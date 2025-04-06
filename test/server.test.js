'use strict';

const request = require('supertest');
const express = require('express');
const routes = require('../src/routes');
const { errorConverter, errorHandler } = require('../src/middlewares/error.middleware');
const rateLimit = require('express-rate-limit');
const app = require('../src/app');
const { verifySignature } = require('../src/utils/security');

jest.mock('../src/utils/security', () => ({
    verifySignature: jest.fn()
}));

describe('Server', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        // Add rate limiter
        const limiter = rateLimit({
            windowMs: 100, // Short window for testing
            max: 2, // Small limit for testing
            standardHeaders: true,
            legacyHeaders: false,
        });
        app.use('/webhook', limiter);
        
        app.use('', routes);
        app.use(errorConverter);
        app.use(errorHandler);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Health Check', () => {
        it('should return 200 for health check', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            expect(response.body).toEqual({ status: 'ok' });
        });
    });

    describe('Not Found Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app)
                .get('/unknown-route')
                .expect(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Not found');
        });
    });

    describe('Error Handler', () => {
        it('should handle errors gracefully', async () => {
            verifySignature.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'invalid')
                .send({});

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Invalid signature');
        });
    });

    describe('Rate Limiter', () => {
        it('should limit requests', async () => {
            verifySignature.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            // First request should fail with 401
            await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'sha256=valid')
                .send({})
                .expect(401);

            // Second request should also fail with 401
            const response = await request(app)
                .post('/webhook/github')
                .set('x-hub-signature-256', 'sha256=valid')
                .send({});

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle rate limit exceeded', async () => {
            // Simulate rate limit exceeded
            const promises = Array(101).fill().map(() => 
                request(app)
                    .post('/webhook/github')
                    .set('x-hub-signature-256', 'sha256=valid')
                    .send({})
            );

            const responses = await Promise.all(promises);
            const lastResponse = responses[responses.length - 1];

            expect(lastResponse.status).toBe(429);
            expect(lastResponse.body).toHaveProperty('error');
            expect(lastResponse.body.error).toBe('Too many requests');
        });
    });

    describe('Body Parser', () => {
        it('should parse valid JSON', async () => {
            verifySignature.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const response = await request(app)
                .post('/webhook/github')
                .set('Content-Type', 'application/json')
                .send({ test: 'data' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle invalid JSON', async () => {
            const response = await request(app)
                .post('/webhook/github')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Invalid JSON payload');
        });
    });
}); 