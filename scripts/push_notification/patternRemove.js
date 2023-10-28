require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const _ = require('lodash');
const config = require(__dirname + '/../../api_server/config/config');
const redisClient = require(__dirname + '/../../api_server/config/redis');
const database = require('../../api_server/config/database');

function getPatternKeys(pattern){
    return redisClient.keys(pattern);
   }
   
   function removePatternKeys(keysData){
    return redisClient.del(keysData);
   }


async function main(){
    let pattern = "LIVE_CLASS_FREE_*";
    let keysData = await getPatternKeys(pattern);
    console.log(keysData);
    if(keysData.length>0){
        for(let i=0; i<keysData.length; i++){
            await removePatternKeys(keysData[i]);
        }
        console.log("keys deleted successfully");
    } else{
    console.log("no keys to delete");
    }
    redisClient.quit();
}

main()