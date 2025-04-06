'use strict';

const express = require('express');
const webhookRoutes = require('./webhook.route');
const ApiError = require('../utils/ApiError');

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.use('/webhook', webhookRoutes);

// Handle 404
router.use((req, res, next) => {
    next(new ApiError(404, 'Not found'));
});

module.exports = router;