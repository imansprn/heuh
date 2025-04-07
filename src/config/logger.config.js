const winston = require('winston');
const config = require('./config.config');

const enumerateErrorFormat = winston.format(info => {
    if (info.message instanceof Error) {
        info.message = { message: info.message.message, stack: info.message.stack, ...info.message };
    }

    if (info instanceof Error) {
        return { message: info.message, stack: info.stack, ...info };
    }

    return info;
});

const loggerConfig = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        enumerateErrorFormat(),
        winston.format.json(),
        config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
        winston.format.splat()
    ),
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});

module.exports = loggerConfig;
