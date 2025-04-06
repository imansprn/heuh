'use strict';

/**
 * Format a Sentry event into a Google Chat message
 * @param {Object} payload - The Sentry webhook payload
 * @returns {Object} - The formatted message
 */
const formatSentryMessage = (payload) => {
    if (!payload.event || !payload.project) {
        return {
            cardsV2: [{
                card: {
                    header: {
                        title: '🚨 ERROR - Invalid Payload'
                    },
                    sections: [{
                        widgets: [{
                            decoratedText: {
                                text: '⚠️ <b>Error:</b> Invalid Sentry payload received'
                            }
                        }]
                    }]
                }
            }]
        };
    }

    const { event, project } = payload;
    const level = event.level ? event.level.toUpperCase() : 'UNKNOWN';

    return {
        cardsV2: [{
            card: {
                header: {
                    title: `🚨 ${level} - Sentry Notification`,
                    subtitle: `Environment: ${event.environment || 'NA'}`
                },
                sections: [{
                    widgets: [
                        {
                            decoratedText: {
                                text: `🔧 <b>Project:</b> ${project.name}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `🆔 <b>Event ID:</b> ${event.event_id || 'NA'}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `👤 <b>User:</b> ${event.user?.username || 'NA'}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `📦 <b>Release:</b> ${event.release || 'NA'}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `⚠️ <b>Error:</b> ${event.title}`
                            }
                        }
                    ]
                }]
            }
        }]
    };
};

/**
 * Format a GitHub event into a Google Chat message
 * @param {Object} payload - The GitHub webhook payload
 * @returns {Object} - The formatted message
 */
const formatGitHubMessage = (payload) => {
    if (!payload.repository) {
        return {
            cardsV2: [{
                card: {
                    header: {
                        title: '🔔 GitHub Notification',
                        subtitle: 'Invalid Payload'
                    },
                    sections: [{
                        widgets: [{
                            decoratedText: {
                                text: '⚠️ <b>Error:</b> Invalid GitHub payload received'
                            }
                        }]
                    }]
                }
            }]
        };
    }

    const { action, repository, pull_request, review } = payload;

    if (action === 'review_requested') {
        const reviewers = payload.requested_reviewers?.map(r => `@${r.login}`).join('\n') || '';
        const teams = payload.requested_team_reviewers?.map(t => `• ${t.name}`).join('\n') || '';

        return {
            cardsV2: [{
                card: {
                    header: {
                        title: '👀 Review Requested',
                        subtitle: repository.full_name
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        text: `🔢 <b>PR Number:</b> #${pull_request.number}`
                                    }
                                },
                                {
                                    decoratedText: {
                                        text: `📌 <b>PR Title:</b> ${pull_request.title}`
                                    }
                                },
                                {
                                    decoratedText: {
                                        text: `👤 <b>Author:</b> ${pull_request.user?.login || 'Unknown'}`
                                    }
                                }
                            ]
                        },
                        {
                            widgets: [
                                {
                                    textParagraph: {
                                        text: '🔍 <b>Hey reviewers!</b>'
                                    }
                                },
                                {
                                    decoratedText: {
                                        text: reviewers
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: 'Please review this PR when you have a chance.'
                                    }
                                }
                            ]
                        },
                        teams && {
                            widgets: [
                                {
                                    textParagraph: {
                                        text: `👥 <b>Teams requested:</b>\n${teams}`
                                    }
                                }
                            ]
                        }
                    ].filter(Boolean)
                }
            }]
        };
    }

    if (action === 'submitted' && review) {
        return {
            cardsV2: [{
                card: {
                    header: {
                        title: '👀 Review Submitted',
                        subtitle: repository.full_name
                    },
                    sections: [{
                        widgets: [
                            {
                                decoratedText: {
                                    text: `🔢 <b>PR Number:</b> #${pull_request.number}`
                                }
                            },
                            {
                                decoratedText: {
                                    text: `📌 <b>PR Title:</b> ${pull_request.title}`
                                }
                            },
                            {
                                decoratedText: {
                                    text: `👤 <b>Reviewer:</b> ${review.user?.login || 'Unknown'}`
                                }
                            },
                            {
                                decoratedText: {
                                    text: `📝 <b>State:</b> ${review.state.charAt(0).toUpperCase() + review.state.slice(1)}`
                                }
                            }
                        ]
                    }]
                }
            }]
        };
    }

    return {
        cardsV2: [{
            card: {
                header: {
                    title: '🔔 Pull Request Notification',
                    subtitle: `${action?.toUpperCase() || 'UNKNOWN'} - ${pull_request?.user?.login || 'Unknown'}`
                },
                sections: [{
                    widgets: [
                        {
                            decoratedText: {
                                text: `📄 <b>PR Title:</b> ${pull_request?.title || 'Unknown'}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `👤 <b>Author:</b> ${pull_request?.user?.login || 'Unknown'}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `✔️ <b>Status:</b> ${pull_request?.state || 'unknown'}`
                            }
                        },
                        {
                            decoratedText: {
                                text: `🌿 <b>Branch:</b> ${pull_request?.head?.ref || 'unknown'} → ${pull_request?.base?.ref || 'unknown'}`
                            }
                        }
                    ]
                }]
            }
        }]
    };
};

module.exports = {
    formatSentryMessage,
    formatGitHubMessage
}; 