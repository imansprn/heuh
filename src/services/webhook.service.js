const logger = require('../config/logger.config');

const sendToGoogleChat = async (message, overrideUrl) => {
    const url = overrideUrl;
    if (!message || !url) {
        logger.warn('Skipping Google Chat send due to missing message or webhook URL', {
            hasMessage: Boolean(message),
            hasUrl: Boolean(url),
        });
        return false;
    }

    try {
        const response = await global.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: typeof message === 'string' ? message : JSON.stringify(message),
        });

        return response.ok;
    } catch (error) {
        logger.error('Error sending message to Google Chat', { error: error.message });
        return false;
    }
};

// Ganti nama fungsinya
const sendSantetMessage = async (formattedMessage, _overrideSpaceId, overrideWebhookUrl) =>
    sendToGoogleChat(formattedMessage, overrideWebhookUrl);

module.exports = {
    sendToGoogleChat,
    sendSantetMessage,
};
