'use strict';

const axios = require('axios');
const { webhookService } = require('../src/services');

// Mock config
jest.mock('../src/config', () => ({
    config: {
        google_chat_webhook_url: 'https://chat.googleapis.com/v1/spaces/test/messages'
    }
}));

jest.mock('axios');

describe('Webhook Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendToGoogleChat', () => {
        const mockMessage = 'Test message';

        it('should send message to Google Chat successfully', async () => {
            axios.post.mockResolvedValueOnce({ data: { success: true } });

            const result = await webhookService.sendToGoogleChat(mockMessage);

            expect(result).toBe(true);
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(axios.post).toHaveBeenCalledWith(
                'https://chat.googleapis.com/v1/spaces/test/messages',
                { text: mockMessage },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        });

        it('should handle Google Chat API errors', async () => {
            axios.post.mockRejectedValueOnce(new Error('API Error'));

            const result = await webhookService.sendToGoogleChat(mockMessage);

            expect(result).toBe(false);
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(axios.post).toHaveBeenCalledWith(
                'https://chat.googleapis.com/v1/spaces/test/messages',
                { text: mockMessage },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        });

        it('should handle missing webhook URL', async () => {
            const originalUrl = require('../src/config').config.google_chat_webhook_url;
            require('../src/config').config.google_chat_webhook_url = null;

            const result = await webhookService.sendToGoogleChat(mockMessage);

            expect(result).toBe(false);
            expect(axios.post).not.toHaveBeenCalled();

            require('../src/config').config.google_chat_webhook_url = originalUrl;
        });

        it('should handle empty message', async () => {
            const result = await webhookService.sendToGoogleChat('');

            expect(result).toBe(false);
            expect(axios.post).not.toHaveBeenCalled();
        });
    });
}); 