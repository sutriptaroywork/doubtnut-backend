const Token = require('../modules/tokenAuth');

let db;
// let client;
// const utility = require('../modules/utility');

// const attempt_limit = 100;
// const banned_ips = [];
// const isuser = true;
// const limitflag = false;

function userAuthByToken(req, res, next) {
    const token_auth = req.headers['x-auth-token'];
    if (token_auth) {
        db = req.app.get('db');
        const tokenInstance = new Token(db);
        tokenInstance.tokenVerification(token_auth).then((values) => {
            console.log('values');
            console.log(values);
            if (values) {
                console.log(`student id =${values}`);
                req.user = {};
                req.user.id = values;
                next();
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Access denied',
                    },
                    error: 'Invalid token',
                };
                res.status(responseData.meta.code).json(responseData);
                // next();
            }
        }, (error) => {
            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "Error with tokenVerification"
            //   },
            //   "error": error
            // }
            // res.status(responseData.meta.code).json(responseData)
            next(error);
        });
    } else {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'No x-auth-token header',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    // next()
    }
}

// function checkAccessToken(req, res, next) {
//     db = req.app.get('db');
//     client = db.redis;
//     const ip = utility.getClientIp(req).split(':');
//     const current_ip = ip[3];
//     console.log(current_ip);
//     const token_auth = req.headers['x-auth-token'];
//     const self = res;
//     client.hgetAsync('doubtnut_user', token_auth).then((response) => response).then((response) => {
//         if (response == null) {
//             isuser = false;
//             return client.zrangeAsync('doubtnut_banned_ips', 0, -1);
//         }

//         isuser = true;
//         return new Promise((resolve) => {
//             resolve('validated');
//         });
//     }).then((response) => {
//         if (response == 'validated') {
//             return new Promise((resolve) => {
//                 resolve('validated');
//             });
//         }

//         if (isuser == true) {
//             console.log(res);
//             return next();
//         }
//         if (isuser == false) {
//             banned_ips = res;
//             if (banned_ips.includes(current_ip) == true) {
//                 return new Promise((resolve) => {
//                     resolve('banned');
//                 });
//             }

//             return client.hgetAsync('doubtnut_incorrect_attempts', current_ip);
//         }
//     })
//         .then((response) => {
//             if (response == 'validated') {
//                 return new Promise((resolve) => {
//                     resolve('validated');
//                 });
//             }
//             if (response == 'pass') {
//                 return new Promise((resolve) => {
//                     resolve('pass');
//                 });
//             }

//             let attempts = response;
//             if (attempts == null) {
//                 limitflag = false;
//                 attempts = 1;
//                 return client.hsetAsync('doubtnut_incorrect_attempts', current_ip, attempts);
//             }

//             if (attempts < attempt_limit) {
//                 limitflag = false;
//                 attempts = parseInt(attempts);
//                 attempts += 1;
//                 return client.hsetAsync('doubtnut_incorrect_attempts', current_ip, attempts);
//             }
//         })
//         .then((response) => {
//             if (response == 'validated') {
//                 return new Promise((resolve) => {
//                     resolve('validated');
//                 });
//             }

//             if (response == 'banned') {
//                 return new Promise((resolve) => {
//                     resolve('banned');
//                 });
//             }

//             let attempts = response;
//             if (attempts == null) {
//                 limitflag = false;
//                 attempts = 1;
//                 return client.hsetAsync('doubtnut_incorrect_attempts', current_ip, attempts);
//             }

//             if (attempts < attempt_limit) {
//                 limitflag = false;
//                 attempts = parseInt(attempts);
//                 attempts += 1;
//                 return client.hsetAsync('doubtnut_incorrect_attempts', current_ip, attempts);
//             }
//             if (attempts == attempt_limit) {
//                 limitflag = true;
//                 const d = new Date();
//                 const value = d.getTime();
//                 return client.zaddAsync('doubtnut_banned_ips', parseInt(value), current_ip);
//             }
//         })
//         .then((response) => {
//             if (response == 'validated') return next();

//             if (response == 'banned') {
//                 const responseData = {
//                     meta: {
//                         code: 403,
//                         success: false,
//                         message: 'Your ip is already banned!',
//                     },
//                 };
//                 return self.status(responseData.meta.code).json(responseData);
//             }

//             if (limitflag == true) {
//                 const responseData = {
//                     meta: {
//                         code: 403,
//                         success: false,
//                         message: 'Access denied',
//                     },
//                     error: 'Your ip is banned from now!',
//                 };
//                 return self.status(responseData.meta.code).json(responseData);
//             }

//             return next();
//         })
//         .catch((err) => {
//             const responseData = {
//                 meta: {
//                     code: 403,
//                     success: false,
//                     message: 'Access denied',
//                 },
//                 error: err,
//             };
//             console.log(err);
//             return self.status(responseData.meta.code).json(responseData);
//         });
// }
module.exports = {
    userAuthByToken,
    // checkAccessToken: checkAccessToken
};
