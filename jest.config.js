module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/config.js'],
    coverageReporters: ['text', 'lcov'],
    coverageThreshold: {
        global: {
            branches: 45,
            functions: 30,
            lines: 45,
            statements: 45,
        },
    },
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    silent: true,
    verbose: false,
};
