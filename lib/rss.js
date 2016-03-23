'use strict';

var http = require('http');
var url = require('url');
var util = require('util');

var cheerio = require('cheerio');


/**
 * A list of headers that should be checked for modification before doing the actual get request of a page.
 * @type {string[]}
 */
exports.headers = ['last-modified', 'etag'];
/**
 * Enable or disable debug messages (set through global config object).
 * @type {boolean}
 */
exports.debug = false;
/**
 * The storage implementation used to store feed data and configuration.
 * @type {Object}
 */
exports.storage = null;

/**
 * Check if the content is still the same as last time. If a header matches a previous on this function stops
 * immediately and returns. If no matching header is found, the current values are set on the config object.
 * @param feedConfig
 * @param cb
 */
exports.checkHeader = (feedConfig, cb) => {
    if (feedConfig.headers && !Object.keys(feedConfig.headers).length) {
        exports.debug && console.log('Skipping header check since there were none received before');
        return cb(false);
    }
    var options = url.parse(feedConfig.url);
    options.method = 'HEAD';
    feedConfig.headers = feedConfig.headers || {};
    http.request(options, function (res) {
        for (let prop of exports.headers) {
            if (res.headers[prop]) {
                if (feedConfig.headers[prop] == res.headers[prop]) {
                    return cb(true);
                } else {
                    feedConfig.headers[prop] = res.headers[prop];
                }
            }
        }
        cb(false);
    }).end();
};

/**
 * Checks if content is still the same based on the content. This setting is configurable per feed.
 * @param feedConfig
 * @param previous
 * @param current
 * @returns {boolean}
 */
exports.checkContent = (feedConfig, previous, current) => {
    if (!previous) {
        return false;
    }
    if (!feedConfig.validate) {
        return current.title == previous.title && current.description == previous.description;
    }
    if (!util.isArray(feedConfig.validate)) {
        feedConfig.validate = [ feedConfig.validate ];
    }
    var hasProp = false;
    for (let property of feedConfig.validate) {
        hasProp = hasProp || previous[property] ? true : false;
        if (previous[property] != current[property]) {
            return false;
        }
    }
    return hasProp;
};

/**
 * Checks a source for updates.
 * @param feedConfig
 * @param cb
 */
exports.update = (feedConfig, cb) => {
    exports.checkHeader(feedConfig, same => {
        if (same) {
            return cb('Content header unchanged, no update needed.')
        }
        http.get(feedConfig.url, res => {
            var data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                var now = new Date();
                var result = {
                    url: feedConfig.url,
                    author: 'rssify',
                    title: now.toDateString(),
                    pubDate: now,
                    guid: now.getTime()
                };
                var $ = cheerio.load(data);
                for (let fieldConfig of feedConfig.fields) {
                    var content = result[fieldConfig.field] || fieldConfig.content || '';
                    if (fieldConfig.selector) {
                        var elements = $(fieldConfig.selector);
                        elements.each(function () {
                            var elementContent;
                            if (fieldConfig.attr) {
                                switch (fieldConfig.attr) {
                                    case 'html':
                                        elementContent = $(this).html();
                                        break;
                                    case 'text':
                                        elementContent = $(this).text();
                                        break;
                                    default:
                                        elementContent = $(this).attr(fieldConfig.attr);
                                }
                            }
                            if (fieldConfig.format) {
                                elementContent = util.format(fieldConfig.format, elementContent);
                            }
                            content += elementContent;
                        });
                    }
                    if (fieldConfig.evaluate) {
                        eval('content = (function() {' + fieldConfig.evaluate + '})()');
                    }
                    result[fieldConfig.field] = content
                }
                // Fix rss lib using categories string array instead of category property
                if (result.categories && !Array.isArray(result.categories)) {
                    result.categories = result.categories.split(/,:;/);
                }
                if (result.category) {
                    result.categories = result.categories || [];
                    result.categories.push(result.category);
                    delete result.category;
                }
                // Fix rss lib option called url, not link
                if (result.link && !result.url) {
                    result.url = result.link;
                    delete result.link;
                }
                // Fix rss lib using date instead of pubDate
                if (result.pubDate && !result.date) {
                    result.date = result.pubDate;
                    delete result.pubDate;
                }
                cb(null, result);
            });
        });
    });
};

/**
 * Go through the configuration and run each one.
 * @param feedName
 */
exports.process = feedName => {
    exports.debug && console.log('Processing feed "' + feedName + '"');
    var feedConfig = exports.storage.getConfig(feedName);
    if (feedConfig.cooldown
        && feedConfig.lastUpdate
        && feedConfig.lastUpdate + feedConfig.cooldown * 60000 > Date.now()) {
        return;
    }
    exports.update(feedConfig, (err, entry) => {
        if (err) {
            return exports.debug && console.log(err);
        }
        feedConfig.lastUpdate = Date.now();
        var last = exports.storage.last(feedName);
        if(exports.checkContent(feedConfig, last, entry)) {
            return exports.debug && console.log('Feed content is still the same, no need to update');
        }
        exports.debug && console.log('Received updated entry from ' + feedName);
        exports.storage.append(feedName, entry, feedConfig);
    });
};

/**
 * Sets up to run the process call on each feed with whatever interval was set.
 */
exports.cron = () => {
    var feeds = exports.storage.list();
    for (let feed of feeds) {
        var config = exports.storage.getConfig(feed);
        setInterval(exports.process, config.interval * 60000, feed);
        exports.process(feed);
    }
};