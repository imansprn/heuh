const { config } = require('../config');
const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');

const sendToGoogleChat = async (message, overrideUrl) => {
    const url = overrideUrl || config.google_chat_webhook_url;
    if (!message || !url) {
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
        console.error('Error sending message to Google Chat:', error.message);
        return false;
    }
};

// Ganti nama fungsinya
const sendHeuhMessage = async (formattedMessage, overrideSpaceId, overrideWebhookUrl) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'service-account.json'), 
            scopes: ['https://www.googleapis.com/auth/chat.messages.create'],
        });

        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        const chat = google.chat('v1');
        const spaceId = overrideSpaceId || process.env.GOOGLE_CHAT_SPACE_ID;

        if (!spaceId) throw new Error('Space ID not found');

        const response = await chat.spaces.messages.create({
            parent: spaceId,
            requestBody: formattedMessage
        });

        console.log('✅ Success: Heuh message delivered!');
    } catch (error) {
        console.error('⚠️ Warning: Heuh API failed -', error.message);
        console.log('🔄 Action: Falling back to Webhook...');
        await sendToGoogleChat(formattedMessage, overrideWebhookUrl);
    }
};

// Pastiin di sini namanya juga udah Heuh
module.exports = {
    sendToGoogleChat,
    sendHeuhMessage
};

