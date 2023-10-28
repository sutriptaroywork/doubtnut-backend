const setExp = 60 * 60;

module.exports = class utility_redis {
    static lock(db, lockingName, value, ttl) {
        return db.setAsync(lockingName, value, 'EX', ttl);
    }

    static lockWithNoExpire(db, lockingName, value) {
        return db.setAsync(lockingName, value);
    }

    static unlock(db, lockingName) {
        return db.delAsync(lockingName);
    }

    static checkIfExists(db, lockingName) {
        return db.getAsync(lockingName);
    }

    static expire(db, lockingName, ttl) {
        return db.expireAsync(lockingName, ttl);
    }

    static getHash(client, key, field) {
        return client.hgetAsync(key, field);
    }

    static getValue(client, key) {
        return client.getAsync(key);
    }

    static incrementValue(client, key) {
        return client.incr(key);
    }

    static decrementValue(client, key) {
        return client.decr(key);
    }

    static lpush(client, key, value) {
        return client.lpush(key, value);
    }

    static ltrim(client, key, start, stop) {
        return client.ltrim(key, start, stop);
    }

    static lpop(client, key) {
        return client.LPOP(key);
    }

    static lrange(client, key, start, stop) {
        return client.lrangeAsync(key, start, stop);
        // return client.lrangeAsync(key, start, stop);
    }

    static setValue(client, key, value, expiry) {
        const output = client.setAsync(key, value);
        if (expiry) {
            return client.expire(key, expiry);
        }
        return output;
    }

    static setHash(client, key, field, value, expiry) {
        const output = client.hsetAsync(key, field, JSON.stringify(value));
        if (expiry) {
            return client.expire(key, expiry);
        }
        return output;
    }

    static incHashValue(client, key, field, expiry) {
        const output = client.hincrby(key, field, 1);
        if (expiry) {
            return client.expire(key, expiry);
        }
        return output;
    }

    static deleteHashField(client, key, field) {
        return client.hdelAsync(key, field);
    }

    static sismember(client, key, field) {
        return client.sismemberAsync(key, field);
    }

    static sadd(client, key, field) {
        return client.sadd(key, field);
    }

    static setQuickBlock(client, mobile, expiry) {
        return client.setAsync(`block_${mobile}`, 1, 'Ex', expiry);
    }

    static getQuickBlock(client, mobile) {
        return client.getAsync(`block_${mobile}`);
    }

    static setCacheHerdingKey(client, value) {
        return client.saddAsync('REDIS_KEY_PRE_CHECK', value);
    }

    static cacheHerdingKeyExists(client, value) {
        return client.sismemberAsync('REDIS_KEY_PRE_CHECK', value);
    }

    static removeCacheHerdingKey(client, value) {
        return client.sremAsync('REDIS_KEY_PRE_CHECK', value);
    }

    static setCacheHerdingKeyNew(client, key) {
        return client.setAsync(`${key}`, 1, 'Ex', setExp * 12); // 12 hrs cache
    }

    static setCacheHerdingKeyWithTtll(client, key, ttl) {
        return client.setAsync(key, 1, 'Ex', ttl);
    }

    static cacheHerdingKeyExistsNew(client, key) {
        return client.getAsync(`${key}`);
    }

    static removeCacheHerdingKeyNew(client, key) {
        return client.delAsync(`${key}`);
    }

    static getSetMembers(client, key) {
        return client.smembersAsync(key);
    }

    static removeMemberFromSet(client, setKey, member) {
        return client.sremAsync(setKey, member);
    }

    static saddWithExpiry(client, key, member, expiry) {
        return client.multi()
            .sadd(key, member)
            .expire(key, expiry)
            .execAsync();
    }
};
