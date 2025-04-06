'use strict';

const { messageService, webhookService, validationService, securityService } = require('../services');
const { config } = require('../config');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const handleSentryWebhook = async (req, res, next) => {
    try {
        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests');
        }

        // Validate Sentry webhook signature
        const signature = req.headers['x-sentry-signature'];
        if (!validationService.validateSentrySignature(req.body, signature)) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid signature');
        }

        // Process Sentry webhook
        const formattedMessage = messageService.formatSentryMessage(req.body);
        await webhookService.sendToGoogleChat(formattedMessage);
        
        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        next(error);
    }
};

const handleGitHubWebhook = async (req, res, next) => {
    try {
        // Rate limiting check
        if (!securityService.rateLimit(req.ip)) {
            throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests');
        }

        // Verify GitHub webhook signature
        const signature = req.headers['x-hub-signature-256'];
        const payload = JSON.stringify(req.body);
        if (!securityService.verifyGitHubWebhook(payload, signature)) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid signature');
        }

        // Process GitHub webhook
        const formattedMessage = messageService.formatGitHubMessage(req.body);
        await webhookService.sendToGoogleChat(formattedMessage);
        
        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleSentryWebhook,
    handleGitHubWebhook
};