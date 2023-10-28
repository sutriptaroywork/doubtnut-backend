const moment = require('moment');
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Data = require(__dirname+'/../../api_server/data/liveclass.data');
const LiveclassHelper = require(__dirname+'/../../api_server/server/helpers/liveclass');
const CourseRedis = require(__dirname+'/../../api_server/modules/redis/course');
const database = require("./database");
const _ = require("lodash");
var rp = require('request-promise');
const Redis = require('ioredis');
const bluebird = require('bluebird');
const PaytmHelper = require('../../api_server/modules/paytm/helper');
const admin = require('firebase-admin');
const serviceAccount = `${__dirname}/../../api_server/${config.GOOGLE_KEYFILE}`;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firebase.baseUrl,
});

bluebird.promisifyAll(Redis);
const doPayment = true;
// console.log(config)
const conWrite = config.write_mysql;
const conRead = config.read_mysql;
main(conWrite, conRead);



async function main(conWrite, conRead) {
    try {
        const readClient = new database(conRead);
        const redisClient = config.redis.hosts.length > 1
            ? new Redis.Cluster(config.redis.hosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password: config.redis.password, showFriendlyErrorStack: true } })
            : new Redis({
                host: config.redis.hosts[0], port: 6379, password: config.redis.password, showFriendlyErrorStack: true,
            });
        // const contestID = 5;

        const date = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .subtract(3, 'days')
            .format('YYYY-MM-DD');
             // console.log(date)
             const leaderBoardData = await getLeaderBoardDataV2(readClient, date);
             console.log(leaderBoardData.length)
             for(let i = 0;i<leaderBoardData.length;i++) {
               console.log(leaderBoardData[i].liveclass_course_id)
               await CourseRedis.setDailyLeaderboardByDateAndCourse(redisClient, date, leaderBoardData[i].points, leaderBoardData[i].liveclass_course_id, leaderBoardData[i].student_id)
             }
             console.log('done')
    } catch (error) {
        console.log(error);
    }
}


function getLeaderBoardData(mysql) {
  const query = `SELECT d.student_id, max(d.points) as max_point, d.mobile, d.student_username, d.student_fname, d.img_url from (Select a.student_id, c.class, sum(points) as points, e.mobile, e.student_username, e.student_fname, e.img_url from (Select student_id, detail_id, sum(points) as points from liveclass_quiz_response where date(created_at) >= CURDATE() and created_at < date_add(CURRENT_DATE, INTERVAL 2 DAY) group by student_id, detail_id) as a LEFT JOIN liveclass_course_details as b on a.detail_id = b.id left join liveclass_course as c on b.liveclass_course_id=c.id left join (select student_id, mobile, student_username, student_fname, img_url from students) as e on a.student_id=e.student_id group by a.student_id, c.class) as d group by d.student_id ORDER BY max_point DESC`;
  console.log(query);
  return mysql.query(query);
}
function getLeaderBoardDataV2(mysql, date) {
  const query = `select * from (select * from liveclass_quiz_response where date(created_at) = '${date}' and is_correct=1) as a inner join (select * from liveclass_course_details) as b on a.detail_id=b.id order by a.created_at asc`;
  console.log(query);
  return mysql.query(query);
}
