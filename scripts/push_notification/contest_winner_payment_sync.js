const moment = require('moment');
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Data = require(__dirname+'/../../api_server/data/liveclass.data');
const LiveclassHelper = require(__dirname+'/../../api_server/server/helpers/liveclass');
const CourseRedis = require(__dirname+'/../../api_server/modules/redis/course');
let PaytmHelper = require('../../api_server/modules/paytm/helper');

const database = require("./database");
const _ = require("lodash");
var rp = require('request-promise');
const conWrite = config.mysql_write;
main(conWrite);

async function main(conWrite) {
    try {
        const writeClient = new database(conWrite);
        const pendingContestWinners = await getPendingPayments(writeClient);
        console.log(pendingContestWinners)
        for ( let i = 0; i < pendingContestWinners.length; i++) {
          const orderID = pendingContestWinners[0].order_id;
          const status = await PaytmHelper.disburseStatus(orderID);
          const objToUpdate = {};
          objToUpdate.payment_status = status.status;
          objToUpdate.status_code = status.statusCode;
          const u = await updatePaymentStatus(writeClient, objToUpdate, orderID)
          console.log(u.message);
        }
        console.log('done')
    } catch (error) {
        console.log(error);
    }
}

function getPendingPayments(mysql) {
  const query = `select * from student_payout_details where payment_status<> 'SUCCESS' and date(created_at) >= date_sub(CURRENT_DATE,INTERVAL 2 DAY)`;
  console.log(query)
  return mysql.query(query);
}
function updatePaymentStatus(mysql, obj, orderID) {
  const sql = `UPDATE student_payout_details SET ? where order_id = '${orderID}'`;
  return mysql.query(sql, [obj]);
}
