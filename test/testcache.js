const NodeCache = require("node-cache");
const myCache = new NodeCache();

const v = 'x'.repeat(300)

let i = 0;
while (1) {
	const k = "k" + Math.random();
	if (myCache.getStats().keys < 100000) {
		success = myCache.set(k, v);
	}
	if (++i % 10000 === 0) {
		console.log(i);
		console.log(v);
		console.log(myCache.getStats());
		console.log(process.memoryUsage());
	}
}