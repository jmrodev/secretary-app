const isTest = process.env.NODE_ENV === 'test';

const logger = {
    info: (...args) => { if (!isTest) console.log(new Date().toISOString(), '[INFO]', ...args); },
    error: (...args) => { if (!isTest) console.error(new Date().toISOString(), '[ERROR]', ...args); },
    warn: (...args) => { if (!isTest) console.warn(new Date().toISOString(), '[WARN]', ...args); },
    debug: (...args) => { if (!isTest) console.debug(new Date().toISOString(), '[DEBUG]', ...args); },
};

module.exports = logger;
