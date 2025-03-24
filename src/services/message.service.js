'use strict';

const formatSentryMessage = (payload) => {
    const { event, project, url } = payload;
    const { title, level, environment, user, event_id, release } = event;
    
    return {
        cardsV2: [
            {
                cardId: 'sentry-notification',
                card: {
                    header: {
                        title: `🚨 ${level.toUpperCase()} - Sentry Notification`,
                        subtitle: `Environment: ${environment || 'NA'}`,
                        imageUrl: 'https://lh6.googleusercontent.com/proxy/D39t02Tq0KwE1CgfoDsjB6W8AT9QzdQYJqIjignDElb-uJckhjVajvxU2WjOumsjFQk8er1a4YpLrRt_9apuQxGgC-btlOrdj6e1y_tWyNAkX9Ic13Tw6CYkZP4L4YhFGr57Dl5wysN6h1wmKVgf-haGTQCgAcyDNpFVhWKXarhEpgSmeX43UQ',
                        imageType: 'SQUARE'
                    },
                    sections: [
                        {
                            header: 'Service Details',
                            widgets: [
                                { decoratedText: { text: `🕒 <b>Time:</b> ${new Date().toISOString()}` } },
                                { decoratedText: { text: `🔧 <b>Project:</b> ${project.name}` } },
                                { decoratedText: { text: `🆔 <b>Event ID:</b> ${event_id}` } },
                                { decoratedText: { text: `👤 <b>User:</b> ${user?.username || 'NA'}` } },
                                { decoratedText: { text: `📦 <b>Release:</b> ${release || 'NA'}` } },
                                { decoratedText: { text: `⚠️ <b>Error:</b> ${title}`, wrapText: true } }
                            ]
                        },
                        {
                            header: 'Actions',
                            widgets: [
                                {
                                    buttonList: {
                                        buttons: [
                                            { text: 'View Details', icon: { materialIcon: { name: 'link' }}, onClick: { openLink: { url } } }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    };
};

const formatGitHubMessage = (payload) => {
    const { action, repository, pull_request, review } = payload;
    
    // Handle review events
    if (review && review.user) {
        const isApproved = review.state === 'approved';
        const reviewIcon = '👀';
        
        // Get all reviewers and their statuses
        const allReviewers = pull_request.requested_reviewers || [];
        const pendingReviewers = allReviewers.map(reviewer => reviewer.login);
        
        return {
            cardsV2: [
                {
                    cardId: 'github-review-notification',
                    card: {
                        header: {
                            title: `${reviewIcon} Review ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                            subtitle: `${repository.full_name}`,
                            imageUrl: review.user.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                            imageType: 'CIRCLE'
                        },
                        sections: [
                            {
                                header: 'Review Details',
                                widgets: [
                                    { decoratedText: { text: `🔢 <b>PR Number:</b> #${pull_request.number}` } },
                                    { decoratedText: { text: `📌 <b>PR Title:</b> ${pull_request.title}`, wrapText: true } },
                                    { decoratedText: { text: `👤 <b>Reviewer:</b> ${review.user.login}`, startIcon: { iconUrl: review.user.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' } } },
                                    { decoratedText: { text: `📝 <b>State:</b> ${review.state.charAt(0).toUpperCase() + review.state.slice(1)}` } }
                                ]
                            },
                            {
                                header: 'Review Status',
                                widgets: [
                                    { textParagraph: { text: review.body } },
                                    ...(pendingReviewers.length > 0 ? [
                                        { textParagraph: { text: `\n🔍 <b>Review Checklist:</b>` } },
                                        ...pendingReviewers.map(reviewer => ({
                                            decoratedText: {
                                                text: `⏳ @${reviewer}`,
                                                startIcon: {
                                                    iconUrl: reviewer.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                                                },
                                            },
                                        })),
                                        { textParagraph: { text: `\n<b>Waiting for review from:</b>` } },
                                        ...pendingReviewers.map(reviewer => ({
                                            decoratedText: {
                                                text: `@${reviewer}`,
                                                startIcon: {
                                                    iconUrl: reviewer.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                                                },
                                            },
                                        })),
                                    ] : [])
                                ]
                            },
                            {
                                header: 'Quick Links',
                                widgets: [
                                    {
                                        buttonList: {
                                            buttons: [
                                                {
                                                    text: '🔗 View Pull Request',
                                                    onClick: { openLink: { url: pull_request.html_url } },
                                                },
                                                {
                                                    text: '📂 View Repository',
                                                    onClick: { openLink: { url: repository.html_url } },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        ].filter(Boolean)
                    }
                }
            ]
        };
    }
    
    // Handle pull request events
    if (pull_request) {
        // Special handling for review requests
        if (action === 'review_requested') {
            const requestedReviewers = pull_request.requested_reviewers || [];
            const requestedTeams = pull_request.requested_teams || [];
            
            return {
                cardsV2: [
                    {
                        cardId: 'github-review-request',
                        card: {
                            header: {
                                title: '👀 Review Requested',
                                subtitle: `${repository.full_name}`,
                                imageUrl: pull_request.user.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                                imageType: 'CIRCLE'
                            },
                            sections: [
                                {
                                    header: 'Pull Request Details',
                                    widgets: [
                                        { decoratedText: { text: `🔢 <b>PR Number:</b> #${pull_request.number}` } },
                                        { decoratedText: { text: `📌 <b>PR Title:</b> ${pull_request.title}`, wrapText: true } },
                                        { decoratedText: { text: `👤 <b>Author:</b> ${pull_request.user.login}` } }
                                    ]
                                },
                                {
                                    header: 'Review Request',
                                    widgets: [
                                        ...(requestedReviewers.length > 0 ? [
                                            { textParagraph: { text: `🔍 <b>Hey reviewers!</b>` } },
                                            ...requestedReviewers.map(reviewer => ({
                                                decoratedText: {
                                                    text: `@${reviewer.login}`,
                                                    startIcon: {
                                                        iconUrl: reviewer.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                                                    },
                                                },
                                            })),
                                            { textParagraph: { text: `Please review this PR when you have a chance.` } }
                                        ] : []),
                                        ...(requestedTeams.length > 0 ? [
                                            { textParagraph: { text: `👥 <b>Teams requested:</b>\n${requestedTeams.map(team => `• ${team.name}`).join('\n')}` } }
                                        ] : [])
                                    ]
                                },
                                pull_request.body ? {
                                    header: 'Description',
                                    widgets: [
                                        { textParagraph: { text: pull_request.body } }
                                    ]
                                } : null,
                                {
                                    header: 'Quick Links',
                                    widgets: [
                                        {
                                            buttonList: {
                                                buttons: [
                                                    {
                                                        text: '🔗 View Pull Request',
                                                        onClick: { openLink: { url: pull_request.html_url } }
                                                    },
                                                    {
                                                        text: '📂 View Repository',
                                                        onClick: { openLink: { url: repository.html_url } }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ].filter(Boolean)
                        }
                    }
                ]
            };
        }
        
        // Regular pull request notification
        return {
            cardsV2: [
                {
                    cardId: 'github-pr-notification',
                    card: {
                        header: {
                            title: `🔔 Pull Request Notification`,
                            subtitle: `${action.toUpperCase()} - ${pull_request.user.login}`,
                            imageUrl: pull_request.user.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                            imageType: 'CIRCLE',
                        },
                        sections: [
                            {
                                header: 'Details',
                                widgets: [
                                    { decoratedText: { text: `📄 <b>PR Title:</b> ${pull_request.title}` } },
                                    { decoratedText: { text: `👤 <b>Author:</b> ${pull_request.user.login}` } },
                                    { decoratedText: { text: `✔️ <b>Status:</b> ${pull_request.state}` } },
                                    { decoratedText: { text: `📂 <b>Repository:</b> ${repository.full_name}` } },
                                    pull_request.head && pull_request.base ? 
                                        { decoratedText: { text: `🌿 <b>Branch:</b> ${pull_request.head.ref} → ${pull_request.base.ref}` } } : null,
                                    { decoratedText: { text: `📊 <b>Changes:</b> +${pull_request.additions || 0} -${pull_request.deletions || 0} (${pull_request.changed_files || 0} files)` } }
                                ],
                            },
                            pull_request.body ? {
                                header: 'Description',
                                widgets: [
                                    { textParagraph: { text: pull_request.body } }
                                ]
                            } : null,
                            pull_request.requested_reviewers?.length || pull_request.requested_teams?.length
                                ? {
                                    header: 'Review Requested',
                                    widgets: [
                                        ...(pull_request.requested_reviewers?.length
                                            ? [
                                                { textParagraph: { text: `🔍 <b>Hey reviewers!</b>` } },
                                                ...pull_request.requested_reviewers.map(reviewer => ({
                                                    decoratedText: {
                                                        text: `@${reviewer.login}`,
                                                        startIcon: {
                                                            iconUrl: reviewer.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                                                        },
                                                    },
                                                })),
                                                { textParagraph: { text: `Please review this PR when you have a chance.` } }
                                            ]
                                            : []),
                                        ...(pull_request.requested_teams?.length
                                            ? [
                                                { textParagraph: { text: `👥 <b>Teams requested:</b>` } },
                                                ...pull_request.requested_teams.map(team => ({
                                                    decoratedText: {
                                                        text: team.name,
                                                    },
                                                })),
                                            ]
                                            : []),
                                    ],
                                }
                                : null,
                            {
                                header: 'Quick Links',
                                widgets: [
                                    {
                                        buttonList: {
                                            buttons: [
                                                {
                                                    text: '🔗 View Pull Request',
                                                    onClick: { openLink: { url: pull_request.html_url } },
                                                },
                                                {
                                                    text: '📂 View Repository',
                                                    onClick: { openLink: { url: repository.html_url } },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        ].filter(Boolean), // Remove null sections
                    },
                },
            ],
        };
    }

    // Fallback for unknown events
    return {
        cardsV2: [
            {
                cardId: 'github-notification',
                card: {
                    header: {
                        title: '🔔 GitHub Notification',
                        subtitle: repository.full_name,
                        imageUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                        imageType: 'CIRCLE'
                    },
                    sections: [
                        {
                            header: 'Event Details',
                            widgets: [
                                { decoratedText: { text: `📝 <b>Action:</b> ${action}` } },
                                { decoratedText: { text: `📂 <b>Repository:</b> ${repository.full_name}` } }
                            ]
                        },
                        {
                            header: 'Quick Links',
                            widgets: [
                                {
                                    buttonList: {
                                        buttons: [
                                            {
                                                text: '📂 View Repository',
                                                onClick: { openLink: { url: repository.html_url } },
                                            },
                                        ],
                                    },
                                },
                            ],
                        }
                    ]
                }
            }
        ]
    };
};

module.exports = {
    formatSentryMessage,
    formatGitHubMessage
}; 