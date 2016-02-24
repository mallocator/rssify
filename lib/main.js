'use strict';

var path = require('path');

var server = require('./server');
var rss = require('./rss');


/**
 * A list of global option properties that should not be applied to each entry.
 * @type {string[]}
 */
exports.nonEntryOptions = ['debug', 'storage', 'port', 'host', 'path'];

/**
 * Applies global options to each individual config.
 * @param config
 * @returns {*}
 */
exports.applyGlobals = config => {
    if (config.global) {
        for (let prop of exports.nonEntryOptions) {
            if (config.global[prop] !== undefined) {
                exports[prop] = config.global[prop];
                delete config.global[prop];
            }
        }
        for (let feed in config) {
            if (feed != 'global') {
                for (let prop in config.global) {
                    if (!config[feed][prop]) {
                        config[feed][prop] = config.global[prop];
                    } else if (Array.isArray(config[feed][prop])) {
                        config[feed][prop] = config[feed][prop].concat(config.global[prop]);
                    }
                }
            }
        }
        delete config.global;
    }
};


exports.initialize = config => {
    exports.applyGlobals(config);
    server.debug = rss.debug = exports.debug;
    exports.storage = server.storage = rss.storage = require('./storage.' + exports.storage);
    exports.storage.path = exports.path || path.join(__dirname, 'feeds');
    exports.storage.updateConfig(config);
    rss.cron();
    server.initialize(exports.host || 'http://localhost:10001', exports.port || 10001)
};