'use strict';

const { errorConverter, errorHandler } = require('../src/middlewares/error.middleware');
const { validationMiddleware } = require('../src/middlewares');
const ApiError = require('../src/utils/ApiError');
const { ApiError: CustomApiError } = require('../src/utils/errors');
const Joi = require('joi');

describe('Middleware', () => {
    describe('Error Middleware', () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {}
        };
        const mockNext = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
            mockRes.locals = {};
        });

        it('should handle ApiError', () => {
            const error = new ApiError(400, 'Bad Request');
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad Request'
            });
        });

        it('should handle non-ApiError', () => {
            const error = new Error('Internal Error');
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal Server Error'
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
                body: {}
            };
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            mockNext = jest.fn();
        });

        it('should pass validation when schema matches', () => {
            const schema = Joi.object({
                test: Joi.string().optional()
            });

            mockReq.body = { test: 'value' };
            validationMiddleware(schema)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should handle validation error', () => {
            const schema = Joi.object({
                required: Joi.string().required()
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