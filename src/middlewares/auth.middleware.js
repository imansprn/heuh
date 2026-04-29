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

        // 1. Fetch all enabled keys (we have to compare one by one because they are hashed)
        // Note: For high traffic, we should use a cache or a more optimized approach, 
        // but for an admin panel, this is perfectly fine and secure.
        const keys = await AdminKey.findAll({ where: { enabled: true } });

        let authenticatedKey = null;
        for (const keyRecord of keys) {
            const match = await bcrypt.compare(apiKey, keyRecord.keyHash);
            if (match) {
                authenticatedKey = keyRecord;
                break;
            }
        }

        if (!authenticatedKey) {
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
