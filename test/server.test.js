const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const routes = require('../src/routes');
const { errorConverter, errorHandler } = require('../src/middlewares/error.middleware');
const { verifySignature } = require('../src/utils/security');
const ApiError = require('../src/utils/ApiError');
const config = require('../src/config/config.config');

jest.mock('../src/utils/security', () => ({
    verifySignature: jest.fn(),
}));

jest.mock('../src/services', () => ({
    messageService: {
        formatSentryMessage: jest.fn(),
        formatGitHubMessage: jest.fn(),
    },
    webhookService: {
        sendToGoogleChat: jest.fn(),
    },
    validationService: {
        validateSentrySignature: jest.fn(),
        validateGitHubPayload: jest.fn(),
    },
    securityService: {
        verifyGitHubWebhook: jest.fn(),
        rateLimit: jest.fn(),
    },
}));

const { webhookService, validationService, securityService } = require('../src/services');

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
            handler: (req, res) => {
                throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests');
            },
        });
        app.use('/webhook', limiter);

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
    });

    beforeEach(() => {
        jest.clearAllMocks();
        securityService.rateLimit.mockReturnValue(true);
    });

    describe('Health Check', () => {
        it('should return 200 for health check', async () => {
            const response = await request(app).get('/health').expect(200);
            expect(response.body).toEqual({ status: 'ok' });
        });
    });

    describe('Not Found Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app).get('/unknown-route').expect(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Not found');
        });
    });

    describe('Body Parser', () => {
        it('should handle invalid JSON', async () => {
            const response = await request(app)
                .post('/webhook/github')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/Unexpected token.*JSON/);
        });
    });
});
