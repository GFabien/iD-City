const parser = require('../parser');
var express = require('express');
const Rx = require('rxjs');
const { take,mergeMap } = require('rxjs/operators');
sw = require('stopword');
const HttpStatus = require('http-status-codes');
var router = express.Router();
var Cache = require('ttl');

//paramètres du cache
var cache = new Cache({
    ttl: 100 * 1000,
    capacity: 10
});

//GET search bar
router.get('/', function (req, res, next) {
    //get request words
    var req_words = req.query.q;
    var list_req_words = req_words.split('|')

    //get similar words 
    const obs = parser(list_req_words[0], 'fr');
    obs.subscribe((result) => {
        let words = []
        if (typeof result.categories.synonymes !== 'undefined' && result.categories.synonymes.length > 0) {
            words = result.categories.synonymes;
        }
        words.push(list_req_words[0]);

        //send relevant words
        var json_relevantWords = {
            'relevantWords': words
        }
        res.status(HttpStatus.OK).send(json_relevantWords);
        console.log(words);
    });

});
//POST entry form 
router.post('/', function(req, res, next) {
    //get request words
    const raw_req_words = req.body.words;
    const split_character='|';
    const list_raw_req_words=raw_req_words.split(split_character)
    
    let list_req_words=sw.removeStopwords(list_raw_req_words,sw.fr); //remove useless words
    list_req_words=list_req_words.filter(function(elem, index, self) { //remove repeated words
        return index === self.indexOf(elem);
    })
    
    //get similar words
    const finalResult = [];
    Rx  .from(list_req_words)
        .pipe(
            mergeMap((word) => {
                if (cache.get(word)){
                    console.log('cache:');
                    return(new Promise(function(resolve, reject) {resolve(cache.get(word))}));
                }
                else{
                    console.log('parser:');
                    console.log(word)
                    return(parser(word, 'fr')); //relevant words {word:..., categorie:{synonymes : ...,troponymes : ...}}
                }
            }),
            take(list_req_words.length)
        )
        .subscribe(
            function (x) {
                if(x.word){
                    cache.put(x.originWord,x);
                }
                finalResult.push(x);          
            },
            function (err) {
                console.log('Error: ' + err);   
            },
            function () {//send relevant words when completed
                console.log('Completed');
                console.log(finalResult);
                res.status(HttpStatus.OK).send({relevantWords: finalResult});  
            });
});
  
module.exports = router;