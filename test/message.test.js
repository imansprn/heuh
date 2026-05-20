const { formatSentryMessage, formatGitHubMessage } = require('../src/services/message.service');

describe('Message Service', () => {
    describe('formatSentryMessage', () => {
        it('renders sentry issue payload in dashboard layout structure', () => {
            const payload = {
                action: 'created',
                data: {
                    issue: {
                        id: '7494101792',
                        shortId: 'VALBURY-MOBILE-APP-SEB',
                        title: '[Adjust] alwimuhammaddd+29298668atgmail.com',
                        level: 'warning',
                        status: 'unresolved',
                        substatus: 'new',
                        count: '2',
                        userCount: 1,
                        firstSeen: '2026-05-20T08:06:28.437000+00:00',
                        lastSeen: '2026-05-20T08:06:29.311000+00:00',
                        project_url: 'https://valbury.sentry.io/issues/?project=4505084990062592',
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

            const card = formatSentryMessage(payload).cardsV2[0].card;
            const sections = card.sections ?? [];
            const serialized = JSON.stringify(sections);
            const bodyWidgets = sections?.[1]?.widgets ?? [];
            const bodyColumnsWidget = bodyWidgets.find(widget => widget?.columns);
            const spacerWidgets = bodyWidgets.filter(widget => widget?.textParagraph?.text === ' ');
            const statusBadgeWidget = bodyWidgets.find(widget => widget?.decoratedText?.text?.includes('unresolved/new'));
            const footerWidgets = sections?.[sections.length - 1]?.widgets ?? [];
            const footerButtons = footerWidgets.find(widget => widget?.buttonList?.buttons)?.buttonList?.buttons ?? [];

            expect(serialized).toContain('<b>valbury-mobile-app</b>');
            expect(serialized).toContain('<b>[Adjust] alwimuhammaddd+29298668atgmail.com</b>');
            expect(serialized).toContain('Env: N/A');
            expect(serialized).toContain('Seen: 2x');
            expect(serialized).toContain('Users: 1');
            expect(serialized).not.toContain('Env: <b>');
            expect(serialized).not.toContain('Seen: <b>');
            expect(serialized).not.toContain('Users: <b>');
            expect(bodyColumnsWidget).toBeDefined();
            expect(bodyColumnsWidget.columns.columnItems).toHaveLength(2);
            expect(spacerWidgets.length).toBeGreaterThanOrEqual(2);
            expect(statusBadgeWidget).toBeDefined();
            expect(JSON.stringify(bodyColumnsWidget)).not.toContain('unresolved/new');

            expect(serialized).toContain('"topLabel":"Issue"');
            expect(serialized).toContain('✖ unresolved/new');
            expect(serialized).toContain('#cf222e');
            expect(serialized).toContain('"topLabel":"First seen"');
            expect(serialized).toContain('"topLabel":"Last seen"');
            expect(serialized).not.toContain('"topLabel":"ACTION"');
            expect(serialized).not.toContain('"topLabel":"ACTOR"');
            expect(serialized).toContain('#57606a\\"><b>');
            expect(serialized).toContain('WIB</font>');
            expect(serialized).toContain('#57606a');
            expect(serialized).not.toContain('<font color="#0969da">MESSAGE</font>');

            expect(serialized).toContain('View in Sentry');
            expect(serialized).toContain('View Project');
            expect(footerButtons).toHaveLength(2);
            expect(footerButtons[0].text).toBe('View in Sentry');
            expect(footerButtons[1].text).toBe('View Project');
            expect(footerButtons[0].color).toBeUndefined();
            expect(serialized).not.toContain('Invalid Payload');
        });

        it('renders legacy sentry event payload with the same dashboard structure', () => {
            const payload = {
                data: {
                    event: {
                        title: 'TypeError: Cannot read properties of undefined',
                        event_id: 'evt-legacy-1',
                        level: 'error',
                        environment: 'production',
                        project: 'checkout-service',
                        user: { username: 'alice' },
                        message: 'Cannot read properties of undefined',
                        web_url: 'https://sentry.io/organizations/acme/issues/123/events/evt-legacy-1/',
                    },
                },
                times_seen: 12,
                url: 'https://sentry.io/organizations/acme/issues/123/',
            };

            const serialized = JSON.stringify(formatSentryMessage(payload).cardsV2[0].card.sections);

            expect(serialized).toContain('<b>checkout-service</b>');
            expect(serialized).toContain('Env: production');
            expect(serialized).toContain('Seen: 12x');
            expect(serialized).toContain('"topLabel":"Issue"');
            expect(serialized).toContain('✖ error');
            expect(serialized).toContain('"topLabel":"First seen"');
            expect(serialized).toContain('"topLabel":"Last seen"');
            expect(serialized).not.toContain('"topLabel":"ACTION"');
            expect(serialized).not.toContain('"topLabel":"ACTOR"');
            expect(serialized).toContain('View in Sentry');
            expect(serialized).not.toContain('Invalid Payload');
        });

        it('renders top-level event payload with dashboard expectations', () => {
            const payload = {
                event: {
                    title: 'ReferenceError: foo is not defined',
                    event_id: 'evt-top-1',
                    level: 'error',
                    environment: 'staging',
                    project: 'checkout-service',
                    user: { username: 'bob' },
                    web_url: 'https://sentry.io/organizations/acme/issues/124/events/evt-top-1/',
                },
                times_seen: 5,
                url: 'https://sentry.io/organizations/acme/issues/124/',
            };

            const card = formatSentryMessage(payload).cardsV2[0].card;
            const sections = card.sections ?? [];
            const serialized = JSON.stringify(sections);
            const widgets = sections?.[1]?.widgets ?? [];
            const bodyColumnsWidget = widgets.find(widget => widget?.columns);

            expect(serialized).toContain('<b>checkout-service</b>');
            expect(serialized).toContain('Env: staging');
            expect(serialized).toContain('Seen: 5x');
            expect(bodyColumnsWidget).toBeDefined();
            expect(bodyColumnsWidget.columns.columnItems).toHaveLength(2);
            expect(serialized).toContain('"topLabel":"Issue"');
            expect(serialized).toContain('✖ error');
            expect(serialized).toContain('"topLabel":"First seen"');
            expect(serialized).toContain('"topLabel":"Last seen"');
            expect(serialized).not.toContain('"topLabel":"ACTION"');
            expect(serialized).not.toContain('"topLabel":"ACTOR"');
            expect(serialized).toContain('View in Sentry');
            expect(serialized).not.toContain('Invalid Payload');
        });

        it('renders event-only sentry payload in current minimal format', () => {
            const payload = {
                event: {
                    title: 'Test Error',
                    event_id: 'abc123',
                    environment: 'production',
                    level: 'error',
                    release: 'v1.0.0',
                    web_url: 'https://sentry.io/test',
                },
                project: { name: 'test-project' },
            };

            const serialized = JSON.stringify(formatSentryMessage(payload).cardsV2[0].card.sections);
            expect(serialized).toContain('<b>test-project</b>');
            expect(serialized).toContain('Env: production');
            expect(serialized).toContain('Release: v1.0.0');
            expect(serialized).toContain('✖ error');
            expect(serialized).toContain('View in Sentry');
        });

        it('handles empty sentry payload without crashing', () => {
            const message = formatSentryMessage({});
            const serialized = JSON.stringify(message.cardsV2[0].card.sections);
            expect(serialized).toContain('<b>N/A</b>');
            expect(serialized).toContain('Env: N/A');
            expect(serialized).toContain('View in Sentry');
        });
    });

    describe('formatSentryMessage (github-style concept)', () => {
        it('renders rich multi-section sentry card for full payload', () => {
            const payload = {
                data: {
                    event: {
                        title: 'TypeError: Cannot read properties of undefined',
                        event_id: 'evt-123',
                        level: 'error',
                        environment: 'production',
                        release: 'web@1.9.0',
                        project: 'checkout-service',
                        user: { username: 'alice' },
                        message: 'Cannot read properties of undefined at CheckoutButton.tsx:92',
                        culprit: 'src/components/CheckoutButton.tsx in onSubmit',
                        web_url: 'https://sentry.io/organizations/acme/issues/123/events/evt-123/',
                    },
                },
                times_seen: 12,
                url: 'https://sentry.io/organizations/acme/issues/123/',
            };

            const message = formatSentryMessage(payload);
            const card = message?.cardsV2?.[0]?.card ?? {};
            const sections = Array.isArray(card.sections) ? card.sections : [];
            const serialized = JSON.stringify(sections);

            expect(message.cardsV2[0].cardId).toBe('sentry-evt-123');
            expect(sections.length).toBeGreaterThanOrEqual(3);
            expect(sections?.[0]?.widgets?.[0]?.columns).toBeDefined();
            expect(serialized).toContain('Env: production');
            expect(serialized).toContain('Release: web@1.9.0');
            expect(serialized).toContain('Seen: 12x');
            expect(serialized).toContain('checkout-service');
            expect(serialized).toContain('View in Sentry');
        });

        it('omits optional evidence/context widgets when fields are missing', () => {
            const payload = {
                data: {
                    event: {
                        title: 'Unhandled rejection',
                        event_id: 'evt-min',
                        level: 'warning',
                        web_url: 'https://sentry.io/organizations/acme/issues/999/events/evt-min/',
                    },
                },
            };

            const message = formatSentryMessage(payload);
            const card = message?.cardsV2?.[0]?.card ?? {};
            const serialized = JSON.stringify(card.sections ?? []);

            expect(serialized).not.toContain('Seen: <b>');
            expect(serialized).not.toContain('Release: <b>');
            expect(serialized).toContain('Unhandled rejection');
            expect(serialized).toContain('View in Sentry');
        });

        it('keeps invalid fallback for empty payload', () => {
            const message = formatSentryMessage({});
            const card = message?.cardsV2?.[0]?.card ?? {};
            const fallbackText = JSON.stringify(card?.sections ?? []);
            expect(fallbackText).toContain('Env: N/A');
            expect(fallbackText).toContain('View in Sentry');
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
                'Missing repository field.'
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
                'Missing repository field.'
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
                'Missing repository field.'
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
                'Missing repository field.'
            );
        });

        it('should handle invalid GitHub payload', () => {
            const message = formatGitHubMessage({});
            expect(message.cardsV2[0].card.header.title).toBe('Invalid Payload');
            expect(message.cardsV2[0].card.sections[0].widgets[0].decoratedText.text).toBe(
                'Missing repository field.'
            );
        });

        it('should handle pull request with missing branch information', () => {
            const payload = {
                action: 'opened',
                repository: {
                    full_name: 'test/test-repo',
                },
                sender: {
                    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
                },
                pull_request: {
                    number: 1,
                    html_url: 'https://github.com/test/test-repo/pull/1',
                    title: 'Test PR',
                    user: {
                        login: 'author',
                    },
                    head: { ref: 'unknown' },
                    base: { ref: 'unknown' },
                },
            };

            const message = formatGitHubMessage(payload);
            const serialized = JSON.stringify(message.cardsV2[0].card.sections);
            expect(serialized).toContain('unknown  →  unknown');
        });
    });
});
