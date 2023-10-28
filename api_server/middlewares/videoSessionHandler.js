const base64url = require('base64-url');
const _ = require('lodash');
const StudentRedis = require('../modules/redis/student');
const Data = require('../data/data');
const VideoBlockLogs = require('../modules/mongo/multipleDeviceVideoBlockLog');
const CourseMysql = require('../modules/mysql/coursev2');

const checkMultipleVideoUserSession = async (req, res, next) => {
    try {
        const { jws_token, id, source } = req.body;
        const db = req.app.get('db');
        if (!_.isEmpty(jws_token) && (_.isEmpty(source) || (!_.isEmpty(source) && source.toLowerCase() !== 'web'))) {
            const jws_parts = jws_token.split('.');
            const payload = jws_parts[1];
            const { student_id, student_class, locale } = req.user;
            const udid = base64url.decode(JSON.parse(base64url.decode(payload)).nonce).split(':')[0];
            const active_udids = await StudentRedis.getActiveDeviceIds(db.redis.read, student_id);
            const promises = [];
            if (!_.isNull(student_class)) {
                promises.push(CourseMysql.getAssortmentsByResourceReference(db.mysql.read, id, student_class));
            } else {
                promises.push(CourseMysql.getAssortmentsByResourceReference(db.mysql.read, id));
            }
            promises.push(CourseMysql.getDistinctClassWiseCoursesPurchasedByStudent(db.mysql.read, student_id));
            const resolvedPromises = await Promise.all(promises);
            const getCourseDetails = resolvedPromises[0];
            const devicesAvailableCounter = resolvedPromises[1][0].class_count > 1 ? resolvedPromises[1][0].class_count : 1;

            const isVideoPremium = !!(getCourseDetails && getCourseDetails.length > 0 && (getCourseDetails[0].is_free == 0 || _.isNull(getCourseDetails[0].is_free)));
            if (_.isNull(active_udids)) {
                // ACTUALLY THE ELSE IF CONDITION 1
                StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udid);
            } else if (!_.isNull(active_udids) && devicesAvailableCounter > 1 && [...new Set(active_udids.split('#'))].length < devicesAvailableCounter) {
                // CONDITION : - CASES WHERE SCREEN SHOULD BE FILLED FOR ALREADY LOGGED IN USERS
                const currentActiveDevices = [...new Set(active_udids.split('#'))];
                currentActiveDevices.push(udid);
                const udids = currentActiveDevices.join('#');
                StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
            } else if (!_.isNull(active_udids) && [...new Set(active_udids.split('#'))].length > devicesAvailableCounter) {
                // CONDITION : - CASE WHERE SCREEN COUNTER DECREASES AS COURSES WILL EXPIRE
                let currentActiveDevices = [...new Set(active_udids.split('#'))];
                currentActiveDevices.push(udid);
                currentActiveDevices = currentActiveDevices.slice(currentActiveDevices.length - devicesAvailableCounter);
                const udids = currentActiveDevices.join('#');
                StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
            } else if (!(active_udids.split('#').includes(udid)) && isVideoPremium) {
                const blockedUserLog = new VideoBlockLogs({
                    studentId: student_id,
                    questionId: req.body.id,
                    blockedUdid: udid,
                    activeUdid: active_udids,
                    page: req.body.page,
                    source: req.body.source,
                });
                blockedUserLog.save();
                req.headers.is_video_blocked = true;
                req.body.id = !_.isEmpty(locale) && locale == 'hi' ? Data.singleDeviceLoginAppConfig.infoVideoIds.hi : Data.singleDeviceLoginAppConfig.infoVideoIds.en;
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
};

module.exports = checkMultipleVideoUserSession;
