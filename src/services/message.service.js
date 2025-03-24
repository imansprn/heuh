'use strict';

const formatSentryMessage = (payload) => {
    const { title, level, url, environment, user } = payload.event;
    let message = `🚨 *Sentry Error Alert*\n\n`;

    message += `*Title:* ${title}\n`;
    message += `*Level:* ${level}\n`;
    
    if (environment) {
        message += `*Environment:* ${environment}\n`;
    }
    
    if (user && (user.username || user.email)) {
        message += `*User:* ${user.username || 'N/A'} (${user.email || 'N/A'})\n`;
    }
    
    message += `*URL:* ${url}`;

    return message;
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