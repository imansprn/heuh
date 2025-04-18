const { messageService, webhookService, securityService } = require('../services');
const ApiError = require('../utils/ApiError');
const { validateGitHubWebhook, validateGitHubPayload, validateSentryWebhook } = require('../services/validation.service');
const httpStatus = require('http-status');

const handleSentryWebhook = async (req, res) => {
    try {
        console.log('Sentry Webhook - Start processing');
        // Validate payload
        const validationResult = validateSentryWebhook(req.body);
        if (validationResult.error) {
            console.log('Sentry Webhook - Invalid payload:', validationResult.error.message);
            return res.status(400).json({ error: validationResult.error.message });
        }

        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            console.log('Sentry Webhook - Rate limit exceeded');
            return res.status(429).json({ error: 'Too many requests' });
        }

        // Process Sentry webhook
        console.log('Sentry Webhook - Formatting message');
        const formattedMessage = await messageService.formatSentryMessage(req.body);
        
        console.log('Sentry Webhook - Sending to Google Chat');
        try {
            await webhookService.sendToGoogleChat(formattedMessage);
        } catch (chatError) {
            console.error('Failed to send message to Google Chat:', chatError);
            return res.status(500).json({ error: 'Failed to send message to Google Chat' });
        }

        console.log('Sentry Webhook - Success');
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Sentry Webhook - Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

/**
 * Handle GitHub webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleGitHubWebhook = async (req, res) => {
    try {
        // Handle both raw and parsed bodies
        let rawBody;
        let parsedBody;

        if (Buffer.isBuffer(req.body)) {
            // Body is raw buffer from express.raw()
            rawBody = req.body.toString('utf8');
            try {
                parsedBody = JSON.parse(rawBody);
            } catch (err) {
                console.error('GitHub Webhook - Invalid JSON:', err);
                return res.status(400).json({ error: 'Invalid JSON payload' });
            }
        } else if (typeof req.body === 'object') {
            // Body is already parsed
            parsedBody = req.body;
            rawBody = JSON.stringify(req.body);
        } else {
            console.error('GitHub Webhook - Invalid body type:', typeof req.body);
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // Get signature from headers
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) {
            console.error('GitHub Webhook - Missing signature header');
            return res.status(401).json({ error: 'Missing signature header' });
        }

        // Validate webhook signature
        const signatureValidation = validateGitHubWebhook(rawBody, signature);
        if (signatureValidation.error) {
            console.log('GitHub Webhook - Invalid signature:', signatureValidation.error.message);
            return res.status(401).json({ error: signatureValidation.error.message });
        }

        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            console.log('GitHub Webhook - Rate limit exceeded');
            return res.status(429).json({ error: 'Too many requests' });
        }

        // Validate payload structure
        try {
            validateGitHubPayload(parsedBody);
        } catch (error) {
            console.log('GitHub Webhook - Invalid payload:', error.message);
            return res.status(400).json({ error: error.message });
        }

        // Process GitHub webhook
        console.log('GitHub Webhook - Formatting message');
        const formattedMessage = await messageService.formatGitHubMessage(parsedBody);
        
        console.log('GitHub Webhook - Sending to Google Chat');
        try {
            await webhookService.sendToGoogleChat(formattedMessage);
        } catch (chatError) {
            console.error('Failed to send message to Google Chat:', chatError);
            return res.status(500).json({ error: 'Failed to send message to Google Chat' });
        }

        console.log('GitHub Webhook - Success');
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('GitHub Webhook - Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = {
    handleSentryWebhook,
    handleGitHubWebhook,
};
