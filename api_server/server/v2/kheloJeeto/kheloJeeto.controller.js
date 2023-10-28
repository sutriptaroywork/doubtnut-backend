const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const KheloJeetoManager = require('../../helpers/khelo.jeeto.helper');
const kheloJeetoData = require('../../../data/khelo.jeeto.data');
const D0UserManager = require('../../helpers/d0User.helper');

async function home(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.home();
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
        logger.error({ tag: 'p2p', source: 'home', error: errorLog });
        next(e);
    }
}

async function levels(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.levels();
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
        logger.error({ tag: 'p2p', source: 'levels', error: errorLog });
        next(e);
    }
}

async function questions(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.questions();
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
        logger.error({ tag: 'p2p', source: 'questions', error: errorLog });
        next(e);
    }
}

async function getWidget(request, response, next) {
    try {
        let defaultFlow = true;
        let data = {
            widget: {
                title: null,
                subtitle: null,
                thumbnail: null,
                button_text: null,
                deeplink: null,
                is_available: false,
            },
        };
        if (request.headers.version_code >= 1010) {
            const d0UserManager = new D0UserManager(request);
            if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                defaultFlow = false;
            }
        }
        if (defaultFlow) {
            const kheloJeetoManager = new KheloJeetoManager(request);
            data = await kheloJeetoManager.getWidget();
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: data.message,
            },
            data: data.widget,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'p2p', source: 'getWidget', error: errorLog });
        next(e);
    }
}

async function leaderboardTabs(request, response, next) {
    try {
        const locale = request.user.local || 'en';
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                title: locale === 'hi' ? kheloJeetoData.leaderboard.title.hi : kheloJeetoData.leaderboard.title.en,
                tabs: request.user.locale === 'hi' ? kheloJeetoData.leaderboard.tabs.hi : kheloJeetoData.leaderboard.tabs.hien,
                active_tab: 1,
            },
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'kheloJeetoController', source: 'leaderboardTabs', error: errorLog });
        next(e);
    }
}

async function leaderboard(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.leaderboard();
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
        logger.error({ tag: 'kheloJeetoController', source: 'leaderboard', error: errorLog });
        next(e);
    }
}

async function friendsTabs(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.friendsTabs();
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
        logger.error({ tag: 'kheloJeetoController', source: 'friendsTabs', error: errorLog });
        next(e);
    }
}

async function friends(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.friends();
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
        logger.error({ tag: 'kheloJeetoController', source: 'friends', error: errorLog });
        next(e);
    }
}

async function invite(request, response, next) {
    try {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'kheloJeetoController', source: 'invite', error: errorLog });
        next(e);
    }
}

async function numberInvite(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.numberInvite();
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
        logger.error({ tag: 'kheloJeetoController', source: 'numberInvite', error: errorLog });
        next(e);
    }
}

async function topics(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.topics();
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
        logger.error({ tag: 'kheloJeetoController', source: 'topics', error: errorLog });
        next(e);
    }
}

async function acceptInvite(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.acceptInvite();
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
        logger.error({ tag: 'kheloJeetoController', source: 'acceptInvite', error: errorLog });
        next(e);
    }
}

async function result(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.result();
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
        logger.error({ tag: 'kheloJeetoController', source: 'result', error: errorLog });
        next(e);
    }
}

async function quizHistory(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.quizHistory();
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
        logger.error({ tag: 'kheloJeetoController', source: 'quizHistory', error: errorLog });
        next(e);
    }
}

async function previousResult(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.previousResult();
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
        logger.error({ tag: 'kheloJeetoController', source: 'previousResult', error: errorLog });
        next(e);
    }
}

async function generateGameId(request, response, next) {
    try {
        const kheloJeetoManager = new KheloJeetoManager(request);
        const data = await kheloJeetoManager.generateGameId();
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
        logger.error({ tag: 'kheloJeetoController', source: 'generateGameId', error: errorLog });
        next(e);
    }
}

module.exports = {
    home,
    levels,
    questions,
    getWidget,
    leaderboardTabs,
    leaderboard,
    friendsTabs,
    friends,
    invite,
    topics,
    numberInvite,
    acceptInvite,
    result,
    quizHistory,
    previousResult,
    generateGameId,
};
