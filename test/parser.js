/**
 * This file aims to test the functions in the parser.js file using Mocha and Chai should assertions
 */

// import chai
const chai = require('chai');
const should = chai.should();

// import rewire to be able to test private functions
const rewire = require('rewire');

// import nock to intercept HTTP requests and mock responses
const nock = require('nock');

const getTitleResponse = require('./get-title-response');
const getPageResponse = require('./get-page-response');

// link rewire to the file we want to test
const mod = rewire('../parser.js');


const getTitle = mod.__get__('getTitle');
const getPage = mod.__get__('getPage');
const parse = mod.__get__('parse');
const wrapper = mod.__get__('wrapper');


describe('Get Title tests', () => {
    beforeEach(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=bonjour&srwhat=nearmatch')
            .reply(200, getTitleResponse);
    });

    it('Get a title', (done) => {
        getTitle('bonjour', 'fr').subscribe((result) => {
            result.should.be.a('string');

            result.should.equal('bonjour');
            done();
        });
    });
});

describe('Get Page tests', () => {
    beforeEach(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=bonjour')
            .reply(200, getPageResponse);
    });

    it('Get a page', (done) => {
        getPage('bonjour', 'fr').subscribe((result) => {
            result.should.be.a('string');
            
            done();
        });
    });
});


describe('Parse tests', () => {
    beforeEach(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=bonjour')
            .reply(200, getPageResponse);
    });

    it('Parse the page', (done) => {
        getPage('bonjour', 'fr').subscribe((response) => {
            const result = parse(response, 'bonjour');
            result.should.be.a('Object');
            result.word.should.equal('bonjour');
            result.categories.should.be.a('array');
            done();
        });
    });
});

describe('Wrapper tests', () => {
    beforeEach(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=bonjour&srwhat=nearmatch')
            .reply(200, getTitleResponse);
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=bonjour')
            .reply(200, getPageResponse);
    });

    it('Wrap all functions', (done) => {
        wrapper('bonjour', 'fr').subscribe((result) => {
            result.should.be.a('Object');
            result.word.should.equal('bonjour');
            result.categories.should.be.a('array');
            done();
        });
    });
});