const { formatSentryMessage, formatGitHubMessage } = require('../src/services/message.service');

describe('Message Service', () => {
    describe('formatSentryMessage', () => {
        it('should format a complete Sentry payload correctly', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    event_id: 'abc123',
                    user: {
                        username: 'testuser',
                    },
                    environment: 'production',
                    level: 'error',
                    release: 'v1.0.0',
                },
                project: {
                    name: 'test-project',
                },
            };

            const result = formatSentryMessage(payload);
            expect(result.cardsV2[0].card.header.title).toBe('🚨 ERROR - Sentry Notification');
            expect(result.cardsV2[0].card.header.subtitle).toBe('Environment: production');
            expect(result.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '🔧 <b>Project:</b> test-project'
            );
            expect(result.cardsV2[0].card.sections[0].widgets[1].decoratedText.text).toBe('🆔 <b>Event ID:</b> abc123');
            expect(result.cardsV2[0].card.sections[0].widgets[2].decoratedText.text).toBe('👤 <b>User:</b> testuser');
            expect(result.cardsV2[0].card.sections[0].widgets[3].decoratedText.text).toBe('📦 <b>Release:</b> v1.0.0');
            expect(result.cardsV2[0].card.sections[0].widgets[4].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Test Error'
            );
        });

        it('should handle Sentry payload with missing optional fields', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                },
                project: {
                    name: 'test-project',
                },
            };

            const result = formatSentryMessage(payload);
            expect(result.cardsV2[0].card.header.title).toBe('🚨 UNKNOWN - Sentry Notification');
            expect(result.cardsV2[0].card.header.subtitle).toBe('Environment: NA');
            expect(result.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '🔧 <b>Project:</b> test-project'
            );
            expect(result.cardsV2[0].card.sections[0].widgets[1].decoratedText.text).toBe('🆔 <b>Event ID:</b> NA');
            expect(result.cardsV2[0].card.sections[0].widgets[2].decoratedText.text).toBe('👤 <b>User:</b> NA');
            expect(result.cardsV2[0].card.sections[0].widgets[3].decoratedText.text).toBe('📦 <b>Release:</b> NA');
            expect(result.cardsV2[0].card.sections[0].widgets[4].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Test Error'
            );
        });

        it('should handle Sentry payload with unknown level', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    level: 'unknown',
                    environment: 'production',
                },
                project: {
                    name: 'test-project',
                },
                url: 'https://sentry.io/test',
            };

            const result = formatSentryMessage(payload);
            expect(result.cardsV2[0].card.header.title).toBe('🚨 UNKNOWN - Sentry Notification');
        });

        it('should handle valid Sentry payload', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    level: 'error',
                    environment: 'production',
                    user: { username: 'testuser' },
                    event_id: 'test123',
                    release: 'v1.0.0',
                },
                project: {
                    name: 'Test Project',
                },
                url: 'https://sentry.io/test',
            };

            const message = formatSentryMessage(payload);
            expect(message.cardsV2[0].card.header.title).toBe('🚨 ERROR - Sentry Notification');
            expect(message.cardsV2[0].card.header.subtitle).toBe('Environment: production');

            const { widgets } = message.cardsV2[0].card.sections[0];
            expect(widgets[0].decoratedText.text).toBe('🔧 <b>Project:</b> Test Project');
            expect(widgets[1].decoratedText.text).toBe('🆔 <b>Event ID:</b> test123');
            expect(widgets[2].decoratedText.text).toBe('👤 <b>User:</b> testuser');
            expect(widgets[3].decoratedText.text).toBe('📦 <b>Release:</b> v1.0.0');
            expect(widgets[4].decoratedText.text).toBe('⚠️ <b>Error:</b> Test Error');
        });

        it('should handle missing optional fields in Sentry payload', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    level: 'error',
                },
                project: {
                    name: 'Test Project',
                },
            };

            const message = formatSentryMessage(payload);
            expect(message.cardsV2[0].card.header.subtitle).toBe('Environment: NA');

            const { widgets } = message.cardsV2[0].card.sections[0];
            expect(widgets[2].decoratedText.text).toBe('👤 <b>User:</b> NA');
            expect(widgets[3].decoratedText.text).toBe('📦 <b>Release:</b> NA');
        });

        it('should handle invalid Sentry payload', () => {
            const message = formatSentryMessage({});
            expect(message.cardsV2[0].card.header.title).toBe('🚨 ERROR - Invalid Payload');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Invalid Sentry payload received'
            );
        });
    });

    describe('formatGitHubMessage', () => {
        it('should handle review request with teams', () => {
            const payload = {
                action: 'review_requested',
                pull_request: {
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/1',
                    user: {
                        login: 'author',
                    },
                    base: {
                        repo: {
                            name: 'repo',
                            owner: {
                                login: 'owner',
                            },
                        },
                    },
                },
                requested_reviewers: [{ login: 'reviewer1' }],
                requested_teams: [{ name: 'team1' }],
            };

            const result = formatGitHubMessage(payload);
            expect(result.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Invalid GitHub payload received'
            );
        });

        it('should handle pull request with all optional fields', () => {
            const payload = {
                action: 'opened',
                pull_request: {
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/1',
                    body: 'PR Description',
                    user: {
                        login: 'author',
                    },
                    base: {
                        repo: {
                            name: 'repo',
                            owner: {
                                login: 'owner',
                            },
                        },
                    },
                },
                requested_reviewers: [{ login: 'reviewer1' }],
            };

            const result = formatGitHubMessage(payload);
            expect(result.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Invalid GitHub payload received'
            );
        });

        it('should handle pull request with teams', () => {
            const payload = {
                action: 'review_requested',
                pull_request: {
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/1',
                    user: {
                        login: 'author',
                    },
                    base: {
                        repo: {
                            name: 'repo',
                            owner: {
                                login: 'owner',
                            },
                        },
                    },
                },
                requested_teams: [{ name: 'team1' }, { name: 'team2' }],
            };

            const result = formatGitHubMessage(payload);
            expect(result.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Invalid GitHub payload received'
            );
        });

        it('should handle unknown GitHub events', () => {
            const payload = {
                action: 'unknown',
                pull_request: {
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/1',
                    user: {
                        login: 'author',
                    },
                    base: {
                        repo: {
                            name: 'repo',
                            owner: {
                                login: 'owner',
                            },
                        },
                    },
                },
            };

            const result = formatGitHubMessage(payload);
            expect(result.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Invalid GitHub payload received'
            );
        });

        it('should handle invalid GitHub payload', () => {
            const message = formatGitHubMessage({});
            expect(message.cardsV2[0].card.header.title).toBe('🔔 GitHub Notification');
            expect(message.cardsV2[0].card.header.subtitle).toBe('Invalid Payload');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                '⚠️ <b>Error:</b> Invalid GitHub payload received'
            );
        });

        it('should handle pull request with missing branch information', () => {
            const payload = {
                action: 'opened',
                repository: {
                    full_name: 'test/test-repo',
                },
                pull_request: {
                    title: 'Test PR',
                    user: {
                        login: 'author',
                    },
                    head: {},
                    base: {},
                },
            };

            const message = formatGitHubMessage(payload);
            const { widgets } = message.cardsV2[0].card.sections[0];
            const branchWidget = widgets.find(w => w.decoratedText?.text?.includes('Branch'));
            expect(branchWidget.decoratedText.text).toBe('🌿 <b>Branch:</b> unknown → unknown');
        });
    });
});
