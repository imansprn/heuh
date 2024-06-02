'use strict';

const config = require('./config.config');
const logger = require('./logger.config');
const morgan = require('./morgan.config');

module.exports = {
    config: config,
    logger: logger,
    morgan: morgan
};