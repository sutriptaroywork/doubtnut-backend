const _ = require('lodash');
const config = require('../../config/config');
const PackageContainer = require('../../modules/containers/package');
const trialMysql = require('../../modules/mysql/trail');
const newtonNotifications = require('../../modules/newtonNotifications');
const packageMysql = require('../../modules/mysql/package');

async function giveTrial(req, res, next) {
    const { student_id: sid} = req.user;
    // const config = req.app.get('config');
    const db = req.app.get('db');
    const {
        type, id,
    } = req.query;
    const studentPackages = await packageMysql.getAllStudentPackage(db.mysql.read, sid);
    // const studentPackages = [];
    if (!studentPackages.length) {
        if (id) {
            await PackageContainer.createSubscriptionEntryForTrialV1(db, sid, id, -1, 3, 'TRIAL_FLOW');
        }
    } else {
        return next({
            data: {
                deeplink: 'doubtnutapp://library_course',
            },
        });
    }
    return next({
        data: {
            deeplink: `doubtnutapp://course_details?id=${id}`,
        },
    });
}

module.exports = {
    giveTrial,
};
