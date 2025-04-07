module.exports = {
    env: {
        es6: true,
        node: true,
        es2021: true,
    },
    extends: ['airbnb-base', 'prettier'],
    plugins: ['prettier'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    rules: {
        'prettier/prettier': 'warn',
        'class-methods-use-this': 'off',
        'no-param-reassign': 'off',
        camelcase: 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
        'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    },
    overrides: [
        {
            files: ['test/**/*.js', '**/*.test.js'],
            env: {
                jest: true,
            },
            rules: {
                'no-unused-vars': 'off',
                'global-require': 'off',
                'no-console': 'off',
            },
        },
        {
            files: ['src/middlewares/validation.middleware.js'],
            rules: {
                'no-unused-vars': 'off',
            },
        },
    ],
};
