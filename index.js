const parser = require('./parser');
const articles = require('./pick-articles');


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

const obs = parser('entretien', 'fr');
obs.subscribe((result) => {
    // console.log(result.categories[0]);
    const words = result.categories[0].words;
    words.push('entretien');
    //console.log(words);
    // console.log(articles(words));
    arts = articles(words);
});

