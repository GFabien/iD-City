const https = require("https");
const Rx = require('rxjs');

// Useful URL to make requests on the Wiktionary API
const titlesURL = ".wiktionary.org/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=";
const pagesURL = ".wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=";

const srwhat = 'nearmatch';

// Titles of the relevant sections of the article
const relevantHeaders = ['hyponymes', 'troponymes', 'antonymes', 'synonymes', 'quasi-synonymes'];

const errors = {
	notFound: "not found",
	req: "a request has failed"
}


function getTitle(word, language) {
    // const self = this; // Keep reference to the object to be able to call it later
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
                    console.log(err);
                    observer.error(err);
                }
                
                
            })
        })

        req.on("error", function() { 
            observer.error("error"); 
        });
        
    });
    return obs;        
}

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
            observer.error("error"); 
        });
    });

    return obs;        
}

function parse(page, word) {
    const sections = page.split('\n====');
    sections.shift();

    const headerPattern = /[^|]+(?=}}\s====\n)/;
    const wordPattern = /[^[]+(?=]])/g;

    const categories = [];
    sections.forEach(element => {
        const header = element.match(headerPattern);
        const words = element.match(wordPattern);
        if (header && words && relevantHeaders.includes(header[0])) {
            categories.push({
                header: header[0],
                words: words
            });
        }
        
    });

    const result = {
        word: word,
        categories: categories
    };

    return result;
}

function wrapper(word, language) {
    const obs = Rx.Observable.create(function subscribe(observer) {
        getTitle(word, language).subscribe((title) => {
            getPage(title, language).subscribe((page) => {
                observer.next(parse(page, word));
            })
        })
    });
    return obs;
}




module.exports = wrapper;