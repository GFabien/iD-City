/**
 * @file Create routes to access the Node API
 * The cache config can be changed in this file
 */

//Library Requirements
var express = require('express');
var router = express.Router();
const HttpStatus = require('http-status-codes');
const Rx = require('rxjs');
const {
    take,
    mergeMap
} = require('rxjs/operators');
const {
    isObservable
} = require('rxjs/index');

const sw = require('stopword');

//Parser Service
const parser = require('../services/parser.service');

//Cache Service
const CacheService = require('../services/cache.service');
const ttlseconds = 24 * 60 * 60; // cache for 1 day
const checkPeriodSeconds = Math.floor(ttlseconds / 3)
var cache = new CacheService({
    ttl: ttlseconds,
    checkPeriod: checkPeriodSeconds
});


/* In memory cache
const CacheService = require('../services/cache.service');
const ttl = 60 * 60 * 1; // cache for 1 Hour
const Maxmemory = 50; //cache for 50 Mb 
const cache = new CacheService(ttl, Maxmemory); // Create a new cache service instance
*/

//POST entry form 
router.post('/', function(req, res, next) {

    //get request words
    const raw_req_words = req.body.words;
    const split_character = '|';
    const list_raw_req_words = raw_req_words.split(split_character)

    let list_req_words = sw.removeStopwords(list_raw_req_words, sw.fr); //remove useless words
    list_req_words = list_req_words.filter(function(elem, index, self) { //remove repeated words
        return index === self.indexOf(elem);
    })

    //get similar words
    const finalResult = [];
    Rx.from(list_req_words)
        .pipe(
            mergeMap((word) => {
                /*
                let cacheContent = cache.get(word); //return null if don't find a word in the cache
                if (cacheContent) {
                    console.log('cache:');
                    return (new Promise(function(resolve, reject) {
                        resolve(cacheContent)
                    })); //send cache
                } else {
                    console.log('parser:');
                    return (parser(word, 'fr')); //send wiki relevant words {word:..., synonymes : ..., troponymes : ...}
                }
				*/
                return (new Promise(function(resolve, reject) {
                    cache.get(word, function(err, value) {
                        if (value) {
                            //console.log('cache:');
                            resolve(value);
                        } else {
                            //console.log('parser:');
                            resolve(parser(word, 'fr')); //send wiki relevant words {word:..., synonymes : ..., troponymes : ...}
                        }
                    })
                }));
            }),
            take(list_req_words.length) //call function() when mergeMap finishes
        )
        .subscribe(
            //concatenate objects returned by mergeMap
            function(x) {
                if (isObservable(x)) { //not in cache
                    x.subscribe((element) => {
                        if (element.originWord) {
                            cache.set(element.originWord[0], element);
                        }
                        finalResult.push(element);
                        if (finalResult.length === list_req_words.length) {
                            res.status(HttpStatus.OK).send({
                                relevantWords: finalResult
                            });
                        }

                    })
                } else { //in cache
                    finalResult.push(x);
                    if (finalResult.length === list_req_words.length) {
                        res.status(HttpStatus.OK).send({
                            relevantWords: finalResult
                        });
                    }

                }
            },
            //when an error is returned
            function(err) {
                console.log('Error: ' + err);
            },
            //send relevant words when mergeMap finishes
            function() {});
});

module.exports = router;