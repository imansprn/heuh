'use strict';

const config = {
    port: process.env.PORT || 3000,
    sentry_webhook_secret: process.env.SENTRY_WEBHOOK_SECRET,
    github_webhook_secret: process.env.GITHUB_WEBHOOK_SECRET,
    google_chat_webhook_url: process.env.GOOGLE_CHAT_WEBHOOK_URL,
    rate_limit: {
        window_ms: 15 * 60 * 1000, // 15 minutes
        max_requests: 100 // Maximum requests per window
    }
};

module.exports = { config };