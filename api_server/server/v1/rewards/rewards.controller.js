const _ = require('lodash');
const RewardsManager = require('../../helpers/rewards');
const logger = require('../../../config/winston').winstonLogger;
const constants = require('../../../data/rewards.data');

async function getRewards(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        console.log(studentId, locale, studentClass);
        const rewardObj = new RewardsManager(req, studentClass, studentId, locale, db, config, db.mongo);
        const rewards = await rewardObj.main();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: rewards,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'rewards', source: 'getRewards', error: errorLog });
        next(e);
    }
}

async function markAttendance(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        console.log(studentId, locale, studentClass);
        const rewardObj = new RewardsManager(req, studentClass, studentId, locale, db, config, db.mongo);
        const message = await rewardObj.markAttendance();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: message.message,
            },
            data: message.data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'rewards', source: 'markAttendance', error: errorLog });
        next(e);
    }
}

async function scratchCard(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        console.log(studentId, locale, studentClass);
        const rewardObj = new RewardsManager(req, studentClass, studentId, locale, db, config, db.mongo);
        const message = await rewardObj.scratchCard();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: message.message,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'rewards', source: 'scratchCard', error: errorLog });
        next(e);
    }
}

async function subscribe(req, resp, next) {
    const db = req.app.get('db');
    const { student_id: studentId } = req.user;
    const { locale } = req.user;
    const notificationSetToast = (locale === 'hi' ? constants.notificationSetHi : constants.notificationSetEn);
    const notificationUnsetToast = (locale === 'hi' ? constants.notificationUnsetHi : constants.notificationUnsetEn);
    await db.mongo.read.collection('student_rewards').updateOne({ studentId },
        { $set: { is_notification_opted: Boolean(req.body.is_subscribed) } },
        (err, res) => {
            if (err) {
                let errorLog = err;
                if (!_.isObject(errorLog)) {
                    errorLog = JSON.stringify(errorLog);
                }
                logger.error({ tag: 'rewards', source: 'subscribe', error: errorLog });
                next(err);
            }
            console.log(res);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: (req.body.is_subscribed === 1 ? notificationSetToast : notificationUnsetToast),
                },
            };
            return resp.status(responseData.meta.code).json(responseData);
        });
}

module.exports = {
    getRewards,
    markAttendance,
    scratchCard,
    subscribe,
};
