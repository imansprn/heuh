const ApiError = require('./ApiError');

class RateLimitError extends ApiError {
    constructor(message = 'Too many requests') {
        super(429, message, true);
    }
}

module.exports = RateLimitError;
