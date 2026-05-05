const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authAdmin } = require('../middlewares/auth.middleware');

// Apply auth to all admin routes
router.use(authAdmin);

// Sources
router.get('/sources', adminController.getSources);
router.post('/sources', adminController.createSource);

// Destinations
router.get('/destinations', adminController.getDestinations);
router.post('/destinations', adminController.createDestination);

// Mappings
router.post('/mappings', adminController.createMapping);

module.exports = router;
