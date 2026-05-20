# Santet - Sentry and GitHub Webhook Integration with Google Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Coverage](https://codecov.io/gh/imansprn/santet/branch/main/graph/badge.svg)](https://codecov.io/gh/imansprn/santet)
[![Node.js CI](https://github.com/imansprn/santet/actions/workflows/coverage.yml/badge.svg)](https://github.com/imansprn/santet/actions/workflows/coverage.yml)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Santet is a Node.js application that integrates Sentry and GitHub webhooks with Google Chat, allowing you to receive notifications about errors and pull request reviews directly in your Google Chat space.

## Features

- Sentry error notifications
- GitHub pull request review notifications
- Rate limiting
- Webhook signature verification
- Input validation
- Beautiful Google Chat card messages
- Database-driven configuration (Manage multiple sources/destinations)
- AES-256-GCM Encryption for sensitive tokens (GitHub PAT, Webhook Secrets)
- Secure Admin API protected by Bcrypted API Keys
- Comprehensive test coverage
- Swagger API documentation
- Docker support
- Environment-based configuration

##  Tech Stack

- Backend: Node.js, Express
- Database: PostgreSQL with Sequelize ORM
- Security: 
  - `crypto` (AES-256-GCM for data at rest)
  - `bcrypt` (For Admin API Key hashing)
  - `helmet` (Secure headers)



## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- A Google Chat space with a webhook URL


## Installation

1. Clone the repository:
```bash
git clone https://github.com/gobliggg/santet.git
cd santet
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Generate a secure **Encryption Key** and set it in `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Create development and test databases:
```bash
createdb santet_dev
createdb santet_test
```

6. Run migrations:
```bash
npx sequelize-cli db:migrate
```

7. Generate your first **Admin API Key**:
```bash
npm run generate-admin-key "Your Name"
```
*Note: Copy and save the plain API Key displayed in the terminal!*


8. Use this minimal `.env` for local development:
```env
# App
APP_ENV=development
APP_NAME=santet
PORT=3000
ENCRYPTION_KEY=your_64_hex_key

# Database
DB_HOST=127.0.0.1
DB_NAME=santet_dev
DB_NAME_TEST=santet_test
DB_USER=postgres
DB_PASS=your_password
DB_PORT=5432

# Google Chat destinations are configured via Admin API (destination.url)
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
docker build -t santet .
```

Run the container:
```bash
docker run -p 3000:3000 \
  -e APP_ENV=production \
  -e GITHUB_WEBHOOK_SECRET=your_secret \
  -e SENTRY_WEBHOOK_SECRET=your_secret \
  santet
```

Or use docker-compose:
```bash
docker-compose up
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## First-time Admin Setup (Source + Destination + Mapping)

After the app is running, set up one destination and one source so webhook delivery works.

Base URL:
```bash
export BASE_URL="http://localhost:3000"
```

Admin key format:
```text
X-Admin-Key: santet<id>.<plain_key>
```

### 1. Create destination (Google Chat)
```bash
curl -X POST "$BASE_URL/admin/destinations" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: santet<id>.<plain_key>" \
  -d '{
    "name": "team-room",
    "type": "google_chat",
    "url": "https://chat.googleapis.com/v1/spaces/XXX/messages?key=YYY&token=ZZZ",
    "enabled": true
  }'
```

### 2. Create source (GitHub)
```bash
curl -X POST "$BASE_URL/admin/sources" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: santet<id>.<plain_key>" \
  -d '{
    "name": "repo-a",
    "type": "github",
    "path": "repo-a",
    "enabled": true,
    "config": {
      "secret": "your_github_webhook_secret",
      "githubToken": "ghp_xxx_optional"
    }
  }'
```

### 3. Get IDs
```bash
curl -H "X-Admin-Key: santet<id>.<plain_key>" "$BASE_URL/admin/sources"
curl -H "X-Admin-Key: santet<id>.<plain_key>" "$BASE_URL/admin/destinations"
```

### 4. Create mapping (source -> destination)
```bash
curl -X POST "$BASE_URL/admin/mappings" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: santet<id>.<plain_key>" \
  -d '{
    "sourceId": "<source-uuid>",
    "destinationId": "<destination-uuid>",
    "enabled": true
  }'
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
http://your-domain/webhook/sentry/repo-a
```
*`repo-a` must match the source `name` created in Admin API.*

## Admin API Usage

The application provides a secure Admin API to manage webhook sources and destinations.

### Authentication
All admin endpoints require an `X-Admin-Key` header.
- **Header**: `X-Admin-Key: santet<id>.<plain_key>`

### 1. Create a Webhook Source
**Endpoint**: `POST /admin/sources`
*Example request is documented in **First-time Admin Setup (Source + Destination + Mapping)** above.*

### 2. List All Sources
**Endpoint**: `GET /admin/sources`

### 3. Create a Destination (Google Chat)
**Endpoint**: `POST /admin/destinations`

**Example Body**:
```json
{
  "name": "google-chat-room",
  "type": "google_chat",
  "url": "https://chat.googleapis.com/v1/spaces/...",
  "enabled": true
}
```

### GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks
3. Add a new webhook with the following URL:
```
http://your-domain/webhook/github/repo-a
```
*`repo-a` must match the source `name` created in Admin API.*


## Security

- All sensitive data at rest is encrypted using **AES-256-GCM**
- All webhooks are verified using HMAC signatures
- Admin routes are protected by **X-Admin-Key** header (Bcrypt hashing)
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

The following environment variables are used to configure the core application:

### Required Variables
- `APP_ENV`: Main app environment selector (`development`, `test`, `production`).
- `ENCRYPTION_KEY`: A 64-character hex key (32 bytes) used for AES-256-GCM encryption.
- `DB_HOST`: PostgreSQL host address.
- `DB_NAME`: PostgreSQL database name.
- `DB_NAME_TEST`: PostgreSQL test database name.
- `DB_USER`: PostgreSQL username.
- `DB_PASS`: PostgreSQL password.

### Optional Variables
- `PORT`: Server port (default: 3000).
- `LOG_LEVEL`: Logging level (default: `info`).
- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 15 minutes).
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100).

For a ready-to-copy `.env` template, use the **Installation** section above.