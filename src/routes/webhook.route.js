const express = require('express');
const { handleSentryWebhook, handleGitHubWebhook } = require('../controllers/webhook.controller');
const rawBodyMiddleware = require('../middlewares/rawBody.middleware');

const router = express.Router();

// Apply raw body middleware to all webhook routes
router.use(rawBodyMiddleware);

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
 *             type: object
 *             required: [action, pull_request, repository]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [opened, closed, reopened, review_requested, review_request_removed]
 *                 description: The action that triggered the webhook
 *               pull_request:
 *                 type: object
 *                 required: [title, html_url, user, head, base]
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: The title of the pull request
 *                   html_url:
 *                     type: string
 *                     description: The URL of the pull request
 *                   user:
 *                     type: object
 *                     required: [login]
 *                     properties:
 *                       login:
 *                         type: string
 *                         description: The username of the PR author
 *                   head:
 *                     type: object
 *                     required: [label, ref]
 *                     properties:
 *                       label:
 *                         type: string
 *                         description: The label of the source branch
 *                       ref:
 *                         type: string
 *                         description: The name of the source branch
 *                   base:
 *                     type: object
 *                     required: [label, ref]
 *                     properties:
 *                       label:
 *                         type: string
 *                         description: The label of the target branch
 *                       ref:
 *                         type: string
 *                         description: The name of the target branch
 *                   requested_reviewers:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required: [login]
 *                       properties:
 *                         login:
 *                           type: string
 *                           description: The username of the requested reviewer
 *               repository:
 *                 type: object
 *                 required: [name, html_url]
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the repository
 *                   html_url:
 *                     type: string
 *                     description: The URL of the repository
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
