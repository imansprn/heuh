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
};