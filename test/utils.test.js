'use strict';

const ApiError = require('../src/utils/ApiError');
const catchAsync = require('../src/utils/catchAsync');
const pick = require('../src/utils/pick');

describe('Utils', () => {
    describe('ApiError', () => {
        it('should create an error with status code and message', () => {
            const error = new ApiError(400, 'Bad Request');
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Bad Request');
            expect(error instanceof Error).toBe(true);
        });

        it('should create an error with default values', () => {
            const error = new ApiError();
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Internal Server Error');
        });
    });

    describe('catchAsync', () => {
        it('should wrap async function and handle errors', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Test Error'));
            const wrapped = catchAsync(mockFn);
            const mockReq = {};
            const mockRes = {};
            const mockNext = jest.fn();

            await wrapped(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext.mock.calls[0][0].message).toBe('Test Error');
        });

        it('should pass through successful execution', async () => {
            const mockFn = jest.fn().mockResolvedValue('success');
            const wrapped = catchAsync(mockFn);
            const mockReq = {};
            const mockRes = {};
            const mockNext = jest.fn();

            await wrapped(mockReq, mockRes, mockNext);
            expect(mockFn).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('pick', () => {
        it('should pick specified keys from object', () => {
            const obj = {
                name: 'test',
                age: 25,
                email: 'test@example.com',
                password: 'secret'
            };
            const keys = ['name', 'email'];
            const result = pick(obj, keys);
            expect(result).toEqual({
                name: 'test',
                email: 'test@example.com'
            });
        });

        it('should handle missing keys', () => {
            const obj = {
                name: 'test'
            };
            const keys = ['name', 'age'];
            const result = pick(obj, keys);
            expect(result).toEqual({
                name: 'test'
            });
        });

        it('should handle empty object', () => {
            const obj = {};
            const keys = ['name'];
            const result = pick(obj, keys);
            expect(result).toEqual({});
        });

        it('should handle empty keys array', () => {
            const obj = {
                name: 'test'
            };
            const keys = [];
            const result = pick(obj, keys);
            expect(result).toEqual({});
        });
    });
}); 