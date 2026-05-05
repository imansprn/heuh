const { WebhookSource, Destination, WebhookMapping } = require('../../models');
const { encrypt } = require('../Encryption/encryption');

// ── Encrypt sensitive fields before storing to DB ─────────────────────────────
const encryptConfig = (config = {}) => {
    const result = { ...config };
    if (result.secret) result.secret = encrypt(result.secret);
    if (result.githubToken) result.githubToken = encrypt(result.githubToken);
    return result;
};

// ── Webhook Sources ───────────────────────────────────────────────────────────
const getSources = async (req, res) => {
    try {
        const sources = await WebhookSource.findAll({
            include: [{ model: Destination, as: 'destinations' }]
        });
        // Return sanitized response — do not expose encrypted config to client
        const sanitized = sources.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            enabled: s.enabled,
            destinations: s.destinations,
        }));
        res.json(sanitized);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSource = async (req, res) => {
    try {
        const body = { ...req.body };

        // Encrypt sensitive values before inserting into DB
        if (body.config) {
            body.config = encryptConfig(body.config);
        }

        const source = await WebhookSource.create(body);

        // Return only non-sensitive fields to the client
        res.status(201).json({
            id: source.id,
            name: source.name,
            type: source.type,
            enabled: source.enabled,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ── Destinations ──────────────────────────────────────────────────────────────
const getDestinations = async (req, res) => {
    try {
        const destinations = await Destination.findAll();
        res.json(destinations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createDestination = async (req, res) => {
    try {
        const dest = await Destination.create(req.body);
        res.status(201).json(dest);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ── Mappings ──────────────────────────────────────────────────────────────────
const createMapping = async (req, res) => {
    try {
        const mapping = await WebhookMapping.create(req.body);
        res.status(201).json(mapping);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    getSources,
    createSource,
    getDestinations,
    createDestination,
    createMapping,
};
