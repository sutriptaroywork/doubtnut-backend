const moment = require('moment');
require('dotenv').config({ path: `${__dirname  }/../../api_server/.env` });

const config = require(`${__dirname}/../../api_server/config/config`);
const Data = require(__dirname+'/../../api_server/data/liveclass.data');

const CourseRedis = require(__dirname+'/../../api_server/modules/redis/course');
const CourseContainer = require(__dirname+'/../../api_server/modules/containers/course');
const StudentContainer = require(__dirname+'/../../api_server/modules/containers/student');
const CourseContainerV2 = require(__dirname+'/../../api_server/modules/containers/coursev2');
const Liveclass = require(__dirname+'/../../api_server/modules/mysql/liveclass');
const Contest = require(__dirname+'/../../api_server/modules/contest');
const WalletUtility = require(__dirname+'/../../api_server/modules/wallet/Utility.wallet.js');
const _ = require("lodash");
var rp = require('request-promise');
const Redis = require('ioredis');
const bluebird = require('bluebird');
const admin = require('firebase-admin');
const PaytmHelper = require('../../api_server/modules/paytm/helper');
const database = require('./database');

const serviceAccount = {
    projectId: config.firebase.project_id,
    privateKey: config.firebase.private_key.replace(/\\n/g, '\n'),
    clientEmail: config.firebase.client_email,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.base_url,
    databaseAuthVariableOverride: {
        uid: 'write-worker',
    },
});

bluebird.promisifyAll(Redis);
const doPayment = true;
const conWrite = config.write_mysql;
const conRead = config.read_mysql;
main(conWrite, conRead);

async function main(conWrite, conRead) {
    try {
      console.log(conWrite)
      console.log(conRead)
      const insert = (typeof process.env.insert === 'undefined') ? 0 : parseInt(process.env.insert);
      const communication = (typeof process.env.communication === 'undefined') ? 0 : parseInt(process.env.communication);
      const payment = (typeof process.env.payment === 'undefined') ? 0 : parseInt(process.env.payment);
      const update = (typeof process.env.update === 'undefined') ? 0 : parseInt(process.env.update);
      const failure = (typeof process.env.failure === 'undefined') ? 0 : parseInt(process.env.failure);
      const offset = (typeof process.env.offset === 'undefined') ? 0 : parseInt(process.env.offset);
      const scriptConfig = {
        insert: insert,
        communication: communication,
        payment: payment,
        updatePaymentStatusAndSendSMS: update,
        failure,
      };
        const writeClient = new database(conWrite);
        const readClient = new database(conRead);
        const contestID = 5;
        // const luckyDrawWinnerLimit = 5;
        // const offset = 1;
        const date = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .subtract(offset, 'days')
            .format('YYYY-MM-DD');
        if(scriptConfig.insert) {
          const luckDrawAmount  = 10000;
          const leaderBoardAmount  = 50;
          const redisClient = config.redis.hosts.length > 1
              ? new Redis.Cluster(config.redis.hosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password: config.redis.password, showFriendlyErrorStack: true } })
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
          const db = {
            mysql: {
              read: readClient,
              write: readClient,
            },
            redis: {
              read: redisClient,
              write: redisClient,
            }
          };
          // let previousWinnerList = await CourseContainer.getPerviosContestWinner(db, date);
          let previousWinnerList = [];
          previousWinnerList = _.groupBy(previousWinnerList, 'student_id');
          const [courseList] = await Promise.all([
                      Liveclass.getAllCourseV2(db.mysql.read),
          ]);
          // console.log(courseList.length)
          const contestDetails = await getContestDetails(contestID, readClient);
          const contestType = contestDetails[0].type;
          const contestParameter = contestDetails[0].parameter;
          const luckyDrawCount = 5;
          let totalLeaderBoard = [];
          const groupedFinalLeaderBoard = {};
          const doneSid = {};
          // get leaderboard
          for(let i = 0; i < courseList.length; i++) {
            const leaderBoardList = await CourseRedis.getLeaderboardByDateAndCourse(db.redis.read, date, courseList[i].course_id, 0, 250);
            totalLeaderBoard.push(CourseContainer.generateLeaderBoardV2(leaderBoardList, courseList[i].course_id, previousWinnerList));
          }
          console.log('totalLeaderBoard')
          console.log(totalLeaderBoard)
          // const cloned = _.clone()
          for(let i = 0; i < totalLeaderBoard.length; i++) {
            if(totalLeaderBoard[i].length > 0) {
              if(typeof groupedFinalLeaderBoard[totalLeaderBoard[i][0].course_id] === 'undefined') {
                groupedFinalLeaderBoard[totalLeaderBoard[i][0].course_id] = [];
              }
              for(let j = 0; j < totalLeaderBoard[i].length; j++) {
                let notPush = false;
                for(k=0;k<totalLeaderBoard.length;k++) {
                  if(i !== k) {
                    for(let l=0; l < totalLeaderBoard[k].length;l++) {
                      if(typeof doneSid[totalLeaderBoard[i][j].student_id] !== 'undefined') {
                        notPush = true;
                      }
                      if(totalLeaderBoard[i][j].student_id === totalLeaderBoard[k][l].student_id && typeof doneSid[totalLeaderBoard[i][j].student_id] === 'undefined') {
                        const studentID = totalLeaderBoard[i][j].student_id;
                        if(totalLeaderBoard[i][j].points < totalLeaderBoard[k][l].points) {
                          notPush = true;
                        }
                        if(totalLeaderBoard[i][j].points === totalLeaderBoard[k][l].points) {
                          // tie breaker
                          const courseArr = [totalLeaderBoard[i][j].course_id, totalLeaderBoard[k][l].course_id];
                          console.log(courseArr)
                          const recent = await CourseContainerV2.getRecentCorrect(db, studentID, courseArr, date);
                          console.log('recent')
                          console.log(recent)
                          ind = 0;
                          const recentCourseID = courseArr.filter((item, index) => {
                            // if(recent.length > 0) {
                              if(item === recent) {
                                ind = index;
                                return true;
                              }
                            // }
                            // return false;
                          });
                          if(ind === 1) {
                            notPush = true;
                          }
                        }
                      }
                    }
                  }
                }
                if(!notPush) {
                  doneSid[totalLeaderBoard[i][j].student_id] = true
                  groupedFinalLeaderBoard[totalLeaderBoard[i][0].course_id].push(totalLeaderBoard[i][j]);
                }
              }
            }
          }
          console.log('groupedFinalLeaderBoard')
          console.log(groupedFinalLeaderBoard)
          let bulkInsertData = [];
          const amount = 50;
          const luckyDrawAmount = 5000;
          for (const key in groupedFinalLeaderBoard) {
              if (Object.prototype.hasOwnProperty.call(groupedFinalLeaderBoard, key)) {
                  const item = groupedFinalLeaderBoard[key];
                  const spliced = item.splice(0, 150);
                  const anAsyncFunction = async (item, index) => {
                    const studentDetails = await StudentContainer.getById(item.student_id, db);
                    // console.log(studentDetails)
                      return {
                          rank: index + 1,
                          student_id: parseInt(item.student_id),
                          username: studentDetails[0].student_fname ? studentDetails[0].student_fname : studentDetails[0].student_username,
                          avatar: studentDetails[0].img_url,
                          mobile: studentDetails[0].mobile,
                          points: parseInt(item.points),
                          hexcode: (index < 13) ? '#000000' : '#808080',
                          fastest: '',
                      };
                  };
                  const getData = async () => Promise.all(spliced.map((item, index) => anAsyncFunction(item, index)));
                  const dataToReturn = await getData();
                  let finalLeader = [];
                  const groupedByPoints = _.groupBy(dataToReturn, 'points');
                  for (const key in groupedByPoints) {
                      if (Object.prototype.hasOwnProperty.call(groupedByPoints, key)) {
                          const item2 = groupedByPoints[key];
                          finalLeader = [..._.sortBy(item2, (dateObj) => new Date(dateObj.fastest)), ...finalLeader];
                      }
                  }
                  console.log('final')
                  console.log(finalLeader)
                  for(let i=0;i<finalLeader.length;i++) {
                    if(i < 20) {
                      const studentID = finalLeader[i].student_id;
                      const count = finalLeader[i].points;
                      const courseID = key;
                      bulkInsertData.push(bulkDataMaker({studentID, amount , date, position: i+1, contestID, contestType, contestParameter, count, courseID}));
                    }
                  }
              }
          }
          // get lucky draw winners
          // const luckyDrawWinners = await Contest.getLuckyDrawWinners(db.mysql.read, date, luckyDrawWinnerLimit, Data.liveQuizContestParams.Z);
          // for(let i = 0; i < luckyDrawWinners.length; i++) {
          //   bulkInsertData.push(bulkDataMaker({studentID: luckyDrawWinners[i].student_id, amount: luckyDrawAmount ,date, position: i+1, contestID, contestType, contestParameter, count: luckyDrawWinners[i].max_point, courseID: luckyDrawWinners[i].course_id }));
          // }
          console.log('bulkInsertData')
          console.log(bulkInsertData)
          await addContestWinners(writeClient, bulkInsertData);
        }
        let results = [];

        if(scriptConfig.failure) {
          results = await getFailureContestWinners(readClient, contestID);
        } else if(scriptConfig.updatePaymentStatusAndSendSMS) {
          results = await updateStatus(readClient, contestID);
        } else {
          results = await getContestWinners(readClient, contestID, date);
        }
        console.log('results')
        console.log(results.length)
        for(let i = 0; i < results.length; i++) {
          console.log(i)
          // console.log(results[i])
          const data = {};
          const studentID = results[i].student_id;
          const winningAmount = results[i].winning_amount;
          const contestWinnersID = results[i].contest_winner_id;
          const repaymentSmsSent = results[i].repayment_sms_sent;
          const mobile = results[i].mobile;
          console.log(contestWinnersID)
          if(scriptConfig.communication) {
            // get winners
            const fcmID = results[0].gcm_reg_id;
            if(fcmID && fcmID.length > 0){
            const hashSid = Buffer.from(studentID.toString()).toString('base64');
            const url = `https://doubtnut.com/contest-result?student_id=${hashSid}`;
                sendWinningNotification(winningAmount, fcmID, studentID, admin, url)
            }
          }
          if(scriptConfig.payment) {
            const orderID = `${results[i].contest_winner_id}_${results[i].student_id}_${moment().unix()}_dn_wallet`;
            // pay
            // const response = await PaytmHelper.disburse(mobile, orderID, winningAmount);
            const resp = await WalletUtility.makeWalletTransaction({
              student_id: studentID,
              reward_amount: winningAmount,
              type: 'CREDIT',
              payment_info_id: 'dedsorupiyadega',
              reason: 'liveclass_contest',
          }, 10000);
          // console.log(resp)
          // break;
          if (typeof resp.meta !== 'undefined' && resp.meta.code === 200) {
            data.order_id = orderID;
            data.payment_status = 'DONE';
            data.status_code = 1;
            data.payment_mode = 'dn_wallet';
            data.payment_try_count = 1;
            const result = await updatePaymentStatus(writeClient, data, contestWinnersID);
            console.log(result);
          }
          //   // const status = response.status;
          //   // const statusCode = response.statusCode;
          //   // update row

            // send sms
            // const msg = `Live Class Quiz Contest ke ₹${winningAmount} hue aapke`;
            // const smsResp = await sendOpenSms(mobile, msg);
            // console.log(`SMS log : ${smsResp}`);
          }
          if(scriptConfig.updatePaymentStatusAndSendSMS && repaymentSmsSent == 0) {
            const orderID = results[i].order_id;
            const paymentStatus = await PaytmHelper.disburseStatus(orderID);
            console.log('update')
            data.payment_status = paymentStatus.status;
            data.status_code = paymentStatus.statusCode;
            // if(paymentStatus.status === 'FAILED' || (paymentStatus.status === 'PENDING' && paymentStatus.statusCode === 'DE_102')) {
            // // if(1) {
            //   const dataToHash = `${contestWinnersID}XX${studentID}`;
            //   console.log(dataToHash)
            //   const info = Buffer.from(dataToHash).toString('base64');
            //   const formLink = `https://doubtnut.com/payment-form?student_id=${info}`;
            //   const smsResponse = await sendSms(formLink, mobile, 'live_payment_fail');
            //   data.repayment_sms_sent = 1;
            //   console.log(smsResponse);
            // }
            const result = await updatePaymentStatus(writeClient, data, contestWinnersID);
            console.log(result.message);
          }
        }
        console.log('done')
    } catch (error) {
        console.log(error);
    }
}

function bulkDataMaker(dataObject){
    return [
        dataObject.studentID,
        dataObject.amount,
        dataObject.date,
        dataObject.position,
        dataObject.contestID,
        dataObject.courseID,
        dataObject.contestType,
        dataObject.contestParameter,
        dataObject.count,
    ];
}

function getContestDetails(contestId, mysql){
    let query = `SELECT * FROM contest_details where id = ${contestId}`;
    return mysql.query(query);
}

function addContestWinners(mysql, data) {
    let query = `INSERT INTO contest_winners (student_id, amount, date, position, contest_id, course_id, type, parameter, count) VALUES ?`;
    return mysql.query(query, [data]);
}

function getGCMID(mysql, studentId) {
  let query = `SELECT gcm_reg_id FROM students where id = ${studentId}`;
  return mysql.query(query);
}

function getContestWinners(mysql, contestID, date) {
  const query = `select * from (SELECT id as contest_winner_id,order_id,repayment_sms_sent,student_id,amount as winning_amount,date,position,contest_id,type,parameter,count as c_count FROM contest_winners WHERE contest_id='${contestID}' and date = '${date}' and payment_status is null order by position asc) as a left join (select student_id,gcm_reg_id, student_fname,student_lname, gender, student_email,img_url, school_name, ex_board, mobile, country_code,pincode,student_class,student_username,coaching,dob from students) as b on a.student_id=b.student_id left join (select * from contest_details) as c on a.contest_id=c.id`;
  console.log(query);
  return mysql.query(query);
}
function getFailureContestWinners(mysql, contestID) {
  const query = `select * from (SELECT id as contest_winner_id,order_id,repayment_sms_sent,student_id,amount as winning_amount,date,position,contest_id,type,parameter,count as c_count FROM contest_winners WHERE contest_id='${contestID}' and payment_status='FAILURE' order by position asc) as a left join (select student_id,gcm_reg_id, student_fname,student_lname, gender, student_email,img_url, school_name, ex_board, mobile, country_code,pincode,student_class,student_username,coaching,dob from students) as b on a.student_id=b.student_id left join (select * from contest_details) as c on a.contest_id=c.id`;
  console.log(query);
  return mysql.query(query);
}
function updateStatus(mysql, contestID) {
  const query = `select * from (SELECT id as contest_winner_id,order_id,repayment_sms_sent,student_id,amount as winning_amount,date,position,contest_id,type,parameter,count as c_count FROM contest_winners WHERE contest_id='${contestID}' and (payment_status='ACCEPTED' or payment_status='PENDING')  order by position asc) as a left join (select student_id,gcm_reg_id, student_fname,student_lname, gender, student_email,img_url, school_name, ex_board, mobile, country_code,pincode,student_class,student_username,coaching,dob from students) as b on a.student_id=b.student_id left join (select * from contest_details) as c on a.contest_id=c.id`;
  console.log(query);
  return mysql.query(query);
}
function sendWinningNotification(winningAmount, gcmId, studentID, admin, url){
  const notification_data = {
      event: 'external_url',
      title: `Live Class Quiz Contest ke ₹${winningAmount} hue aapke 🥳`,
      message: 'Mubarak Ho !',
      image: (winningAmount == 1000) ? `${config.cdn_url}/engagement_framework/D3DCA677-00D2-43A7-03C4-EB8AEAD67E92.webp` : `${config.cdn_url}engagement_framework/34D2D9C3-9187-DE04-D5D7-36B4707A2284.webp`,
      data: JSON.stringify({ url }),
  };
  console.log(notification_data);
  return sendNotification(gcmId, notification_data, admin);
}
function updatePaymentStatus(mysql, obj, contestWinnersID) {
  const sql = `UPDATE contest_winners SET ? where id = ${contestWinnersID}`;
  return mysql.query(sql, [obj]);
}
function sendNotification(gcmId, message, admin) {
  const messageTosend = {};
  messageTosend.token = gcmId;
  messageTosend.data = message;
  messageTosend.android = {
      priority: 'high',
      ttl: 4500,
  };
  return admin
      .messaging()
      .send(messageTosend)
}

function sendSms(var1, mobile, templateName){
    const formData = {
        To: mobile,
        TemplateName:templateName,
        From: 'DOUBTN',
        VAR1: var1
    };
    var options = {
        method: 'POST',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/ADDON_SERVICES/SEND/TSMS`,
        formData: formData,
    };
    return rp(options);
}
function sendOpenSms(mobile, msg){
    const formData = {
        To: mobile,
        From: 'DOUBTN',
        Msg: msg
    };
    var options = {
        method: 'POST',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/ADDON_SERVICES/SEND/TSMS`,
        formData: formData,
    };
    return rp(options);
}

function getRandom(arr, n) {
  var result = new Array(n),
      len = arr.length,
      taken = new Array(len);
  if (n > len)
      console.log("getRandom: more elements taken than available");
  while (n--) {
      var x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}
function generateLeaderBoard(leaderBoardList, courseID) {
        const leaderBoard = [];
        const studentArr = [];
        const pointsArr = [];
        for (let i = 0; i < leaderBoardList.length; i++) {
            if (i % 2 === 0) {
                studentArr.push(leaderBoardList[i]);
            } else {
                pointsArr.push(leaderBoardList[i]);
            }
        }
        for (let i = 0; i < studentArr.length; i++) {
            const obj = {};
            obj.rank = i + 1;
            obj.student_id = parseInt(studentArr[i]);
            obj.points = parseInt(pointsArr[i]);
            obj.course_id = courseID;
            leaderBoard.push(obj);
        }
        return leaderBoard;
}
function sampleData() {
  //SAMPLE test data
    return [
    [
    {student_id: 1, points: 29, course_id: 1},
    {student_id: 2, points: 28, course_id: 1},
    {student_id: 3, points: 27, course_id: 1},
    {student_id: 4, points: 27, course_id: 1},
    {student_id: 6, points: 25, course_id: 1},
  ],
  [
  {student_id: 3, points: 35, course_id: 2},
  {student_id: 1, points: 30, course_id: 2},
  {student_id: 8, points: 28, course_id: 2},
  {student_id: 2, points: 25, course_id: 2},
  {student_id: 10, points: 24, course_id: 2},
],[
  {student_id: 11, points: 37, course_id: 3},
  {student_id: 1, points: 28, course_id: 3},
  {student_id: 5, points: 25, course_id: 3},
  {student_id: 8, points: 22, course_id: 3},
  {student_id: 2, points: 21, course_id: 3},
],[
  {student_id: 1, points: 45, course_id: 4},
  {student_id: 13, points: 30, course_id: 4},
  {student_id: 2, points: 29, course_id: 4},
  {student_id: 4, points: 20, course_id: 4},
  {student_id: 9, points: 19, course_id: 4},
]
];
}
