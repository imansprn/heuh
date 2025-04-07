class ApiError extends Error {
    constructor(statusCode = 500, message = 'Internal Server Error', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
