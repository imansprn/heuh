const { messageService, webhookService, validationService, securityService } = require('../services');
const ApiError = require('../utils/ApiError');

const handleSentryWebhook = async (req, res) => {
    try {
        console.log('Sentry Webhook - Start processing');
        // Validate payload
        const { error } = validationService.validateSentryWebhook(req.body);
        if (error) {
            console.log('Sentry Webhook - Invalid payload:', error.message);
            return res.status(400).json({ error: error.message });
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
        const result = await webhookService.sendToGoogleChat(formattedMessage);
        if (!result) {
            return res.status(500).json({ error: 'Failed to send message to Google Chat' });
        }

        console.log('Sentry Webhook - Success');
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.log('Sentry Webhook - Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const handleGitHubWebhook = async (req, res) => {
    try {
        console.log('GitHub Webhook - Start processing');
        // Validate payload
        const { error } = validationService.validateGitHubWebhook(req.body);
        if (error) {
            console.log('GitHub Webhook - Invalid payload:', error.message);
            console.log('GitHub Webhook - Error object:', JSON.stringify(error, null, 2));
            return res.status(400).json({ error: error.message });
        }

        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            console.log('GitHub Webhook - Rate limit exceeded');
            return res.status(429).json({ error: 'Too many requests' });
        }

        // Process GitHub webhook
        console.log('GitHub Webhook - Formatting message');
        const formattedMessage = await messageService.formatGitHubMessage(req.body);
        console.log('GitHub Webhook - Sending to Google Chat');
        const result = await webhookService.sendToGoogleChat(formattedMessage);
        if (!result) {
            return res.status(500).json({ error: 'Failed to send message to Google Chat' });
        }

        console.log('GitHub Webhook - Success');
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.log('GitHub Webhook - Error:', error);
        console.log('GitHub Webhook - Error details:', {
            name: error.name,
            message: error.message,
            statusCode: error.statusCode,
            isOperational: error.isOperational,
            stack: error.stack,
        });
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = {
    handleSentryWebhook,
    handleGitHubWebhook,
};
