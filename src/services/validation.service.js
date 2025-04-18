const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/index');
const crypto = require('crypto');

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

// Base schemas for common objects
const userSchema = Joi.object({
    login: Joi.string().required(),
    id: Joi.number(),
    node_id: Joi.string(),
    avatar_url: Joi.string().uri(),
    html_url: Joi.string().uri(),
    type: Joi.string(),
    site_admin: Joi.boolean(),
}).unknown(true);

const repositorySchema = Joi.object({
    name: Joi.string().required(),
    full_name: Joi.string().required(),
    private: Joi.boolean(),
    owner: userSchema,
    html_url: Joi.string().uri(),
    description: Joi.string().allow(null),
    fork: Joi.boolean(),
    url: Joi.string().uri(),
    created_at: Joi.string(),
    updated_at: Joi.string(),
    pushed_at: Joi.string(),
    default_branch: Joi.string(),
}).unknown(true);

const pullRequestSchema = Joi.object({
    number: Joi.number().required(),
    title: Joi.string().required(),
    html_url: Joi.string().uri().required(),
    state: Joi.string().valid('open', 'closed'),
    user: userSchema,
    body: Joi.string().allow('', null),
    created_at: Joi.string(),
    updated_at: Joi.string(),
    closed_at: Joi.string().allow(null),
    merged_at: Joi.string().allow(null),
    merge_commit_sha: Joi.string().allow(null),
    assignee: userSchema.allow(null),
    assignees: Joi.array().items(userSchema),
    requested_reviewers: Joi.array().items(userSchema),
    labels: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        color: Joi.string(),
    })),
    head: Joi.object({
        ref: Joi.string().required(),
        sha: Joi.string().required(),
        label: Joi.string().pattern(/^[^:]+:[^:]+$/),
        user: userSchema,
        repo: repositorySchema,
    }),
    base: Joi.object({
        ref: Joi.string().required(),
        sha: Joi.string().required(),
        label: Joi.string().pattern(/^[^:]+:[^:]+$/),
        user: userSchema,
        repo: repositorySchema,
    }),
}).unknown(true);

// Action-specific schemas
const openedSchema = Joi.object({
    action: Joi.string().valid('opened').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const closedSchema = Joi.object({
    action: Joi.string().valid('closed').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const reopenedSchema = Joi.object({
    action: Joi.string().valid('reopened').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const reviewRequestedSchema = Joi.object({
    action: Joi.string().valid('review_requested').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    requested_reviewer: userSchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const reviewRequestRemovedSchema = Joi.object({
    action: Joi.string().valid('review_request_removed').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    requested_reviewer: userSchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const submittedSchema = Joi.object({
    action: Joi.string().valid('submitted').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    review: Joi.object({
        state: Joi.string().valid('approved', 'changes_requested', 'commented').required(),
        user: userSchema.required(),
        body: Joi.string().allow('', null),
        submitted_at: Joi.string(),
    }).required(),
    sender: userSchema.required(),
}).unknown(true);

const editedSchema = Joi.object({
    action: Joi.string().valid('edited').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
    changes: Joi.object({
        title: Joi.object({
            from: Joi.string(),
        }),
        body: Joi.object({
            from: Joi.string(),
        }),
    }),
}).unknown(true);

const synchronizeSchema = Joi.object({
    action: Joi.string().valid('synchronize').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
    before: Joi.string().required(),
    after: Joi.string().required(),
}).unknown(true);

const assignedSchema = Joi.object({
    action: Joi.string().valid('assigned').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    assignee: userSchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const unassignedSchema = Joi.object({
    action: Joi.string().valid('unassigned').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    assignee: userSchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const labeledSchema = Joi.object({
    action: Joi.string().valid('labeled').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    label: Joi.object({
        name: Joi.string().required(),
        color: Joi.string(),
    }).required(),
    sender: userSchema.required(),
}).unknown(true);

const unlabeledSchema = Joi.object({
    action: Joi.string().valid('unlabeled').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    label: Joi.object({
        name: Joi.string().required(),
        color: Joi.string(),
    }).required(),
    sender: userSchema.required(),
}).unknown(true);

const readyForReviewSchema = Joi.object({
    action: Joi.string().valid('ready_for_review').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const lockedSchema = Joi.object({
    action: Joi.string().valid('locked').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
    lock_reason: Joi.string(),
}).unknown(true);

const unlockedSchema = Joi.object({
    action: Joi.string().valid('unlocked').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
}).unknown(true);

const mergedSchema = Joi.object({
    action: Joi.string().valid('merged').required(),
    pull_request: pullRequestSchema.required(),
    repository: repositorySchema.required(),
    sender: userSchema.required(),
}).unknown(true);

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

/**
 * Validates GitHub webhook signature
 * @param {string} payload - Raw request payload
 * @param {string} signature - X-Hub-Signature-256 header value
 * @returns {Object} - Validation result with error if invalid
 */
const validateGitHubWebhook = (payload, signature) => {
    // Use test secret in test environment
    const secret = config.config.github_webhook_secret;
    
    if (!signature || !secret) {
        return { error: { message: 'Invalid webhook signature' } };
    }

    // Remove 'sha256=' prefix from signature
    const receivedSignature = signature.replace('sha256=', '');
    
    // Calculate expected signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Compare signatures
    try {
        const isValid = crypto.timingSafeEqual(
            Buffer.from(receivedSignature),
            Buffer.from(expectedSignature)
        );
        return isValid ? { error: null } : { error: { message: 'Invalid webhook signature' } };
    } catch (error) {
        return { error: { message: 'Invalid webhook signature' } };
    }
};

/**
 * Validates GitHub webhook payload
 * @param {Object} payload - GitHub webhook payload
 * @returns {Object} - Validation result
 */
const validateGitHubPayload = payload => {
    if (!payload) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing payload', true);
    }

    // Check required fields
    if (!payload.action || !payload.pull_request || !payload.repository) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields', true);
    }

    // Validate action-specific schema
    const actionSchemas = {
        opened: openedSchema,
        closed: closedSchema,
        reopened: reopenedSchema,
        review_requested: reviewRequestedSchema,
        review_request_removed: reviewRequestRemovedSchema,
        submitted: submittedSchema,
        edited: editedSchema,
        synchronize: synchronizeSchema,
        assigned: assignedSchema,
        unassigned: unassignedSchema,
        labeled: labeledSchema,
        unlabeled: unlabeledSchema,
        ready_for_review: readyForReviewSchema,
        locked: lockedSchema,
        unlocked: unlockedSchema,
        merged: mergedSchema,
    };

    const schema = actionSchemas[payload.action];
    if (!schema) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid action', true);
    }

    const result = schema.validate(payload, { abortEarly: false });
    if (result.error) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            result.error.details.map(detail => detail.message).join(', '),
            true
        );
    }

    return true;
};

module.exports = {
    validateGitHubWebhook,
    validateGitHubPayload,
    validateSentryWebhook,
};
