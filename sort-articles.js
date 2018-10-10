const keys = {
    name: 5,
    topic: 10,
    description: 1,
    objective: 3
}

function totalWeight(article, words) {
    return Object.keys(keys).reduce((accumulator, key) => {
        return accumulator + weightByKey(article, words, key);
    }, 0)
}

function weightByKey(article, words, key) {
    return words.reduce((accumulator, word) => {
        return accumulator + wordImportance(article, word, key);
    }, 0)
}

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

function sortArticles(articles, words) {
    return articles.sort((article1, article2) => {
        return totalWeight(article2, words) - totalWeight(article1, words);
    });
}

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