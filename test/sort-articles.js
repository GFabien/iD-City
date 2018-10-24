/**
 * This file aims to test the functions in the sort-articles.js file using Mocha and Chai should assertions
 */

// import chai
const chai = require('chai');
const should = chai.should();

// import rewire to be able to test private functions
const rewire = require('rewire');

const articles = require('./mock-articles');
// console.log(articles[0]);

const keys = {
    name: 5,
    topic: 10,
    description: 1,
    objective: 3
}

const mod = rewire('../sort-articles.js');


const totalWeight = mod.__get__('totalWeight');
const weightByKey = mod.__get__('weightByKey');
const wordImportance = mod.__get__('wordImportance');
const sortArticles = mod.__get__('sortArticles');
const getMostRelevantIds = mod.__get__('getMostRelevantIds');

mod.__set__('keys', keys);

describe('Test that articles are well defined', () => {
    it('Test articles', () => {
        articles.should.be.a('array').with.lengthOf(70);
    });
});

describe('Word Importance Test', () => {
    it('Should return zero if word does not appear in the article\'s name', () => {
        const weight = wordImportance(articles[0], 'anticonstitutionnellement', 'name');
        weight.should.equal(0);
    });
    it('Should return five if word appears once and only once in the article\'s name', () => {
        const weight = wordImportance(articles[0], 'préservation', 'name');
        weight.should.equal(5);
    });
    it('Should return two if word appears twice in the article\'s description', () => {
        const weight = wordImportance(articles[0], 'ville', 'description');
        weight.should.equal(2);
    })
});

describe('Weight By Key Test', () => {
    it('Should return zero if no words are provided', () => {
        const weight = weightByKey(articles[0], [], 'name');
        weight.should.equal(0);
    });
    it('Should return zero if none of the words are in the article\'s name', () => {
        const weight = weightByKey(articles[0], ['anticonstitutionnellement'], 'name');
        weight.should.equal(0);
    });
    it('Should return three if words appear a total of three times in the article\'s description', () => {
        const weight = weightByKey(articles[0], ['entretien', 'préservation', 'construction', 'valorisation'], 'description');
        weight.should.equal(3);
    });
    it('Should return six if words appear twice in the article\'s objective', () => {
        const weight = weightByKey(articles[0], ['protection', 'entretien', 'préservation', 'aménagement'], 'objective');
        weight.should.equal(6);
        console.log(['protection', 'entretien', 'préservation', 'aménagement']);
        console.log(articles[0]['objective']);
        console.log('weight: ', weight);
    });
});

describe('Total Weight Test', () => {
    it('Should return zero if no words are provided', () => {
        const weight = totalWeight(articles[0], []);
        weight.should.equal(0);
    })
    it('Should return zero if none of the words are in the article', () => {
        const weight = totalWeight(articles[0], ['anticonstitutionnellement']);
        weight.should.equal(0);
    })
    it('Should return eleven if words appear once in the name, once in the objective and four times in the description of the article', () => {
        const weight = totalWeight(articles[0], ['entretien', 'préservation', 'construction', 'valorisation']);
        weight.should.equal(11);
        console.log('words: ', ['entretien', 'préservation', 'construction', 'valorisation']);
        console.log(articles[0]);
        console.log('weight: ', weight);
    })
})

describe('Sort Articles Test', () => {
    it('Should leave the articles as they are if no words are provided', () => {
        const sortedArticles = sortArticles(articles, []);
        sortedArticles.should.equal(articles);
    });
    it('Should leave the articles as they are if none of the words are in the articles', () => {
        const sortedArticles = sortArticles(articles, ['anticonstitutionnellement']);
        sortedArticles.should.equal(articles);
    });
    it('Should return the sorted list', () => {
        const words = ['entretien', 'préservation', 'construction', 'valorisation'];
        const sortedArticles = sortArticles(articles, words);
        n = sortedArticles.length;
        for (let i = 0; i < n - 1; i++) {
            const weight1 = totalWeight(sortedArticles[i], words);
            const weight2 = totalWeight(sortedArticles[i+1], words);
            (weight2 - weight1).should.be.at.most(0);
        }
        console.log('words: ', words);
        console.log(sortedArticles[0]);
        console.log(sortedArticles[1]);
    });
});

describe('Get Most Relevant Ids Test', () => {
    it('Should return an empty list if no articles are given', () => {
        const relevantIds = getMostRelevantIds([], ['entretien', 'préservation', 'construction', 'valorisation']);
        relevantIds.should.be.a('array').with.lengthOf(0);
    });
    it('Should return the five most relevant ids', () => {
        const words = ['entretien', 'préservation', 'construction', 'valorisation'];
        const relevantIds = getMostRelevantIds(articles, words);
        relevantIds.should.be.a('array').with.lengthOf(5);
        relevantIds[0].should.equal('1212');
        relevantIds[2].should.equal('616');
        relevantIds[4].should.equal('940');
    });
});
