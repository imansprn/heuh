'use strict';

const { securityService } = require('../src/services');

// Mock config
jest.mock('../src/config', () => ({
    config: {
        github_webhook_secret: 'test-github-secret',
        rate_limit: {
            window_ms: 1000, // 1 second for testing
            max_requests: 2  // 2 requests per window for testing
        }
    }
}));

describe('Security Service', () => {
    describe('verifyGitHubWebhook', () => {
        it('should verify valid GitHub webhook signature', () => {
            const payload = JSON.stringify({ test: 'data' });
            const hmac = require('crypto').createHmac('sha256', 'test-github-secret');
            const signature = `sha256=${hmac.update(payload).digest('hex')}`;

            const result = securityService.verifyGitHubWebhook(payload, signature);
            expect(result).toBe(true);
        });

        it('should reject invalid GitHub webhook signature', () => {
            const payload = JSON.stringify({ test: 'data' });
            const signature = 'sha256=invalid_signature';

            const result = securityService.verifyGitHubWebhook(payload, signature);
            expect(result).toBe(false);
        });

        it('should accept any signature when no secret is configured', () => {
            const originalSecret = require('../src/config').config.github_webhook_secret;
            require('../src/config').config.github_webhook_secret = null;

            const result = securityService.verifyGitHubWebhook('test', 'invalid_signature');
            expect(result).toBe(true);

            require('../src/config').config.github_webhook_secret = originalSecret;
        });
    });

    describe('rateLimit', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-01').getTime());
            // Reset rate limiter state
            securityService.resetRateLimiter();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should allow requests within limit', () => {
            const ip = '127.0.0.1';
            
            for (let i = 0; i < 2; i++) {
                expect(securityService.rateLimit(ip)).toBe(true);
                jest.advanceTimersByTime(100); // Advance 100ms between requests
            }
        });

        it('should reject requests exceeding limit', () => {
            const ip = '127.0.0.1';
            
            // First two requests should be allowed
            expect(securityService.rateLimit(ip)).toBe(true);
            jest.advanceTimersByTime(100);
            expect(securityService.rateLimit(ip)).toBe(true);
            jest.advanceTimersByTime(100);
            
            // Third request should be rejected
            expect(securityService.rateLimit(ip)).toBe(false);
        });

        it('should reset after window period', () => {
            const ip = '127.0.0.1';
            
            // Fill up the rate limit
            expect(securityService.rateLimit(ip)).toBe(true);
            jest.advanceTimersByTime(100);
            expect(securityService.rateLimit(ip)).toBe(true);
            jest.advanceTimersByTime(100);
            expect(securityService.rateLimit(ip)).toBe(false);

            // Advance past the window period
            jest.advanceTimersByTime(1100);

            // Should allow new requests
            expect(securityService.rateLimit(ip)).toBe(true);
        });
    });
}); 