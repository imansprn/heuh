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
    if (review) {
        return {
            cardsV2: [
                {
                    cardId: 'github-review-notification',
                    card: {
                        header: {
                            title: `👀 Review ${action.charAt(0).toUpperCase() + action.slice(1)}`,
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
                                    { decoratedText: { text: `👤 <b>Reviewer:</b> ${review.user.login}` } },
                                    { decoratedText: { text: `📝 <b>State:</b> ${review.state.charAt(0).toUpperCase() + review.state.slice(1)}` } }
                                ]
                            },
                            {
                                header: 'Review Comment',
                                widgets: [
                                    { textParagraph: { text: review.body || 'No comment provided' } }
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
                        ]
                    }
                }
            ]
        };
    }
    
    // Handle pull request events
    if (pull_request) {
        return {
            cardsV2: [
                {
                    cardId: 'github-pr-notification',
                    card: {
                        header: {
                            title: `🔔 Pull Request Notification`,
                            subtitle: `${action.toUpperCase()} - ${pull_request.user.login}`,
                            imageUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
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
                                ],
                            },
                            pull_request.requested_reviewers
                                ? {
                                    header: 'Review Requested',
                                    widgets: [
                                        ...(pull_request.requested_reviewers?.length
                                            ? pull_request.requested_reviewers.map(reviewer => ({
                                                decoratedText: {
                                                    text: `${reviewer.login}`,
                                                    startIcon: {
                                                        iconUrl: reviewer.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                                                    },
                                                },
                                            }))
                                            : [
                                                {
                                                    decoratedText: {
                                                        text: 'No individual reviewers requested.',
                                                    },
                                                },
                                            ]),
                                        ...(pull_request.requested_teams?.length
                                            ? pull_request.requested_teams.map(team => ({
                                                decoratedText: {
                                                    text: `👤 ${team.name}`,
                                                },
                                            }))
                                            : [
                                                {
                                                    decoratedText: {
                                                        text: 'No team reviewers requested.',
                                                    },
                                                },
                                            ]),
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
                        ].filter(Boolean), // Remove null sections if no review_requested
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