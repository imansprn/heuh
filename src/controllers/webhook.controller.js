'use strict';

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { webhookService, sentryService} = require('../services');
const ApiError = require('../utils/ApiError');

const sentryWebhook = catchAsync(async (req, res) => {
    const { level, title, project, event_id, user, release, web_url, environment } = req.body.data.event;

    const message = `*${level.toUpperCase()} - ${title}*\n` +
        `* Project: ${project}\n` +
        `* Short ID: ${event_id}\n` +
        `* User: ${user?.username || 'NA'} - ${user?.email || 'NA'}\n` +
        `* Environment: ${environment || 'NA'}\n` +
        `* Release: ${release || 'NA'}\n` +
        `See full details on Sentry: ${web_url}`;

    const webhook = await webhookService.googleChat(message);
    if (!webhook) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something Went Wrong')
    }

    res.status(httpStatus.OK).send();
});

module.exports = {
    sentryWebhook,
};