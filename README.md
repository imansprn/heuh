# Heuh

Heuh (pronounced "hey-uh") is a Node.js REST API that acts as a bridge between Sentry webhooks and Google Chat. In Sundanese, "Heuh" is an expression of surprise or alarm, making it a fitting name for this service that notifies you about events from Sentry.

This service allows you to receive alerts from Sentry directly in your Google Chat space, keeping you informed about potential issues in your application.

## Requirements
1. Node.js and npm installed.
2. A Sentry account with a project and webhook configured.
3. A Google Cloud project with the Google Chat API enabled.

## Installation
1. Clone this repository:
   ```bash
   $ git clone https://github.com/gobliggg/heuh.git
   ```

2. Install dependencies:
   ```bash
   $ cd heuh
   $ npm install
   ```

3. Configure the service:
- Create a .env file in the project root directory.
- Add the following environment variables, replacing the placeholders with your actual values:
    ```bash
    APP_ENV=development
    APP_NAME=heuh
    GOOGLE_CHAT_WEBHOOKS=https://chat.googleapis.com/v1/spaces/SPACE_ID/messages
    ```

## Running the service
Start the service using:
   ```bash
   $ npm start
   ```
This will start the Node.js server and listen for incoming Sentry webhooks.

## Usage
Configure your Sentry project to send webhook notifications to the URL of your deployed Heuh service. This URL will typically be your server's public IP address or domain name followed by the configured endpoint (e.g., https://your-server.com/webhooks/sentry).

When an event triggers a webhook in Sentry, it will send the event data to your Heuh API. The API will then parse the data and send a formatted message to your designated Google Chat space.

## Contributing
We welcome contributions to this project! Please see the CONTRIBUTING.md file for details on how to submit pull requests.

## License
This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).