const Server = require('./server');

const server = new Server();
server.start().catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
});
