"use strict"
// const log = require('why-is-node-running')
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const MongoClient = require("mongodb").MongoClient;
const mysqlRead = new database(config.read_mysql);

const URL = process.env.NEWTON_MONGO_URL;
const DAYS = [7,5]; // IN DAYS
const EXPIRY = 2; // IN DAYS

async function getReminders(days){
    const sql = `select a.student_id, b.name, a.end_date,a.new_package_id,b.assortment_id,b.emi_amount from (SELECT * from classzoo1.student_package_subscription sps where end_date <=DATE_ADD(CURRENT_DATE, INTERVAL ${days} DAY)and end_date>DATE_ADD(CURRENT_DATE, INTERVAL ${days-1} DAY) and new_package_id in (select id from classzoo1.package where type like 'emi' and is_last=0)) as a JOIN (select id, name, assortment_id,emi_amount from classzoo1.package) as b on a.new_package_id=b.id`;
    // console.log(sql)
    return mysqlRead.query(sql)
}

async function connectToMongo() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(URL, { useUnifiedTopology: true }, { useNewUrlParser: true }, async function (err, client) {
            console.log(err)
            if (err) process.exit()
            console.log("connected mongo notif");
            return resolve(client.db('doubtnut'))
        });
    });
}

function parseDate(date){
    return new Date(date).toLocaleDateString(undefined, {timeZone: 'Asia/Kolkata'});
}

async function addtoNotifs(reminder,mongo, count){
    const type = "SILENT_PAYMENT";
    const title = "EMI due date";
    const deeplink = `doubtnutapp://vip?assortment_id=${reminder.assortment_id}`
    const expireAt = new Date();
    const createdAt = new Date();
    expireAt.setDate(expireAt.getDate() + EXPIRY);
    const studentId = [reminder.student_id]
    const message = `Hi, ${reminder.name.split('EMI')[0]} course ke liye Rs ${reminder.emi_amount} ki EMI, ${parseDate(reminder.end_date)} ko due hai. Doubtnut app pe payment kijiye live classes ka lagataar laabh uthaane ke liye.`;
    const newReminder = await mongo.collection('pinned_notifs').insertOne({
        type,
        createdAt,
        expireAt,
        studentId,
        data: {
            title,
            message,
            event:"payment_due_reminder",
            deeplink
        }
    })
    console.log(count+1, newReminder.insertedCount ? `Inserted for ${reminder.student_id}` : `Something Went Wrong for ${reminder.student_id} `)
}

async function main(){
    let mongo = await connectToMongo();
    
    for(let j=0;j<DAYS.length;j++){
        console.log("NOTIFS For DAY:",DAYS[j])
        let reminders = await getReminders(DAYS[j]);
        for(let i=0;i<reminders.length;i++){
            // console.log(reminders[i]);
            let temp = await addtoNotifs(reminders[i],mongo,i);
            // addtoNotifs(reminders[i])
        }
    }
    
    mysqlRead.connection.end();
    process.exit()
}


main()