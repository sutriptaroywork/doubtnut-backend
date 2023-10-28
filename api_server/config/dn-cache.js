const NodeCache = require('node-cache');

module.exports = class DNCache {
    constructor(stdTTL, checkperiod, useClones) {
        this.cache = new NodeCache({
            stdTTL,
            checkperiod,
            useClones,
        });
    }

    keys() {
        return this.cache.keys();
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value, ttl) {
        if (ttl) {
            return this.cache.set(key, value, ttl);
        }
        return this.cache.set(key, value);
    }

    mget(keys) {
        const data = this.cache.mget(keys);
        return keys.map((x) => data[x]);
    }

    mgetall() {
        const keys = this.keys();
        return this.mget(keys);
    }

    /**
     * Multi set
     * @param {{key: string, val: any, ttl?: number}[] | any[]} params Array of objects or key-value pairs
     * @param {string} key Key to be picked from array of objects
     * @param {*} ttl TTL
     */
    mset(params, key, ttl) {
        if (!key) {
            return this.cache.mset(params);
        }
        const newParams = params.map((x) => (ttl ? { key: x[key], val: x, ttl } : { key: x[key], val: x }));
        return this.cache.mset(newParams);
    }

    flushall() {
        return this.cache.flushAll();
    }
};
