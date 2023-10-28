/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 18:11:23
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-05-12T13:16:22+05:30
*/

// const Comment = require('../../../modules/class')
const assert = require('assert');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fs = require('fs');
const Utility = require('../../../modules/utility');
const Notification = require('../../../modules/notifications');
const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const CommentContainer = require('../../../modules/containers/comment');
const RedisCommentContainer = require('../../../modules/redis/comment');
const StudentContainer = require('../../../modules/containers/student');
const BannedUser = require('../../../modules/mysql/banneduser');
const redisFeed = require('../../../modules/redis/feed');
require('../../../modules/mongo/comment');

bluebird.promisifyAll(mongoose);
// const profanity = require("profanity-hindi");
const profanity = require('../../helpers/profanity-hindi');

const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');
const dataFile = require('../../../data/data');

let db;

async function add(req, res, next) {
    try {
        const config = req.app.get('config');
        const publicPath = req.app.get('publicPath');
        // let blobService = req.app.get('blobService')
        const { student_id } = req.user;
        const s3 = req.app.get('s3');
        db = req.app.get('db');
        req.body.student_id = req.user.student_id;
        req.body.student_username = req.user.student_username;
        req.body.student_avatar = req.user.img_url;

        let isDirty = 0;
        if (typeof req.body.message !== 'undefined' && req.body.message !== '') {
            isDirty = profanity.isMessageDirty(req.body.message);
        }

        const checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, student_id);
        if (checkbanned.length > 0) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: {
                    message: 'YOUR ROADS END HERE',
                },
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const hex = /[0-9A-Fa-f]{6}/g;
            req.body.parent_id = (hex.test(req.body.parent_id)) ? mongoose.Types.ObjectId(req.body.parent_id) : req.body.parent_id;
            if (typeof req.body.image !== 'undefined' && req.body.image !== '') {
                req.body.image = await Utility.uploadImageToS3(req.body.image, student_id, config.cdn_url, publicPath, fs, s3, config.aws_bucket);
            }
            const question_id = Utility.findPatternInCommentMessage(req.body.message);
            if (question_id) {
                req.body.question_id = question_id;
                req.body.message = 'Click below to view its solution';
                // get thumbnail image of question
                let question = await AnswerContainer.getByQuestionId(question_id, db);
                if (question.length > 0) {
                    question = question[0];
                    req.body.image = (question.matched_question == null) ? (`${config.blob_url}q-thumbnail/${question.question_id}.png`) : (`${config.blob_url}q-thumbnail/${question.matched_question}.png`);
                }
            }
            if (isDirty) {
                req.body.is_deleted = true;
                req.body.is_moderated = true;
                req.body.moderated_by = { student_username: 'Xesloohc' };
            }

            req.body.original_message = req.body.message;
            req.body.message = Utility.commentLengthCheck(req.body.message, dataFile.commentLength);

            const comment = new Comment(req.body);
            const result = await comment.save();
            if (req.body.image) {
                const imagepath = req.body.image.split('/');
                Utility.deleteImage(`${publicPath}/uploads/${imagepath[imagepath.length - 1]}`, fs);
            }

            if (result) {
                // add/update top comment and comment count cache in redis

                await CommentContainer.updateCommentCount(req.body.entity_type, req.body.entity_id, Comment, db);
                await RedisCommentContainer.updateTopComment(req.body.entity_type, req.body.entity_id, result, db.redis.write);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS!',
                    },
                    data: result,
                };
                /*
      Activity Stream Entry
      */
                db.redis.read.publish('activitystream_service', JSON.stringify({
                    actor_id: req.user.student_id,
                    actor_type: 'USER',
                    actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                    verb: 'POST',
                    object: result,
                    object_id: result._id,
                    object_type: 'COMMENT',
                    target_id: req.body.entity_id,
                    target_type: req.body.entity_type,
                    target: '',
                }));
                res.status(responseData.meta.code).json(responseData);
                // send comment to all users of same entity
                // get all student ids of entity type and id
                if ((typeof req.body.entity_type !== 'undefined') && (typeof req.body.entity_id !== 'undefined')) {
                    Notification.commentEntityNotification(req.user.gcm_reg_id, req.body.entity_type, req.body.entity_id, req.user.student_username, null, db);
                    if (req.body.entity_type === 'ugc') {
                        // get post details
                        const query = { _id: req.body.entity_id };
                        // //console.log(query)
                        const result = await Post.find(query);
                        // //console.log(result)
                        if (result[0].student_id !== student_id) {
                            // console.log('send notification')
                            const event = 'feed_details';
                            const title = `${req.user.student_username} commented on your post.`;
                            const data = { id: req.body.entity_id, type: req.body.entity_type };
                            const message = 'Check now!!';
                            Notification.sendNotification(result[0].student_id, event, title, message, null, data, null, db);
                        }
                        return res.send(result);
                    }
                    if (req.body.entity_type === 'unanswered') {
                        // console.log("unanswered")
                        // get student id from question id
                        const question = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, req.body.entity_id);
                        const st_id = question[0].student_id;
                        // //console.log("st_id")
                        // //console.log(st_id)
                        if (student_id != st_id) {
                            // //console.log("test")
                            const student = await StudentContainer.getById(st_id, db);
                            // //console.log("student[0]['student_username']")
                            // //console.log(req.user.student_username)
                            Notification.commentEntityOwnerNotification(st_id, student[0].gcm_reg_id, req.body.entity_type, req.body.entity_id, req.user.student_username, null, db);
                        }
                    }
                }
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Error in saving!',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error!"
    //   },
    //   "data": null,
    //   "error": e
    // };
    // res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = { add };
