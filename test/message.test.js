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
                event_id: 'abc123',
                release: 'v1.0.0',
                user: {
                    username: 'testuser',
                    email: 'test@example.com'
                }
            },
            project: {
                name: 'test-project',
                slug: 'test-project'
            },
            url: 'https://sentry.io/test'
        };

        it('should format Sentry error message correctly', () => {
            const result = messageService.formatSentryMessage(mockSentryPayload);
            expect(result).toHaveProperty('cardsV2');
            expect(result.cardsV2[0].card.header.title).toBe('🚨 ERROR - Sentry Notification');
            expect(result.cardsV2[0].card.header.subtitle).toBe('Environment: production');
            
            const widgets = result.cardsV2[0].card.sections[0].widgets;
            expect(widgets[1].decoratedText.text).toBe('🔧 <b>Project:</b> test-project');
            expect(widgets[2].decoratedText.text).toBe('🆔 <b>Event ID:</b> abc123');
            expect(widgets[3].decoratedText.text).toBe('👤 <b>User:</b> testuser');
            expect(widgets[4].decoratedText.text).toBe('📦 <b>Release:</b> v1.0.0');
            expect(widgets[5].decoratedText.text).toBe('⚠️ <b>Error:</b> Test Error');
        });

        it('should handle Sentry payload with missing optional fields', () => {
            const minimalPayload = {
                event: {
                    title: 'Test Error',
                    level: 'error',
                    environment: 'production'
                },
                project: {
                    name: 'test-project'
                },
                url: 'https://sentry.io/test'
            };

            const result = messageService.formatSentryMessage(minimalPayload);
            expect(result).toHaveProperty('cardsV2');
            expect(result.cardsV2[0].card.header.title).toBe('🚨 ERROR - Sentry Notification');
            expect(result.cardsV2[0].card.header.subtitle).toBe('Environment: production');
            
            const widgets = result.cardsV2[0].card.sections[0].widgets;
            expect(widgets[1].decoratedText.text).toBe('🔧 <b>Project:</b> test-project');
            expect(widgets[3].decoratedText.text).toBe('👤 <b>User:</b> NA');
            expect(widgets[4].decoratedText.text).toBe('📦 <b>Release:</b> NA');
            expect(widgets[5].decoratedText.text).toBe('⚠️ <b>Error:</b> Test Error');
        });

        it('should handle Sentry payload with unknown level', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    level: 'unknown',
                    environment: 'production'
                },
                project: {
                    name: 'test-project'
                },
                url: 'https://sentry.io/test'
            };

            const result = messageService.formatSentryMessage(payload);
            expect(result.cardsV2[0].card.header.title).toBe('🚨 UNKNOWN - Sentry Notification');
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