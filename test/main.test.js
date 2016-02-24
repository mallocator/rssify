'use strict';

var expect = require('chai').expect;

var main = require('../lib/main');

describe('main.js', () => {
    describe('#applyGlobals()', () => {
        it('should apply all the global options to the individual options', () => {
            var config = {
                global: {
                    prop1: 'value1',
                    prop2: 2,
                    prop3: true,
                    prop4: 'success'
                },
                testFeed: {
                    prop1: 'value2',
                    prop4: ['Yay!']
                }
            };
            main.applyGlobals(config);
            expect(config.testFeed.prop1).to.equal('value2');
            expect(config.testFeed.prop2).to.equal(2);
            expect(config.testFeed.prop3).to.equal(true);
            expect(config.testFeed.prop4).to.deep.equal(['Yay!', 'success']);
        });
    });

    describe('#initialize()', () => {
        it('should call all initializers and set the proper configuration values', () => {

        })
    });
});