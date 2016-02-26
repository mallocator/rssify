'use strict';

var http = require('http');

var expect = require('chai').expect;
var gently = new (require('gently'));

var rss = require('../lib/rss');

describe('rss.js', () => {
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

    });

    describe('#process()', () => {

    });

    describe('#cron()', () => {

    });
});