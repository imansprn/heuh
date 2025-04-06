'use strict';

const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config();

const envVarsSchema = Joi.object()
    .keys({
        APP_ENV: Joi.string()
            .valid('development', 'test', 'production')
            .required(),
        PORT: Joi.number()
            .default(3000),
        GOOGLE_CHAT_WEBHOOK_URL: Joi.string()
            .required(),
        GITHUB_WEBHOOK_SECRET: Joi.string()
            .required(),
        SENTRY_WEBHOOK_SECRET: Joi.string()
            .required(),
        LOG_LEVEL: Joi.string()
            .valid('error', 'warn', 'info', 'debug')
            .default('info'),
        REQUEST_TIMEOUT: Joi.number()
            .default(5000),
        MAX_PAYLOAD_SIZE: Joi.number()
            .default(102400),
        RATE_LIMIT_MAX_REQUESTS: Joi.number()
            .default(100),
        RATE_LIMIT_WINDOW_MS: Joi.number()
            .default(900000)
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.APP_ENV,
    port: envVars.PORT,
    google_chat_webhook_url: envVars.GOOGLE_CHAT_WEBHOOK_URL,
    github_webhook_secret: envVars.GITHUB_WEBHOOK_SECRET,
    sentry_webhook_secret: envVars.SENTRY_WEBHOOK_SECRET,
    log_level: envVars.LOG_LEVEL,
    request_timeout: envVars.REQUEST_TIMEOUT,
    max_payload_size: envVars.MAX_PAYLOAD_SIZE,
    rate_limit: {
        max_requests: envVars.RATE_LIMIT_MAX_REQUESTS,
        window_ms: envVars.RATE_LIMIT_WINDOW_MS
    }
};