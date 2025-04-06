'use strict';

const httpStatus = require('http-status');
const { config, logger} = require('../config');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message);
    }
    next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    if (!(err instanceof ApiError)) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    if (config.env === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    res.locals.errorMessage = err.message;

    const response = {
        error: message,
        ...(config.env === 'development' && { stack: err.stack })
    };

    if (config.env === 'development') {
        logger.error(err);
    }

    res.status(statusCode || 500).json(response);
};

module.exports = {
    errorConverter,
    errorHandler,
};