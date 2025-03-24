'use strict';

// Suppress console output during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Restore console output after tests
afterAll(() => {
    console.log.mockRestore();
    console.info.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
}); 