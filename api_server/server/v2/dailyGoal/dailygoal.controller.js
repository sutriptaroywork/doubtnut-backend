const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const DailyGoalManager = require('../../helpers/dailygoal.helper');
const dailyGoalData = require('../../../data/dailygoal.data');

async function getRewards(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const rewards = await dailyGoalObj.getRewards();
        let responseData;
        if (rewards) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: rewards,
            };
        } else {
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Error',
                },
            };
        }
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'dailyGoalController', source: 'getRewards', error: errorLog });
        next(e);
    }
}

async function markStreak(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const message = await dailyGoalObj.markDailyGoalComplete();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: message.message,
            },
            data: message.data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'dailyGoalController', source: 'markStreak', error: errorLog });
        next(e);
    }
}

async function scratchCard(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const message = await dailyGoalObj.scratchCard();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: message.message,
            },
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'dailyGoalController', source: 'scratchCard', error: errorLog });
        next(e);
    }
}

async function leaderboardTabs(request, response, next) {
    try {
        const locale = request.user.locale || 'en';
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                title: locale === 'hi' ? dailyGoalData.leaderboard.title.hi : dailyGoalData.leaderboard.title.en,
                tabs: request.user.locale === 'hi' ? dailyGoalData.leaderboard.tabs.hi : dailyGoalData.leaderboard.tabs.en,
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
        logger.error({ tag: 'dailyGoalController', source: 'leaderboardTabs', error: errorLog });
        next(e);
    }
}

async function leaderboard(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const data = await dailyGoalObj.leaderboard();
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
        logger.error({ tag: 'dailyGoalController', source: 'leaderboard', error: errorLog });
        next(e);
    }
}

async function submitDoubtCompletion(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const data = await dailyGoalObj.submitDailyGoal();
        const responseData = {
            meta: {
                code: data.code,
                success: data.success,
                message: data.message,
            },
            data: data.data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'dailyGoalController', source: 'submitDoubtCompletion', error: errorLog });
        next(e);
    }
}

async function getDoubtFeedDetails(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const data = await dailyGoalObj.getDoubtFeedDetails();
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
        logger.error({ tag: 'dailyGoalController', source: 'submitDoubtCompletion', error: errorLog });
        next(e);
    }
}
async function getPreviousDoubts(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const data = await dailyGoalObj.getPreviousDoubts();
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
        logger.error({ tag: 'dailyGoalController', source: 'submitDoubtCompletion', error: errorLog });
        next(e);
    }
}

async function submitPreviousDoubtCompletion(request, response, next) {
    try {
        const dailyGoalObj = new DailyGoalManager(request);
        const data = await dailyGoalObj.submitPreviousTask();
        const responseData = {
            meta: {
                code: data.code,
                success: data.success,
                message: data.message,
            },
            data: data.data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'dailyGoalController', source: 'submitPreviousDoubtCompletion', error: errorLog });
        next(e);
    }
}

module.exports = {
    getRewards,
    markStreak,
    scratchCard,
    leaderboardTabs,
    leaderboard,
    submitDoubtCompletion,
    getDoubtFeedDetails,
    getPreviousDoubts,
    submitPreviousDoubtCompletion,
};
