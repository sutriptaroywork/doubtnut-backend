require('dotenv').config({ path: `${__dirname  }/../../api_server/.env` });

const bluebird = require("bluebird");
const config = require(`${__dirname}/../../api_server/config/config`);
const Redis = require('ioredis');
bluebird.promisifyAll(Redis);
const database = require('./database');
const AnswerRedis = require(`${__dirname}/../../api_server/modules/redis/answer`)
const conRead = config.read_mysql;




function getData() {
    const sql = 'select * from liveclass_homework';
    console.log(sql);
    return mysql.query(sql);
}
const mysql = new database(conRead);

(async () => {
    let writeClient = '';
    let readClient = '';
    try {
        const redisClient = config.redis.hosts.length > 1
        ?  new Redis.Cluster(config.redis.hosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password: config.redis.password, showFriendlyErrorStack: true } })
        : new Redis({
            host: config.redis.hosts, port: 6379, password: config.redis.password, showFriendlyErrorStack: true,
        });
        redisClient.on('connect', () => {
            console.log('redis connect');
        });

        redisClient.on('ready', () => {
            console.log('redis ready');
        });

        redisClient.on('error', () => {
            console.log('redis error');
        });

        redisClient.on('close', () => {
            console.log('redis close');
        });

        redisClient.on('reconnecting', () => {
            console.log('redis reconnecting');
        });

        redisClient.on('end', () => {
            console.log('redis end');
        });
        const homeworks = await getData();
        mysql.connection.end();

        for (let i = 0; i < homeworks.length; i++) {
            const questionList = homeworks[i].question_list.split('|');
            for (let j = 0; j < questionList.length; j++) {
                console.log(questionList[j])
                await AnswerRedis.deleteByQuestionIdWithTextSolution(questionList[j], redisClient);
            }
        }
        console.log(`the script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
    } finally {
        mysql.connection.end();
    }
})();