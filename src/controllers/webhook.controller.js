const { messageService, webhookService, validationService, securityService } = require('../services');
const ApiError = require('../utils/ApiError');
const { validateGitHubWebhook, validateGitHubPayload } = require('../services/validation.service');
const httpStatus = require('http-status');

const handleSentryWebhook = async (req, res) => {
    try {
        console.log('Sentry Webhook - Start processing');
        // Validate payload
        const validationResult = validationService.validateSentryWebhook(req.body);
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
        // Get raw body for signature validation
        const rawBody = req.rawBody;
        const signature = req.headers['x-hub-signature-256'];

        // Validate webhook signature
        const signatureValidation = validationService.validateGitHubWebhook(rawBody, signature);
        if (signatureValidation.error) {
            return res.status(400).json({ error: signatureValidation.error.message });
        }

        // Validate payload structure
        const payloadValidation = validationService.validateGitHubPayload(req.body);
        if (!payloadValidation) {
            return res.status(400).json({ error: 'Invalid GitHub payload structure' });
        }

        // Process the webhook payload
        const { action, pull_request, repository } = req.body;

        // Create message based on action
        const message = await messageService.createGitHubMessage(action, pull_request, repository);

        // Send message to Google Chat
        await webhookService.sendToGoogleChat(message);

        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

module.exports = {
    handleSentryWebhook,
    handleGitHubWebhook,
};
