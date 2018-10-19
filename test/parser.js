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
const getBetterTitle = mod.__get__('getBetterTitle');
const getPage = mod.__get__('getPage');
const parse = mod.__get__('parse');
const wrapper = mod.__get__('wrapper');


describe('Get Title tests', () => {
    before(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=bonjour&srwhat=nearmatch')
            .reply(200, getTitleResponse[0]);
    });

    it('Get a title', (done) => {
        getTitle('bonjour', 'fr').subscribe((result) => {
            result.should.be.a('string');

            result.should.equal('bonjour');
            done();
        });
    });

    before(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=&srwhat=nearmatch')
            .reply(200, getTitleResponse[2]);
    });

    it('Throws an error if we give an empty word', (done) => {
        getTitle('', 'fr').subscribe(() => {},
        (err) => {
            err.should.be.an('error');
            done();
        });
    });

    before(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=écologié&srwhat=nearmatch')
            .reply(200, getTitleResponse[3]);
    });

    it('Throws an error if we give a word that does not exist', (done) => {
        getTitle('écologié', 'fr').subscribe(() => {},
        (err) => {
            err.should.be.an('error');
            done();
        });
    });
});

describe('Get Better Title tests', () => {
    before(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=pommes')
            .reply(200, getPageResponse[1]);
    });

    it('Get the name if we give the plural', (done) => {
        getBetterTitle('pommes', 'fr').subscribe((result) => {
            result.should.be.a('string');
            result.should.equal('pomme');
            done();
        });
    });
    
    
    before(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=attentifs')
            .reply(200, getPageResponse[2]);
    });

    it('Get the adjective if we give the plural', (done) => {
        getBetterTitle('attentifs', 'fr').subscribe((result) => {
            result.should.be.a('string');
            result.should.equal('attentif');
            done();
        });
    });

    
    before(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=descendons')
            .reply(200, getPageResponse[3]);
    });
    
    it('Get the verb if we give a conjugated form', (done) => {
        getBetterTitle('descendons', 'fr').subscribe((result) => {
            result.should.be.a('string');
            result.should.equal('descendre');
            done();
        });
    });
    
});

describe('Get Page tests', () => {
    beforeEach(() => {
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=bonjour')
            .reply(200, getPageResponse[0]);
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
            .reply(200, getPageResponse[0]);
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
            .get('/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=pommes&srwhat=nearmatch')
            .reply(200, getTitleResponse[1]);
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=pommes')
            .reply(200, getPageResponse[1]);
        nock('https://fr.wiktionary.org')
            .get('/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=pomme')
            .reply(200, getPageResponse[4]);
    });

    it('Wrap all functions', (done) => {
        wrapper('pommes', 'fr').subscribe((result) => {
            result.should.be.a('Object');
            result.word.should.equal('pomme');
            result.categories.should.be.a('array');
            done();
        });
    });
});