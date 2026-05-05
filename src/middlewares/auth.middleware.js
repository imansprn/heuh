const bcrypt = require('bcrypt');
const { AdminKey } = require('../../models');

/**
 * Middleware to protect admin routes using API Keys
 */
const authAdmin = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-admin-key'];

        if (!apiKey) {
            return res.status(401).json({ error: 'API Key is required in X-Admin-Key header' });
        }

        // 1. Extract ID and Key 
        const matchFormat = apiKey.match(/^heuh([a-f0-9\-]+)\.(.+)$/);

        if (!matchFormat) {
            return res.status(401).json({ error: 'Invalid API Key format (must be heuh [1ID] [2KEY])' });
        }

        const id = matchFormat[1];
        const plainKey = matchFormat[2];

        // 2. Find by primary key(id)
        let authenticatedKey = await AdminKey.findByPk(id);

        if (!authenticatedKey || !authenticatedKey.enabled) {
            return res.status(403).json({ error: 'Invalid or disabled API Key' });
        }

        // 3. Bcrypt verification
        const match = await bcrypt.compare(plainKey, authenticatedKey.keyHash);

        if (!match) {
            return res.status(403).json({ error: 'Invalid or disabled API Key' });
        }

        // 2. Update lastUsedAt (async, don't block)
        authenticatedKey.update({ lastUsedAt: new Date() }).catch(console.error);

        // 3. Attach key info to request if needed
        req.admin = authenticatedKey;

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal Authentication Error' });
    }
};

module.exports = { authAdmin };
