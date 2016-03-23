'use strict';

var events = require('events');
var fs = require('fs');
var http = require('http');
var path = require('path');

var expect = require('chai').expect;
var gently = new (require('gently'));

var rss = require('../lib/rss');

describe('rss.js', () => {
    rss.storage = {};

    describe('#checkHeader()', () => {
        before(() => {
            gently.expect(http, 'request', 4, (options, cb) => {
                cb({
                    headers: {
                        etag: '456def',
                        'last-modified': "Today"
                    }
                });
                return {
                    end: () => {}
                };
            });
        });
        after(() => gently.verify());

        it('should return true for a matching "etag" header', (done) => {
            var config = {
                url: 'localhost',
                headers: {
                    etag: '456def'
                }
            };
            rss.checkHeader(config, result => {
                expect(result).to.be.true;
                done();
            });
        });

        it('should return true for a matching "last-modified" header', (done) => {
            var config = {
                url: 'localhost',
                headers: {
                    'last-modified': "Today"
                }
            };
            rss.checkHeader(config, result => {
                expect(result).to.be.true;
                done();
            });
        });

        it('should return false for a mismatching "etag" header', (done) => {
            var config = {
                url: 'localhost',
                headers: {
                    etag: '123abc'
                }
            };
            rss.checkHeader(config, result => {
                expect(result).to.be.false;
                expect(config.headers.etag).to.equal('456def');
                done();
            });
        });

        it('should return set the header if there is non', (done) => {
            var config = {
                url: 'localhost'
            };
            rss.checkHeader(config, result => {
                expect(result).to.be.false;
                expect(config.headers.etag).to.equal('456def');
                done();
            });
        });

        it('should return false for an empty header', (done) => {
            var config = {
                url: 'localhost',
                headers: {}
            };
            rss.checkHeader(config, result => {
                expect(result).to.be.false;
                done();
            });
        });
    });

    describe('#checkContent()', () => {
        it('should return false if there is no previous feed', () => {
            var result = rss.checkContent(null, null, null);
            expect(result).to.be.false;
        });

        it('should return false if none of the validation fields exist', () => {
            var result = rss.checkContent({
                validate: 'prop'
            }, {
                other: 'value'
            }, {
                other: 'value'
            });
            expect(result).to.be.false;
        });

        it('should return false if the properties don\'t match', () => {
            var result = rss.checkContent({
                validate: 'prop'
            }, {
                prop: 'value'
            }, {
                other: 'value'
            });
            expect(result).to.be.false;

            var result = rss.checkContent({
                validate: 'prop'
            }, {
                prop: 'value'
            }, {
                prop: 'other'
            });
            expect(result).to.be.false;
        });

        it('should return true if one property matches', () => {
            var result = rss.checkContent({
                validate: 'prop'
            }, {
                prop: 'value'
            }, {
                prop: 'value'
            });
            expect(result).to.be.true;
        });

        it('should return true if all multiple properties match', () => {
            var result = rss.checkContent({
                validate: [ 'prop1', 'prop2' ]
            }, {
                prop1: 'value1',
                prop2: 'value2'
            }, {
                prop1: 'value1',
                prop2: 'value2'
            });
            expect(result).to.be.true;
        });

        it('should return false if one of multiple properties don\'t match', () => {
            var result = rss.checkContent({
                validate: ['prop1', 'prop2']
            }, {
                prop1: 'value1',
                prop2: 'value2'
            }, {
                prop1: 'value1',
                prop2: 'other'
            });
            expect(result).to.be.false;
        });
    });

    describe('#update()', () => {
        beforeEach(() => {
            gently.expect(rss, 'checkHeader', (config, cb) => {
                cb(false);
            });

            gently.expect(http, 'get', (url, cb) => {
                var res = new events.EventEmitter();
                cb(res);
                res.emit('data', fs.readFileSync(path.join(__dirname, 'sample.html')));
                res.emit('end');
            });
        });
        afterEach(() => gently.verify());

        it('should process feed with constant content', done => {
            var config = {
                url: 'test.url',
                fields: [{
                    field: 'testField',
                    content: 'testContent'
                }]
            };

            rss.update(config, (err, result) => {
                expect(result.url).to.equal('test.url');
                expect(result.testField).to.equal('testContent');
                expect(result.date).to.be.instanceof(Date);
                done();
            })
        });

        it('should process feed while extracting data from the html into a specific format', done => {
            var config = {
                url: 'test.url',
                fields: [{
                    field: 'testField',
                    selector: 'div > img',
                    attr: 'src',
                    format: '<img src="%s" />'
                }]
            };

            rss.update(config, (err, result) => {
                expect(result.url).to.equal('test.url');
                expect(result.testField).to.equal('<img src="awesomeimage.jpg" />');
                expect(result.date).to.be.instanceof(Date);
                done();
            })
        });

        it('should process feed while evaluating a script as content', done => {
            var config = {
                url: 'test.url',
                fields: [{
                    field: 'testField',
                    evaluate: 'return "testData"'
                }]
            };

            rss.update(config, (err, result) => {
                expect(result.url).to.equal('test.url');
                expect(result.testField).to.equal('testData');
                expect(result.date).to.be.instanceof(Date);
                done();
            })
        });
    });

    describe('#process()', () => {
        it('should not process if cooldown is still active', () => {
            gently.expect(rss.storage, 'getConfig', feedName => {
                return {
                    lastUpdate: Date.now(),
                    cooldown: 60
                }
            });

            var result = rss.process('testFeed');
            expect(result).to.be.undefined;
            gently.verify()
        });

        it('should process an update and store it', () => {
            gently.expect(rss.storage, 'getConfig', feedName => { return {
                name: feedName
            }});

            gently.expect(rss, 'update', (feedConfig, cb) => cb(null, {
                title: 'testEntry'
            }));

            gently.expect(rss.storage, 'last', () => { return {
                title: 'previousEntry'
            }});

            gently.expect(rss, 'checkContent', () => false);

            gently.expect(rss.storage, 'append', (feedName, entry, feedConfig) => {
                expect(feedName).to.equal('testFeed');
                expect(entry.title).to.equal('testEntry');
                expect(feedConfig.name).to.equal('testFeed');
            });

            var result = rss.process('testFeed');
            expect(result).to.be.undefined;
            gently.verify()
        });
    });

    describe('#cron()', () => {

    });
});