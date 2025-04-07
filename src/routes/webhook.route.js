const express = require('express');
const { handleSentryWebhook, handleGitHubWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

/**
 * @swagger
 * /webhook/github:
 *   post:
 *     summary: Handle GitHub webhook events
 *     description: Process GitHub webhook events and send notifications to Google Chat
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GitHubWebhookPayload'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/github', handleGitHubWebhook);

/**
 * @swagger
 * /webhook/sentry:
 *   post:
 *     summary: Handle Sentry webhook events
 *     description: Process Sentry webhook events and send notifications to Google Chat
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SentryWebhookPayload'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/sentry', handleSentryWebhook);

module.exports = router;
