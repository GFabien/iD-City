const parser = require('../parser');
const articles = require('../pick-articles');
const sortArticles = require('../sort-articles');
var express = require('express');
const HttpStatus = require('http-status-codes');
var router = express.Router();

/* //how to get relevant ids from word "entretien"
const obs = parser('entretien', 'fr');
obs.subscribe((result) => {
    const words = result.categories[0].words;
    words.push('entretien');
    const arts = articles(words);
    const relevantIds = sortArticles(arts, words);
    console.log(relevantIds);
});
*/

//GET search bar
router.get('/', function(req, res, next) {
    //get request words
    var req_words = req.query.q;
    var list_req_words=req_words.split('|')
    
    //get similar words 
    const obs = parser(list_req_words[0], 'fr');
    obs.subscribe((result) => {
        let words=[]
        if (typeof result.categories.synonymes !== 'undefined' && result.categories.synonymes.length > 0) {
            words = result.categories.synonymes;
        }
        words.push(list_req_words[0]);
        
        //send relevant words
        var json_relevantWords={'relevantWords': words}
        res.status(HttpStatus.OK).send(json_relevantWords);  
        console.log(words);
    });

});
  
//POST entry form 
router.post('/', function(req, res, next) {
    //get request words
    const req_words = req.body.words;
    const list_req_words=req_words.split('|');

    //get similar words 
    const obs = parser(list_req_words[0], 'fr');
    obs.subscribe((result) => {
        let words=[]
        if (typeof result.categories.synonymes !== 'undefined' && result.categories.synonymes.length > 0) {
            words = result.categories.synonymes;
        }
        words.push(list_req_words[0]);
        
        //send relevant words
        var json_relevantWords={'relevantWords': words}
        res.status(HttpStatus.OK).send(json_relevantWords);  
        console.log(words);
    });
});

  
module.exports = router;
  