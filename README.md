# Heuh - Sentry and GitHub Webhook Integration with Google Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Coverage](https://codecov.io/gh/imansprn/heuh/branch/main/graph/badge.svg)](https://codecov.io/gh/imansprn/heuh)
[![Node.js CI](https://github.com/imansprn/heuh/actions/workflows/coverage.yml/badge.svg)](https://github.com/imansprn/heuh/actions/workflows/coverage.yml)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Heuh is a Node.js application that integrates Sentry and GitHub webhooks with Google Chat, allowing you to receive notifications about errors and pull request reviews directly in your Google Chat space.

## Features

- Sentry error notifications
- GitHub pull request review notifications
- Rate limiting
- Webhook signature verification
- Input validation
- Beautiful Google Chat card messages
- Comprehensive test coverage
- Swagger API documentation
- Docker support
- Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
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
# Required Configuration
APP_ENV=development  # Options: development, test, production
APP_NAME=heuh
GOOGLE_CHAT_WEBHOOK_URL=your_google_chat_webhook_url

# Optional Configuration - Server
PORT=3000  # Default: 3000
HOST=localhost  # Default: localhost

# Optional Configuration - Webhooks
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret  # Default: none (webhook verification skipped)
SENTRY_WEBHOOK_SECRET=your_sentry_webhook_secret  # Default: none (webhook verification skipped)

# Optional Configuration - Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # Default: 900000 (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100  # Default: 100

# Optional Configuration - Logging
LOG_LEVEL=info  # Default: info

# Optional Configuration - Request Handling
REQUEST_TIMEOUT=5000  # Default: 5000 (5 seconds)
MAX_PAYLOAD_SIZE=102400  # Default: 102400 (100KB)
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

Build the image:
```bash
docker build -t heuh .
```

Run the container:
```bash
docker run -p 3000:3000 \
  -e APP_ENV=production \
  -e GOOGLE_CHAT_WEBHOOK_URL=your_webhook_url \
  -e GITHUB_WEBHOOK_SECRET=your_secret \
  -e SENTRY_WEBHOOK_SECRET=your_secret \
  heuh
```

Or use docker-compose:
```bash
docker-compose up
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

## API Documentation

The API documentation is available at `/docs` when the server is running. It provides detailed information about:

- Available endpoints
- Request/response formats
- Authentication requirements
- Rate limiting
- Error handling

## Webhook Configuration

### Sentry Webhook

1. Go to your Sentry project settings
2. Navigate to Webhooks
3. Add a new webhook with the following URL:
```
http://your-domain/webhook/sentry
```

### GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks
3. Add a new webhook with the following URL:
```
http://your-domain/webhook/github
```

## Security

- All webhooks are verified using HMAC signatures
- Rate limiting is implemented to prevent abuse
- Input validation is performed on all requests
- Security headers are set using Helmet
- CORS is properly configured
- XSS protection is enabled

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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