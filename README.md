# Heuh - Sentry and GitHub Webhook Integration with Google Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Coverage](https://codecov.io/gh/gobliggg/heuh/branch/main/graph/badge.svg)](https://codecov.io/gh/gobliggg/heuh)
[![Node.js CI](https://github.com/gobliggg/heuh/actions/workflows/coverage.yml/badge.svg)](https://github.com/gobliggg/heuh/actions/workflows/coverage.yml)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Dependencies](https://img.shields.io/david/gobliggg/heuh.svg)](https://david-dm.org/gobliggg/heuh)

Heuh is a Node.js application that integrates Sentry and GitHub webhooks with Google Chat, allowing you to receive notifications about errors and pull request reviews directly in your Google Chat space.

## Features

- Sentry error notifications
- GitHub pull request review notifications
- Rate limiting
- Webhook signature verification
- Input validation
- Beautiful Google Chat card messages
- Comprehensive test coverage

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Google Chat space with a webhook URL
- Sentry webhook secret (optional)
- GitHub webhook secret (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gobliggg/heuh.git
cd heuh
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
SENTRY_WEBHOOK_SECRET=your_sentry_webhook_secret
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
GOOGLE_CHAT_WEBHOOK_URL=your_google_chat_webhook_url
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
REQUEST_TIMEOUT=5000
MAX_PAYLOAD_SIZE=102400
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker
```bash
docker build -t heuh .
docker run -p 8080:8080 --env-file .env heuh
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Webhook Configuration

### Sentry Webhook

1. Go to your Sentry project settings
2. Navigate to Webhooks
3. Add a new webhook with the following URL:
```
http://your-domain/webhook/sentry
```
4. Set the webhook secret in your `.env` file

### GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks
3. Add a new webhook with the following URL:
```
http://your-domain/webhook/github
```
4. Set the content type to `application/json`
5. Select the following events:
   - Pull request reviews
6. Set the webhook secret in your `.env` file

## Development

### Running Tests
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Security

- All webhooks are protected by signature verification
- Rate limiting is implemented to prevent abuse
- Security headers are enabled using Helmet
- XSS protection is enabled
- CORS is configured for security

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Iman Suparman

## Acknowledgments

- [Sentry](https://sentry.io)
- [GitHub](https://github.com)
- [Google Chat](https://chat.google.com)

## Environment Variables

The following environment variables can be configured:

### Required Variables
- `GOOGLE_CHAT_WEBHOOK_URL`: The webhook URL for your Google Chat space

### Optional Variables
- `PORT`: Server port (default: 3000)
- `GITHUB_WEBHOOK_SECRET`: Secret for GitHub webhook verification (if not set, verification is skipped)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000 - 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)
- `LOG_LEVEL`: Logging level (default: 'info')
- `REQUEST_TIMEOUT`: Request timeout in milliseconds (default: 5000)
- `MAX_PAYLOAD_SIZE`: Maximum payload size in bytes (default: 102400 - 100KB)

You can set these variables in a `.env` file in the project root:

```env
# Required
GOOGLE_CHAT_WEBHOOK_URL=your_webhook_url

# Optional - shown with default values
PORT=3000
GITHUB_WEBHOOK_SECRET=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
REQUEST_TIMEOUT=5000
MAX_PAYLOAD_SIZE=102400
```

Note: If optional variables are not set, the application will use the default values.