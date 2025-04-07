const { config } = require('../config');

const sendToGoogleChat = async message => {
    if (!message || !config.google_chat_webhook_url) {
        return false;
    }

    try {
        const response = await global.fetch(config.google_chat_webhook_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: typeof message === 'string' ? message : JSON.stringify(message),
        });

        return response.ok;
    } catch (error) {
        console.error('Error sending message to Google Chat:', error.message);
        return false;
    }
};

module.exports = {
    sendToGoogleChat,
};
