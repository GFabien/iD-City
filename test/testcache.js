const CacheService = require('../cache.service');
const now = require("performance-now");
const ttl = 60 * 60 * 1; // cache for 1 Hour
const Maxmemory = 500; //cache for 500 Mb 
const myCache = new CacheService(ttl, Maxmemory); // Create a new cache service instance

const v = 'x'.repeat(300)

let i = 0;
isNotFull = true;
const k = "k" + Math.random();
isNotFull = myCache.set(k, v);

//timer for getting element in cache with only 1 element
let t0 = now();
myCache.keys((err, myKeys) => {
    if (!err) {
        console.log(myCache.get(myKeys[0]));
    }
});
let t1 = now();
const firstTime = t1 - t0;

while (isNotFull) {
    const k = "k" + Math.random();
    isNotFull = myCache.set(k, v);
    if (++i % 10000 === 0) {
        console.log(i);
        console.log(v);
        console.log(myCache.getStats());
        console.log(process.memoryUsage());
    }
}

t0 = now();
myCache.keys((err, myKeys) => {
    if (!err) {
        console.log(myCache.get(myKeys[0]));
    }
})
t1 = now();
console.log('first time: ', firstTime, ' second time: ', (t1 - t0));