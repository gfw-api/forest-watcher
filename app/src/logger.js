const config = require('config');
const bunyan = require('bunyan');

/**
 * Create Logger
 */
module.exports = (() => {
    const streams = [{
        level: config.get('logger.level') || 'debug',
        stream: process.stdout
    }];
    if (config.get('logger.toFile')) {
        streams.push({
            level: config.get('logger.level') || 'debug',
            path: config.get('logger.dirLogFile')
        });
    }
    const logger = bunyan.createLogger({
        name: config.get('logger.name'),
        src: true,
        streams
    });
    return logger;

})();
