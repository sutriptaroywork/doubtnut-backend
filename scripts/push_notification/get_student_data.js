const database = require('../../api_server/config/database');
const bluebird = require("bluebird");
const redis = require("redis");
const con = {
  host: "dn-prod-db-cluster.cluster-ro-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
}
console.log(con);
const mysql = new database(con);
//main(mysql);
bluebird.promisifyAll(redis);
const client = redis.createClient({
		  host : '35.200.190.26',
          no_ready_check: true,
          auth_pass: 'neil@123'});
	client.on("connect", async function() {
		console.log("Redis client connected successfully");
//async function main(mysql){
try{
let result = await getStudentEngagement(mysql)
console.log(result);
if(result.length>0){
	for(i=0;i<result.length;i++){
		
	}

}else{
	console.log("No data")
}

}catch(e){
	console.log(e)
}
})

client.on("error", function (err){
		console.log("Error" + err);
});


function getStudentEngagement(mysql) {
  let sql = "SELECT `resource_id`,`resource_type`,`student_id` FROM `user_engagement_feedback` WHERE `is_like` =1 ORDER BY `student_id`"
  return mysql.query(sql)
}