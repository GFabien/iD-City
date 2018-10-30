const NodeCache=require('node-cache');

class Cache {

  constructor(ttlSeconds) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2 });
  }

  get(key) {
    return (this.cache.get(key));
  }

  set(key,value) {
    return(this.cache.set(key,value));
  }

  del(keys) {
    return(this.cache.del(keys));
  }

  flush() {
    this.cache.flushAll();
  }

  getStats(){
    return(this.cache.getStats());
  }
}
module.exports=Cache;
