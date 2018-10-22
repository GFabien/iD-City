const parser = require('./parser');

const Rx = require('rxjs');
const { expand,take } = require('rxjs/operators');

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


/*
var source = new Rx.Observable.of({val: 0, counter: 3});

source.expand(function(o) {
  console.log('Counter: ' + o.counter);
  o.counter--;

return (o.counter >= 0) ? Rx.Observable.just(o) : Rx.Observable.empty()
})
.subscribe(
    function (x) {
        console.log('Next: ' , x);
    },
    function (err) {
        console.log('Error: ' + err);   
    },
    function () {
        console.log('Completed');   
    });
*/



/*
const finalResult = [];
Rx.from(words)
    .pipe(
        map(word => parser(word, 'fr'))
        )
    .subscribe(val => {
        val.subscribe(result => {
            finalResult.push(result);
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
*/

const finalResult = [];
Rx  .from(words)
    .pipe(expand(function(word){ 
        return(obs=parser(word, 'fr'));
        }),
        take(words.length*2)
        )
    .subscribe(
        function (x) {
            finalResult.push(x);
            console.log('Next: ' , finalResult);
        },
        function (err) {
            console.log('Error: ' + err);   
        },
        function () {
            finalResult.splice(0,words.length);
            console.log('Completed');
            console.log(finalResult)   
        });

        /*
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
*/