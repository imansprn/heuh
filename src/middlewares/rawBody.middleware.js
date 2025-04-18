/**
 * Middleware to capture raw body for webhook signature validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const rawBodyMiddleware = (req, res, next) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', () => {
        req.rawBody = data;
        next();
    });
};

module.exports = rawBodyMiddleware; 