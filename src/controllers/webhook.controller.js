'use strict';

const { messageService, webhookService, validationService, securityService } = require('../services');
const { config } = require('../config');

const handleSentryWebhook = async (req, res) => {
    try {
        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        // Validate Sentry webhook signature
        const signature = req.headers['x-sentry-signature'];
        if (!validationService.validateSentrySignature(req.body, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process Sentry webhook
        const formattedMessage = messageService.formatSentryMessage(req.body);
        await webhookService.sendToGoogleChat(formattedMessage);
        
        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing Sentry webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleGitHubWebhook = async (req, res) => {
    try {
        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        // Verify GitHub webhook signature
        const signature = req.headers['x-hub-signature-256'];
        const payload = JSON.stringify(req.body);
        if (!securityService.verifyGitHubWebhook(payload, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process GitHub webhook
        const formattedMessage = messageService.formatGitHubMessage(req.body);
        await webhookService.sendToGoogleChat(formattedMessage);
        
        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing GitHub webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    handleSentryWebhook,
    handleGitHubWebhook
};