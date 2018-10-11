/** This file aims to get the articles we need from an extract of the database given as an xml file. */

const convert = require('xml-js');

const xml = require('fs').readFileSync('./export_proposal_2018_09_27_10_52_38.xml', 'utf8');
const options = {
    ignoreComment: true,
    alwaysChildren: true,
    compact: true
};

const articles = convert.xml2js(xml, options).datas.data;

const relevantKeys = ['name', 'topic', 'objective', 'description'];

/*
function internal_filter(article, array, key) {
    return (article[key]._cdata && array.some((element) => {
        return article[key]._cdata.toLowerCase().includes(element);
    })); 
}
*/

/** Private function that returns true if one of the words is present in the different sections of the selected article given by the keys we provide.
 * @param {Object} article - The article we are evaluating.
 * @param {Array} words - The words we want to have in the article.
 * @param {Array} keys - The sections of the article we are searching in.
 */
function internal_filter(article, words, keys) {
    return (
        keys.reduce((accumulator, key) => {
            return accumulator + (article[key]._cdata !== undefined && words.some((element) => {
                return article[key]._cdata.toLowerCase().includes(element);
            }));
        }, 0) > 0
    ); 
}

/*
function filter_articles(words) {
    return articles.filter(article => 
        internal_filter(article, words, 'name')  ||
        internal_filter(article, words, 'topic')  ||
        internal_filter(article, words, 'objective')  ||
        internal_filter(article, words, 'description')
    );
}
*/

/** Public function that returns all the articles which name, topic, objective or description contains at least one of the words we provided.
 * @param {Array} words - The words we want to have in the articles.
 */
function filter_articles(words) {
    return articles.filter(article => 
        internal_filter(article, words, relevantKeys)
    );
}

module.exports = filter_articles;
