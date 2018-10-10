/**
 * This file aims to test the functions in the pick-articles.js file using Mocha and Chai should assertions
 */

// import chai
const chai = require('chai');
const should = chai.should();

// import rewire to be able to test private functions
const rewire = require('rewire');

// link rewire to the file we want to test
const mod = rewire('../pick-articles.js');

const convert = require('xml-js');

const xml = require('fs').readFileSync('./export_proposal_2018_09_27_10_52_38.xml', 'utf8');
const options = {
    ignoreComment: true,
    alwaysChildren: true,
    compact: true
};

const articles = convert.xml2js(xml, options).datas.data;

mod.__set__('articles', articles);

const relevantKeys = ['name', 'topic', 'objective', 'description'];

const internal_filter = mod.__get__('internal_filter');
const filter_articles = mod.__get__('filter_articles');

describe('Internal Filter Tests', () => {
    it('Should return false if no words are provided', () => {
        const bool = internal_filter(articles[0], [], relevantKeys);
        bool.should.equal(false);
    });
    it('Should return true if empty word is provided', () => {
        const bool = internal_filter(articles[0], ['anticonstitutionnellement', ''], relevantKeys);
        bool.should.equal(true);
    });
    it('Should return true if one or more words are in the article', () => {
        const bool = internal_filter(articles[0], ['parc', 'sport'], relevantKeys);
        bool.should.equal(true);
    });
});

describe('Filter Articles Tests', () => {
    it('Should return an empty list if no words are provided', () => {
        const filtered_articles = filter_articles([]);
        filtered_articles.should.be.a('array').with.lengthOf(0);
    });
    it('Should return a list of 12 entries if words \'construction\' and \'écologique\' are provided', () => {
        const filtered_articles = filter_articles(['construction', 'écologique']);
        filtered_articles.should.be.a('array').with.lengthOf(12);
    });
});