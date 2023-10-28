const _ = require('lodash');
const {
    createLogger, format, transports,
} = require('winston');

const fileTransport = new transports.File({
    filename: 'application.log',
    dirname: './logs',
    maxsize: 100000000,
    maxFiles: 2,
    tailable: true,
});

// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const level_filter = process.env.LOG_LEVEL || 'debug';
const developmentFormat = format.combine(
    format.timestamp(),
    format.prettyPrint(),
);

const productionFormat = format.combine(
    format.timestamp(),
    format.json(),
);

let logger;

if (process.env.NODE_ENV !== 'production') {
    logger = createLogger({
        level_filter,
        format: developmentFormat,
        transports: [
            new transports.File({ filename: 'application.log', dirname: './logs' }), // to log to a file instead of console
            new transports.Console(),
        ],
    });
} else {
    logger = createLogger({
        level_filter,
        format: productionFormat,
        transports: [
            fileTransport,
        ],
        exceptionHandlers: [
            new transports.Console(),
        ],
        exitOnError: false,
    });
}
logger.on('error', (e) => console.error(`attempting to catch: ${e}`));

const winstonLogger = {
    /**
     * @param {string|Error} message
     * @param {Error?} error
     */
    warn: (message, error) => {
        try {
            if (message instanceof Error) {
                const [msg, src] = (message.stack).split('at ');
                const [source, path] = src.trim().split('');
                logger.warn({
                    source: source.trim(),
                    path: path.replace('(', '').replace(')', '').trim(),
                    message: msg.trim(),
                    stack: message,
                });
                return;
            }
            if (typeof message === 'string') {
                if (error instanceof Error) {
                    const [source, path] = ((error.stack).split('at ')[1]).trim().split(' ');
                    logger.warn({
                        source: source.trim(),
                        path: path.replace('(', '').replace(')', '').trim(),
                        message,
                        stack: error,
                    });
                    return;
                }
                const [source, path] = ((new Error().stack).split('at ')[1]).trim().split(' ');
                logger.warn({
                    source: source.trim(),
                    path: path.replace('(', '').replace(')', '').trim(),
                    message,
                    error: typeof error === 'object' ? JSON.stringify(error) : error,

                });
            }
        } catch (e) {
            console.error(e);
        }
    },
    /**
     * @param {string} message
     */
    // express-winston uses winstonInstance.log method only in case of errorLogger or logger.
    // Hence the message needs to be handled to distinguish between Error and string.
    log: (message) => {
        // if (message instanceof String) {
        //     logger.info({
        //         message,
        //     });
        // }
        if (_.get(message, 'meta.error') instanceof Error) {
            logger.error({ message });
        }
        // else {
        //     logger.info({ message });
        // }
    },
    /**
     * @param {string|Error} message
     * @param {Object | Error?} error
     */
    error: (message, error) => {
        try {
            if (message instanceof Error) {
                const [msg, src] = (message.stack).split('at ');
                const [source, path] = src.trim().split('');
                logger.error({
                    source: source.trim(),
                    path: path.replace('(', '').replace(')', '').trim(),
                    message: msg.trim(),
                    stack: message,
                });
                return;
            }
            if (typeof message === 'string') {
                if (error instanceof Error) {
                    const [source, path] = ((error.stack).split('at ')[1]).trim().split(' ');
                    logger.error({
                        source: source.trim(),
                        path: path.replace('(', '').replace(')', '').trim(),
                        message,
                        stack: error,
                    });
                    return;
                }
                const { stack } = new Error();
                const [source, path] = (stack.split('at ')[1]).trim().split(' ');
                console.log({
                    source: source.trim(),
                    path: path.replace('(', '').replace(')', '').trim(),
                    message,
                    error,
                    stack,
                });
                logger.error({
                    source: source.trim(),
                    path: path.replace('(', '').replace(')', '').trim(),
                    message,
                    error: typeof error === 'object' ? JSON.stringify(error) : error,
                    stack,
                });
            }
        } catch (e) {
            console.error(e);
        }
    },
};
function getDynamicMeta(req, res) {
    const meta = { httpRequest: {} };
    if (req) {
        meta.httpRequest.body = JSON.stringify(req.body);
        meta.httpRequest.query = JSON.stringify(req.query);
        meta.httpRequest.params = JSON.stringify(req.params);
        if (req.user) {
            meta.studentId = req.user.student_id;
        }
        if (req.headers['x-auth-refresh-token']) {
            meta.httpRequest.refreshToken = true;
        }

        // This is to ensure that the ALB logs are being collected correctly when routing requests through Cloudflare (which adds a true-client-ip header for actual client IP address)
        req.headers['x-forwarded-for'] = req.headers['True-Client-IP'] || req.headers['x-forwarded-for'];

        meta.httpRequest.originalUrl = req.originalUrl;
        meta.httpRequest.method = req.method;
    }

    if (res) {
        meta.statusCode = res.statusCode;
    }
    return meta;
}

module.exports.winstonLogger = winstonLogger;
module.exports.getDynamicMeta = getDynamicMeta;
module.exports.stream = {
    write(message) {
        logger.info(message.replace(/\n$/, ''));
    },
};
