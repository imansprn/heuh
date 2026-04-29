const axios = require('axios');
const { WebhookSource, Destination } = require('../../models');
const { messageService, webhookService, securityService } = require('../services');
const { validateGitHubWebhook, validateGitHubPayload, validateSentryWebhook } = require('../services/validation.service');
const diffService = require('../services/diff.service');

// -----------------------------------------------------------------------------
//  GITHUB API HELPERS
// -----------------------------------------------------------------------------

const ghHeaders = (token) => ({
    Authorization: `token ${token || process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
});

/** Fetch diff lines -- returns [] on error */
const fetchDiffLines = async (apiUrl, token) => {
    try {
        const { data } = await axios.get(apiUrl, {
            headers: {
                Authorization: `token ${token || process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3.diff',
            },
        });
        return data.split('\n')
            .filter(l => !['diff --git', 'index', '---', '+++', '@@'].some(p => l.startsWith(p)))
            .slice(0, 10)
            .map(l => ({
                text: l.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                type: l.startsWith('+') ? 'addition' : l.startsWith('-') ? 'deletion' : 'context',
            }));
    } catch (err) {
        console.error('Diff fetch error:', err.message);
        return [];
    }
};

/** Fetch CI status -- returns { status, label } */
const fetchCIStatus = async (repoFullName, sha, token) => {
    try {
        const { data } = await axios.get(
            `https://api.github.com/repos/${repoFullName}/commits/${sha}/check-runs`,
            { headers: ghHeaders(token) }
        );
        const runs = data.check_runs ?? [];
        if (!runs.length) return { status: 'unknown', label: 'No CI' };

        const conclusions = runs.map(r => r.conclusion ?? r.status);
        if (conclusions.every(c => c === 'success'))    return { status: 'success', label: 'CI Passing' };
        if (conclusions.some(c => c === 'failure'))     return { status: 'failure', label: 'CI Failed' };
        if (conclusions.some(c => c === 'in_progress')) return { status: 'pending', label: 'CI Running' };
        return { status: 'unknown', label: 'CI Unknown' };
    } catch (err) {
        console.error('CI fetch error:', err.message);
        return { status: 'unknown', label: 'No CI' };
    }
};

// -----------------------------------------------------------------------------
//  HANDLERS
// -----------------------------------------------------------------------------

const handleSentryWebhook = async (req, res) => {
    try {
        console.log('Sentry Webhook - Start');

        const validationResult = validateSentryWebhook(req.body);
        if (validationResult.error) {
            return res.status(400).json({ error: validationResult.error.message });
        }
        if (!securityService.rateLimit(req.ip)) {
            return res.status(429).json({ error: 'Too many requests' });
        }

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

        // Fetch source and its associated destinations from DB
        const source = await WebhookSource.findOne({
            where: { name: sourceName, enabled: true },
            include: [{ 
                model: Destination, 
                as: 'destinations',
                through: { where: { enabled: true } } // Only active mappings
            }]
        });

        if (!source) {
            return res.status(404).json({ error: 'Webhook source not found or inactive' });
        }

        const sourceConfig = source.config || {};
        const secret = sourceConfig.secret;
        const githubToken = sourceConfig.githubToken;

        // -- Parse body -------------------------------------------------------
        let rawBody = req.rawBody;
        let parsedBody = req.body;

        if (!rawBody) {
            if (Buffer.isBuffer(req.body)) {
                rawBody = req.body.toString('utf8');
                try { parsedBody = JSON.parse(rawBody); }
                catch { return res.status(400).json({ error: 'Invalid JSON payload' }); }
            } else if (typeof req.body === 'object') {
                parsedBody = req.body;
                rawBody    = JSON.stringify(req.body);
            } else {
                return res.status(400).json({ error: 'Invalid request body' });
            }
        }

        // -- Signature validation ---------------------------------------------
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) return res.status(401).json({ error: 'Missing signature header' });
        const sigValidation = validateGitHubWebhook(rawBody, signature, secret);
        if (sigValidation.error) return res.status(401).json({ error: sigValidation.error.message });

        // -- Rate limit -------------------------------------------------------
        if (!securityService.rateLimit(req.ip)) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        // -- Payload validation -----------------------------------------------
        try { validateGitHubPayload(parsedBody); }
        catch (err) { return res.status(400).json({ error: err.message }); }

        const isPR = githubEvent === 'pull_request';
        const pr   = parsedBody.pull_request;
        const repo = parsedBody.repository;

        // -- Parallel: diff lines + CI status ---------------------------------
        const apiUrl = isPR
            ? pr.url
            : parsedBody.commits?.length > 0
                ? `${repo.url}/commits/${parsedBody.after}`
                : '';

        console.log('GitHub Webhook - Fetching diff + CI...');
        const [diffLines, ci] = await Promise.all([
            apiUrl ? fetchDiffLines(apiUrl, githubToken) : Promise.resolve([]),
            isPR   ? fetchCIStatus(repo.full_name, pr.head.sha, githubToken) : Promise.resolve({ status: 'unknown', label: 'N/A' }),
        ]);

        // -- Format card ------------------------------------------------------
        let msg = messageService.formatGoogleChatMessage(parsedBody, 'github');

        // -- Inject CI widget into body section (PR only) ---------------------
        if (isPR) {
            messageService.injectCIWidget(msg, {
                ci,
                commentCount: pr.comments ?? 0,
            });
        }

        // -- Generate + inject diff image -------------------------------------
        if (diffLines.length) {
            console.log('GitHub Webhook - Generating diff image...');
            const lastCommit = parsedBody.commits?.[parsedBody.commits.length - 1];
            const diffMeta   = isPR ? {
                filename:  `PR #${pr.number}: ${pr.title}`,
                additions: pr.additions ?? 0,
                deletions: pr.deletions ?? 0,
                prNumber:  pr.number,
                repoName:  repo.name,
            } : {
                filename: lastCommit?.modified?.[0] ?? lastCommit?.added?.[0] ?? 'code changes',
                repoName: repo.name,
            };

            const diffImageUrl = await diffService.generateDiffImage(diffLines, diffMeta, githubToken);
            if (diffImageUrl) messageService.injectDiffImage(msg, diffImageUrl);
        }

        // -- Send to all destinations -----------------------------------------
        const destinations = source.destinations || [];
        if (destinations.length === 0) {
            console.log('⚠️ No active destinations found for this source.');
        }

        const sendPromises = destinations.map(dest => {
            if (!dest.enabled) return Promise.resolve();
            const spaceId = dest.config?.spaceId;
            const targetUrl = dest.url;
            return webhookService.sendHeuhMessage(msg, spaceId, targetUrl);
        });

        await Promise.all(sendPromises);

        console.log(`GitHub Webhook - Success (Sent to ${destinations.length} destinations)`);
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('GitHub Webhook - Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { handleSentryWebhook, handleGitHubWebhook };