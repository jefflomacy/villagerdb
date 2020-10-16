const path = require('path');
const winston = require('winston');

/**
 * Location of log file. Repo root + /var/log/system.log.
 *
 * @type {string}
 */
const LOG_FILE_PATH = path.join(process.cwd() ,'var', 'log', 'system.log');

/**
 * Log file format.
 *
 * @type {Format}
 */
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint()
);

/**
 *
 * @type {winston.Logger}
 */
module.exports = winston.createLogger({
    level: 'info', // log anything higher than info
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: LOG_FILE_PATH }),
    ],
});
