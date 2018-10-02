const https = require("https");

const titlesURL = ".wiktionary.org/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=";
const pagesURL = ".wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=";

const relevantHeaders = ['hyponymes', 'troponymes', 'antonymes', 'synonymes', 'quasi-synonymes'];

const errors = {
	notFound: "not found",
	req: "a request has failed"
}

class Parser {
    constructor(word, language, callback) {
        this.language = language;
        this.word = word;

        this.srwhat = 'nearmatch';

        this.callback = callback;
    }

    sendError(err, word) {
        this.callback( {
            word: word || this.word,
            err: err
        });
    }

    getTitles() {
        const self = this; // Keep reference to the object to be able to call it later

        const url = `https://${this.language}${titlesURL}${encodeURIComponent(this.word)}&srwhat=${this.srwhat}`;
        const req = https.get(url, function(result) {
            let content = "";

            result.on('data', function(chunk) {
                content += chunk;
            })
            .on('end', function() {
                try {
                    const articles = JSON.parse(content).query.search;
                    if (articles.length) {
                        self.getPage(articles[0].title);
                    }
                }
                catch(err) {
                    console.log(err);
                    self.sendError(err);
                }
                
                
            })
        })

        req.on("error", function() { 
            self.sendError(err); 
        });
    }

    getPage(title) {
        const self = this;

        const url = `https://${this.language}${pagesURL}${encodeURIComponent(title)}`;
        const req = https.get(url, function(result) {
            let content = '';
            result.on('data', function(chunk) {
                content += chunk;
            })
            .on('end', function() {
                try { // par sécurité
                    const pages = JSON.parse(content).query.pages;
                    const page = pages[Object.keys(pages)[0]].revisions[0]['*'];
                    const languages = page.split(/\n==[^=]/);
                    let relevantPage = languages[0];
                    
                    if (relevantPage.length < 20) {     // We select only the selected language page
                        relevantPage = languages[1];
                    }

                    const sections = relevantPage.split('\n====');

                    sections.shift();

                    self.parse(relevantPage);
                }
                catch(err) {
                    console.log(err);
                    return self.sendError(errors.req);
                }
            })
        });

        req.on("error", function() {
            this.sendErr(errors.req); 
        });
    }

    parse(page) {
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
        // console.log(categories);
        // return categories;
        this.callback({
            word: this.word,
            categories: categories
        });
    }
}



exports.parser = Parser;