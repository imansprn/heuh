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
    const { action, repository, pull_request, commits, sender } = payload;

    // --- 1. LOGIC WARNA & STATUS (Sesuai TDD) ---
   // --- 1. LOGIC WARNA & STATUS ---
let headerColor = "#27AE60"; // Default Hijau (Opened)
let statusText = action ? action.toUpperCase() : "PUSHED"; 
let title = "GitHub Activity";
let subtitle = "Event Detected";

if (pull_request) {
    title = pull_request.title;
    subtitle = `#${pull_request.number}`;
    
    // Logika Warna Berdasarkan Action
    if (action === 'opened' || action === 'reopened') {
        headerColor = "#27AE60"; // Hijau
    } else if (action === 'closed' && pull_request.merged) {
        headerColor = "#8E44AD"; // Ungu (Merged)
        statusText = "MERGED";
    } else if (action === 'closed') {
        headerColor = "#C0392B"; // Merah (Closed tanpa merge)
        statusText = "CLOSED";
    }
} else if (commits && commits.length > 0) {
    title = commits[0].message;
    subtitle = `Commit: ${commits[0].id.substring(0, 7)}`;
    statusText = "PUSHED";
}
   

    // handle push events without pull_request
    if (commits && !pull_request) {
        const latestCommit = commits[0];
        const pusherName = pusher.name || pusher.email || "Unknown Pusher";

        const avatarUrl = payload.sender?.avatar_url || "https://fonts.gstatic.com/s/i/googlematerialicons/person/v11/24px.svg";
        return {
            "cardsV2": [
                {
                    "cardId": "pushCard",
                    "card": {
                        "header": {
                            "title": repository.name.substring(0, 30), // Biar gak kepanjangan
                            "subtitle": "Push Event",
                            "imageUrl": avatarUrl,
                            "imageType": "CIRCLE"
                        },
                        "sections": [
                            {
                                "widgets": [
                                    {
                                        "decoratedText": {
                                            "text": `<b>Pusher:</b> ${pusherName}`,
                                            "bottomLabel": `Branch: ${payload.ref?.replace('refs/heads/', '') || 'main'}`
                                        }
                                    },
                                    {
                                        "textParagraph": {
                                            "text": `<b>Message:</b><br><code>${latestCommit.message}</code>`
                                        }
                                    },

                                    {
                                        "buttonList": {
                                            "buttons": [
                                                {
                                                    "text": "VIEW COMMIT",
                                                    "onClick": {
                                                        "openLink": {
                                                            "url": latestCommit.url
                                                        }
                                                    }
                                                }
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
    }



// Handle review_requested action
if (action === 'review_requested') {
    const requestedReviewer = payload.requested_reviewer?.login || 'Unknown';
    return {
        cardsV2: [
            {
                card: {
                    header: {
                        title: `[GitHub PR ${action.toUpperCase()}] 📝 ${repository.name} #${pull_request.number} by ${pull_request.user.login}`,
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        text: `👀 Review Requested${repository.full_name}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🔢 PR Number: #${pull_request.number}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `📌 PR Title: ${pull_request.title}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `👤 Author: ${pull_request.user.login}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🌿 <b>Branch:</b> ${pull_request.head?.ref || 'unknown'} → ${pull_request.base?.ref || 'unknown'}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🔍 Review Requested!`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `@${requestedReviewer}`,
                                    },
                                },
                                {
                                    textParagraph: {
                                        text: 'Please review this PR when you have a chance.',
                                    },
                                },
                            ],
                        },
                        {
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
                        },
                    ],
                },
            },
        ],
    };
}

if (pull_request) {
    if (action === 'review_requested') {
        const requestedReviewer = payload.requested_reviewer?.login || 'Unknown';
        return {
            cardsV2: [{
                card: {
                    header: {
                        title: `[GitHub PR ${action.toUpperCase()}] 📝 ${repository.name} #${pull_request.number}`,
                    },
                    sections: [
                        {
                            widgets: [
                                { decoratedText: { text: `📌 PR Title: ${pull_request.title}` } },
                                { decoratedText: { text: `👤 Author: ${pull_request.user?.login}` } },
                                { decoratedText: { text: `🔍 Review Requested: @${requestedReviewer}` } }
                            ]
                        },
                        {
                            widgets: [{
                                buttonList: {
                                    buttons: [{
                                        text: '🔗 View PR',
                                        onClick: { openLink: { url: pull_request.html_url } }
                                    }]
                                }
                            }]
                        }
                    ]
                }
            }]
        };
    }

    // ... (sisanya pake logic lo yang PR closed/opened, tapi pastiin dibungkus 'if (pull_request)')
}

// Handle closed action
if (action === 'closed') {
    return {
        cardsV2: [
            {
                card: {
                    header: {
                        title: `[GitHub PR ${action.toUpperCase()}] 📝 ${repository.name} #${pull_request.number} by ${pull_request.user.login}`,
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        text: `🔒 Pull Request Closed${repository.full_name}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🔢 PR Number: #${pull_request.number}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `📌 PR Title: ${pull_request.title}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `👤 Author: ${pull_request.user.login}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🌿 <b>Branch:</b> ${pull_request.head?.ref || 'unknown'} → ${pull_request.base?.ref || 'unknown'}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `📊 Changes: +${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: pull_request.merged ? '✅ Status: Merged' : '❌ Status: Closed without merging',
                                    },
                                },
                            ],
                        },
                        {
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
                        },
                    ],
                },
            },
        ],
    };
}

// Handle synchronize action
if (action === 'synchronize') {
    return {
        cardsV2: [
            {
                card: {
                    header: {
                        title: `[GitHub PR ${action.toUpperCase()}] 📝 ${repository.name} #${pull_request.number} by ${pull_request.user.login}`,
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    decoratedText: {
                                        text: `🔄 Pull Request Updated${repository.full_name}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🔢 PR Number: #${pull_request.number}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `📌 PR Title: ${pull_request.title}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `👤 Author: ${pull_request.user.login}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `🌿 <b>Branch:</b> ${pull_request.head?.ref || 'unknown'} → ${pull_request.base?.ref || 'unknown'}`,
                                    },
                                },
                                {
                                    decoratedText: {
                                        text: `📊 Changes: +${pull_request.additions} -${pull_request.deletions} (${pull_request.changed_files} files)`,
                                    },
                                },
                            ],
                        },
                        {
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
                        },
                    ],
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
                        text: `🌿 <b>Branch:</b> ${pull_request.head?.ref || 'unknown'} → ${pull_request.base?.ref || 'unknown'}`,
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
            text: `🌿 <b>Branch:</b> ${pull_request.head?.ref || 'unknown'} → ${pull_request.base?.ref || 'unknown'}`,
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
        cardsV2: [{
            cardId: "githubCard",
            card: {
                header: {
                    title: repository?.full_name || "GitHub Notification",
                    subtitle: statusText,
                    imageUrl: sender?.avatar_url || "https://fonts.gstatic.com/s/i/googlematerialicons/person/v11/24px.svg",
                    imageType: "CIRCLE"
                },
                sections: [{
                    widgets: [
                        {
                            textParagraph: {
                                text: `<font color="${headerColor}"><b>${subtitle}</b></font><br>${title}`
                            }
                        },
                        {
                            decoratedText: {
                                
                                text: sender?.login || pusher?.name || "User",
                                bottomLabel: pull_request ? `${pull_request.comments || 0} comments` : "Direct Push"
                            }
                        },
                        {
                            textParagraph: {
                                text: `<code>+ ${title}\n- modifications in ${repository?.name || 'repo'}</code>`
                            }
                        },
                        {
                            buttonList: {
                                buttons: [{
                                    text: 'VIEW ON GITHUB',
                                    onClick: {
                                        openLink: {
                                            url: pull_request ? pull_request.html_url : (commits ? commits[0].url : "#")
                                        }
                                    }
                                }]
                            }
                        }
                    ]
                }]
            }
        }]
    };
};



//     return {
//         cardsV2: [
//             {
//                 card: {
//                     header: {
//                         title: '🔔 Pull Request Notification',
//                         subtitle: `${action.toUpperCase()} - ${pull_request.user?.login || 'Unknown'}`,
//                     },
//                     sections,
//                 },
//             },
//         ],
//     };
// };

module.exports = {
    formatSentryMessage,
    formatGitHubMessage,
};
