'use strict';

const request = require('supertest');
const app = require('../src/app');
const { verifySignature } = require('../src/utils/security');
const messageService = require('../src/services/message.service');

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

const { webhookService, validationService, securityService } = require('../src/services');

describe('Webhook Controller', () => {
    const mockMessage = {
        cardsV2: [{
            card: {
                header: { title: 'Test Card' },
                sections: [{ widgets: [{ text: 'Test content' }] }]
            }
        }]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        messageService.formatSentryMessage.mockReturnValue(mockMessage);
        messageService.formatGitHubMessage.mockReturnValue(mockMessage);
    });

    describe('POST /webhook/sentry', () => {
        it('should handle valid Sentry webhook', async () => {
            const response = await request(app)
                .post('/webhook/sentry')
                .set('x-sentry-hook-signature', 'valid')
                .send({ event: { id: 'test' } });

            expect(response.status).toBe(200);
            expect(messageService.formatSentryMessage).toHaveBeenCalled();
        });

        it('should reject requests exceeding rate limit', async () => {
            // Make multiple requests to trigger rate limit
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/webhook/sentry')
                    .set('x-sentry-hook-signature', 'valid')
                    .send({ event: { id: 'test' } });
            }

            const response = await request(app)
                .post('/webhook/sentry')
                .set('x-sentry-hook-signature', 'valid')
                .send({ event: { id: 'test' } });

            expect(response.status).toBe(429);
            expect(response.body).toHaveProperty('error', 'Too many requests');
        });

        it('should reject invalid Sentry signature', async () => {
            const response = await request(app)
                .post('/webhook/sentry')
                .set('x-sentry-hook-signature', 'invalid')
                .send({ event: { id: 'test' } });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid signature');
        });
    });

    describe('POST /webhook/github', () => {
        it('should handle valid GitHub webhook', async () => {
            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'sha256=valid')
                .send({ repository: { name: 'test' } });

            expect(response.status).toBe(200);
            expect(messageService.formatGitHubMessage).toHaveBeenCalled();
        });

        it('should reject requests exceeding rate limit', async () => {
            // Make multiple requests to trigger rate limit
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/webhook/github')
                    .set('x-hub-signature-256', 'sha256=valid')
                    .send({ repository: { name: 'test' } });
            }

            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'sha256=valid')
                .send({ repository: { name: 'test' } });

            expect(response.status).toBe(429);
            expect(response.body).toHaveProperty('error', 'Too many requests');
        });

        it('should reject invalid GitHub signature', async () => {
            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'sha256=invalid')
                .send({ repository: { name: 'test' } });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid signature');
        });
    });
}); 