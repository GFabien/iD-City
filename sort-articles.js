/**
 * This file aims to provide functions to sort articles according to their relevance.
 */

const keys = {
    name: 5,
    topic: 10,
    description: 1,
    objective: 3
}

const categories = {
    'hyponymes': 1,
    'troponymes': 1,
    'antonymes': 1,
    'synonymes': 1,
    'quasi-synonymes': 1
};

/** Private function that returns the weight of an article given an array of words we want to be in the article.
 * @param {Object} article - The article we are evaluating.
 * @param {Array} words - The words we want to have in the article.
 */
function totalWeight(article, words) {
    return Object.keys(keys).reduce((accumulator, key) => {
        return accumulator + weightByKey(article, words, key);
    }, 0)
}

/** Private function that returns the weight of an article given an array of words we want to be in an article's specific section.
 * @param {Object} article - The article we are evaluating.
 * @param {Array} words - The words we want to have in the article.
 * @param {string} key - The section we look into.
 */
function weightByKey(article, words, key) {
    return words.reduce((accumulator, word) => {
        return accumulator + wordImportance(article, word, key);
    }, 0)
}

/** Private function that returns the weight of an article given one word we want to be in an article's specific section.
 * @param {Object} article - The article we are evaluating.
 * @param {string} word - The word we want to have in the article.
 * @param {string} key - The section we look into.
 */
function wordImportance(article, word, key) {
    const content = article[key]._cdata
    if (content !== undefined) {
        const reg = new RegExp(word, 'gi');
        if (content.match(reg)) {
            return content.match(reg).length*keys[key];
        } 
    }
    return 0;
}

/** Private function that sorts the articles according to their weights.
 * @param {Array} articles - The articles we are sorting.
 * @param {Array} words - The words we want to have in the articles.
 */
function sortArticles(articles, words) {
    return articles.sort((article1, article2) => {
        return totalWeight(article2, words) - totalWeight(article1, words);
    });
}

/** Public function that returns the ids of the most relevant articles.
 * @param {Array} articles - The articles have.
 * @param {Array} words - The words we want to have in the articles.
 */
function getMostRelevantIds(articles, words) {
    const relevantIds = [];
    if (articles) {
        const sortedArticles = sortArticles(articles, words);
        for (let i = 0; i < Math.min(5, articles.length); i++) {
            relevantIds.push(sortedArticles[i].id._cdata);
        }
    }
    return relevantIds;
}

module.exports = getMostRelevantIds;