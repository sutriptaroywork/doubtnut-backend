/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 18:11:23
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-20T17:24:01+05:30
*/

// const Comment = require('../../../modules/class')
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const fs = require('fs');
const { ObjectId } = require('mongodb'); // or ObjectID

const Utility = require('../../../modules/utility');

const Notification = require('../../../modules/notifications');
const QuestionContainer = require('../../../modules/containers/question');
const StudentContainer = require('../../../modules/containers/student');
const CommentContainer = require('../../../modules/containers/comment');
const CommentRedis = require('../../../modules/redis/comment');
require('../../../modules/mongo/comment');

bluebird.promisifyAll(mongoose);
// const profanity = require("profanity-hindi");
const profanity = require('../../helpers/profanity-hindi');
const banner = require('../../helpers/banUser');

const Comment = mongoose.model('Comment');
const PostModel = require('../../../modules/mongo/post');
const CommentModel = require('../../../modules/mongo/comment');
const dataFile = require('../../../data/data');

let db;

async function getListByEntity(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id } = req.user;
        const { entity_type } = req.params;
        const { entity_id } = req.params;
        const query = { entity_type, entity_id, is_deleted: false };
        // const query = {
        //     entity_type, entity_id, is_deleted: false, $expr: { $lt: [{ $strLenCP: '$message' }, 1100] },
        // };
        // console.log(query)
        let result = await Comment.find(query).sort({ createdAt: -1 }).limit(100).lean();
        result = result.reverse();
        result = result.map((item) => {
            if ((item.message.length === 0) && (typeof item.audio !== 'undefined') && (item.audio.length > 0)) {
                item.message = 'is message to dekhne ke liye apne app ko update karein '
                    + 'https://play.google.com/store/apps/details?id=com.doubtnutapp';
            }
            item.like_count = item.liked_by.length;
            if (item.liked_by.indexOf(student_id) > -1) {
                item.is_liked = 1;
            } else {
                item.is_liked = 0;
            }
            if (item.reported_by.indexOf(student_id) > -1) {
                return;
            }
            return item;
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: result,
        };
        res.status(responseData.meta.code).json(responseData);
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
        const hex = /[0-9A-Fa-f]{6}/g;
        req.body.parent_id = (hex.test(req.body.parent_id)) ? mongoose.Types.ObjectId(req.body.parent_id) : req.body.parent_id;
        if (typeof req.body.image !== 'undefined' && req.body.image !== '') {
            req.body.image = await Utility.uploadImageToS3(req.body.image, student_id, config.cdn_url, publicPath, fs, s3, config.aws_bucket);
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

        // console.log(result)
        if (result) {
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
                req.user.student_username = (req.user.student_fname !== '') ? req.user.student_fname : req.user.student_username;
                Notification.commentEntityNotification(req.user.gcm_reg_id, req.body.entity_type, req.body.entity_id, req.user.student_username, null, db);
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

async function remove(req, res, next) {
    try {
        db = req.app.get('db');
        const { comment_id } = req.body;
        let { student_id } = req.user;
        const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

        if (student_id == 98) {
            student_id = req.body.author_student_id;
        }
        const query = Comment.where({ _id: comment_id, student_id: student_id.toString() });
        const result = await Comment.findOneAndUpdate(query, { is_deleted: true }, {});
        // //console.log({_id: comment_id,student_id:student_id.toString()})
        // //console.log("result)
        if (result) {
            if (req.body.entity_type == 'comment') {
                await db.mongo.write.collection('comments').findOneAndUpdate(
                    {
                        _id: ObjectId(req.body.entity_id),
                    },
                    {
                        $inc: { replies_count: -1 },
                    },
                );
            } else if (result.entity_type === 'comment') {
                await db.mongo.write.collection('comments').findOneAndUpdate(
                    {
                        _id: ObjectId(result.entity_id),
                    },
                    {
                        $inc: { replies_count: -1 },
                    },
                );
            }
            // console.log("result")
            // console.log(result)
            const originalDoubtinES = await elasticSearchAllDoubtsInstance.getByOriginalCommentId(req.body.comment_id);
            if (originalDoubtinES.hits.hits.length > 0) {
                await elasticSearchAllDoubtsInstance.updateDoubt(originalDoubtinES.hits.hits[0]._id, { is_deleted: true });
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: null,
            };
            /*
      Activity Stream Entry
      */
            db.redis.read.publish('activitystream_service', JSON.stringify({
                actor_id: req.user.student_id,
                actor_type: 'USER',
                actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                verb: 'DELETE',
                object: result,
                object_id: result._id,
                object_type: 'COMMENT',
                target_id: '',
                target_type: '',
                target: '',
            }));
            res.status(responseData.meta.code).json(responseData);
            await CommentRedis.deleteTopComment(result.entity_type, result.entity_id, db.redis.write);
            await CommentRedis.deleteCommentCount(result.entity_type, result.entity_id, db.redis.write);
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid comment id',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
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

async function report(req, res, next) {
    try {
        db = req.app.get('db');
        const { comment_id } = req.body;
        const { student_id } = req.user;
        const query = Comment.where({ _id: comment_id });
        const result = await Comment.findOne(query).lean();
        const reported_array = result.reported_by;
        const type = result.entity_type;
        const id = result.entity_id;
        const index = reported_array.indexOf(student_id);
        if (index == -1) {
            reported_array.push(student_id);
        }
        console.log(result);
        console.log(student_id);
        // ADMINS are Moderators, a report by them leads to a direct BAN
        const admins = [
            7232, // Aditya Shankar
            4414510, // Umang
            4413678, // Parth
            28075529, // Sanjeev
            25787005, // Charmi
            13098982, // Aditya Pathak
        ];
        // BAN IF > 3 reports or by a moderator(i.e admin)
        if (reported_array.length > 5 || admins.includes(student_id)) {
            const isBAN = await banner.banUser(db, result.student_id);
            if (isBAN) {
                const criteria = {
                    student_id: student_id.toString(),
                };
                // console.log(criteria)
                await PostModel.updateMany(criteria, { is_deleted: true });
                await CommentModel.updateMany(criteria, { is_deleted: true });
            }
        }
        const update = await Comment.updateOne(query, { $set: { reported_by: reported_array } });
        // TODO: Delete in comment
        if (student_id == 1388224) {
            await Comment.findOneAndUpdate(query, { is_deleted: true }, {});
        }
        if (update) {
            await CommentRedis.deleteTopComment(type, id, db.redis.write);
            await CommentRedis.deleteCommentCount(type, id, db.redis.write);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: null,
            };
            /*
      Activity Stream Entry
      */
            //   db.redis.read.publish("activitystream_service", JSON.stringify({
            //   "actor_id":req.user.student_id,
            //   "actor_type":"USER",
            //   "actor":{"student_username":req.user.student_username,"user_avatar":req.user.img_url},
            //   "verb":"REPORT",
            //   "object":update,
            //   "object_id":comment_id,
            //   "object_type":"COMMENT",
            //   "target_id":"",
            //   "target_type":"",
            //   "target":"",
            // }));
            res.status(responseData.meta.code).json(responseData);
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

async function like(req, res, next) {
    try {
        db = req.app.get('db');
        const { comment_id } = req.body;
        const { is_like } = req.body;
        const { student_id } = req.user;
        // console.log(typeof req.user.student_id)
        if (comment_id == 'topPin') {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: 'Top Pin Cant Be Liked',
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const query = Comment.where({ _id: comment_id });
        const result = await Comment.findOne(query).lean();
        const like_array = result.liked_by;
        const index = like_array.indexOf(student_id);
        // console.log(index)
        if (is_like == 1) {
            if (index === -1) {
                like_array.push(student_id);
            }
        } else {
            like_array.splice(index, 1);
        }
        // update
        const update = await Comment.updateOne(query, { $set: { liked_by: like_array } });

        // TODO: Delete in list and comment data from redis
        if (update) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: null,
            };
            if (is_like) {
                /*
        Activity Stream Entry
        */
                db.redis.read.publish('activitystream_service', JSON.stringify({
                    actor_id: req.user.student_id,
                    actor_type: 'USER',
                    actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                    verb: 'LIKE',
                    object: update,
                    object_id: comment_id,
                    object_type: 'COMMENT',
                    target_id: '',
                    target_type: '',
                    target: '',
                }));
            } else {
                /*
      Activity Stream Entry
      */
                db.redis.read.publish('activitystream_service', JSON.stringify({
                    actor_id: req.user.student_id,
                    actor_type: 'USER',
                    actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                    verb: 'DISLIKE',
                    object: update,
                    object_id: comment_id,
                    object_type: 'COMMENT',
                    target_id: '',
                    target_type: '',
                    target: '',
                }));
            }

            res.status(responseData.meta.code).json(responseData);
            // like comment notification
            if (result.student_id != student_id) {
                // send notification
                const student = await StudentContainer.getById(result.student_id, db);
                // console.log(student[0]['gcm_reg_id'])
                Notification.commentLikeNotification(result.student_id, student[0].gcm_reg_id, result.entity_type, result.entity_id, req.user.student_username, null, db);
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

async function mute(req, res) {
    let responseData = {};
    try {
        db = req.app.get('db');
        const { entity_id: entityID } = req.body;
        const { student_id: studentID } = req.user;
        console.log('MUTE REQUEST for', entityID, studentID);

        // await db.mongo.write.collection('comments').update(
        //     {
        //         parent_id: entityID,
        //         student_id: studentID
        //     },
        //     {
        //         $set: { is_mute: true }
        //     },
        //     {
        //         multi : true
        //     }
        // );
        await db.mongo.write.collection('tesla').update(
            {
                _id: ObjectId(entityID),
                student_id: studentID,
            },
            {
                $set: { is_comment_mute: true },
            },
        );
        await CommentContainer.removeCommentor('new_feed_type', entityID, Comment, db, studentID);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: null,
        };
        // res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        // next(e);
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Error!',
            },
            data: null,
            error: e,
        };
        // res.status(responseData.meta.code).json(responseData);
    }
    res.status(responseData.meta.code).json(responseData);
}

async function updateCommentCount(req, res) {
    let responseData = {};
    console.log('\n\nNEW MUTE');
    try {
        db = req.app.get('db');
        const { comment_id, count } = req.body;
        const { student_id } = req.user;
        // console.log(typeof req.user.student_id)
        // const query = Comment.where({ _id: comment_id });
        // const result = await Comment.findOne(query).lean();
        // console.log(result);
        // update
        // const update = await Comment.updateOne(query, { $set: { is_muted: true } });
        // console.log(update);
        // if (update) {
        // const type = result.entity_type;
        // const id = result.entity_id;
        // if(result.entity_type === "comment"){
        //     // REPLY
        //     const query = Comment.where({entity_id:ObjectId(result.entity_id)});
        //     const parent = await Comment.findOne(query).lean();
        //     console.log(parent);
        //     type = parent.entity_type;
        //     id = parent.entity_id;
        // }
        await CommentContainer.updateCommentorsCount('new_feed_type', comment_id, Comment, db, student_id, parseInt(count));
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: null,
        };
        // res.status(responseData.meta.code).json(responseData);
        // }
    } catch (e) {
        // console.log(e)
        // next(e);
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Error!',
            },
            data: null,
            error: e,
        };
        // res.status(responseData.meta.code).json(responseData);
    }
    res.status(responseData.meta.code).json(responseData);
}

module.exports = {
    getListByEntity,
    add,
    remove,
    report,
    like,
    mute,
    updateCommentCount,
};
