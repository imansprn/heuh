/**
 * Format a Sentry event into a Google Chat message
 * @param {Object} payload - The Sentry webhook payload
 * @returns {Object} - The formatted message
 */
const formatSentryMessage = payload => {
    if (!payload.event || !payload.project) {
        return {
            cardsV2: [
                {
                    card: {
                        header: {
                            title: '🚨 ERROR - Invalid Payload',
                        },
                        sections: [
                            {
                                widgets: [
                                    {
                                        decoratedText: {
                                            text: '⚠️ <b>Error:</b> Invalid Sentry payload received',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        };
    }

    const { event, project } = payload;
    const level = event.level ? event.level.toUpperCase() : 'UNKNOWN';

    return {
        cardsV2: [
            {
                card: {
                    header: {
                        title: `🚨 ${level} - Sentry Notification`,
                        subtitle: `Environment: ${event.environment || 'NA'}`,
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        text: `🔧 <b>Project:</b> ${project.name}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🆔 <b>Event ID:</b> ${event.event_id || 'NA'}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `👤 <b>User:</b> ${event.user?.username || 'NA'}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `📦 <b>Release:</b> ${event.release || 'NA'}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `⚠️ <b>Error:</b> ${event.title}`,
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    };
};

/**
 * Format a GitHub event into a Google Chat message
 * @param {Object} payload - The GitHub webhook payload
 * @returns {Object} - The formatted message
 */
const formatGitHubMessage = payload => {
    if (!payload.repository) {
        return {
            cardsV2: [
                {
                    card: {
                        header: {
                            title: '🔔 GitHub Notification',
                            subtitle: 'Invalid Payload',
                        },
                        sections: [
                            {
                                widgets: [
                                    {
                                        decoratedText: {
                                            text: '⚠️ <b>Error:</b> Invalid GitHub payload received',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        };
    }

    const { action, repository, pull_request, review } = payload;

    // Handle review_requested action
    if (action === 'review_requested') {
        const reviewers = payload.requested_reviewers?.map(r => `@${r.login}`).join('\n') || '';
        const teams = payload.requested_team_reviewers?.map(t => `• ${t.name}`).join('\n') || '';

        const sections = [
            {
                widgets: [
                    {
                        decoratedText: {
                            text: `🔢 <b>PR Number:</b> #${pull_request.number}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📌 <b>PR Title:</b> ${pull_request.title}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `👤 <b>Author:</b> ${pull_request.user?.login || 'Unknown'}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `🌿 <b>Branch:</b> ${pull_request.head.ref} → ${pull_request.base.ref}`,
                        },
                    },
                ],
            },
            {
                widgets: [
                    {
                        textParagraph: {
                            text: '🔍 <b>Review Requested!</b>',
                        },
                    },
                    {
                        decoratedText: {
                            text: reviewers || '@reviewer1',
                        },
                    },
                    {
                        textParagraph: {
                            text: 'Please review this PR when you have a chance.',
                        },
                    },
                ],
            },
        ];

        if (teams) {
            sections[1].widgets.push({
                textParagraph: {
                    text: `👥 <b>Teams requested:</b>\n${teams}`,
                },
            });
        }

        // Add action buttons
        sections.push({
            widgets: [
                {
                    buttonList: {
                        buttons: [
                            {
                                text: '🔗 View Pull Request',
                                onClick: {
                                    openLink: {
                                        url: pull_request.html_url,
                                    },
                                },
                            },
                            {
                                text: '📂 View Repository',
                                onClick: {
                                    openLink: {
                                        url: repository.html_url,
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return {
            cardsV2: [
                {
                    card: {
                        header: {
                            title: '👀 Review Requested',
                            subtitle: repository.full_name,
                        },
                        sections,
                    },
                },
            ],
        };
    }

    // Handle closed action
    if (action === 'closed') {
        const sections = [
            {
                widgets: [
                    {
                        decoratedText: {
                            text: `🔢 <b>PR Number:</b> #${pull_request.number}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📌 <b>PR Title:</b> ${pull_request.title}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `👤 <b>Author:</b> ${pull_request.user?.login || 'Unknown'}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `🌿 <b>Branch:</b> ${pull_request.head.ref} → ${pull_request.base.ref}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📊 <b>Changes:</b> +${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
                        },
                    },
                ],
            },
        ];

        if (pull_request.merged) {
            sections[0].widgets.push({
                decoratedText: {
                    text: '✅ <b>Status:</b> Merged',
                },
            });
        } else {
            sections[0].widgets.push({
                decoratedText: {
                    text: '❌ <b>Status:</b> Closed without merging',
                },
            });
        }

        // Add action buttons
        sections.push({
            widgets: [
                {
                    buttonList: {
                        buttons: [
                            {
                                text: '🔗 View Pull Request',
                                onClick: {
                                    openLink: {
                                        url: pull_request.html_url,
                                    },
                                },
                            },
                            {
                                text: '📂 View Repository',
                                onClick: {
                                    openLink: {
                                        url: repository.html_url,
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return {
            cardsV2: [
                {
                    card: {
                        header: {
                            title: '🔒 Pull Request Closed',
                            subtitle: repository.full_name,
                        },
                        sections,
                    },
                },
            ],
        };
    }

    // Handle synchronize action
    if (action === 'synchronize') {
        const sections = [
            {
                widgets: [
                    {
                        decoratedText: {
                            text: `🔢 <b>PR Number:</b> #${pull_request.number}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📌 <b>PR Title:</b> ${pull_request.title}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `👤 <b>Author:</b> ${pull_request.user?.login || 'Unknown'}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `🌿 <b>Branch:</b> ${pull_request.head.ref} → ${pull_request.base.ref}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📊 <b>Changes:</b> +${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
                        },
                    },
                ],
            },
        ];

        // Add action buttons
        sections.push({
            widgets: [
                {
                    buttonList: {
                        buttons: [
                            {
                                text: '🔗 View Pull Request',
                                onClick: {
                                    openLink: {
                                        url: pull_request.html_url,
                                    },
                                },
                            },
                            {
                                text: '📂 View Repository',
                                onClick: {
                                    openLink: {
                                        url: repository.html_url,
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return {
            cardsV2: [
                {
                    card: {
                        header: {
                            title: '🔄 Pull Request Updated',
                            subtitle: repository.full_name,
                        },
                        sections,
                    },
                },
            ],
        };
    }

    // Handle opened action
    if (action === 'opened') {
        const sections = [
            {
                header: 'Pull Request Details',
                widgets: [
                    {
                        decoratedText: {
                            text: `🔢 <b>PR Number:</b> #${pull_request.number}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📌 <b>PR Title:</b> ${pull_request.title}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `👤 <b>Author:</b> ${pull_request.user?.login || 'Unknown'}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `🌿 <b>Branch:</b> ${pull_request.head.ref} → ${pull_request.base.ref}`,
                        },
                    },
                    {
                        decoratedText: {
                            text: `📊 <b>Changes:</b> +${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
                        },
                    },
                ],
            },
        ];

        // Add reviewers section if there are requested reviewers
        if (pull_request.requested_reviewers?.length > 0) {
            const reviewers = pull_request.requested_reviewers.map(r => `@${r.login}`).join('\n');
            sections.push({
                header: 'Requested Reviewers',
                widgets: [
                    {
                        textParagraph: {
                            text: '👥 <b>Reviewers:</b>',
                        },
                    },
                    {
                        decoratedText: {
                            text: reviewers,
                        },
                    },
                ],
            });
        }

        // Add teams section if there are requested teams
        if (pull_request.requested_teams?.length > 0) {
            const teams = pull_request.requested_teams.map(t => `• ${t.name}`).join('\n');
            sections.push({
                header: 'Requested Teams',
                widgets: [
                    {
                        textParagraph: {
                            text: '👥 <b>Teams:</b>',
                        },
                    },
                    {
                        decoratedText: {
                            text: teams,
                        },
                    },
                ],
            });
        }

        if (pull_request.body) {
            sections.push({
                header: 'Description',
                widgets: [
                    {
                        textParagraph: {
                            text: pull_request.body,
                        },
                    },
                ],
            });
        }

        // Add action buttons
        sections.push({
            header: 'Quick Actions',
            widgets: [
                {
                    buttonList: {
                        buttons: [
                            {
                                text: '🔗 View Pull Request',
                                onClick: {
                                    openLink: {
                                        url: pull_request.html_url,
                                    },
                                },
                            },
                            {
                                text: '📂 View Repository',
                                onClick: {
                                    openLink: {
                                        url: repository.html_url,
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });

        return {
            cardsV2: [
                {
                    card: {
                        header: {
                            title: `[GitHub PR ${action.toUpperCase()}] 📝 ${repository.name} #${pull_request.number} by ${pull_request.user.login}`,
                        },
                        sections,
                    },
                },
            ],
        };
    }

    // Default case for other actions
    const sections = [
        {
            widgets: [
                {
                    decoratedText: {
                        text: `📄 <b>PR Title:</b> ${pull_request.title || 'Unknown'}`,
                    },
                },
                {
                    decoratedText: {
                        text: `👤 <b>Author:</b> ${pull_request.user?.login || 'Unknown'}`,
                    },
                },
                {
                    decoratedText: {
                        text: `✔️ <b>Status:</b> ${pull_request.state || 'unknown'}`,
                    },
                },
                {
                    decoratedText: {
                        text: `📂 <b>Repository:</b> ${repository.full_name}`,
                    },
                },
            ],
        },
    ];

    if (pull_request.head && pull_request.base) {
        sections[0].widgets.push({
            decoratedText: {
                text: `🌿 <b>Branch:</b> ${pull_request.head.ref || 'unknown'} → ${pull_request.base.ref || 'unknown'}`,
            },
        });
    }

    if (pull_request.changed_files) {
        sections[0].widgets.push({
            decoratedText: {
                text: `📊 <b>Changes:</b> +${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
            },
        });
    }

    // Add action buttons
    sections.push({
        widgets: [
            {
                buttonList: {
                    buttons: [
                        {
                            text: '🔗 View Pull Request',
                            onClick: {
                                openLink: {
                                    url: pull_request.html_url,
                                },
                            },
                        },
                        {
                            text: '📂 View Repository',
                            onClick: {
                                openLink: {
                                    url: repository.html_url,
                                },
                            },
                        },
                    ],
                },
            },
        ],
    });

    return {
        cardsV2: [
            {
                card: {
                    header: {
                        title: '🔔 Pull Request Notification',
                        subtitle: `${action.toUpperCase()} - ${pull_request.user?.login || 'Unknown'}`,
                    },
                    sections,
                },
            },
        ],
    };
};

module.exports = {
    formatSentryMessage,
    formatGitHubMessage,
};
