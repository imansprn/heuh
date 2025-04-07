const crypto = require('crypto');
const { config } = require('../config');

const verifyGitHubWebhook = (payload, signature) => {
    if (!config.github_webhook_secret) {
        return true; // Skip verification if no secret is configured
    }

    if (!signature) {
        return false;
    }

    try {
        const hmac = crypto.createHmac('sha256', config.github_webhook_secret);
        const calculatedSignature = `sha256=${hmac.update(payload).digest('hex')}`;

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
    } catch (error) {
        return false;
    }
};

class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    isAllowed(ip) {
        const now = Date.now();
        const windowMs = config.rate_limit?.window_ms || 15 * 60 * 1000;
        const maxRequests = config.rate_limit?.max_requests || 100;
        const windowStart = now - windowMs;

        // Clean up old requests
        Array.from(this.requests.entries()).forEach(([key, timestamp]) => {
            if (timestamp < windowStart) {
                this.requests.delete(key);
            }
        });

        // Get requests for this IP in the current window
        const ipRequests = Array.from(this.requests.entries()).filter(
            ([key, timestamp]) => key.startsWith(ip) && timestamp > windowStart
        ).length;

        if (ipRequests >= maxRequests) {
            return false;
        }

        // Add new request
        const requestKey = `${ip}-${now}`;
        this.requests.set(requestKey, now);
        return true;
    }

    reset() {
        this.requests.clear();
    }
}

const rateLimiter = new RateLimiter();

const rateLimit = ip => rateLimiter.isAllowed(ip);

// For testing purposes
const resetRateLimiter = () => rateLimiter.reset();

module.exports = {
    verifyGitHubWebhook,
    rateLimit,
    resetRateLimiter,
};
