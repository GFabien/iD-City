const parser = require('./parser');

const Rx = require('rxjs');
const { map, filter, switchMap } = require('rxjs/operators');

const words = ['manger', 'des', 'chips', 'aux', 'crevettes'];

/*
const finalResult = [];
const obs = Rx.Observable.create(function subscribe(observer) {
    words.forEach((word) => {
        parser(word, 'fr').subscribe((result) => {
            finalResult.push(result);
        });
    })
});

obs.subscribe(() => {}, () => {}, () => {
    console.log(finalResult);
    console.log('coucou');
})
*/
const finalResult = [];
Rx.from(words)
    .pipe(
        map(word => parser(word, 'fr'))
        )
    .subscribe(val => {
        val.subscribe(result => {
            finalResult.push(result);
            console.log(finalResult);
        });
    });

const eventify = function(arr, callback) {
    arr.push = function(e) {
        Array.prototype.push.call(arr,e);
        callback(arr);
    };
};

eventify(finalResult, (res) => {
    const x =1;
    console.log(res);
})
