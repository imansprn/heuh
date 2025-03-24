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
                    login: 'testuser',
                    avatar_url: 'https://github.com/testuser.png'
                }
            },
            pull_request: {
                number: 123,
                title: 'Test PR',
                html_url: 'https://github.com/test/repo/pull/123',
                user: {
                    login: 'author',
                    avatar_url: 'https://github.com/author.png'
                },
                state: 'open'
            },
            repository: {
                name: 'test-repo',
                full_name: 'test/test-repo',
                html_url: 'https://github.com/test/test-repo'
            }
        };

        it('should format GitHub review message correctly', () => {
            const result = messageService.formatGitHubMessage(mockGitHubPayload);
            expect(result).toHaveProperty('cardsV2');
            expect(result.cardsV2[0].card.header.title).toBe('👀 Review Submitted');
            expect(result.cardsV2[0].card.header.subtitle).toBe('test/test-repo');
            
            const reviewDetails = result.cardsV2[0].card.sections[0].widgets;
            expect(reviewDetails[0].decoratedText.text).toBe('🔢 <b>PR Number:</b> #123');
            expect(reviewDetails[1].decoratedText.text).toBe('📌 <b>PR Title:</b> Test PR');
            expect(reviewDetails[2].decoratedText.text).toBe('👤 <b>Reviewer:</b> testuser');
            expect(reviewDetails[3].decoratedText.text).toBe('📝 <b>State:</b> Approved');

            const comment = result.cardsV2[0].card.sections[1].widgets[0].textParagraph.text;
            expect(comment).toBe('LGTM');

            const buttons = result.cardsV2[0].card.sections[2].widgets[0].buttonList.buttons;
            expect(buttons[0].text).toBe('🔗 View Pull Request');
            expect(buttons[1].text).toBe('📂 View Repository');
        });

        it('should handle GitHub payload with missing optional fields', () => {
            const minimalPayload = {
                action: 'opened',
                pull_request: {
                    number: 123,
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/123',
                    user: {
                        login: 'author',
                        avatar_url: 'https://github.com/author.png'
                    },
                    state: 'open'
                },
                repository: {
                    name: 'test-repo',
                    full_name: 'test/test-repo',
                    html_url: 'https://github.com/test/test-repo'
                }
            };

            const result = messageService.formatGitHubMessage(minimalPayload);
            expect(result).toHaveProperty('cardsV2');
            expect(result.cardsV2[0].card.header.title).toBe('🔔 Pull Request Notification');
            expect(result.cardsV2[0].card.header.subtitle).toBe('OPENED - author');
            
            const details = result.cardsV2[0].card.sections[0].widgets;
            expect(details[0].decoratedText.text).toBe('📄 <b>PR Title:</b> Test PR');
            expect(details[1].decoratedText.text).toBe('👤 <b>Author:</b> author');
            expect(details[2].decoratedText.text).toBe('✔️ <b>Status:</b> open');
            expect(details[3].decoratedText.text).toBe('📂 <b>Repository:</b> test/test-repo');

            const buttons = result.cardsV2[0].card.sections[1].widgets[0].buttonList.buttons;
            expect(buttons[0].text).toBe('🔗 View Pull Request');
            expect(buttons[1].text).toBe('📂 View Repository');
        });

        it('should handle different review states correctly', () => {
            const states = ['approved', 'changes_requested', 'commented', 'dismissed'];

            states.forEach((state) => {
                const payload = {
                    ...mockGitHubPayload,
                    review: {
                        ...mockGitHubPayload.review,
                        state,
                        user: {
                            login: 'testuser',
                            avatar_url: 'https://github.com/testuser.png'
                        }
                    }
                };

                const result = messageService.formatGitHubMessage(payload);
                expect(result.cardsV2[0].card.sections[0].widgets[3].decoratedText.text)
                    .toBe(`📝 <b>State:</b> ${state.charAt(0).toUpperCase() + state.slice(1)}`);
            });
        });
    });
}); 