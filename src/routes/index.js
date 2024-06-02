'use strict';

const express = require('express');
const webhookRoute = require('./webhook.route')

const router = express.Router();

const defaultRoutes = [
    {
        path: '/webhooks',
        route: webhookRoute,
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;