/**
 * Middleware to capture raw body for webhook signature validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const rawBodyMiddleware = (req, res, next) => {
    if (req.method !== 'POST') {
        return next();
    }

    let data = '';
    req.setEncoding('utf8');

    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        req.rawBody = data;
        try {
            req.body = JSON.parse(data);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
        next();
    });
};

module.exports = rawBodyMiddleware; 