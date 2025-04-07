const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
    console.log('Error Converter - Starting conversion');
    console.log('Error Converter - Input Error:', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        isOperational: err.isOperational,
        isJoi: err.error && err.error.isJoi,
    });

    let error = err;
    if (!(error instanceof ApiError)) {
        // Handle Joi validation errors
        if (error.error && error.error.isJoi) {
            console.log('Error Converter - Converting Joi error');
            error = new ApiError(httpStatus.BAD_REQUEST, error.error.message, true);
        } else {
            console.log('Error Converter - Converting generic error');
            const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
            const message = error.message || 'Internal Server Error';
            error = new ApiError(statusCode, message, false);
        }
    }

    console.log('Error Converter - Converted Error:', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
    });

    next(error);
};

const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let error = {};

    // Handle ApiError
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        error = err.error || {};
    }
    // Handle validation errors
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        error = Object.values(err.errors).map(e => e.message);
    }
    // Handle other errors
    else {
        error = err.message || 'An unexpected error occurred';
    }

    // Check if the request is for the API or Swagger UI
    const isApiRequest = req.path && req.path.startsWith('/webhook');

    // Send JSON response for API routes and tests
    if (isApiRequest || process.env.NODE_ENV === 'test') {
        res.status(statusCode).json({
            error: message,
            ...(Object.keys(error).length > 0 && { details: error }),
        });
    } else {
        // Send HTML response for other routes
        res.status(statusCode).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Error ${statusCode}</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #333; }
                        p { color: #666; }
                    </style>
                </head>
                <body>
                    <h1>Error ${statusCode}</h1>
                    <p>${message}</p>
                </body>
            </html>
        `);
    }
};

module.exports = {
    errorConverter,
    errorHandler,
};
