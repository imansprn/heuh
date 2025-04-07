const httpStatus = require('http-status');
const { validationService } = require('../src/services');
const ApiError = require('../src/utils/ApiError');

describe('Validation Service', () => {
    describe('validateGitHubPayload', () => {
        const validGitHubPayload = {
            action: 'submitted',
            review: {
                state: 'approved',
                body: 'LGTM',
            },
            repository: {
                name: 'test-repo',
            },
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
                new ApiError(httpStatus.BAD_REQUEST, 'Invalid review state', true)
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
