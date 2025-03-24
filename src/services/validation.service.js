'use strict';

const Joi = require('joi');
const crypto = require('crypto');
const { config } = require('../config');

const sentryWebhookSchema = Joi.object({
    data: Joi.object({
        event: Joi.object({
            level: Joi.string().required(),
            title: Joi.string().required(),
            project: Joi.string().required(),
            event_id: Joi.string().required(),
            user: Joi.object({
                username: Joi.string(),
                email: Joi.string().email()
            }),
            release: Joi.string(),
            web_url: Joi.string().uri().required(),
            environment: Joi.string()
        }).required()
    }).required()
});

const githubWebhookSchema = Joi.object({
    action: Joi.string().valid('submitted').required(),
    review: Joi.object({
        state: Joi.string().valid('approved', 'changes_requested', 'commented').required(),
        user: Joi.object({
            login: Joi.string().required()
        }).required(),
        body: Joi.string().allow('', null)
    }).required(),
    pull_request: Joi.object({
        number: Joi.number().required(),
        title: Joi.string().required(),
        html_url: Joi.string().uri().required()
    }).required(),
    repository: Joi.object({
        name: Joi.string().required()
    }).required()
});

const validateSentryWebhook = (payload) => {
    return sentryWebhookSchema.validate(payload, { abortEarly: false });
};

const validateGitHubWebhook = (payload) => {
    return githubWebhookSchema.validate(payload, { abortEarly: false });
};

const validateSentrySignature = (payload, signature) => {
    if (!config.sentry_webhook_secret) {
        return true; // Skip validation if no secret is configured
    }

    if (!signature) {
        return false;
    }

    try {
        const hmac = crypto.createHmac('sha256', config.sentry_webhook_secret);
        const calculatedSignature = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(calculatedSignature)
        );
    } catch (error) {
        return false;
    }
};

const validateGitHubPayload = (payload) => {
    if (!payload) {
        return false;
    }

    // Check required fields
    if (!payload.action || !payload.review || !payload.repository) {
        return false;
    }

    // Validate action
    if (payload.action !== 'submitted') {
        return false;
    }

    // Validate review state
    const validStates = ['approved', 'changes_requested', 'commented', 'dismissed'];
    if (!validStates.includes(payload.review.state)) {
        return false;
    }

    return true;
};

module.exports = {
    validateSentryWebhook,
    validateGitHubWebhook,
    validateSentrySignature,
    validateGitHubPayload
}; 