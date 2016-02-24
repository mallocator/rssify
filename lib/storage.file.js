"use strict";

var fs = require('fs');
var path = require('path');

/**
 * In memory buffer so we don't have to go to disk every time we want data
 * @type {{}}
 */
var storage = {};

function getFeed(feedName) {
    if (!storage[feedName]) {
        try {
            storage[feedName] = JSON.parse(fs.readFileSync(path.join(exports.path, feedName), 'utf8'));
        } catch (e) {
            storeFeed(feedName, {entries: [], config: {}});
        }
    }
    return storage[feedName];
}

function storeFeed(feedName, feed) {
    storage[feedName] = feed;
    try {
        fs.mkdirSync(exports.path);
    } catch (e) {}
    fs.writeFileSync(path.join(exports.path, feedName), JSON.stringify(feed), 'utf8');
}

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
    return getFeed(feedName).entries;
};

/**
 * Returns the last known entry for a specific feed.
 * @param feedName
 */
exports.last = feedName => {
    var feed = getFeed(feedName);
    var size = feed.entries.length;
    return size ? feed.entries[size - 1] : null;
};

/**
 * Appends an entry to a given feed. If the feed entries are more then what's set in the config, the oldest element
 * is removed.
 * @param feedName
 * @param entry
 * @param config
 */
exports.append = (feedName, entry, config) => {
    var feed = getFeed(feedName);
    feed.config = config;
    feed.entries.push(entry);
    var size = feed.config.size || 20;
    if (feed.entries.length > size) {
        feed.entries.shift();
    }
    storeFeed(feedName, feed);
};

/**
 * Sets any configuration values (such as headers) if they don't exist already.
 * @param config
 */
exports.updateConfig = config => {
    for (let feedName in config) {
        var feed = getFeed(feedName)
        for (let prop in config[feedName]) {
            feed.config[prop] = config[feedName][prop];
        }
        storeFeed(feedName, feed);
    }
};

/**
 * Returns the configuration of a given feed.
 * @param feedName
 */
exports.getConfig = feedName => {
    return getFeed(feedName).config;
};

/**
 * clear all stored data.
 */
exports.reset = () => {
    storage = {};
    try {
        var files = fs.readdirSync(exports.path);
        files.forEach(file => {
            var curPath = path.join(exports.path, file);
            if (!fs.lstatSync(curPath).isDirectory()) {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(exports.path);
    } catch(e) {}
};