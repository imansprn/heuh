const httpStatus = require('http-status');
const { validationService } = require('../src/services');
const ApiError = require('../src/utils/ApiError');

describe('Validation Service', () => {
    describe('validateGitHubPayload', () => {
        const validGitHubPayload = {
            action: 'submitted',
            pull_request: {
                number: 1,
                title: 'Test PR',
                html_url: 'http://test.com',
                state: 'open',
                user: { login: 'test-user' },
                head: { ref: 'feature', sha: 'abc123' },
                base: { ref: 'main', sha: 'def456' }
            },
            review: {
                state: 'approved',
                body: 'LGTM',
                user: { login: 'reviewer' }
            },
            repository: {
                name: 'test-repo',
                full_name: 'test/test-repo',
                owner: { login: 'test-user' }
            },
            sender: { login: 'test-user' }
        };

        it('should validate correct GitHub payload', () => {
            const result = validationService.validateGitHubPayload(validGitHubPayload);
            expect(result).toBe(true);
        });

        it('should reject GitHub payload with invalid action', () => {
            const invalidPayload = {
                ...validGitHubPayload,
                action: 'invalid_action',
            };
            expect(() => validationService.validateGitHubPayload(invalidPayload)).toThrow(
                new ApiError(httpStatus.BAD_REQUEST, 'Invalid action', true)
            );
        });

        it('should reject GitHub payload with invalid review state', () => {
            const invalidPayload = {
                ...validGitHubPayload,
                review: {
                    ...validGitHubPayload.review,
                    state: 'invalid_state',
                },
            };
            expect(() => validationService.validateGitHubPayload(invalidPayload)).toThrow(
                new ApiError(httpStatus.BAD_REQUEST, '"review.state" must be one of [approved, changes_requested, commented]', true)
            );
        });

        it('should reject GitHub payload missing required fields', () => {
            const invalidPayload = {
                action: 'submitted',
                // Missing review and repository fields
            };
            expect(() => validationService.validateGitHubPayload(invalidPayload)).toThrow(
                new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields', true)
            );
        });
    });
});
