'use strict';

const express = require('express');
const { handleSentryWebhook, handleGitHubWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

router.post('/sentry', handleSentryWebhook);
router.post('/github', handleGitHubWebhook);

module.exports = router;