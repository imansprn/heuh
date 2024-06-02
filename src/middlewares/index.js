'use strict';

const errorMiddleware = require('./error.middleware');
const validationMiddleware = require('./validation.middleware');

module.exports = {
    errorMiddleware: errorMiddleware,
    validationMiddleware: validationMiddleware
};