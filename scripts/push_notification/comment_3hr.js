require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const redis = require('../../api_server/config/redis');
redis.on('connect', () => {
    console.log('redis connect');
});

redis.on('ready', () => {
    console.log('redis ready');
});

redis.on('error', () => {
    console.log('redis error');
});

redis.on('close', () => {
    console.log('redis close');
});

redis.on('reconnecting', () => {
    console.log('redis reconnecting');
});

redis.on('end', () => {
    console.log('redis end');
});

(async () => {
    let x = await redis.del('comment_count_leaderboard')
    console.log(x)
    process.exit();
})()