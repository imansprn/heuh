const request = require('supertest');
const express = require('express');
const httpStatus = require('http-status');
const routes = require('../src/routes');
const { errorConverter, errorHandler } = require('../src/middlewares/error.middleware');
const ApiError = require('../src/utils/ApiError');

// Mock the config module
jest.mock('../src/config/config.config', () => ({
    config: {
        github_webhook_secret: 'test-secret',
    },
}));

// Mock the validation service
jest.mock('../src/services/validation.service', () => ({
    validateGitHubWebhook: jest.fn().mockReturnValue({ error: null }),
    validateGitHubPayload: jest.fn().mockReturnValue(true),
    validateSentryWebhook: jest.fn().mockReturnValue({ error: null }),
}));

// Mock other services
jest.mock('../src/services', () => ({
    messageService: {
        formatGitHubMessage: jest.fn().mockResolvedValue('formatted github message'),
        createGitHubMessage: jest.fn().mockResolvedValue('created github message'),
        formatSentryMessage: jest.fn().mockResolvedValue('formatted sentry message'),
    },
    webhookService: {
        sendToGoogleChat: jest.fn().mockResolvedValue(true),
    },
    securityService: {
        rateLimit: jest.fn().mockReturnValue(true),
    },
}));

const { messageService, webhookService, securityService } = require('../src/services');
const { validateGitHubWebhook, validateGitHubPayload, validateSentryWebhook } = require('../src/services/validation.service');

// Increase test timeout
jest.setTimeout(30000);

describe('Webhook Routes', () => {
    let app;
    let server;

    beforeEach(() => {
        app = express();
        app.use('', routes);

        // Error handling middleware
        app.use((err, req, res, next) => {
            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next(err);
        });

        app.use(errorConverter);
        app.use(errorHandler);

        // Reset mocks
        jest.clearAllMocks();
        securityService.rateLimit.mockReturnValue(true);
        webhookService.sendToGoogleChat.mockResolvedValue(true);
        validateSentryWebhook.mockReturnValue({ error: null });
        validateGitHubWebhook.mockReturnValue({ error: null });
        validateGitHubPayload.mockReturnValue(true);

        // Start server
        server = app.listen(0);
    });

    afterEach((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    describe('POST /webhook/github', () => {
        it('should handle invalid GitHub payload', async () => {
            validateGitHubWebhook.mockReturnValueOnce({ error: { message: 'Invalid signature' } });
            const response = await request(app)
                .post('/webhook/github')
                .send('{}')
                .set('x-hub-signature-256', 'invalid')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
            expect(validateGitHubWebhook).toHaveBeenCalled();
        });

        it('should handle valid GitHub payload', async () => {
            const payload = {
                action: 'submitted',
                review: { state: 'approved', user: { login: 'test' }, body: 'LGTM' },
                pull_request: { number: 1, title: 'Test PR', html_url: 'http://test.com' },
                repository: { name: 'test-repo' },
            };

            const response = await request(app)
                .post('/webhook/github')
                .send(JSON.stringify(payload))
                .set('x-hub-signature-256', 'valid')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
            expect(validateGitHubWebhook).toHaveBeenCalled();
            expect(messageService.formatGitHubMessage).toHaveBeenCalledWith(payload);
            expect(webhookService.sendToGoogleChat).toHaveBeenCalled();
        });
    });

    describe('POST /webhook/sentry', () => {
        it('should handle invalid Sentry payload', async () => {
            validateSentryWebhook.mockReturnValueOnce({ error: { message: 'Invalid payload' } });
            const response = await request(app)
                .post('/webhook/sentry')
                .send({})
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(validateSentryWebhook).toHaveBeenCalledWith({});
        });

        it('should handle valid Sentry payload', async () => {
            const payload = {
                data: {
                    event: {
                        level: 'error',
                        title: 'Test Error',
                        project: 'test-project',
                        event_id: '123',
                        web_url: 'http://test.com',
                    },
                },
            };

            const response = await request(app)
                .post('/webhook/sentry')
                .send(payload)
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
            expect(validateSentryWebhook).toHaveBeenCalledWith(payload);
            expect(messageService.formatSentryMessage).toHaveBeenCalledWith(payload);
            expect(webhookService.sendToGoogleChat).toHaveBeenCalled();
        });
    });
});
