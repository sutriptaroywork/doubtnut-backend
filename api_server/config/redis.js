const Redis = require('ioredis');
const bluebird = require('bluebird');
const config = require('./config');

bluebird.promisifyAll(Redis);

const redisClient = config.redis.hosts.length > 1
    ? new Redis.Cluster(config.redis.hosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password: config.redis.password, showFriendlyErrorStack: true } })
    : new Redis({
        host: config.redis.hosts[0], port: 6379, password: config.redis.password, showFriendlyErrorStack: true, db: config.redis.db,
    });

module.exports = redisClient;
