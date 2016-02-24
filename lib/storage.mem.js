"use strict";

var storage = exports.storage = {};


/**
 * Returns a list of feed names that have a configuration.
 */
exports.list = () => {
    return Object.keys(storage);
};

/**
 * Returns the entire list of entries for a feed.
 * @param feedName
 */
exports.get = feedName => {
    var feed = storage[feedName] = storage[feedName] || {entries: [], config: {}};
    return feed.entries;
};

/**
 * Returns the last known entry for a specific feed.
 * @param feedName
 */
exports.last = feedName => {
    var size = storage[feedName] ? storage[feedName].entries.length : 0;
    return size ? storage[feedName].entries[size - 1] : null;
};

/**
 * Appends an entry to a given feed. If the feed entries are more then what's set in the config, the oldest element
 * is removed.
 * @param feedName
 * @param entry
 * @param config
 */
exports.append = (feedName, entry, config) => {
    var feed = storage[feedName] = storage[feedName] || {entries:[], config: {}};
    feed.config = config;
    feed.entries.push(entry);
    var size = feed.config.size || 20;
    if (feed.entries.length > size) {
        feed.entries.shift();
    }
};

/**
 * Sets any configuration values (such as headers) if they don't exist already.
 * @param config
 */
exports.updateConfig = config => {
    for (let feedName in config) {
        storage[feedName] = storage[feedName] || {entries: [], config: {}}
        for (let prop in config[feedName]) {
            storage[feedName].config[prop] = config[feedName][prop];
        }
    }
};

/**
 * Returns the configuration of a given feed.
 * @param feedName
 */
exports.getConfig = feedName => {
    var feed = storage[feedName] = storage[feedName] || {entries: [], config: {}};
    return feed.config;
};

/**
 * clear all stored data.
 */
exports.reset = () => {
    storage = {};
};