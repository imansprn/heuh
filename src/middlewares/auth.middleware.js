const bcrypt = require('bcrypt');
const { AdminKey } = require('../../models');
const logger = require('../config/logger.config');

/**
 * Middleware to protect admin routes using API Keys
 */
const authAdmin = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-admin-key'];

        if (!apiKey) {
            logger.warn('Admin auth failed: missing API key header', { ip: req.ip });
            return res.status(401).json({ error: 'API Key is required in X-Admin-Key header' });
        }

        // 1. Extract ID and Key
        const matchFormat = apiKey.match(/^santet([a-f0-9-]+)\.(.+)$/);

        if (!matchFormat) {
            logger.warn('Admin auth failed: invalid API key format', { ip: req.ip });
            return res.status(401).json({ error: 'Invalid API Key format (must be santet [1ID] [2KEY])' });
        }

        const id = matchFormat[1];
        const plainKey = matchFormat[2];

        // 2. Find by primary key(id)
        const authenticatedKey = await AdminKey.findByPk(id);

        if (!authenticatedKey || !authenticatedKey.enabled) {
            logger.warn('Admin auth failed: key not found or disabled', { ip: req.ip, keyId: id });
            return res.status(403).json({ error: 'Invalid or disabled API Key' });
        }

        // 3. Bcrypt verification
        const match = await bcrypt.compare(plainKey, authenticatedKey.keyHash);

        if (!match) {
            logger.warn('Admin auth failed: bcrypt mismatch', { ip: req.ip, keyId: id });
            return res.status(403).json({ error: 'Invalid or disabled API Key' });
        }

        // 2. Update lastUsedAt (async, don't block)
        authenticatedKey.update({ lastUsedAt: new Date() }).catch(error => {
            logger.error('Admin auth: failed to update key lastUsedAt', { keyId: id, error: error.message });
        });

        // 3. Attach key info to request if needed
        req.admin = authenticatedKey;

        return next();
    } catch (error) {
        logger.error('Auth Middleware Error', { error: error.message });
        return res.status(500).json({ error: 'Internal Authentication Error' });
    }
};

module.exports = { authAdmin };
