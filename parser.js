/**
 * This file aims to make requests on Wiktionary thanks to the Wikimedia API to get words related to the one we received on the server.
 */

const https = require("https");
const Rx = require('rxjs');

// Useful URL to make requests on the Wiktionary API.
const titlesURL = ".wiktionary.org/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=";
const pagesURL = ".wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=";

const srwhat = 'nearmatch';

// Titles of the sections of the article we are intersted in.
const relevantHeaders = ['hyponymes', 'troponymes', 'antonymes', 'synonymes', 'quasi-synonymes'];

const errors = {
	notFound: "not found",
	req: "a request has failed"
}


/** Private function to get the title of the page we are interested in given a specific word and a specific language.
 * @param {string} word - The word we want to find semantic correspondance with.
 * @param {string} language - The language we want to search in.
 * @return {Observable} - An observable on which we can subscribe to get the page we want.
 */
function getTitle(word, language) {
    const url = `https://${language}${titlesURL}${encodeURIComponent(word)}&srwhat=${srwhat}`;

    const obs = Rx.Observable.create(function subscribe(observer) {

        const req = https.get(url, function(result) {
            let content = "";

            result.on('data', function(chunk) {
                content += chunk;
            })
            .on('end', function() {
                try {
                    const articles = JSON.parse(content).query.search;
                    if (articles.length) {
                        observer.next(articles[0].title);
                    }
                }
                catch(err) {
                    observer.error(err);
                }
            });
        });
        req.on("error", function() { 
            observer.error(Error("error"));
        });
    });
    return obs;        
}

/** Private function to get a better title for the page we are interested in given a specific word and a specific language.
 * @param {string} word - The word we want to find semantic correspondance with.
 * @param {string} language - The language we want to search in.
 * @return {Observable} - An observable on which we can subscribe to get the page we want.
 */
function getBetterTitle(title, language) {
    const url = `https://${language}${pagesURL}${encodeURIComponent(title)}`;

    const obs = Rx.Observable.create(function subscribe(observer) {
        const req = https.get(url, function(result) {
            let content = '';
            result.on('data', function(chunk) {
                content += chunk;
            })
            .on('end', function() {
                try {
                    const pages = JSON.parse(content).query.pages;
                    const page = pages[Object.keys(pages)[0]].revisions[0]['*'];
                    const isName = /{{S\|nom\|fr\|flexion}}/.exec(page);
                    const isAdjective = /{{S\|adjectif\|fr\|flexion}}/.exec(page);
                    const isVerb = /{{S\|verbe\|fr\|flexion}}/.exec(page);
                    if (isName && (!isAdjective || isName.index < isAdjective.index) && (!isVerb || isName.index < isVerb.index)) {   // On suppose ici qu'on est en français
                        // Find xxxx in ...|s=xxxx}}
                        observer.next(/\|s=([a-z]*)/.exec(page)[1]);
                    }
                    else if (isAdjective && (!isVerb || isAdjective.index < isVerb.index)) {
                        // Find xxxx in [[xxxx#fr-yy|xxxx]]
                        observer.next(/\[\[([a-z]*)/.exec(page)[1]);
                    }
                    else if (isVerb) {
                        // Find xxxx in {{fr-verbe-flexion|(grp=3)|xxxx|
                        observer.next(/{{fr-verbe-flexion\|(grp=3\|)?([a-z]*)\|/.exec(page)[2]);
                    }
                    else {
                        observer.next(title);
                    }

                }
                catch(err) {
                    console.log(err);
                    observer.error(errors.req);
                }
            })
        });

        req.on("error", function() {
            observer.error(Error("error"));
        });
    });

    return obs;        
}


/** Private function to get the content of the page once we have its title and language.
 * @param {string} title - The title of the page we are intersted in.
 * @param {string} language - The language we want to search in.
 * @return {Observable} - An observable on which we can subscribe to get the page we want.
 */
function getPage(title, language) {
    const url = `https://${language}${pagesURL}${encodeURIComponent(title)}`;

    const obs = Rx.Observable.create(function subscribe(observer) {
        const req = https.get(url, function(result) {
            let content = '';
            result.on('data', function(chunk) {
                content += chunk;
            })
            .on('end', function() {
                try {
                    const pages = JSON.parse(content).query.pages;
                    const page = pages[Object.keys(pages)[0]].revisions[0]['*'];
                    const languages = page.split(/\n==[^=]/);
                    let relevantPage = languages[0];
                    
                    if (relevantPage.length < 20) {     // We keep only the selected language page
                        relevantPage = languages[1];
                    }
                    
                    observer.next(relevantPage);
                }
                catch(err) {
                    console.log(err);
                    observer.error(errors.req);
                }
            })
        });

        req.on("error", function() {
            observer.error(Error("error")); 
        });
    });

    return obs;        
}

/** Private function to parse the content of the page we got to turn it into a javascript object.
 * @param {string} page - The page we got and we want to parse.
 * @param {string} word - The word we want to find semantic correspondance with.
 * @return {Object} - An object with attributes word and categories. Word is the word we gave to the function and categories are arrays that contain objects with attributes header and words. This array might be empty.
 */
function parse(page, word) {
    const sections = page.split('\n====');
    sections.shift();

    const headerPattern = /[^|]+(?=}}\s====\n)/;
    const wordPattern = /[^[]+(?=]])/g;

    const categories = {};
    sections.forEach(element => {
        const header = element.match(headerPattern);
        const words = element.match(wordPattern);
        if (header && words && relevantHeaders.includes(header[0])) {
            //choose categorie will have the following form: {{synonym: list of words},{troponyme:list of words}}
            categories[header[0]]=words;
        }
        
    });

    const result = {
        word: word,
        categories: categories
    };

    return result;
}


/** Public function to wrap all precedent functions and return an Observable we just have to subscribe to get the results we want.
 * @param {string} word - The word we want to find semantic correspondance with.
 * @param {string} language - The language we want to search in.
 * @return {Observable} - An observable on which we can subscribe to get the output of the parse function.
 */
function wrapper(word, language) {
    const defaultResult = {
        word: word,
        categories: []
    }
    const obs = Rx.Observable.create(function subscribe(observer) {
        getTitle(word, language).subscribe((title) => {
            getBetterTitle(title, language).subscribe((newTitle) => {
                getPage(newTitle, language).subscribe((page) => {
                    observer.next(parse(page, newTitle));
                },
                () => {
                    observer.next(defaultResult);
                });
            },
            () => {
                observer.next(defaultResult);
            });
        },
        (err) => {
            observer.next(defaultResult);
        });
    });
    return obs;
}

module.exports = wrapper;