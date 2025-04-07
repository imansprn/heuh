const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

/**
 * Create a validation middleware for the given schema
 * @param {Object} schema - The Joi schema to validate against
 * @returns {Function} - The validation middleware
 */
const validate = schema => (req, res, next) => {
    if (!schema) {
        next(new ApiError(500, 'Invalid schema configuration'));
        return;
    }

    const { error } = schema.validate(req.body);
    if (error) {
        next(new ApiError(400, 'Validation failed'));
        return;
    }
    next();
};

module.exports = validate;
