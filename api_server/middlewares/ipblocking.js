const ExpressBrute = require('express-brute');
const RedisStore = require('express-brute-redis');
const moment = require('moment');
const config = require('../config/config');

let store;

if (config.env == 'development') {
    store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
} else {
    // stores state with memcached
    store = new RedisStore({
        host: config.redis.host,
        port: config.redis.port,
    });
}
const handleStoreError = function (error) {
    // console.log('Error=');
    // console.log(error); // log this error so we can figure out what went wrong
    // cause node to exit, hopefully restarting the process fixes the problem
    throw new Error({
        message: error,
    });
};
const failCallback = function (req, res, next, nextValidRequestDate, error) {
    const responseData = {
        meta: {
            code: 403,
            success: false,
            message: 'Access denied',
        },
        error: `You have made too many failed attempts in a short period of time, please try again${moment(nextValidRequestDate).fromNow()}`,
    };
    res.status(responseData.meta.code).json(responseData);
    // res.flash('error', "You've made too many failed attempts in a short period of time, please try again "+moment(nextValidRequestDate).fromNow());
    // res.redirect('/'); // brute force protection triggered, send them back to the login page
    if (error) handleStoreError(error);
};

// Start slowing requests after 5 failed attempts to do something for the same user
const userBruteforce = new ExpressBrute(store, {
    freeRetries: 50,
    minWait: 1 * 60 * 1000, // 1 minutes
    maxWait: 1 * 60 * 1000, // 1/60 hour,
    failCallback,
    handleStoreError,
});
// No more than 1000 login attempts per day per IP
const globalBruteforce = new ExpressBrute(store, {
    freeRetries: 1000,
    attachResetToRequest: false,
    refreshTimeoutOnRequest: false,
    minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    lifetime: 24 * 60 * 60, // 1 day (seconds not milliseconds)
    failCallback,
    handleStoreError,
});

function requestHandler(req, res, next) {
    // const self = res;
    const ip_address = req.ip.split(':')[3];
    console.log(`Ip Address${ip_address}`);
    req.app.get('db').redis.zrangeAsync('doubtnut_banned_ips', 0, -1).then((result) => {
        console.log(result);
        if (result != null && result.includes(ip_address) == true) {
            console.log('user is already banned');
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Access denied',
                },
                error: 'Your ip is banned.',
            };
            res.status(responseData.meta.code).json(responseData);
            return new Promise((resolve) => {
                resolve('pass');
            });
        }
        console.log('user is not banned');
        return next();
    }).catch((err) => {
        console.log('catch error');
        console.log(err);
    });
}

module.exports = { globalBruteforce, userBruteforce, requestHandler };
