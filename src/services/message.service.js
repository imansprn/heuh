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
    const { action, review, repository, pull_request } = payload;
    let message = `📝 *GitHub Review Update*\n\n`;

    message += `*Repository:* ${repository.name}\n`;
    message += `*PR:* #${pull_request.number} - ${pull_request.title}\n`;
    message += `*Reviewer:* ${review.user.login}\n`;

    // Add state with emoji
    const stateEmoji = {
        approved: '✅',
        changes_requested: '❌',
        commented: '💬',
        dismissed: '🚫'
    };
    const emoji = stateEmoji[review.state] || '❓';
    const state = review.state.charAt(0).toUpperCase() + review.state.slice(1);
    message += `*State:* ${emoji} ${state}\n`;

    // Add comment if present
    if (review.body) {
        message += `*Comment:* ${review.body}\n`;
    }

    // Add URL
    message += `*URL:* ${pull_request.html_url}`;

    return message;
};

module.exports = {
    formatSentryMessage,
    formatGitHubMessage
}; 