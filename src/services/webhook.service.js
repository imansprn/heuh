'use strict';

const axios = require('axios');
const { config } = require('../config');

const sendToGoogleChat = async (message) => {
    if (!message || !config.google_chat_webhook_url) {
        return false;
    }

    try {
        await axios.post(
            config.google_chat_webhook_url,
            { text: message },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return true;
    } catch (error) {
        console.error('Error sending message to Google Chat:', error.message);
        return false;
    }
};

module.exports = {
    sendToGoogleChat
};