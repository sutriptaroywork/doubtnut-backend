
'use strict';
var request = require('request');
const Students = require('../../api_server/modules/student')
module.exports = class ClevertapUpdateProfileService {
    constructor(config) {
        this.config=config
    }

    async run(message, db) {
        try {
            // console.log("inside")
            console.log(message.student_id)
          
            Students.getClevertapIdByStudentId(message.student_id, db.mysql.read).then((data) => {
            if (data.length > 0) {
                console.log(data[0].clevertap_id); 
                if(typeof data[0].clevertap_id !== 'undefined' && data[0].clevertap_id !== null){
                    var headers = {
                        'X-CleverTap-Account-Id': this.config.clevertap_account_id,
                        'X-CleverTap-Passcode': this.config.clevertap_passcode,
                        'Content-Type': 'application/json'
                    };
                    var dataString = '{"d":[{"objectId":"'+data[0].clevertap_id+'","type":"profile","profileData":{"latest_question": "'+message.question_id+'"}}]}';
                    var options = {
                        url: 'https://api.clevertap.com/1/upload',
                        method: 'POST',
                        headers: headers,
                        body: dataString
                    };
                    request(options, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log(body);
                        }
                    });


                }
               
           
            }
            }).catch(error => {
                console.log(error);
            })
            
        }
        catch (e) {
            console.log(e)
        }
    }
}



