"use strict";

var http = require('http');

var RSS = require('rss');


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
 * Start the server that will respond to http requests.
 * @param port
 */
exports.initialize = (host, port) => {
    http.createServer((req, res) => {
        var feedName = req.url.replace(/^\/|\/$/g, '');
        var feed = exports.storage.get(feedName);
        var config = exports.storage.getConfig(feedName);
        var output = new RSS({
            title: feedName,
            generator: 'rssify',
            feed_url: host + '/' + feedName,
            site_url: config.url,
            ttl: config.interval
        });
        for (let entry of feed.reverse()) {
            output.item(entry);
        }
        res.writeHead(200, {
            'Content-Type': 'application/atom+xml; charset=utf-8',
            'Cache-Control': 'public; max-age=' + config.interval * 60,
            'Date': new Date().toUTCString()
        });
        res.end(output.xml({indent: true}));
    }).listen(port, () => {
        exports.debug && console.log('Server is listening on port ' + port);
    });

};