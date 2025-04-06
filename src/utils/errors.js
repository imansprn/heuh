class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends ApiError {
    constructor(message = 'Validation failed') {
        super(400, message, true);
    }
}

class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(401, message, true);
    }
}

class RateLimitError extends ApiError {
    constructor(message = 'Too many requests') {
        super(429, message, true);
    }
}

module.exports = {
    ApiError,
    ValidationError,
    AuthenticationError,
    RateLimitError
}; 