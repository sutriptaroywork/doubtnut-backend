/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-10 20:05:15
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-20T16:40:45+05:30
*/
const PostModel = require('../../../modules/mongo/post')
const CommentModel = require('../../../modules/mongo/comment')

const _ = require('lodash')
let db, config, client
const moment = require('moment')
let inProgress = false;
const profanity = require("../../helpers/profanity-hindi");
var sendgrid = require("sendgrid")("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")
var helper = require('sendgrid').mail
const { response } = require('express')

async function sendUnBanRequest(req, res, next) {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.params.studentid
    

    let check_existing_request = "SELECT created_at FROM unban_requests WHERE student_id= ?"
    let compute = await db.mysql.write.query(check_existing_request, [student_id])
    
    console.log('data ', compute[0],compute.length)
    let response_message;
    

    if(compute.length !==0)
    {
        //Existing request
        response_message="You have already submitted an UnBan Request"
    }
    else
    {
        let unban_request_sql = "INSERT INTO `unban_requests` (`student_id`, `review_status`, `unban_status`, `created_at`, `reviewer_name`) VALUES ('" + student_id + "','" + false + "', 'Banned'" + "," + 'current_date()' + ", null)";
        
        let optionInsert = await db.mysql.write.query(unban_request_sql) 
        response_message="UnBan Request Submitted"
    }

    let responseData = {
        "meta": {
            "code": 200,
            "success": true,
            "message": response_message
        },
    }
    res.status(responseData.meta.code).json(responseData);

}

async function getUnBanRequestStatus(req, res, next) {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.params.studentid

    let unban_status_sql = "SELECT review_status, unban_status FROM `unban_requests` WHERE student_id = ?"
    let check = await db.mysql.write.query(unban_status_sql, [student_id])
    let responseData

    if(check.length === 0 )
    {
        //The user is not banned
         responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "success"
            },
            "data" : {
                "Request Status" : "No Unban Request Found",
            }
        }    
    }
    else
    {
        let review_status="Request Reviewed"
        let unban_status=check[0].unban_status

        if(check[0].review_status=== 0)
        {
            review_status="Request under Review"
        }

        responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "success"
            },
            "data" : {
            "Request Status" : review_status,
            "Ban Status" : unban_status
            }
        }
    }
    
    res.status(responseData.meta.code).json(responseData);

}

async function reviewedUser(req, res) {
    const db = req.app.get('db');
    const StudentId = req.params.studentid;
    const { reviewedBy, Status } = req.query;
    
    let review_sql = `UPDATE unban_requests SET review_status=1, unban_status="${Status}", reviewer_name="${reviewedBy}" WHERE student_id="${StudentId}"`;
    let Update = await db.mysql.write.query(review_sql);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { Status: 'Reviewed', Reviewer : reviewedBy, BanStatus :  Status},
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function getUnBanRequests(req, res, next) {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.params.studentid
    let Date=req.query.Date;
    console.log('Date ' , Date);

    let page_number = 0;
        let page_size = 5;
        if (req.query.page) {
            page_number = parseInt(req.query.page)-1;
        }

    let unban_requests_sql = `SELECT * FROM unban_requests WHERE created_at=` + `'${Date}'` + ` LIMIT `+ page_number*page_size + `,`+ page_size + ``
    console.log('query ', unban_requests_sql)
    let fetch = await db.mysql.write.query(unban_requests_sql)

    let responseData = {
        "meta": {
            "code": 200,
            "success": true,
            "message": "success"
        },
        "data" : fetch
    }
    res.status(responseData.meta.code).json(responseData);

}

module.exports = { sendUnBanRequest , getUnBanRequestStatus, getUnBanRequests, reviewedUser}