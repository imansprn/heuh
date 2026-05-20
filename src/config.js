require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    github_webhook_secret: process.env.GITHUB_WEBHOOK_SECRET,

    // Rate limiting configuration with defaults
    rate_limit: {
        window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Default: 15 minutes
        max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // Default: 100 requests
    },

    // General settings with defaults
    log_level: process.env.LOG_LEVEL || 'info',
    request_timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 5000, // Default: 5 seconds
    max_payload_size: parseInt(process.env.MAX_PAYLOAD_SIZE, 10) || 102400, // Default: 100KB
};

module.exports = { config };
