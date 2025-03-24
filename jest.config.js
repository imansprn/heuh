module.exports = {
    testEnvironment: 'node',
    coverageDirectory: './coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/config/**',
        '!src/app.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    testMatch: ['**/test/**/*.test.js'],
    verbose: true
}; 