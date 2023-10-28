const admin = require('firebase-admin');
const mysql = require('mysql');
if (typeof client_read === 'undefined') {
  var client_read = mysql.createConnection({ host: process.env.MYSQL_HOST_READ, user: process.env.MYSQL_USER_READ, password: process.env.MYSQL_PASS_READ, database: process.env.MYSQL_DB});
  client_read.connect();
}

admin.initializeApp({
  credential: admin.credential.cert('./firebase.json'),
  databaseURL: 'https://doubtnut-e000a.firebaseio.com'
});
module.exports.handler = async (event, context) => {
    try {
        for (message of event.Records) {
            let data = JSON.parse(message.body)
            let fcm_id = ""
            if (!data.fcm_id) {
                let user_id = data.user_id
                let user_data = getUserData(client_read,data.user_id)
                data.fcm_id = user_data[0].gcm_reg_id
            }
            if (data.fcm_id) {
                let messageTosend = {};
                messageTosend["android"] = {
                  priority: "normal",
                  ttl: 4500
                };

                messageTosend["token"]= data.fcm_id;
                messageTosend['data'] = data.notification
                await sendNotification(messageTosend)
            }

        }
    } catch (e) {

    } finally {
        return 1
    }
}
function sendNotification(message){
  return new Promise((resolve,reject) => {
  console.log(message)
  if (!_.isNull(message["token"])) {
    admin.messaging().send(message)
      .then((response) => {
        resolve(response)
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        resolve(error)
        console.log('Error sending message:', error);
      });
  }else{
    resolve("")
  }

  })

}
function getUserData(mysql,user_id){
    user_id = parseInt(user_id)
    return new Promise((resolve,reject) => {
        let sql = 'SELECT * FROM `students` WHERE student_id = ?'
        mysql.query(sql,[user_id],function(err,result){
            resolve(result)
        })
    })
}
