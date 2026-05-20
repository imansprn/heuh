describe('Logging coverage', () => {
    const logger = {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it('logs warn when admin key is missing in auth middleware', async () => {
        jest.doMock('../src/config/logger.config', () => logger);
        jest.doMock('../models', () => ({ AdminKey: { findByPk: jest.fn() } }));

        const { authAdmin } = require('../src/middlewares/auth.middleware');
        const req = { headers: {}, ip: '127.0.0.1' };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await authAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(logger.warn).toHaveBeenCalled();
    });

    it('logs error when admin controller source fetch fails', async () => {
        jest.doMock('../src/config/logger.config', () => logger);
        jest.doMock('../models', () => ({
            WebhookSource: { findAll: jest.fn().mockRejectedValue(new Error('db down')) },
            Destination: {},
            WebhookMapping: {},
        }));
        jest.doMock('../src/encryption/encryption', () => ({ encrypt: jest.fn(v => v) }));

        const adminController = require('../src/controllers/admin.controller');
        const req = {};
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await adminController.getSources(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(logger.error).toHaveBeenCalled();
    });

    it('does not require github signature header when source secret is not configured', async () => {
        jest.doMock('../src/config/logger.config', () => logger);
        jest.doMock('../src/services', () => ({
            messageService: {
                formatGoogleChatMessage: jest.fn(),
                injectCIWidget: jest.fn(),
                injectDiffText: jest.fn(),
            },
            webhookService: { sendSantetMessage: jest.fn() },
            securityService: { rateLimit: jest.fn().mockReturnValue(true) },
        }));
        jest.doMock('../src/services/validation.service', () => ({
            validateGitHubWebhook: jest.fn().mockReturnValue({ error: null }),
            validateGitHubPayload: jest.fn().mockReturnValue(true),
            validateSentryWebhook: jest.fn().mockReturnValue({ error: null }),
        }));
        jest.doMock('../src/encryption/encryption', () => ({ decrypt: jest.fn(v => v) }));
        jest.doMock('../models', () => ({
            WebhookSource: {
                findOne: jest.fn().mockResolvedValue({
                    config: {},
                    destinations: [],
                }),
            },
            Destination: {},
        }));

        const { handleGitHubWebhook } = require('../src/controllers/webhook.controller');

        const req = {
            params: { sourceName: 'github-source' },
            headers: { 'x-github-event': 'pull_request' },
            body: {
                action: 'opened',
                pull_request: { head: { sha: 'abc123' } },
                repository: { full_name: 'owner/repo' },
            },
            ip: '127.0.0.1',
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await handleGitHubWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.warn).not.toHaveBeenCalledWith(
            'GitHub webhook rejected: missing signature header',
            expect.any(Object)
        );
    });

    it('logs warn when github signature header is missing and source secret is configured', async () => {
        jest.doMock('../src/config/logger.config', () => logger);
        jest.doMock('../src/services', () => ({
            messageService: {
                formatGoogleChatMessage: jest.fn(),
                injectCIWidget: jest.fn(),
                injectDiffText: jest.fn(),
            },
            webhookService: { sendSantetMessage: jest.fn() },
            securityService: { rateLimit: jest.fn().mockReturnValue(true) },
        }));
        jest.doMock('../src/services/validation.service', () => ({
            validateGitHubWebhook: jest.fn().mockReturnValue({ error: null }),
            validateGitHubPayload: jest.fn().mockReturnValue(true),
            validateSentryWebhook: jest.fn().mockReturnValue({ error: null }),
        }));
        jest.doMock('../src/encryption/encryption', () => ({ decrypt: jest.fn(v => v) }));
        jest.doMock('../models', () => ({
            WebhookSource: {
                findOne: jest.fn().mockResolvedValue({
                    config: { secret: 'configured-secret' },
                    destinations: [],
                }),
            },
            Destination: {},
        }));

        const { handleGitHubWebhook } = require('../src/controllers/webhook.controller');

        const req = {
            params: { sourceName: 'github-source' },
            headers: { 'x-github-event': 'pull_request' },
            body: {
                action: 'opened',
                pull_request: { head: { sha: 'abc123' } },
                repository: { full_name: 'owner/repo' },
            },
            ip: '127.0.0.1',
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await handleGitHubWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(logger.warn).toHaveBeenCalled();
    });

    it('logs warn when sentry payload validation fails', async () => {
        jest.doMock('../src/config/logger.config', () => logger);
        jest.doMock('../src/services', () => ({
            messageService: { formatGoogleChatMessage: jest.fn() },
            webhookService: { sendSantetMessage: jest.fn() },
            securityService: { rateLimit: jest.fn().mockReturnValue(true) },
        }));
        jest.doMock('../src/services/validation.service', () => ({
            validateGitHubWebhook: jest.fn(),
            validateGitHubPayload: jest.fn(),
            validateSentryWebhook: jest.fn().mockReturnValue({ error: { message: 'invalid sentry payload' } }),
        }));
        jest.doMock('../src/encryption/encryption', () => ({ decrypt: jest.fn(v => v) }));
        jest.doMock('../models', () => ({
            WebhookSource: {
                findOne: jest.fn().mockResolvedValue({
                    config: {},
                    destinations: [],
                }),
            },
            Destination: {},
        }));

        const { handleSentryWebhook } = require('../src/controllers/webhook.controller');

        const req = { params: { sourceName: 'sentry-source' }, headers: {}, body: {}, ip: '127.0.0.1' };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await handleSentryWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(logger.warn).toHaveBeenCalled();
    });
});
