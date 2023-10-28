const staticData = require('../data/data');

function checkApiRoute(req, res, next) {
    try {
        const apiRoute = req.originalUrl ? req.originalUrl.split('?') : [];
        if (apiRoute.length && staticData.inapp_pop_up_end_point_mapping[apiRoute[0]] && req.query.page === '1' && req.query.source === 'home') {
            req.inapp_pop_up = { deeplink: staticData.inapp_pop_up_end_point_mapping[apiRoute[0]] };
        }
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = checkApiRoute;
