const bluebird = require("bluebird");
const redis = require("redis");
bluebird.promisifyAll(redis);
const client = redis.createClient({
		  host : '35.200.190.26',
          no_ready_check: true,
          auth_pass: 'neil@123'});
	client.on("connect", async function() {
        console.log("Redis client connected successfully");
        //return new Promise(async function (resolve, reject) {
        try{	
        let pattern = "HOMEPAGE_*";
        // let pattern = "like_count_*";
        let keysData = await getPatternKeys(pattern, client);
        console.log(keysData);
        if(keysData.length>0){
        for(let i=0; i<keysData.length; i++){
        	await removePatternKeys(keysData[i],client);
        }
        console.log("keys deleted successfully");
       } else{
       	console.log("no keys to delete");
       }
     	client.quit();
		//return resolve(keysData)
		}catch(e){
			console.log(e)
		} 
		}) 
//});
	client.on("error", function (err){
		console.log("Error" + err);
});

function getPatternKeys(pattern, client){
 return client.keysAsync(pattern);
}

function removePatternKeys(keysData,client){
 return client.delAsync(keysData);
}

//     function (err, values) {
    	// console.log(values.length + " values:");
    	// values.forEach(function (value, i) {
     //    console.log("    " + i + ": " + value);
    	// });
    //client.quit();
		// });
