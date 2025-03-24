'use strict';

const { webhookService } = require('../src/services');
const { config } = require('../src/config');

// Mock config
jest.mock('../src/config', () => ({
    config: {
        google_chat_webhook_url: 'https://chat.googleapis.com/v1/spaces/test/messages',
        rate_limit: {
            window_ms: 1000,
            max_requests: 2
        }
    }
}));

// Mock fetch
global.fetch = jest.fn();

describe('Webhook Service', () => {
    let originalConsoleError;

    beforeEach(() => {
        jest.clearAllMocks();
        originalConsoleError = console.error;
        console.error = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    describe('sendToGoogleChat', () => {
        it('should send message to Google Chat successfully', async () => {
            const message = {
                cardsV2: [
                    {
                        cardId: 'test-card',
                        card: {
                            header: {
                                title: 'Test Card'
                            }
                        }
                    }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({})
            });

            const result = await webhookService.sendToGoogleChat(message);
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                config.google_chat_webhook_url,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                })
            );
            expect(console.error).not.toHaveBeenCalled();
        });

        it('should handle Google Chat API errors', async () => {
            const message = {
                cardsV2: [
                    {
                        cardId: 'test-card',
                        card: {
                            header: {
                                title: 'Test Card'
                            }
                        }
                    }
                ]
            };
            global.fetch.mockRejectedValueOnce(new Error('API Error'));

            const result = await webhookService.sendToGoogleChat(message);
            expect(result).toBe(false);
            expect(global.fetch).toHaveBeenCalledWith(
                config.google_chat_webhook_url,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                })
            );
            expect(console.error).toHaveBeenCalledWith(
                'Error sending message to Google Chat:',
                'API Error'
            );
        });

        it('should handle missing webhook URL', async () => {
            const originalUrl = config.google_chat_webhook_url;
            config.google_chat_webhook_url = null;

            const result = await webhookService.sendToGoogleChat('Test message');
            expect(result).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();

            config.google_chat_webhook_url = originalUrl;
        });

        it('should handle empty message', async () => {
            const result = await webhookService.sendToGoogleChat('');
            expect(result).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });
}); 