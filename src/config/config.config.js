'use strict';

const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
    .keys({
        APP_ENV: Joi.string().required(),
        APP_NAME: Joi.string().required(),
        GOOGLE_CHAT_WEBHOOKS: Joi.string().required(),
        GITHUB_WEBHOOK_SECRET: Joi.string().allow('', null),
        RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
        RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        REQUEST_TIMEOUT: Joi.number().default(5000),
        MAX_PAYLOAD_SIZE: Joi.number().default(100 * 1024), // 100KB
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.APP_ENV,
    name: envVars.APP_NAME,
    google_chat_webhooks: envVars.GOOGLE_CHAT_WEBHOOKS,
    github_webhook_secret: envVars.GITHUB_WEBHOOK_SECRET,
    rate_limit: {
        window_ms: envVars.RATE_LIMIT_WINDOW_MS,
        max_requests: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
    log_level: envVars.LOG_LEVEL,
    request_timeout: envVars.REQUEST_TIMEOUT,
    max_payload_size: envVars.MAX_PAYLOAD_SIZE,
};