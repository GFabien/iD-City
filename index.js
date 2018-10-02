const wd = require("word-definition");
const Parser = require('./parser');

/**

const http = require('http');

function demo4() {
	wd.getDef("garçon", "fr", { hyperlinks: "html", formatted: true }, function(result) {
        // print(result, "Definition of 'GARCON', french, with HTML hyperlinks and text formatting");
        return result;
	});
}

const server = http.createServer(function(req, res) {

  res.writeHead(200);

  wd.getDef("garçon", "fr", null, function(result) {
      res.end(result.definition);
  });

});


server.listen(8080); // Démarre le serveur

console.log("j'ecoute sur 8080");

 */

monParser = new Parser.parser('tableau', 'fr', function(result) {

    console.log(result.categories);
});
monParser.getTitles();