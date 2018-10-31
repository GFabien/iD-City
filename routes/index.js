const parser = require('../parser');
var express = require('express');
var router = express.Router();
const HttpStatus = require('http-status-codes');
const Rx = require('rxjs');
const { take,mergeMap } = require('rxjs/operators');
const sw = require('stopword');

//Cache Service
const CacheService = require('../cache.service');
const ttl = 60 * 60 * 1; // cache for 1 Hour
const cache = new CacheService(ttl); // Create a new cache service instance

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
                const cacheContent=cache.get(word); //return null if don't find a word in the cache
                if (cacheContent){
                    console.log('cache:');
                    return(new Promise(function(resolve, reject) {resolve(cacheContent)}));
                }
                else{
                    console.log('parser:');
                    return(parser(word, 'fr')); //relevant words {word:..., categorie:{synonymes : ...,troponymes : ...}}
                }
            }),
            take(list_req_words.length) //call function() when mergeMap completed
        )
        .subscribe(
            function (x) {
                if(x.originWord[0]){
                    cache.set(x.originWord[0],x);
                }
                finalResult.push(x);          
            },
            function (err) {
                console.log('Error: ' + err);   
            },
            function () {//send relevant words when completed
                console.log('Completed');
                console.log('cache Stats:',cache.getStats());                
                res.status(HttpStatus.OK).send({relevantWords: finalResult});  
            });
});
  
module.exports = router;