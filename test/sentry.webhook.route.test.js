const request = require('supertest');
const express = require('express');
const routes = require('../src/routes');

jest.mock('../models', () => ({
    WebhookSource: { findOne: jest.fn() },
    Destination: {},
}));

jest.mock('../src/services', () => ({
    messageService: { formatGoogleChatMessage: jest.fn().mockReturnValue({ cardsV2: [] }) },
    webhookService: { sendSantetMessage: jest.fn().mockResolvedValue(true) },
    securityService: { rateLimit: jest.fn().mockReturnValue(true) },
}));

jest.mock('../src/encryption/encryption', () => ({
    decrypt: jest.fn(v => v),
}));

jest.mock('../src/services/validation.service', () => ({
    validateGitHubWebhook: jest.fn().mockReturnValue({ error: null }),
    validateGitHubPayload: jest.fn().mockReturnValue(true),
    validateSentryWebhook: jest.fn().mockReturnValue({ error: null }),
    validateSentryWebhookSignature: jest.fn().mockReturnValue({ error: null }),
}));

const { WebhookSource } = require('../models');
const { webhookService, securityService } = require('../src/services');
const { validateSentryWebhook, validateSentryWebhookSignature } = require('../src/services/validation.service');

describe('POST /webhook/sentry/:sourceName', () => {
    const app = express();
    app.use(express.json());
    app.use('', routes);

    beforeEach(() => {
        jest.clearAllMocks();
        securityService.rateLimit.mockReturnValue(true);
        validateSentryWebhook.mockReturnValue({ error: null });
        validateSentryWebhookSignature.mockReturnValue({ error: null });
    });

    it('returns 404 when source is not found', async () => {
        WebhookSource.findOne.mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/webhook/sentry/repo-a')
            .send({ data: { event: {} } });
        expect(res.status).toBe(404);
    });

    it('returns 401 when source secret exists but signature is missing', async () => {
        WebhookSource.findOne.mockResolvedValueOnce({
            config: { secret: 'enc-secret' },
            destinations: [{ url: 'https://chat.example/a', config: {} }],
        });

        const res = await request(app)
            .post('/webhook/sentry/repo-a')
            .send({ data: { event: { title: 'boom' } } });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Missing signature header');
    });

    it('returns 401 for invalid signature', async () => {
        validateSentryWebhookSignature.mockReturnValueOnce({ error: { message: 'Invalid signature' } });
        WebhookSource.findOne.mockResolvedValueOnce({
            config: { secret: 'enc-secret' },
            destinations: [{ url: 'https://chat.example/a', config: {} }],
        });

        const res = await request(app)
            .post('/webhook/sentry/repo-a')
            .set('sentry-hook-signature', 'invalid-signature')
            .send({ data: { event: { title: 'boom' } } });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid signature');
    });

    it('returns 400 for invalid payload', async () => {
        validateSentryWebhook.mockReturnValueOnce({ error: { message: 'Invalid payload' } });
        WebhookSource.findOne.mockResolvedValueOnce({
            config: { secret: '' },
            destinations: [{ url: 'https://chat.example/a', config: {} }],
        });

        const res = await request(app).post('/webhook/sentry/repo-a').send({ foo: 'bar' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid payload');
    });

    it('returns 200 and sends to all mapped destinations', async () => {
        WebhookSource.findOne.mockResolvedValueOnce({
            config: { secret: '' },
            destinations: [
                { url: 'https://chat.example/a', config: {} },
                { url: 'https://chat.example/b', config: {} },
            ],
        });

        const payload = {
            data: {
                event: {
                    level: 'error',
                    title: 'boom',
                    project: 'p1',
                    event_id: 'e1',
                    web_url: 'http://example.com/event',
                },
            },
        };

        const res = await request(app).post('/webhook/sentry/repo-a').send(payload);

        expect(res.status).toBe(200);
        expect(webhookService.sendSantetMessage).toHaveBeenCalledTimes(2);
    });
});
