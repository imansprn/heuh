const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const sentryWebhookSchema = Joi.object({
    data: Joi.object({
        event: Joi.object({
            level: Joi.string().required(),
            title: Joi.string().required(),
            project: Joi.string().required(),
            event_id: Joi.string().required(),
            user: Joi.object({
                username: Joi.string(),
                email: Joi.string().email(),
            }),
            release: Joi.string(),
            web_url: Joi.string().uri().required(),
            environment: Joi.string(),
        }).required(),
    }).required(),
});

const githubWebhookSchema = Joi.object({
    action: Joi.string().valid('submitted').required(),
    review: Joi.object({
        state: Joi.string().valid('approved', 'changes_requested', 'commented').required(),
        user: Joi.object({
            login: Joi.string().required(),
        }).required(),
        body: Joi.string().allow('', null),
    }).required(),
    pull_request: Joi.object({
        number: Joi.number().required(),
        title: Joi.string().required(),
        html_url: Joi.string().uri().required(),
    }).required(),
    repository: Joi.object({
        name: Joi.string().required(),
    }).required(),
});

const validateSentryWebhook = payload => {
    const result = sentryWebhookSchema.validate(payload, { abortEarly: false });
    if (result.error) {
        const error = new ApiError(
            httpStatus.BAD_REQUEST,
            result.error.details.map(detail => detail.message).join(', '),
            true
        );
        return { error };
    }
    return { value: result.value };
};

const validateGitHubWebhook = payload => {
    const result = githubWebhookSchema.validate(payload, { abortEarly: false });
    if (result.error) {
        const error = new ApiError(
            httpStatus.BAD_REQUEST,
            result.error.details.map(detail => detail.message).join(', '),
            true
        );
        return { error };
    }
    return { value: result.value };
};

const validateGitHubPayload = payload => {
    if (!payload) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing payload', true);
    }

    // Check required fields
    if (!payload.action || !payload.review || !payload.repository) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields', true);
    }

    // Validate action
    if (payload.action !== 'submitted') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid action', true);
    }

    // Validate review state
    const validStates = ['approved', 'changes_requested', 'commented', 'dismissed'];
    if (!validStates.includes(payload.review.state)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid review state', true);
    }

    return true;
};

module.exports = {
    validateSentryWebhook,
    validateGitHubWebhook,
    validateGitHubPayload,
};
