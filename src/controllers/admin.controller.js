const { WebhookSource, Destination, WebhookMapping } = require('../../models');

// --- Webhook Sources ---
const getSources = async (req, res) => {
    const sources = await WebhookSource.findAll({
        include: [{ model: Destination, as: 'destinations' }]
    });
    res.json(sources);
};

const createSource = async (req, res) => {
    try {
        const source = await WebhookSource.create(req.body);
        res.status(201).json(source);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// --- Destinations ---
const getDestinations = async (req, res) => {
    const destinations = await Destination.findAll();
    res.json(destinations);
};

const createDestination = async (req, res) => {
    try {
        const dest = await Destination.create(req.body);
        res.status(201).json(dest);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// --- Mappings ---
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
    createMapping
};
