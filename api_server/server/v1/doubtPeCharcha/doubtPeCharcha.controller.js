const _ = require('lodash');
const DoubtPeCharchaHelper = require('../../helpers/doubtPeCharcha');
const logger = require('../../../config/winston').winstonLogger;
const Question = require('../../../modules/mysql/question');
const QuizHelper = require('../quiz_notifications/quiz_helper');
const UtilityFlagr = require('../../../modules/Utility.flagr');

async function connect(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.connect();
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
        logger.error({ tag: 'p2p', source: 'connect', error: errorLog });
        next(e);
    }
}

async function listMembers(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.listMembers();
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
        logger.error({ tag: 'p2p', source: 'listMembers', error: errorLog });
        next(e);
    }
}

async function feedback(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.feedback();
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
        logger.error({ tag: 'p2p', source: 'listMembers', error: errorLog });
        next(e);
    }
}

async function addMember(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.addMember();
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
        logger.error({ tag: 'p2p', source: 'addMember', error: errorLog });
        next(e);
    }
}

async function deactivate(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.deactivate();
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
        logger.error({ tag: 'p2p', source: 'addMember', error: errorLog });
        next(e);
    }
}

async function getQuestionThumbnail(req, res, next) {
    try {
        const db = req.app.get('db');
        const { question_id: questionId } = req.params;
        let data;

        let thumbnailData = await Question.getThumbnailByIds(db.mysql.read, questionId);
        if (thumbnailData[0].EXIST === 0) {
            thumbnailData = await Question.getThumbnailFromQuestionsNew(db.mysql.read, questionId);
        }

        if (thumbnailData[0].EXIST === 1) {
            data = {
                question_id: questionId,
                thumbnail_image: QuizHelper.getThumbnailOfQuestion(questionId, 'webp'),
                is_active: true,
            };
        } else {
            data = {
                question_id: questionId,
                thumbnail_image: null,
                is_active: false,
            };
        }

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
        logger.error({ tag: 'p2p', source: 'getQuestionThumbnail', error: errorLog });
        next(e);
    }
}

async function doubtTypes(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.doubtTypes();
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
        logger.error({ tag: 'p2p', source: 'addMember', error: errorLog });
        next(e);
    }
}

async function doubts(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.doubts();
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
        logger.error({ tag: 'p2p', source: 'addMember', error: errorLog });
        next(e);
    }
}

async function helperData(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.helperData();
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
        logger.error({ tag: 'p2p', source: 'addMember', error: errorLog });
        next(e);
    }
}

async function similarSolvedDoubts(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
        const data = await p2pObj.similarSolvedDoubts();
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
        logger.error({ tag: 'p2p', source: 'similarSolvedDoubts', error: errorLog });
        next(e);
    }
}

async function isP2PFlagrEnabled(studentId, xAuthToken) {
    try {
        const flagData = { xAuthToken, body: { capabilities: { match_page_back_press_v2: {} } } };
        const flagrResp = await UtilityFlagr.getFlagrResp(flagData);
        const p2pActiveVariants = [2, 3];
        return !!(flagrResp && flagrResp.match_page_back_press_v2 && flagrResp.match_page_back_press_v2.payload.enabled && p2pActiveVariants.includes(flagrResp.match_page_back_press_v2.payload.variantNumber));
    } catch (e) {
        console.log(e);
        return false;
    }
}

module.exports = {
    connect,
    listMembers,
    feedback,
    addMember,
    deactivate,
    getQuestionThumbnail,
    doubtTypes,
    doubts,
    helperData,
    similarSolvedDoubts,
    isP2PFlagrEnabled,
};
