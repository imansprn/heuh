const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const { config } = require('./index');

const getServerUrl = () => {
    const { port } = config;
    if (config.env === 'production') {
        return `https://${config.host}`;
    }
    return `http://${config.host}:${port}`;
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Webhook Service API',
            version: '1.0.0',
            description: 'API documentation for the Webhook Service that handles GitHub and Sentry webhooks',
        },
        servers: [
            {
                url: getServerUrl(),
                description: `${config.env.charAt(0).toUpperCase() + config.env.slice(1)} server`,
            },
        ],
        components: {
            schemas: {
                GitHubWebhookPayload: {
                    type: 'object',
                    required: ['action', 'review', 'pull_request', 'repository'],
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['submitted'],
                            description: 'The action that triggered the webhook',
                        },
                        review: {
                            type: 'object',
                            required: ['state', 'body'],
                            properties: {
                                state: {
                                    type: 'string',
                                    enum: ['approved', 'changes_requested', 'commented'],
                                    description: 'The state of the review',
                                },
                                body: {
                                    type: 'string',
                                    description: 'The review comment',
                                },
                            },
                        },
                        pull_request: {
                            type: 'object',
                            required: ['title', 'html_url', 'user'],
                            properties: {
                                title: {
                                    type: 'string',
                                    description: 'The title of the pull request',
                                },
                                html_url: {
                                    type: 'string',
                                    description: 'The URL of the pull request',
                                },
                                user: {
                                    type: 'object',
                                    required: ['login'],
                                    properties: {
                                        login: {
                                            type: 'string',
                                            description: 'The username of the PR author',
                                        },
                                    },
                                },
                            },
                        },
                        repository: {
                            type: 'object',
                            required: ['name', 'html_url'],
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'The name of the repository',
                                },
                                html_url: {
                                    type: 'string',
                                    description: 'The URL of the repository',
                                },
                            },
                        },
                    },
                },
                SentryWebhookPayload: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                        data: {
                            type: 'object',
                            required: ['event', 'url', 'culprit', 'project', 'project_name'],
                            properties: {
                                event: {
                                    type: 'object',
                                    required: ['title', 'metadata'],
                                    properties: {
                                        title: {
                                            type: 'string',
                                            description: 'The title of the error event',
                                        },
                                        metadata: {
                                            type: 'object',
                                            properties: {
                                                value: {
                                                    type: 'string',
                                                    description: 'The error message',
                                                },
                                            },
                                        },
                                    },
                                },
                                url: {
                                    type: 'string',
                                    description: 'The URL to view the error in Sentry',
                                },
                                culprit: {
                                    type: 'string',
                                    description: 'The file and line number where the error occurred',
                                },
                                project: {
                                    type: 'string',
                                    description: 'The project slug',
                                },
                                project_name: {
                                    type: 'string',
                                    description: 'The name of the project',
                                },
                            },
                        },
                    },
                },
                Error: {
                    type: 'object',
                    required: ['error'],
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                },
            },
        },
    },
    apis: [path.join(__dirname, '../routes/*.js')], // Path to the API docs
};

const swaggerSpecs = swaggerJsdoc(options);

module.exports = swaggerSpecs;
