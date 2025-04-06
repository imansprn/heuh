'use strict';

const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');
const httpStatus = require('http-status');
const config = require('./config/config.config');
const morgan = require('./config/morgan.config');
const { webhookRoutes } = require('./routes');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');
const { ApiError } = require('./utils/errors');
const rateLimit = require('express-rate-limit');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json({ limit: config.max_payload_size }));

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: config.max_payload_size }));

// Sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// Enable cors
app.use(cors());
app.options('*', cors());

// Request logging
app.use(morgan);

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rate_limit.window_ms,
    max: config.rate_limit.max_requests,
    message: { error: 'Too many requests' }
});
app.use(limiter);

// Authentication middleware
app.use((req, res, next) => {
    const signature = req.headers['x-hub-signature-256'] || req.headers['x-sentry-hook-signature'];
    if (!signature) {
        return next(new ApiError(401, 'Invalid signature'));
    }
    next();
});

// Routes
app.use('/webhook', webhookRoutes);

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle error
app.use(errorHandler);

module.exports = app; 