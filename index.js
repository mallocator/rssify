'use strict';

process.on('uncaughtException', console.log);

var config = process.argv.pop();
config = config.match(/\.json$/) ? require('path').resolve(config) : './config.json';

require('./lib/main').initialize(require(config));