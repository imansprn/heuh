'use strict';

const { messageService } = require('../src/services');

describe('Message Service', () => {
    describe('formatSentryMessage', () => {
        const mockSentryPayload = {
            event: {
                title: 'Test Error',
                level: 'error',
                url: 'https://sentry.io/test',
                environment: 'production',
                user: {
                    username: 'testuser',
                    email: 'test@example.com'
                }
            }
        };

        it('should format Sentry error message correctly', () => {
            const result = messageService.formatSentryMessage(mockSentryPayload);
            expect(result).toContain('🚨 *Sentry Error Alert*');
            expect(result).toContain('*Title:* Test Error');
            expect(result).toContain('*Level:* error');
            expect(result).toContain('*Environment:* production');
            expect(result).toContain('*User:* testuser (test@example.com)');
            expect(result).toContain('*URL:* https://sentry.io/test');
        });

        it('should handle Sentry payload with missing optional fields', () => {
            const minimalPayload = {
                event: {
                    title: 'Test Error',
                    level: 'error',
                    url: 'https://sentry.io/test'
                }
            };

            const result = messageService.formatSentryMessage(minimalPayload);
            expect(result).toContain('🚨 *Sentry Error Alert*');
            expect(result).toContain('*Title:* Test Error');
            expect(result).toContain('*Level:* error');
            expect(result).toContain('*URL:* https://sentry.io/test');
            expect(result).not.toContain('*Environment:*');
            expect(result).not.toContain('*User:*');
        });

        it('should handle Sentry payload with unknown level', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    level: 'unknown',
                    url: 'https://sentry.io/test'
                }
            };

            const result = messageService.formatSentryMessage(payload);
            expect(result).toContain('*Level:* unknown');
        });
    });

    describe('formatGitHubMessage', () => {
        const mockGitHubPayload = {
            action: 'submitted',
            review: {
                state: 'approved',
                body: 'LGTM',
                user: {
                    login: 'testuser'
                }
            },
            pull_request: {
                number: 123,
                title: 'Test PR',
                html_url: 'https://github.com/test/repo/pull/123'
            },
            repository: {
                name: 'test-repo'
            }
        };

        it('should format GitHub review message correctly', () => {
            const result = messageService.formatGitHubMessage(mockGitHubPayload);
            expect(result).toContain('📝 *GitHub Review Update*');
            expect(result).toContain('*Repository:* test-repo');
            expect(result).toContain('*PR:* #123 - Test PR');
            expect(result).toContain('*Reviewer:* testuser');
            expect(result).toContain('*State:* ✅ Approved');
            expect(result).toContain('*Comment:* LGTM');
            expect(result).toContain('*URL:* https://github.com/test/repo/pull/123');
        });

        it('should handle GitHub payload with missing optional fields', () => {
            const minimalPayload = {
                action: 'submitted',
                review: {
                    state: 'approved',
                    user: {
                        login: 'testuser'
                    }
                },
                pull_request: {
                    number: 123,
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/123'
                },
                repository: {
                    name: 'test-repo'
                }
            };

            const result = messageService.formatGitHubMessage(minimalPayload);
            expect(result).toContain('📝 *GitHub Review Update*');
            expect(result).toContain('*Repository:* test-repo');
            expect(result).toContain('*PR:* #123 - Test PR');
            expect(result).toContain('*Reviewer:* testuser');
            expect(result).toContain('*State:* ✅ Approved');
            expect(result).not.toContain('*Comment:*');
            expect(result).toContain('*URL:* https://github.com/test/repo/pull/123');
        });

        it('should handle different review states correctly', () => {
            const states = ['approved', 'changes_requested', 'commented', 'dismissed'];
            const expectedEmojis = ['✅', '❌', '💬', '🚫'];

            states.forEach((state, index) => {
                const payload = {
                    ...mockGitHubPayload,
                    review: {
                        ...mockGitHubPayload.review,
                        state
                    }
                };

                const result = messageService.formatGitHubMessage(payload);
                expect(result).toContain(`*State:* ${expectedEmojis[index]} ${state.charAt(0).toUpperCase() + state.slice(1)}`);
            });
        });
    });
}); 