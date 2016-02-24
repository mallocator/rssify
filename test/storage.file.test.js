'use strict';

var fs = require('fs');
var path = require('path');

var expect = require('chai').expect;

var storage = require('../lib/storage.file');


storage.path = path.join(__dirname, '../feeds');

function getFile(feedname) {
    try {
        return JSON.parse(fs.readFileSync(path.join(storage.path, feedname), 'utf8'));
    } catch (e) {
        return null;
    }
}

describe('storage.file.js', () => {
    afterEach(() => {
        storage.reset();
    });

    describe("#append()", () => {
        it('should append an item to the storage', () => {
            storage.append('testFeed', {title: 'test'}, {prop: 'value'});
            expect(storage.last('testFeed')).to.deep.equal({title: 'test'});
            var file = getFile('testFeed');
            expect(file.config).to.deep.equal({prop: 'value'});
            expect(file.entries).to.deep.equal([{title: 'test'}]);
        });

        it('should append another item and still deliver only the last one', () => {
            storage.append('testFeed', {title: 'test'}, {prop: 'value'});
            storage.append('testFeed', {title: 'test2'}, {prop: 'value'});
            expect(storage.last('testFeed')).to.deep.equal({title: 'test2'});
            var file = getFile('testFeed');
            expect(file.config).to.deep.equal({prop: 'value'});
            expect(file.entries).to.deep.equal([{title: 'test'}, {title: 'test2'}]);
        });
    });

    describe("#updateConfig()", () => {
        it('should update all existing configurations', () => {
            storage.updateConfig({
                testFeed: {
                    prop1: 'test2'
                },
                testFeed2: {
                    prop2: 'test3'
                }
            });
            expect(storage.getConfig('testFeed')).to.deep.equal({prop1: 'test2'});
            expect(storage.getConfig('testFeed2')).to.deep.equal({prop2: 'test3'});
            expect(getFile('testFeed').config).to.deep.equal({prop1: 'test2'});
            expect(getFile('testFeed2').config).to.deep.equal({prop2: 'test3'});
        });
    });

    describe("#list()", () => {
        it('should return a list of all known feeds', () => {
            storage.append('testFeed1', {title: 'test1'}, {prop: 'value1'});
            storage.append('testFeed2', {title: 'test2'}, {prop: 'value1'});
            storage.append('testFeed3', {title: 'test3'}, {prop: 'value1'});
            var feeds = storage.list();
            expect(feeds).to.include('testFeed1');
            expect(feeds).to.include('testFeed2');
            expect(feeds).to.include('testFeed3');
            expect(getFile('testFeed1')).to.deep.equal({entries: [{title: 'test1'}], config: {prop: 'value1'}});
            expect(getFile('testFeed2')).to.deep.equal({entries: [{title: 'test2'}], config: {prop: 'value1'}});
            expect(getFile('testFeed3')).to.deep.equal({entries: [{title: 'test3'}], config: {prop: 'value1'}});
        });
    });

    describe("#get()", () => {
        it('should return a list of items in the same order', () => {
            storage.append('testFeed', {title: 'test1'}, {prop: 'value1'});
            storage.append('testFeed', {title: 'test2'}, {prop: 'value1'});
            storage.append('testFeed', {title: 'test3'}, {prop: 'value1'});
            var feeds = storage.get('testFeed');
            expect(feeds[0]).to.deep.equal({title: 'test1'});
            expect(feeds[1]).to.deep.equal({title: 'test2'});
            expect(feeds[2]).to.deep.equal({title: 'test3'});
            var file = getFile('testFeed');
            expect(file.config).to.deep.equal({prop: 'value1'});
            expect(file.entries).to.deep.equal([{title: 'test1'}, {title: 'test2'}, {title: 'test3'}]);
        });

        it('should return a list of items of a previously saved file', () => {
            var testFeed = {
                entries: [{title: 'test1'}, {title: 'test2'}, {title: 'test3'}],
                config: {prop: 'value1'}
            };
            fs.mkdirSync(storage.path);
            fs.writeFileSync(path.join(storage.path, 'testFeed'), JSON.stringify(testFeed), 'utf8');
            var feeds = storage.get('testFeed');
            expect(feeds[0]).to.deep.equal({title: 'test1'});
            expect(feeds[1]).to.deep.equal({title: 'test2'});
            expect(feeds[2]).to.deep.equal({title: 'test3'});
        });
    });
});