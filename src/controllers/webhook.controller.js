const axios = require('axios');
const { messageService, webhookService, securityService } = require('../services');
const { validateGitHubWebhook, validateGitHubPayload, validateSentryWebhook } = require('../services/validation.service');
const { decrypt } = require('../Encryption/encryption');

// ─────────────────────────────────────────────────────────────────────────────
//  GITHUB API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch diff lines dari GitHub API */
const fetchDiffLines = async (apiUrl, githubToken) => {
    try {
        const { data } = await axios.get(apiUrl, {
            headers: {
                Authorization: `token ${githubToken || process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3.diff',
            },
        });
        return data.split('\n')
            .filter(l => !['diff --git', 'index', '---', '+++', '@@'].some(p => l.startsWith(p)))
            .filter(l => l.trim() !== '')
            .slice(0, 10)
            .map(l => ({
                text: l.substring(1).trim(), // hapus prefix +/- dan whitespace
                type: l.startsWith('+') ? 'addition'
                    : l.startsWith('-') ? 'deletion'
                        : 'context',
            }));
    } catch (err) {
        console.error('Diff fetch error:', err.message);
        return [];
    }
};

/** Fetch CI status */
const fetchCIStatus = async (repoFullName, sha, githubToken) => {
    try {
        const { data } = await axios.get(
            `https://api.github.com/repos/${repoFullName}/commits/${sha}/check-runs`,
            {
                headers: {
                    Authorization: `token ${githubToken || process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );
        const runs = data.check_runs ?? [];
        if (!runs.length) return { status: 'unknown', label: 'No CI' };
        const conclusions = runs.map(r => r.conclusion ?? r.status);
        if (conclusions.every(c => c === 'success')) return { status: 'success', label: 'CI Passing' };
        if (conclusions.some(c => c === 'failure')) return { status: 'failure', label: 'CI Failed' };
        if (conclusions.some(c => c === 'in_progress')) return { status: 'pending', label: 'CI Running' };
        return { status: 'unknown', label: 'CI Unknown' };
    } catch (err) {
        console.error('CI fetch error:', err.message);
        return { status: 'unknown', label: 'No CI' };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const handleSentryWebhook = async (req, res) => {
    try {
        console.log('Sentry Webhook - Start');
        const validationResult = validateSentryWebhook(req.body);
        if (validationResult.error) return res.status(400).json({ error: validationResult.error.message });
        if (!securityService.rateLimit(req.ip)) return res.status(429).json({ error: 'Too many requests' });

        const formattedMessage = messageService.formatGoogleChatMessage(req.body, 'sentry');
        await webhookService.sendToGoogleChat(formattedMessage);

        console.log('Sentry Webhook - Success');
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Sentry Webhook - Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const handleGitHubWebhook = async (req, res) => {
    try {
        const { sourceName } = req.params;
        const githubEvent = req.headers['x-github-event'];

        if (githubEvent === 'ping') {
            console.log('GitHub Webhook - Ping');
            return res.status(200).json({ message: 'Ping Received' });
        }

        const isPR = githubEvent === 'pull_request';

        // ── Fetch source + destinations dari DB ───────────────────────────────
        const { WebhookSource, Destination } = require('../../models');
        const source = await WebhookSource.findOne({
            where: { name: sourceName, enabled: true },
            include: [{
                model: Destination,
                as: 'destinations',
                through: { where: { enabled: true } },
            }],
        });

        if (!source) {
            console.error(`Webhook source not found or inactive: ${sourceName}`);
            return res.status(404).json({ error: 'Webhook source not found or inactive' });
        }

        const sourceConfig = source.config || {};

        // Decrypt sensitive values fetched from DB before use
        const secret = decrypt(sourceConfig.secret);
        const githubToken = decrypt(sourceConfig.githubToken);

        // ── Parse body ────────────────────────────────────────────────────────
        let rawBody, parsedBody;
        if (Buffer.isBuffer(req.body)) {
            rawBody = req.body.toString('utf8');
            try { parsedBody = JSON.parse(rawBody); }
            catch { return res.status(400).json({ error: 'Invalid JSON payload' }); }
        } else if (typeof req.body === 'object') {
            parsedBody = req.body;
            rawBody = JSON.stringify(req.body);
        } else {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // ── Signature validation ──────────────────────────────────────────────
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) return res.status(401).json({ error: 'Missing signature header' });

        const sigValidation = validateGitHubWebhook(rawBody, signature, secret);
        if (sigValidation.error) return res.status(401).json({ error: sigValidation.error.message });

        // ── Rate limit ────────────────────────────────────────────────────────
        if (!securityService.rateLimit(req.ip)) return res.status(429).json({ error: 'Too many requests' });

        // ── Payload validation ────────────────────────────────────────────────
        try { validateGitHubPayload(parsedBody); }
        catch (err) { return res.status(400).json({ error: err.message }); }

        const pr = parsedBody.pull_request;
        const repo = parsedBody.repository;

        // ── Parallel: fetch CI + diff lines ───────────────────────────────────
        const apiUrl = isPR
            ? pr?.url
            : parsedBody.commits?.length > 0
                ? `https://api.github.com/repos/${repo.full_name}/commits/${parsedBody.after}`
                : '';

        const [ci, diffLines] = await Promise.all([
            isPR && pr ? fetchCIStatus(repo.full_name, pr.head.sha, githubToken)
                : Promise.resolve({ status: 'unknown', label: 'N/A' }),
            apiUrl ? fetchDiffLines(apiUrl, githubToken)
                : Promise.resolve([]),
        ]);

        // ── Format card ───────────────────────────────────────────────────────
        let msg = messageService.formatGoogleChatMessage(parsedBody, 'github');

        // ── Inject CI + comment count (PR only) ───────────────────────────────
        if (isPR && pr) {
            messageService.injectCIWidget(msg, {
                ci,
                commentCount: pr.comments ?? 0,
            });
        }

        // ── Inject diff as text ───────────────────
        if (diffLines.length > 0) {
            messageService.injectDiffText(msg, diffLines);
        }

        // ── Send to all destinations ────────────────────────────────────────
        const destinations = source.destinations || [];
        if (!destinations.length) {
            console.warn('No active destinations for source:', sourceName);
        }

        await Promise.all(destinations.map(dest =>
            webhookService.sendHeuhMessage(msg, dest.config?.spaceId, dest.url)
        ));

        console.log(`GitHub Webhook - Success (sent to ${destinations.length} destination(s))`);
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('GitHub Webhook - Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { handleSentryWebhook, handleGitHubWebhook };