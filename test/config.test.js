'use strict';

const path = require('path');
const { expect } = require('@jest/globals');

describe('Config', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv };
        jest.resetModules();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Config Config', () => {
        it('should load valid configuration', () => {
            process.env.APP_ENV = 'test';
            process.env.PORT = '3000';
            process.env.GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/test';
            process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
            process.env.SENTRY_WEBHOOK_SECRET = 'test-secret';
            process.env.LOG_LEVEL = 'info';
            process.env.REQUEST_TIMEOUT = '5000';
            process.env.MAX_PAYLOAD_SIZE = '102400';
            process.env.RATE_LIMIT_MAX_REQUESTS = '100';
            process.env.RATE_LIMIT_WINDOW_MS = '900000';

            const config = require('../src/config/config.config');
            expect(config).toEqual({
                app_env: 'test',
                port: '3000',
                google_chat_webhook_url: 'https://chat.googleapis.com/test',
                github_webhook_secret: 'test-secret',
                sentry_webhook_secret: 'test-secret',
                log_level: 'info',
                request_timeout: 5000,
                max_payload_size: 102400,
                rate_limit: {
                    max_requests: 100,
                    window_ms: 900000
                }
            });
        });

        it('should throw error on missing required values', () => {
            delete process.env.APP_ENV;
            expect(() => {
                require('../src/config/config.config');
            }).toThrow('Config validation error: "APP_ENV" is required');
        });
    });

    describe('Logger Config', () => {
        it('should create logger with correct configuration', () => {
            const logger = require('../src/config/logger.config');
            expect(logger).toBeDefined();
            expect(logger.level).toBe('info');
        });
    });

    describe('Morgan Config', () => {
        it('should create morgan logger with correct format', () => {
            const morgan = require('../src/config/morgan.config');
            expect(morgan).toBeDefined();
        });
    });

    describe('Config Index', () => {
        it('should export all configs', () => {
            process.env.APP_ENV = 'test';
            process.env.PORT = '3000';
            process.env.GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/test';
            process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
            process.env.SENTRY_WEBHOOK_SECRET = 'test-secret';
            process.env.LOG_LEVEL = 'info';
            process.env.REQUEST_TIMEOUT = '5000';
            process.env.MAX_PAYLOAD_SIZE = '102400';
            process.env.RATE_LIMIT_MAX_REQUESTS = '100';
            process.env.RATE_LIMIT_WINDOW_MS = '900000';

            const config = require('../src/config');
            expect(config).toHaveProperty('config');
            expect(config).toHaveProperty('logger');
            expect(config).toHaveProperty('morgan');
        });
    });
}); 