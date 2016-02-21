'use strict';

var rssify = require('./lib/main');

//process.on('uncaughtException', console.log);

var config = require('./config.json');

rssify.initialize(config);