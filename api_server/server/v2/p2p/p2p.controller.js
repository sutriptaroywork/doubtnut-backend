const _ = require('lodash');
const DoubtPeCharchaHelper = require('../../helpers/doubtPeCharcha');
const logger = require('../../../config/winston').winstonLogger;

async function home(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const studentClass = req.user.student_class || 12;
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.home();
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
        logger.error({ tag: 'p2p-v3', source: 'home', error: errorLog });
        next(e);
    }
}

async function doubts(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const studentClass = req.user.student_class || 12;
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.doubtsV2();
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
        logger.error({ tag: 'p2p-v3', source: 'home', error: errorLog });
        next(e);
    }
}

async function whatsappInitiated(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const studentClass = req.user.student_class || 12;
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.whatsappInitiated();
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
        logger.error({ tag: 'p2p-v3', source: 'home', error: errorLog });
        next(e);
    }
}

async function feedbackData(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const studentClass = req.user.student_class || 12;
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.getFeedbackData();
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
        logger.error({ tag: 'p2p-v3', source: 'home', error: errorLog });
        next(e);
    }
}

async function markSolved(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const studentClass = req.user.student_class || 12;
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.markSolved();
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
        logger.error({ tag: 'p2p-v3', source: 'markSolved', error: errorLog });
        next(e);
    }
}

module.exports = {
    home,
    doubts,
    whatsappInitiated,
    markSolved,
    feedbackData,
};
