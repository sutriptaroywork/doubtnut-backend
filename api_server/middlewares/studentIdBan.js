// const _ = require('lodash');

function banStudent(req, res, next) {
    const bannedUserList = ['5060710'];
    const bannedToken = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTA2MDcxMCwiaWF0IjoxNTY3NDEzOTI3LCJleHAiOjE2MzA0ODU5Mjd9.ZqnQW2094GF9F_N3G3uPyd7vDFtzn7PjSCRLLydpXiA'];
    // console.log((bannedUserList.indexOf(req.body.student_id) !== -1))
    // console.log((bannedToken.indexOf(req.header('x-auth-token') !== -1)))
    if ((bannedUserList.indexOf(req.body.student_id) !== -1) || (bannedToken.indexOf(req.header('x-auth-token')) !== -1)) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'YOUR ROAD ENDS HERE!!  #BANNED',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
    next();

    // if (req.method === 'OPTIONS') {
    //   console.log('!OPTIONS');
    //   var headers = {};
    //   // IE8 does not allow domains to be specified, just the *
    //   // headers["Access-Control-Allow-Origin"] = req.headers.origin;
    //   headers["Access-Control-Allow-Origin"] = "*";
    //   headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    //   headers["Access-Control-Allow-Credentials"] = false;
    //   headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    //   headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept,x-auth-token";
    //   res.writeHead(200, headers);
    //   res.end();
    // }
    // if(typeof req.header('x-auth-token') !== 'undefined'){
    //   if(!_.isNull(req.header('x-auth-token')) && !_.isEmpty(req.header('x-auth-token'))){
    //     let token=req.header('x-auth-token');
    //     req.headers.authorization='bearer '+token;
    //     next();
    //   }else{
    //     let responseData = {
    //       "meta": {
    //         "code": 401,
    //         "success": false,
    //         "message": "Access denied"
    //       },
    //       "error": "Invalid token"
    //     }
    //     res.status(responseData.meta.code).json(responseData)
    //   }
    // }else {
    //   next()
    // }
}
module.exports = {
    banStudent,
};
