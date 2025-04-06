'use strict';

const { formatSentryMessage, formatGitHubMessage } = require('../src/services/message.service');

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
            const result = formatSentryMessage(mockSentryPayload);
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

            const result = formatSentryMessage(minimalPayload);
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
                    release: 'v1.0.0'
                },
                project: {
                    name: 'Test Project'
                },
                url: 'https://sentry.io/test'
            };

            const message = formatSentryMessage(payload);
            expect(message.cardsV2[0].card.header.title).toBe('🚨 ERROR - Sentry Notification');
            expect(message.cardsV2[0].card.header.subtitle).toBe('Environment: production');
            
            const widgets = message.cardsV2[0].card.sections[0].widgets;
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
                    level: 'error'
                },
                project: {
                    name: 'Test Project'
                }
            };

            const message = formatSentryMessage(payload);
            expect(message.cardsV2[0].card.header.subtitle).toBe('Environment: NA');
            
            const widgets = message.cardsV2[0].card.sections[0].widgets;
            expect(widgets[2].decoratedText.text).toBe('👤 <b>User:</b> NA');
            expect(widgets[3].decoratedText.text).toBe('📦 <b>Release:</b> NA');
        });

        it('should handle invalid Sentry payload', () => {
            const message = formatSentryMessage({});
            expect(message.cardsV2[0].card.header.title).toBe('🚨 ERROR - Invalid Payload');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text)
                .toBe('⚠️ <b>Error:</b> Invalid Sentry payload received');
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
            const result = formatGitHubMessage(mockGitHubPayload);
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

            const result = formatGitHubMessage(minimalPayload);
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

                const result = formatGitHubMessage(payload);
                expect(result.cardsV2[0].card.sections[0].widgets[3].decoratedText.text)
                    .toBe(`📝 <b>State:</b> ${state.charAt(0).toUpperCase() + state.slice(1)}`);
            });
        });

        it('should handle review request with teams', () => {
            const payload = {
                action: 'review_requested',
                pull_request: {
                    number: 123,
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/123',
                    user: {
                        login: 'author',
                        avatar_url: 'https://github.com/author.png'
                    },
                    state: 'open',
                    requested_reviewers: [
                        {
                            login: 'reviewer1',
                            avatar_url: 'https://github.com/reviewer1.png'
                        }
                    ],
                    requested_teams: [
                        {
                            name: 'team1',
                            slug: 'team1'
                        }
                    ],
                    body: 'Please review this PR',
                    head: {
                        ref: 'feature-branch'
                    },
                    base: {
                        ref: 'main'
                    },
                    additions: 100,
                    deletions: 50,
                    changed_files: 5
                },
                repository: {
                    name: 'test-repo',
                    full_name: 'test/test-repo',
                    html_url: 'https://github.com/test/test-repo'
                }
            };

            const result = formatGitHubMessage(payload);
            expect(result).toHaveProperty('cardsV2');
            expect(result.cardsV2[0].card.header.title).toBe('👀 Review Requested');
            
            const reviewRequest = result.cardsV2[0].card.sections[1].widgets;
            expect(reviewRequest[0].textParagraph.text).toBe('🔍 <b>Hey reviewers!</b>');
            expect(reviewRequest[1].decoratedText.text).toBe('@reviewer1');
            expect(reviewRequest[2].textParagraph.text).toBe('Please review this PR when you have a chance.');
            expect(reviewRequest[3].textParagraph.text).toBe('👥 <b>Teams requested:</b>\n• team1');
        });

        it('should handle pull request with all optional fields', () => {
            const payload = {
                action: 'opened',
                pull_request: {
                    number: 123,
                    title: 'Test PR',
                    html_url: 'https://github.com/test/repo/pull/123',
                    user: {
                        login: 'author',
                        avatar_url: 'https://github.com/author.png'
                    },
                    state: 'open',
                    body: 'PR Description',
                    head: {
                        ref: 'feature-branch'
                    },
                    base: {
                        ref: 'main'
                    },
                    additions: 100,
                    deletions: 50,
                    changed_files: 5,
                    requested_reviewers: [
                        {
                            login: 'reviewer1',
                            avatar_url: 'https://github.com/reviewer1.png'
                        }
                    ],
                    requested_teams: [
                        {
                            name: 'team1'
                        }
                    ]
                },
                repository: {
                    name: 'test-repo',
                    full_name: 'test/test-repo',
                    html_url: 'https://github.com/test/test-repo'
                }
            };

            const result = formatGitHubMessage(payload);
            expect(result).toHaveProperty('cardsV2');
            expect(result.cardsV2[0].card.header.title).toBe('🔔 Pull Request Notification');
            
            const sections = result.cardsV2[0].card.sections;
            expect(sections[0].widgets[4].decoratedText.text).toBe('🌿 <b>Branch:</b> feature-branch → main');
            expect(sections[0].widgets[5].decoratedText.text).toBe('📊 <b>Changes:</b> +100 -50 (5 files)');
            
            expect(sections[1].header).toBe('Description');
            expect(sections[1].widgets[0].textParagraph.text).toBe('PR Description');
            
            expect(sections[2].header).toBe('Review Requested');
            expect(sections[2].widgets[1].decoratedText.text).toBe('@reviewer1');
        });

        it('should handle review with pending reviewers', () => {
            const payload = {
                action: 'review_requested',
                repository: {
                    full_name: 'test/test-repo',
                    html_url: 'https://github.com/test/test-repo'
                },
                pull_request: {
                    number: 1,
                    title: 'Test PR',
                    html_url: 'https://github.com/test/test-repo/pull/1',
                    user: {
                        login: 'author',
                        avatar_url: 'https://github.com/author.png'
                    },
                    requested_reviewers: [
                        {
                            login: 'reviewer1',
                            avatar_url: 'https://github.com/reviewer1.png'
                        },
                        {
                            login: 'reviewer2',
                            avatar_url: 'https://github.com/reviewer2.png'
                        }
                    ]
                }
            };

            const message = formatGitHubMessage(payload);
            expect(message.cardsV2[0].card.header.title).toBe('👀 Review Requested');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe('🔢 <b>PR Number:</b> #1');
            expect(message.cardsV2[0].card.sections[0].widgets[1].decoratedText.text).toBe('📌 <b>PR Title:</b> Test PR');
            expect(message.cardsV2[0].card.sections[0].widgets[2].decoratedText.text).toBe('👤 <b>Author:</b> author');
        });

        it('should handle review with missing user information', () => {
            const payload = {
                action: 'submitted',
                repository: {
                    full_name: 'test/test-repo'
                },
                pull_request: {
                    number: 1,
                    title: 'Test PR'
                },
                review: {
                    state: 'approved'
                }
            };

            const message = formatGitHubMessage(payload);
            expect(message.cardsV2[0].card.header.title).toBe('👀 Review Submitted');
            expect(message.cardsV2[0].card.sections[0].widgets[2].decoratedText.text).toBe('👤 <b>Reviewer:</b> Unknown');
        });

        it('should handle pull request with missing fields', () => {
            const payload = {
                action: 'opened',
                repository: {
                    full_name: 'test/test-repo'
                },
                pull_request: {
                    title: 'Test PR'
                }
            };

            const message = formatGitHubMessage(payload);
            expect(message.cardsV2[0].card.header.title).toBe('🔔 Pull Request Notification');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe('📄 <b>PR Title:</b> Test PR');
            expect(message.cardsV2[0].card.sections[0].widgets[1].decoratedText.text).toBe('👤 <b>Author:</b> Unknown');
            expect(message.cardsV2[0].card.sections[0].widgets[2].decoratedText.text).toBe('✔️ <b>Status:</b> unknown');
        });

        it('should handle pull request with teams', () => {
            const payload = {
                action: 'review_requested',
                repository: {
                    full_name: 'test/test-repo'
                },
                pull_request: {
                    title: 'Test PR',
                    requested_teams: [
                        { name: 'team1' },
                        { name: 'team2' }
                    ]
                }
            };

            const message = formatGitHubMessage(payload);
            const teamsSection = message.cardsV2[0].card.sections[1].widgets[0].textParagraph.text;
            expect(teamsSection).toBe('👥 <b>Teams requested:</b>\n• team1\n• team2');
        });

        it('should handle unknown GitHub events', () => {
            const payload = {
                action: 'unknown',
                repository: {
                    full_name: 'test/test-repo'
                }
            };

            const message = formatGitHubMessage(payload);
            expect(message.cardsV2[0].card.header.title).toBe('🔔 GitHub Notification');
            expect(message.cardsV2[0].card.header.subtitle).toBe('test/test-repo');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe('📝 <b>Action:</b> unknown');
        });

        it('should handle invalid GitHub payload', () => {
            const message = formatGitHubMessage({});
            expect(message.cardsV2[0].card.header.title).toBe('🔔 GitHub Notification');
            expect(message.cardsV2[0].card.header.subtitle).toBe('Invalid Payload');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text)
                .toBe('⚠️ <b>Error:</b> Invalid GitHub payload received');
        });

        it('should handle pull request with missing branch information', () => {
            const payload = {
                action: 'opened',
                repository: {
                    full_name: 'test/test-repo'
                },
                pull_request: {
                    title: 'Test PR',
                    user: {
                        login: 'author'
                    },
                    head: {},
                    base: {}
                }
            };

            const message = formatGitHubMessage(payload);
            const widgets = message.cardsV2[0].card.sections[0].widgets;
            const branchWidget = widgets.find(w => w.decoratedText?.text?.includes('Branch'));
            expect(branchWidget.decoratedText.text).toBe('🌿 <b>Branch:</b> unknown → unknown');
        });
    });
}); 