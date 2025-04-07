const ApiError = require('./ApiError');

class ValidationError extends ApiError {
    constructor(message = 'Validation failed') {
        super(400, message, true);
    }
}

module.exports = ValidationError;
