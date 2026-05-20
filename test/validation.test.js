const crypto = require('crypto');
const httpStatus = require('http-status');
const { validationService } = require('../src/services');
const ApiError = require('../src/utils/ApiError');

describe('Validation Service', () => {
    describe('validateGitHubPayload', () => {
        const validGitHubPayload = {
            action: 'submitted',
            pull_request: {
                number: 1,
                title: 'Test PR',
                html_url: 'http://test.com',
                state: 'open',
                user: { login: 'test-user' },
                head: { ref: 'feature', sha: 'abc123' },
                base: { ref: 'main', sha: 'def456' },
            },
            review: {
                state: 'approved',
                body: 'LGTM',
                user: { login: 'reviewer' },
            },
            repository: {
                name: 'test-repo',
                full_name: 'test/test-repo',
                owner: { login: 'test-user' },
            },
            sender: { login: 'test-user' },
        };

        it('should validate correct GitHub payload', () => {
            const result = validationService.validateGitHubPayload(validGitHubPayload);
            expect(result).toBe(true);
        });

        it('should reject GitHub payload with invalid action', () => {
            const invalidPayload = {
                ...validGitHubPayload,
                action: 'invalid_action',
            };
            expect(() => validationService.validateGitHubPayload(invalidPayload)).toThrow(
                new ApiError(httpStatus.BAD_REQUEST, 'Invalid action', true)
            );
        });

        it('should reject GitHub payload with invalid review state', () => {
            const invalidPayload = {
                ...validGitHubPayload,
                review: {
                    ...validGitHubPayload.review,
                    state: 'invalid_state',
                },
            };
            expect(() => validationService.validateGitHubPayload(invalidPayload)).toThrow(
                new ApiError(
                    httpStatus.BAD_REQUEST,
                    '"review.state" must be one of [approved, changes_requested, commented]',
                    true
                )
            );
        });

        it('should reject GitHub payload missing required fields', () => {
            const invalidPayload = {
                action: 'submitted',
                // Missing review and repository fields
            };
            expect(() => validationService.validateGitHubPayload(invalidPayload)).toThrow(
                new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields', true)
            );
        });

        describe('validateSentryWebhookSignature', () => {
            const payload = JSON.stringify({ data: { event: { title: 'boom' } } });
            const secret = 'sentry-secret';
            const buildSignature = body => crypto.createHmac('sha256', secret).update(body).digest('hex');

            it('should return success for valid signature', () => {
                const signature = buildSignature(payload);
                const result = validationService.validateSentryWebhookSignature(payload, signature, secret);
                expect(result).toEqual({ error: null });
            });

            it('should return error for invalid signature', () => {
                const result = validationService.validateSentryWebhookSignature(payload, 'invalid', secret);
                expect(result.error).toBeDefined();
                expect(result.error.message).toBe('Invalid signature');
            });

            it('should skip verification when secret is missing', () => {
                const result = validationService.validateSentryWebhookSignature(payload, undefined, undefined);
                expect(result).toEqual({ error: null });
            });
        });

        describe('validateSentryWebhook', () => {
            it('should accept Sentry issue alert payload shape (data.issue)', () => {
                const payload = {
                    action: 'created',
                    installation: { uuid: '021b1590-5af8-43d1-a342-ff6138aea725' },
                    data: {
                        issue: {
                            id: '7494101792',
                            shortId: 'VALBURY-MOBILE-APP-SEB',
                            title: '[Adjust] alwimuhammaddd+29298668atgmail.com',
                            level: 'warning',
                            status: 'unresolved',
                            count: '2',
                            userCount: 1,
                            firstSeen: '2026-05-20T08:06:28.437000+00:00',
                            lastSeen: '2026-05-20T08:06:29.311000+00:00',
                            web_url: 'https://valbury.sentry.io/issues/7494101792/',
                            project: {
                                id: '4505084990062592',
                                name: 'valbury-mobile-app',
                                slug: 'valbury-mobile-app',
                                platform: 'flutter',
                            },
                        },
                    },
                    actor: { type: 'application', id: 'sentry', name: 'Sentry' },
                };

                const result = validationService.validateSentryWebhook(payload);
                expect(result.error).toBeUndefined();
            });
        });
    });
});
