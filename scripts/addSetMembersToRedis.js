/**
 * @Author: Meghna
 * @Date:   2020-08-02
 * @Email:  meghna.gupta@doubtnut.com
 * @param {*} redisKeyName name_of_redis_set_key
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2020-08-08
 */
require('dotenv').config({path : __dirname + '/../api_server/.env'});
const config = require(__dirname+'/../api_server/config/config');
const args = process.argv.slice(2);
if (args[0]) {
    var keyName = args[0];
} else {
    console.error('Please provide redis key name as third argument');
    process.exit(1);
}
const fs = require('fs');
const Redis = require('ioredis');
const redisClientRead = new Redis.Cluster(config.redis.hosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password: config.redis.password, showFriendlyErrorStack: true } })
const redisClientWrite = redisClientRead;
const file = fs.readFileSync('answer_ids.csv', {encoding: 'utf8'})
const answer_ids = file.split(',');
answer_ids.unshift(keyName);

redisClientWrite.sadd(answer_ids, function(err, reply) {
    console.log(reply, ' elements added to ', keyName);
    process.exit(0);
});
