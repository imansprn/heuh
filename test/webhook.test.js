'use strict';

const request = require('supertest');
const app = require('../src/app');

// Mock the services
jest.mock('../src/services', () => ({
    messageService: {
        formatSentryMessage: jest.fn(),
        formatGitHubMessage: jest.fn()
    },
    webhookService: {
        sendToGoogleChat: jest.fn()
    },
    validationService: {
        validateSentrySignature: jest.fn(),
        validateGitHubPayload: jest.fn()
    },
    securityService: {
        verifyGitHubWebhook: jest.fn(),
        rateLimit: jest.fn()
    }
}));

const { messageService, webhookService, validationService, securityService } = require('../src/services');

describe('Webhook Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /webhook/sentry', () => {
        const mockSentryPayload = {
            event: {
                title: 'Test Error',
                level: 'error',
                url: 'https://sentry.io/test'
            }
        };

        it('should process valid Sentry webhook', async () => {
            // Mock service responses
            securityService.rateLimit.mockReturnValue(true);
            validationService.validateSentrySignature.mockReturnValue(true);
            messageService.formatSentryMessage.mockReturnValue('Formatted message');
            webhookService.sendToGoogleChat.mockResolvedValue(true);

            const response = await request(app)
                .post('/webhook/sentry')
                .set('x-sentry-signature', 'valid-signature')
                .send(mockSentryPayload);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Webhook processed successfully' });
            expect(securityService.rateLimit).toHaveBeenCalled();
            expect(validationService.validateSentrySignature).toHaveBeenCalled();
            expect(messageService.formatSentryMessage).toHaveBeenCalledWith(mockSentryPayload);
            expect(webhookService.sendToGoogleChat).toHaveBeenCalled();
        });

        it('should reject requests exceeding rate limit', async () => {
            securityService.rateLimit.mockReturnValue(false);

            const response = await request(app)
                .post('/webhook/sentry')
                .set('x-sentry-signature', 'valid-signature')
                .send(mockSentryPayload);

            expect(response.status).toBe(429);
            expect(response.body).toEqual({ error: 'Too many requests' });
        });

        it('should reject invalid Sentry signature', async () => {
            securityService.rateLimit.mockReturnValue(true);
            validationService.validateSentrySignature.mockReturnValue(false);

            const response = await request(app)
                .post('/webhook/sentry')
                .set('x-sentry-signature', 'invalid-signature')
                .send(mockSentryPayload);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: 'Invalid signature' });
        });
    });

    describe('POST /webhook/github', () => {
        const mockGitHubPayload = {
            action: 'submitted',
            review: {
                state: 'approved',
                body: 'LGTM'
            },
            repository: {
                name: 'test-repo'
            }
        };

        it('should process valid GitHub webhook', async () => {
            // Mock service responses
            securityService.rateLimit.mockReturnValue(true);
            securityService.verifyGitHubWebhook.mockReturnValue(true);
            messageService.formatGitHubMessage.mockReturnValue('Formatted message');
            webhookService.sendToGoogleChat.mockResolvedValue(true);

            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'valid-signature')
                .send(mockGitHubPayload);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Webhook processed successfully' });
            expect(securityService.rateLimit).toHaveBeenCalled();
            expect(securityService.verifyGitHubWebhook).toHaveBeenCalled();
            expect(messageService.formatGitHubMessage).toHaveBeenCalledWith(mockGitHubPayload);
            expect(webhookService.sendToGoogleChat).toHaveBeenCalled();
        });

        it('should reject requests exceeding rate limit', async () => {
            securityService.rateLimit.mockReturnValue(false);

            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'valid-signature')
                .send(mockGitHubPayload);

            expect(response.status).toBe(429);
            expect(response.body).toEqual({ error: 'Too many requests' });
        });

        it('should reject invalid GitHub signature', async () => {
            securityService.rateLimit.mockReturnValue(true);
            securityService.verifyGitHubWebhook.mockReturnValue(false);

            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'invalid-signature')
                .send(mockGitHubPayload);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: 'Invalid signature' });
        });
    });
}); 