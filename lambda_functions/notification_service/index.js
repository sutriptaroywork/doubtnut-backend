// var aws = require('aws-sdk');
const mysql = require('mysql');
const Bounty = require('./getData')
// if (typeof client_read === 'undefined') {
//   var db = mysql.createConnection({ host: process.env.MYSQL_HOST_READ, user: process.env.MYSQL_USER_READ, password: process.env.MYSQL_PASS_READ, database: process.env.MYSQL_DB});
//   client_read.connect();
// }


if (typeof db === 'undefined') {
    var db = mysql.createConnection({ 
        host: 'test-db-latest.cpymfjcydr4n.ap-south-1.rds.amazonaws.com',
        user: 'dn-prod',
        password: 'D0ubtnut@2143',
        database: 'classzoo1'
    });
    db.connect();
  }


// var lambda = new aws.Lambda({
//     region: 'ap-south-1'
//   });
exports.handler = async (event) => {

    try{
        let studentDetails;
        if(!event.Records.length){
            return;
        }
        if(event.Records[0].body.type == 'got-answer'){
            studentDetails = await Bounty.getStudentWhoAnswered(db, event.Records[0].body.bounty_id);
            console.log('got answer to the solution', studentDetails)
            //triger fcm-lambda
        }
        else if(event.Records[0].body.type == 'answer-accepted'){
            studentDetails = await Bounty.getAcceptedAnswerStudent(db, event.Records[0].body.answer_id)
            console.log('answer is accepted', studentDetails)
            // trigger fcm-lambda
        }
        else if(event.Records[0].body.type == 'more-than-5-likes'){
            studentDetails = {
                student_id: event.Records[0].body.student_id,
                answer_id: event.Records[0].body.answer_id,
                bounty_id: event.Records[0].body.bounty_id,
            }
            // studentDetails = await getStudentWhoGotLikes(db, event.Records[0].body.likeCounter);
            console.log('got likes', studentDetails)
            // trigger fcm-lambda
        }

        // lambda.invoke({
        //     FunctionName: '',
        //     Payload: JSON.stringify(event)
        // }, (err, data)=>{
        //     if(err) {
        //         context.done('error', err);
        //     }
        //     if(data.Payload) {
        //         context.succeed(data.Payload)
        //     }
        // })

    } catch (e) {
        console.log(e);
    }
};