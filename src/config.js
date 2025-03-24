'use strict';

require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    google_chat_webhook_url: process.env.GOOGLE_CHAT_WEBHOOK_URL,
    github_webhook_secret: process.env.GITHUB_WEBHOOK_SECRET,
    
    // Rate limiting configuration with defaults
    rate_limit: {
        window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,  // Default: 15 minutes
        max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100         // Default: 100 requests
    },

    // General settings with defaults
    log_level: process.env.LOG_LEVEL || 'info',
    request_timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 5000,        // Default: 5 seconds
    max_payload_size: parseInt(process.env.MAX_PAYLOAD_SIZE, 10) || 102400    // Default: 100KB
};

// Validate required configurations only in production
if (process.env.NODE_ENV === 'production') {
    const requiredConfigs = ['google_chat_webhook_url'];
    const missingConfigs = requiredConfigs.filter(key => !config[key]);

    if (missingConfigs.length > 0) {
        console.warn(`Warning: Missing required configuration(s): ${missingConfigs.join(', ')}`);
    }
}

module.exports = { config }; 