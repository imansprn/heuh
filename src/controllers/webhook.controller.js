const axios = require('axios');
const { messageService, webhookService, securityService } = require('../services');
const {
    validateGitHubWebhook,
    validateGitHubPayload,
    validateSentryWebhook,
} = require('../services/validation.service');
const { decrypt } = require('../encryption/encryption');
const { WebhookSource, Destination } = require('../../models');
const logger = require('../config/logger.config');

// ─────────────────────────────────────────────────────────────────────────────
//  GITHUB API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch diff lines dari GitHub API */
const fetchDiffLines = async (apiUrl, githubToken) => {
    try {
        const { data } = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.v3.diff',
            },
        });

        return data
            .split('\n')
            .filter(l => !['diff --git', 'index', '---', '+++', '@@'].some(p => l.startsWith(p)))
            .filter(l => l.trim() !== '')
            .slice(0, 10)
            .map(l => {
                let type = 'context';
                if (l.startsWith('+')) type = 'addition';
                if (l.startsWith('-')) type = 'deletion';

                return {
                    text: l.substring(1).trim(), // hapus prefix +/- dan whitespace
                    type,
                };
            });
    } catch (err) {
        logger.error('Diff fetch error', { error: err.message });
        return [];
    }
};

/** Fetch CI status */
const fetchCIStatus = async (repoFullName, sha, githubToken) => {
    console.log(repoFullName, sha, githubToken);
    try {
        const { data } = await axios.get(`https://api.github.com/repos/${repoFullName}/commits/${sha}/check-runs`, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        const runs = data.check_runs ?? [];
        if (!runs.length) return { status: 'unknown', label: 'No CI' };
        const conclusions = runs.map(r => r.conclusion ?? r.status);
        if (conclusions.every(c => c === 'success')) return { status: 'success', label: 'CI Passing' };
        if (conclusions.some(c => c === 'failure')) return { status: 'failure', label: 'CI Failed' };
        if (conclusions.some(c => c === 'in_progress')) return { status: 'pending', label: 'CI Running' };
        return { status: 'unknown', label: 'CI Unknown' };
    } catch (err) {
        logger.error('CI fetch error 2', { error: err.message });
        return { status: 'unknown', label: 'No CI' };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const handleSentryWebhook = async (req, res) => {
    try {
        logger.info('Sentry webhook received');
        const validationResult = validateSentryWebhook(req.body);
        if (validationResult.error) {
            logger.warn('Sentry webhook validation failed', { error: validationResult.error.message, ip: req.ip });
            return res.status(400).json({ error: validationResult.error.message });
        }
        if (!securityService.rateLimit(req.ip)) {
            logger.warn('Sentry webhook rate limited', { ip: req.ip });
            return res.status(429).json({ error: 'Too many requests' });
        }

        const formattedMessage = messageService.formatGoogleChatMessage(req.body, 'sentry');
        await webhookService.sendToGoogleChat(formattedMessage);

        logger.info('Sentry webhook processed successfully');
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        logger.error('Sentry webhook processing failed', { error: error.message });
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const handleGitHubWebhook = async (req, res) => {
    try {
        const { sourceName } = req.params;
        const githubEvent = req.headers['x-github-event'];

        if (githubEvent === 'ping') {
            return res.status(200).json({ message: 'Ping Received' });
        }

        const isPR = githubEvent === 'pull_request';

        // ── Fetch source + destinations dari DB ───────────────────────────────
        const source = await WebhookSource.findOne({
            where: { name: sourceName, enabled: true },
            include: [
                {
                    model: Destination,
                    as: 'destinations',
                    through: { where: { enabled: true } },
                },
            ],
        });

        if (!source) {
            logger.warn('GitHub webhook source not found or inactive', { sourceName });
            return res.status(404).json({ error: 'Webhook source not found or inactive' });
        }

        const sourceConfig = source.config || {};

        // Decrypt sensitive values fetched from DB before use
        const secret = decrypt(sourceConfig.secret);
        const githubToken = decrypt(sourceConfig.githubToken);

        // ── Parse body ────────────────────────────────────────────────────────
        let rawBody;
        let parsedBody;
        if (Buffer.isBuffer(req.body)) {
            rawBody = req.body.toString('utf8');
            try {
                parsedBody = JSON.parse(rawBody);
            } catch {
                logger.warn('GitHub webhook rejected: invalid JSON payload', { sourceName, ip: req.ip });
                return res.status(400).json({ error: 'Invalid JSON payload' });
            }
        } else if (typeof req.body === 'object') {
            parsedBody = req.body;
            rawBody = JSON.stringify(req.body);
        } else {
            logger.warn('GitHub webhook rejected: invalid request body type', {
                sourceName,
                ip: req.ip,
                bodyType: typeof req.body,
            });
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // ── Signature validation ──────────────────────────────────────────────
        const signature = req.headers['x-hub-signature-256'];
        const requiresSignatureValidation = Boolean(secret);

        if (requiresSignatureValidation && !signature) {
            logger.warn('GitHub webhook rejected: missing signature header', { sourceName, ip: req.ip });
            return res.status(401).json({ error: 'Missing signature header' });
        }

        if (requiresSignatureValidation) {
            const sigValidation = validateGitHubWebhook(rawBody, signature, secret);
            if (sigValidation.error) {
                logger.warn('GitHub webhook signature validation failed', {
                    sourceName,
                    ip: req.ip,
                    error: sigValidation.error.message,
                });
                return res.status(401).json({ error: sigValidation.error.message });
            }
        }

        // ── Rate limit ────────────────────────────────────────────────────────
        if (!securityService.rateLimit(req.ip)) {
            logger.warn('GitHub webhook rate limited', { sourceName, ip: req.ip });
            return res.status(429).json({ error: 'Too many requests' });
        }

        // ── Payload validation ────────────────────────────────────────────────
        try {
            validateGitHubPayload(parsedBody);
        } catch (err) {
            logger.warn('GitHub webhook payload validation failed', {
                sourceName,
                ip: req.ip,
                error: err.message,
            });
            return res.status(400).json({ error: err.message });
        }

        const pr = parsedBody.pull_request;
        const repo = parsedBody.repository;

        // ── Parallel: fetch CI + diff lines ───────────────────────────────────
        let apiUrl = '';
        if (isPR) {
            apiUrl = pr?.url || '';
        } else if (parsedBody.commits?.length > 0) {
            apiUrl = `https://api.github.com/repos/${repo.full_name}/commits/${parsedBody.after}`;
        }

        const [ci, diffLines] = await Promise.all([
            isPR && pr
                ? fetchCIStatus(repo.full_name, pr.head.sha, githubToken)
                : Promise.resolve({ status: 'unknown', label: 'N/A' }),
            apiUrl ? fetchDiffLines(apiUrl, githubToken) : Promise.resolve([]),
        ]);

        // ── Format card ───────────────────────────────────────────────────────
        const msg = messageService.formatGoogleChatMessage(parsedBody, 'github');

        // ── Inject CI + comment count (PR only) ───────────────────────────────
        if (isPR && pr) {
            messageService.injectCIWidget(msg, {
                ci,
                commentCount: pr.comments ?? 0,
            });
        }

        // ── Inject diff as text ───────────────────
        if (diffLines.length > 0) {
            console.log("ANJING")
            messageService.injectDiffText(msg, diffLines);
        }

        // ── Send to all destinations ────────────────────────────────────────
        const destinations = source.destinations || [];
        if (!destinations.length) {
            logger.warn('No active destinations for GitHub webhook source', { sourceName });
        }

        await Promise.all(
            destinations.map(dest => webhookService.sendSantetMessage(msg, dest.config?.spaceId, dest.url))
        );

        logger.info('GitHub webhook processed successfully', { sourceName, destinationsCount: destinations.length });
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        logger.error('GitHub webhook processing failed', { error: error.message });
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { handleSentryWebhook, handleGitHubWebhook };
