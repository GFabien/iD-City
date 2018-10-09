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

function internal_filter(article, array, keys) {
    return (
        keys.reduce((accumulator, key) => {
            return accumulator + (article[key]._cdata !== undefined && array.some((element) => {
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

function filter_articles(words) {
    return articles.filter(article => 
        internal_filter(article, words, relevantKeys)
    );
}

module.exports = filter_articles;
