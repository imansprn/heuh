const { messageService, webhookService, validationService, securityService } = require('../services');
const ApiError = require('../utils/ApiError');
const { validateGitHubWebhook, validateGitHubPayload } = require('../services/validation.service');
const httpStatus = require('http-status');

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

/**
 * Handle GitHub webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleGitHubWebhook = async (req, res, next) => {
    try {
        // Get raw body for signature validation
        const rawBody = req.rawBody;
        const signature = req.headers['x-hub-signature-256'];

        // Validate webhook signature
        if (!validateGitHubWebhook(rawBody, signature)) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid webhook signature', true);
        }

        // Validate payload structure
        const { value: validatedPayload } = validateGitHubPayload(req.body);
        const { action, pull_request, repository } = validatedPayload;

        // Create message based on action
        const message = await messageService.createGitHubMessage(action, pull_request, repository);

        // Send message to Google Chat
        await webhookService.sendToGoogleChat(message);

        res.status(httpStatus.OK).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleSentryWebhook,
    handleGitHubWebhook,
};
