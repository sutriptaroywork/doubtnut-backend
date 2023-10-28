require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const config = require(__dirname+'/../../api_server/config/config')
const redis = require('redis');
const redisClient = redis.createClient({legacyMode: true, ...config.redis});
// const redisClient = redis.createClient();
redisClient.connect();

let prefixToDelete = 'numerade*';


async function main() {  
    redisClient.on('connect', async function() {
        console.log('redis connected');
        let keys = await redisClient.keys(prefixToDelete);
        console.log(keys);
        redisClient.del(keys).then((res, err)=>{
            if (err) {
                throw new Error(err);
            }
            console.log("successfully deleted,",res);
            process.exit(0);
        });
    });
}

main();