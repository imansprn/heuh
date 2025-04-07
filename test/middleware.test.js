const Joi = require('joi');
const { errorConverter, errorHandler } = require('../src/middlewares/error.middleware');
const { validationMiddleware } = require('../src/middlewares');
const ApiError = require('../src/utils/ApiError');
const { ApiError: CustomApiError } = require('../src/utils/errors');

describe('Middleware', () => {
    describe('Error Middleware', () => {
        let mockReq;
        let mockRes;
        let mockNext;

        beforeEach(() => {
            console.log('Middleware Test - Setting up mocks');
            mockReq = {};
            mockRes = {
                status: jest.fn(() => mockRes),
                json: jest.fn(() => mockRes),
                locals: {},
            };
            mockNext = jest.fn();
            console.log('Middleware Test - Mocks set up:', { mockRes });
        });

        it('should handle ApiError', () => {
            console.log('Middleware Test - Testing ApiError handling');
            const error = new ApiError(400, 'Bad Request');
            errorHandler(error, mockReq, mockRes, mockNext);
            console.log('Middleware Test - Status calls:', mockRes.status.mock.calls);
            console.log('Middleware Test - JSON calls:', mockRes.json.mock.calls);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad Request',
            });
        });

        it('should convert error to ApiError', () => {
            const error = new Error('Test Error');
            errorConverter(error, mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
            const convertedError = mockNext.mock.calls[0][0];
            expect(convertedError.statusCode).toBe(500);
            expect(convertedError.message).toBe('Test Error');
        });
    });

    describe('Validation Middleware', () => {
        let mockReq;
        let mockRes;
        let mockNext;

        beforeEach(() => {
            mockReq = {
                body: {},
            };
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            mockNext = jest.fn();
        });

        it('should pass validation when schema matches', () => {
            const schema = Joi.object({
                test: Joi.string().optional(),
            });

            mockReq.body = { test: 'value' };
            validationMiddleware(schema)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should handle validation error', () => {
            const schema = Joi.object({
                required: Joi.string().required(),
            });

            mockReq.body = {};
            validationMiddleware(schema)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomApiError));
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Validation failed');
        });

        it('should handle invalid schema', () => {
            const schema = null;

            validationMiddleware(schema)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomApiError));
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Invalid schema configuration');
        });
    });
});
