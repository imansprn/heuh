'use strict';

const helmet = require('helmet');
const xss = require('xss-clean');
const { createServer } = require("http");
const compression = require('compression');
const cors = require('cors');
const serveStatic = require('serve-static');
const path = require('path');
const routes = require('./routes');
const { errorMiddleware } = require('./middlewares');
const express = require('express');
const morgan = require('morgan');
const { config } = require('./config');

class Server {
    #host;
    #port;
    #app = express();

    constructor(options = {
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        modules: [],
        socket: null,
    }) {
        this.#port = options.port;
        this.#host = options.host;
        this.defaults();
    }

    defaults() {
        if (config.env !== 'test') {
            this.#app.use(morgan('combined'));
        }

        // set security HTTP headers
        this.#app.use(
            helmet({
                contentSecurityPolicy: false,
            })
        );

        this.#app.use(express.urlencoded({ extended: false }));
        this.#app.use(express.json({
            inflate: true,
            limit: '100kb',
            reviver: null,
            strict: true,
            type: 'application/json',
            verify: undefined,
        }));

        this.#app.use(express.json({
            extended: true,
            inflate: true,
            limit: '100kb',
            parameterLimit: 1000,
            type: 'application/x-www-form-urlencoded',
            verify: undefined,
        }));

        // sanitize request data
        this.#app.use(xss());

        // gzip compression
        this.#app.use(compression());

        // enable cors
        this.#app.use(cors());
        this.#app.options('*', cors());

        this.#app.use(serveStatic(path.resolve(__dirname, './../public')));
    }

    start() {
        this.#app.use('', routes);

        return new Promise((resolve, reject) => {
            this.errors();
            const server = createServer(this.#app);

            server.listen(this.#port, (err) => {
                if (err) return reject(err);

                console.log(`Server is listening on port ${this.#port}`);
                return resolve(this.#app);
            });
        });
    }

    errors() {
        // convert error to ApiError, if needed
        this.#app.use(errorMiddleware.errorConverter);

        // handle error
        this.#app.use(errorMiddleware.errorHandler);
    }
}

module.exports = new Server().start();