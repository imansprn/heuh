const request = require('supertest');
const express = require('express');
const httpStatus = require('http-status');
const routes = require('../src/routes');
const { errorConverter, errorHandler } = require('../src/middlewares/error.middleware');
const ApiError = require('../src/utils/ApiError');

// Mock the services
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
    validationService: {
        validateSentryWebhook: jest.fn().mockReturnValue({ error: null }),
        validateGitHubWebhook: jest.fn().mockReturnValue({ error: null }),
        validateGitHubPayload: jest.fn().mockReturnValue(true),
    },
}));

const { messageService, webhookService, securityService, validationService } = require('../src/services');

describe('Webhook Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
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
        validationService.validateSentryWebhook.mockReturnValue({ error: null });
        validationService.validateGitHubWebhook.mockReturnValue({ error: null });
        validationService.validateGitHubPayload.mockReturnValue(true);
    });

    describe('POST /webhook/github', () => {
        it('should handle invalid GitHub payload', async () => {
            validationService.validateGitHubWebhook.mockReturnValueOnce({ error: { message: 'Invalid signature' } });
            const response = await request(app)
                .post('/webhook/github')
                .send({})
                .set('x-hub-signature-256', 'invalid');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(validationService.validateGitHubWebhook).toHaveBeenCalled();
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
                .send(payload)
                .set('x-hub-signature-256', 'valid');

            expect(response.status).toBe(200);
            expect(validationService.validateGitHubWebhook).toHaveBeenCalled();
            expect(messageService.createGitHubMessage).toHaveBeenCalledWith(payload.action, payload.pull_request, payload.repository);
            expect(webhookService.sendToGoogleChat).toHaveBeenCalled();
        });
    });

    describe('POST /webhook/sentry', () => {
        it('should handle invalid Sentry payload', async () => {
            validationService.validateSentryWebhook.mockReturnValueOnce({ error: { message: 'Invalid payload' } });
            const response = await request(app).post('/webhook/sentry').send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(validationService.validateSentryWebhook).toHaveBeenCalledWith({});
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

            const response = await request(app).post('/webhook/sentry').send(payload);

            expect(response.status).toBe(200);
            expect(validationService.validateSentryWebhook).toHaveBeenCalledWith(payload);
            expect(messageService.formatSentryMessage).toHaveBeenCalledWith(payload);
            expect(webhookService.sendToGoogleChat).toHaveBeenCalled();
        });
    });
});
