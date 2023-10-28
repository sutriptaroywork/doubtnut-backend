const _ = require('lodash');
const Utility = require('../modules/utility');
const StaticData = require('../data/data');
const QuestionContainer = require('../modules/containers/question');

function isVersionCompatibleToPass(version_code, country) {
    if (Utility.isUsRegion(country)) {
        if (version_code >= 1) {
            return true;
        }
        return false;
    }
    if (version_code >= 604) {
        return true;
    }
    return false;
}

function headerMiddleware(req, res, next) {
    if (req.method === 'OPTIONS') {
        console.log('!OPTIONS');
        const headers = {};
        // IE8 does not allow domains to be specified, just the *
        // headers["Access-Control-Allow-Origin"] = req.headers.origin;
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, DELETE, OPTIONS';
        headers['Access-Control-Allow-Credentials'] = false;
        headers['Access-Control-Max-Age'] = '86400'; // 24 hours
        headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept,x-auth-token';
        res.writeHead(200, headers);
        res.end();
    }
    console.log(req.headers, isVersionCompatibleToPass(parseInt(req.header('version_code')), req.header('country')));
    if (typeof req.header('x-auth-token') !== 'undefined') {
        if (!_.isNull(req.header('x-auth-token')) && !_.isEmpty(req.header('x-auth-token'))) {
            if (!_.isNull(req.header('user-agent')) && !_.isEmpty(req.header('user-agent')) && Utility.isRequestFromApp(req.header('user-agent'))) {
                if (!_.isEmpty(req.header('version_code')) && isVersionCompatibleToPass(parseInt(req.header('version_code')), req.header('country'))) {
                    const token = req.header('x-auth-token');
                    req.headers.authorization = `bearer ${token}`;
                    next();
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Forbidden',
                        },
                        error: 'Invalid token - Old App User',
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
            } else {
                const token = req.header('x-auth-token');
                req.headers.authorization = `bearer ${token}`;
                next();
            }
        } else {
            next();
        }
    } else {
        next();
    }
}

async function blockQASpamming(req, res, next) {
    try {
        if (typeof req.user.student_id !== 'undefined') {
            const studentId = req.user.student_id;
            if (StaticData.whitelisted_student_ids_QA.includes(studentId)) {
                next();
            } else {
                const db = req.app.get('db');
                const dailyCount = await QuestionContainer.getDailyCountQuesAsk(db.redis.read, studentId);
                QuestionContainer.incDailyCountQuesAsk(db.redis.write, studentId);
                if (Utility.isDailyLimitExceeded(req, dailyCount)) {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Forbidden',
                        },
                        error: 'Daily count exceeded',
                    };
                    res.status(responseData.meta.code).json(responseData);
                } else {
                    next();
                }
            }
        } else {
            const responseData = {
                meta: {
                    code: 401,
                    success: false,
                    message: 'Unauthorized',
                },
                error: 'Student id not present',
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next();
    }
}

module.exports = {
    headerMiddleware,
    blockQASpamming,
};
