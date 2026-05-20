const { webhookService } = require('../src/services');
const logger = require('../src/config/logger.config');

// Mock config
jest.mock('../src/config', () => ({
    config: {
        google_chat_webhook_url: 'https://chat.googleapis.com/v1/spaces/fallback/messages',
        rate_limit: {
            window_ms: 1000,
            max_requests: 2,
        },
    },
}));
jest.mock('../src/config/logger.config', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Webhook Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendToGoogleChat', () => {
        it('should send message to Google Chat successfully', async () => {
            const message = {
                cardsV2: [
                    {
                        cardId: 'test-card',
                        card: {
                            header: {
                                title: 'Test Card',
                            },
                        },
                    },
                ],
            };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            });
            const overrideWebhookUrl = 'https://chat.googleapis.com/v1/spaces/test/messages';

            const result = await webhookService.sendToGoogleChat(message, overrideWebhookUrl);
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                overrideWebhookUrl,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(message),
                })
            );
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should handle Google Chat API errors', async () => {
            const message = {
                cardsV2: [
                    {
                        cardId: 'test-card',
                        card: {
                            header: {
                                title: 'Test Card',
                            },
                        },
                    },
                ],
            };
            global.fetch.mockRejectedValueOnce(new Error('API Error'));
            const overrideWebhookUrl = 'https://chat.googleapis.com/v1/spaces/test/messages';

            const result = await webhookService.sendToGoogleChat(message, overrideWebhookUrl);
            expect(result).toBe(false);
            expect(global.fetch).toHaveBeenCalledWith(
                overrideWebhookUrl,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(message),
                })
            );
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle missing webhook URL', async () => {
            const result = await webhookService.sendToGoogleChat('Test message');
            expect(result).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should not use GOOGLE_CHAT_WEBHOOK_URL fallback without override URL', async () => {
            const result = await webhookService.sendToGoogleChat({ text: 'Test message' });

            expect(result).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should handle empty message', async () => {
            const result = await webhookService.sendToGoogleChat('');
            expect(result).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        describe('sendSantetMessage', () => {
            it('should send via webhook URL and return success', async () => {
                const message = { text: 'hello' };
                const overrideWebhookUrl = 'https://chat.googleapis.com/v1/spaces/custom/messages';
                global.fetch.mockResolvedValueOnce({ ok: true });

                const result = await webhookService.sendSantetMessage(message, null, overrideWebhookUrl);

                expect(result).toBe(true);
                expect(global.fetch).toHaveBeenCalledWith(
                    overrideWebhookUrl,
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify(message),
                    })
                );
            });
        });
    });
});
