'use strict';

const crypto = require('crypto');
const { validationService } = require('../src/services');

// Mock config
jest.mock('../src/config', () => ({
    config: {
        sentry_webhook_secret: 'test-sentry-secret',
        github_webhook_secret: 'test-github-secret'
    }
}));

describe('Validation Service', () => {
    describe('validateSentrySignature', () => {
        const mockPayload = {
            event: {
                title: 'Test Error',
                level: 'error',
                url: 'https://sentry.io/test'
            }
        };

        it('should validate correct Sentry signature', () => {
            const payload = JSON.stringify(mockPayload);
            const hmac = crypto.createHmac('sha256', 'test-sentry-secret');
            const signature = `sha256=${hmac.update(payload).digest('hex')}`;

            const result = validationService.validateSentrySignature(mockPayload, signature);
            expect(result).toBe(true);
        });

        it('should reject invalid Sentry signature', () => {
            const signature = 'sha256=invalid_signature';
            const result = validationService.validateSentrySignature(mockPayload, signature);
            expect(result).toBe(false);
        });

        it('should reject missing Sentry signature', () => {
            const result = validationService.validateSentrySignature(mockPayload, null);
            expect(result).toBe(false);
        });

        it('should accept any signature when no secret is configured', () => {
            const originalSecret = require('../src/config').config.sentry_webhook_secret;
            require('../src/config').config.sentry_webhook_secret = null;

            const result = validationService.validateSentrySignature(mockPayload, 'invalid_signature');
            expect(result).toBe(true);

            require('../src/config').config.sentry_webhook_secret = originalSecret;
        });
    });

    describe('validateGitHubPayload', () => {
        const validGitHubPayload = {
            action: 'submitted',
            review: {
                state: 'approved',
                body: 'LGTM'
            },
            repository: {
                name: 'test-repo'
            }
        };

        it('should validate correct GitHub payload', () => {
            const result = validationService.validateGitHubPayload(validGitHubPayload);
            expect(result).toBe(true);
        });

        it('should reject GitHub payload with invalid action', () => {
            const invalidPayload = {
                ...validGitHubPayload,
                action: 'invalid_action'
            };
            const result = validationService.validateGitHubPayload(invalidPayload);
            expect(result).toBe(false);
        });

        it('should reject GitHub payload with invalid review state', () => {
            const invalidPayload = {
                ...validGitHubPayload,
                review: {
                    ...validGitHubPayload.review,
                    state: 'invalid_state'
                }
            };
            const result = validationService.validateGitHubPayload(invalidPayload);
            expect(result).toBe(false);
        });

        it('should reject GitHub payload missing required fields', () => {
            const invalidPayload = {
                action: 'submitted'
                // Missing review and repository fields
            };
            const result = validationService.validateGitHubPayload(invalidPayload);
            expect(result).toBe(false);
        });
    });
}); 