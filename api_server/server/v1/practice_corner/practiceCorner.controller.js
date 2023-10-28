const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const PracticeCornerManager = require('../../helpers/practiceCorner.helper');

async function home(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.home();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'home', error: errorLog });
        next(e);
    }
}
async function topics(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.topics();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'topics', error: errorLog });
        next(e);
    }
}
async function rules(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.rules();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'rules', error: errorLog });
        next(e);
    }
}
async function questions(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.questions();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'questions', error: errorLog });
        next(e);
    }
}
async function submit(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.submit();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'submit', error: errorLog });
        next(e);
    }
}
async function stats(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.stats();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'stats', error: errorLog });
        next(e);
    }
}
async function history(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.history();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'history', error: errorLog });
        next(e);
    }
}

async function subjectTabs(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.subjectTabs();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'subjectTabs', error: errorLog });
        next(e);
    }
}
async function previousResult(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.previousResult();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'previousResult', error: errorLog });
        next(e);
    }
}

async function submitStats(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.submitStats();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'submitStats', error: errorLog });
        next(e);
    }
}

async function fullLengthTestHistory(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.fullLengthTestHistory();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'fullLengthTestHistory', error: errorLog });
        next(e);
    }
}

module.exports = {
    home,
    topics,
    rules,
    questions,
    submit,
    stats,
    history,
    subjectTabs,
    previousResult,
    submitStats,
    fullLengthTestHistory,
};
