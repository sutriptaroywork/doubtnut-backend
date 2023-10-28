/*
* @Author: shubham-dn
* @Email: shubham.rohit@doubtnut.com
* @Date:   Mon Feb  7 13:59:51 IST 2022
* @Last Modified by:   shubham-dn
* @Last Modified time: Mon Feb  7 13:59:51 IST 2022
*/

const _ = require('lodash');
const moment = require('moment');
const StudentContainer = require('../../../modules/redis/student');

const UtilityFlagr = require('../../../modules/Utility.flagr');
const Data = require('../../../data/audioToolTip.data');

async function files(req, res, next) {
    try {
        const data = { app_session_count: 0, files: [], message: 'Successful' };
        const db = req.app.get('db');
        let signupTime = null;
        const studentDetails = await StudentContainer.getUserProfile(db.redis.write, req.user.student_id);
        if (studentDetails !== null) {
            signupTime = JSON.parse(studentDetails)[0].timestamp;
        }
        const currentDate = moment().add(5, 'hours').add(30, 'minutes');
        if (signupTime) {
            const hourDiff = currentDate.diff(moment(signupTime), 'hours');
            if (hourDiff <= 72) {
                const xAuthToken = req.headers['x-auth-token'];
                const flgrData = { xAuthToken, body: { capabilities: { audio_tooltip: {} } } };
                const flgrResp = await UtilityFlagr.getFlagrResp(flgrData);
                if (_.get(flgrResp, 'audio_tooltip.payload.enabled', null)) {
                    data.files = Data.audioFiles;
                    data.app_session_count = 3;
                } else {
                    data.message = 'flagr failed';
                }
            } else {
                data.message = 'Signup time is > 72 hours';
            }
        } else {
            data.message = 'Signup Time Unavailable';
        }
        next({ data });
    } catch (err) {
        next({ err });
    }
}

module.exports = {
    files,
};
