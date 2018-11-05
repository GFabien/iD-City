/** 
 * @file Create a service which query the Wiktionary and return words related to the requested one
 */

/**
 * Query the Wiktionary (thanks to the Wikimedia API) and return words related to the requested one
 * @module Parser
 */

const https = require("https");
const Rx = require('rxjs');

// Useful URL to make requests on the Wiktionary API.
const titlesURL = ".wiktionary.org/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=";
const pagesURL = ".wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=";

const srwhat = 'nearmatch';

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
                    } catch (err) {
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
                        const isAlreadyBest = /{{S\|synonymes}}/.exec(page);
                        let betterTitle = title;
                        if (!isAlreadyBest) {
                            const isName = /{{S\|nom\|fr\|flexion}}/.exec(page);
                            const isAdjective = /{{S\|adjectif\|fr\|flexion}}/.exec(page);
                            const isVerb = /{{S\|verbe\|fr\|flexion}}/.exec(page);
                            if (isName && (!isAdjective || isName.index < isAdjective.index) && (!isVerb || isName.index < isVerb.index)) { // On suppose ici qu'on est en français
                                // Find xxxx in ...|s=xxxx}}
                                betterTitle = (/\|s=([a-z]*)/.exec(page)[1]);
                            } else if (isAdjective && (!isVerb || isAdjective.index < isVerb.index)) {
                                // Find xxxx in [[xxxx#fr-yy|xxxx]]
                                betterTitle = (/\[\[([a-z]*)/.exec(page)[1]);
                            } else if (isVerb) {
                                // Find xxxx in {{fr-verbe-flexion|(grp=3)|xxxx|
                                betterTitle = (/{{fr-verbe-flexion\|(grp=3\|)?([a-z]*)\|/.exec(page)[2]);
                            }
                        }
                        observer.next(betterTitle);
                    } catch (err) {
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
    //cache options:
    let options = {
        method: 'GET'
    };
    options['url'] = url;

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

                        //page are either under the form 
                        //1:    {{voir|tèxte|texté}} \n \n== "paragraph language 2" ..."something" \n== "Paragraph language 1" \n== "paragraph language 2" ... 
                        //or
                        //2:    "something" \n== "Paragraph language 1" \n== "paragraph language 2" ... 

                        //while we don't find the fr language, we choose the next paragraph
                        const languages = page.split(/\n==[^=]/);
                        let i = 0;
                        do {
                            relevantPage = languages[i];
                            i += 1;
                        } while (!relevantPage.match(/{{langue\|fr}}/));
                        observer.next(relevantPage);
                    } catch (err) {
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
 * @param {string} originWord - the original word requested.
 * @return {Object} - An object with the attributes {word:..., originWord:...[, relevantHeaders: list of words]}
 */
function parse(page, word, originWord) {

    const result = {
        word: [word],
        originWord: [originWord]
    };

    // Titles of the sections of the article we are intersted in.
    let relevantHeaders = ['hyponymes', 'troponymes', 'antonymes', 'synonymes', 'quasi-synonymes'];

    const sections = page.split('\n====');
    sections.shift();
    const headerPattern = /[^|]+(?=}}\s====\n)/;
    const wordPattern = /[^[]+(?=]])/g;


    sections.forEach(element => {
        const smallerSections = element.split('\n===') // the interesting part is either between \n==== and the next \n==== or \n===
        const header = smallerSections[0].match(headerPattern);
        const words = smallerSections[0].match(wordPattern);
        if (header && words && relevantHeaders.includes(header[0])) {
            //result will have the following form: {word:...,originWord:..., synonymes: list of words,troponyme:list of words,...}
            result[header[0]] = words;
            //allow only one list for each relevantHeader
            relevantHeaders.splice(relevantHeaders.indexOf(header[0]), 1);
        }
    });

    return result;
}


/** Public function to wrap all precedent functions and return an Observable we just have to subscribe to get the results we want.
 * @param {string} word - The word we want to find semantic correspondance with.
 * @param {string} language - The language we want to search in.
 * @return {Observable} - An observable on which we can subscribe to get the output of the parse function.
 */
function wrapper(word, language) {
    const defaultResult = {
        word: [word]
    }
    const obs = Rx.Observable.create(function subscribe(observer) {
        getTitle(word, language).subscribe((title) => {
                getBetterTitle(title, language).subscribe((newTitle) => {
                        getPage(newTitle, language).subscribe((page) => {
                                observer.next(parse(page, newTitle, word));
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