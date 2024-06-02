'use strict';

const express = require('express');
const { webhookController } = require('../controllers');

const router = express.Router();

router.post('/sentry', webhookController.sentryWebhook);

module.exports = router;