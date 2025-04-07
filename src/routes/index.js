const express = require('express');

const router = express.Router();
const webhookRoutes = require('./webhook.route');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Webhook routes
router.use('/webhook', webhookRoutes);

// 404 handler
router.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

module.exports = router;
