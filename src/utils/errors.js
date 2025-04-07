const ApiError = require('./ApiError');
const ValidationError = require('./ValidationError');
const AuthenticationError = require('./AuthenticationError');
const RateLimitError = require('./RateLimitError');

module.exports = {
    ApiError,
    ValidationError,
    AuthenticationError,
    RateLimitError,
};
