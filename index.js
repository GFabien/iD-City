const parser = require('./parser');
const articles = require('./pick-articles');
const Rx = require('rxjs');

/**

const http = require('http');

const server = http.createServer(function(req, res) {

  res.writeHead(200);

  wd.getDef("garçon", "fr", null, function(result) {
      res.end(result.definition);
  });

});


server.listen(8080); // Démarre le serveur

console.log("j'ecoute sur 8080");

 */
/*
console.log(articles[0].name._cdata);
const filtered_articles = articles.filter(x => x.description._cdata.toLowerCase().includes('entretien'));
console.log(filtered_articles.length);
*/


const obs = parser('entretien', 'fr');
obs.subscribe((result) => {
    // console.log(result.categories[0]);
    const words = result.categories[0].words;
    words.push('entretien');
    //console.log(words);
    console.log(articles(words).length);
});

/*
const obs2 = Rx.Observable.create(function subscribe(observer) {
    observer.next(parser('fromage', 'fr'));
    observer.next(parser('jambon', 'fr'));
})

const resultats = [];
obs2.subscribe((result) => {
    result.subscribe((x) => {
        resultats.push(x);  
        console.log(resultats);
    });
})
*/
