const _ = require('lodash');
const moment = require('moment');
const StudyTimerHelper = require('../../helpers/studyTimer.helper');
const logger = require('../../../config/winston').winstonLogger;
const flagrUtility = require('../../../modules/Utility.flagr');

async function home(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyTimerObj = new StudyTimerHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyTimerObj.home();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studyTimer', source: 'home', error: errorLog });
        next(e);
    }
}

async function result(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyTimerObj = new StudyTimerHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyTimerObj.result();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studyTimer', source: 'result', error: errorLog });
        next(e);
    }
}

async function stats(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyTimerObj = new StudyTimerHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyTimerObj.stats();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studyTimer', source: 'stats', error: errorLog });
        next(e);
    }
}

module.exports = {
    home,
    result,
    stats,
};
