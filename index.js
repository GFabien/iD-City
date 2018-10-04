const Parser = require('./parser');

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

monParser = new Parser.parser('entrée', 'fr', function(result) {

    console.log(result.categories);
});
monParser.getTitles();