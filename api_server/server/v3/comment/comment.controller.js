/* eslint-disable no-await-in-loop */
/**
 * @Author: xesloohc
 * @Date:   2019-05-12T05:05:28+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-05-12T10:31:55+05:30
 */

// const Comment = require('../../../modules/class')
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const Utility = require('../../../modules/utility');
const Notification = require('../../../modules/notifications');
const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const StudentContainer = require('../../../modules/containers/student');
require('../../../modules/mongo/comment');
const AnswerControllerContainer = require('../../v13/answer/answer.container');
const CourseRedisv2 = require('../../../modules/redis/coursev2');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CommentPinned = require('../../../modules/mysql/comment_pinned');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const SchedulerContainer = require('../../../modules/containers/scheduler');
const SchedulerHelper = require('../../helpers/scheduler');

bluebird.promisifyAll(mongoose);
// const profanity = require("profanity-hindi");
const profanity = require('../../helpers/profanity-hindi');

const Comment = mongoose.model('Comment');
const dataFile = require('../../../data/data');

let db;

async function getListByEntity(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id } = req.user;
        const { entity_type } = req.params;
        const { entity_id } = req.params;
        let { batch_id: batchId } = req.query;
        let { supported_media_type } = req.query;
        const { version_code } = req.headers;
        const isDoubtsReply = req.query.doubts_reply === 'true';

        if (entity_type === 'new_feed_type') {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: [],
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        // Fix For Android Side Missing ParamsNew
        supported_media_type = supported_media_type || 'DASH%2CHLS%2CRTMP%2CBLOB%2CYOUTUBE';
        supported_media_type = decodeURIComponent(supported_media_type);
        let supportedMediaList = [];
        if (supported_media_type) {
            supportedMediaList = _.split(supported_media_type, ',');
        }
        let page_number = 0;
        let page_size = 10;
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1;
        }
        const { filter } = req.query;
        let result = [];
        const query = { entity_type, entity_id, is_deleted: false };
        const totalMapppingsRedis = entity_id ? await CourseRedisv2.getAllAssortmentsByQuestionId(db.redis.read, entity_id) : null;
        let totalMapppings = [];
        totalMapppings = JSON.parse(totalMapppingsRedis);
        switch (filter) {
            case 'doubts':
                query.is_doubt = true;
                break;
            case 'top_doubts':
                page_size = 30;
                query.is_top_doubt = true;
                break;
            case 'my_doubts':
                query.student_id = student_id.toString();
                query.is_doubt = true;
                break;
            case 'answers':
                query.is_answer = true;
                break;

            default:
                if (entity_type === 'answered') {
                    if (!batchId) {
                        batchId = 1;
                        let userPackages = [];
                        if (totalMapppingsRedis) {
                            if (totalMapppings.length) {
                                const allUserActivePackages = await CourseContainerv2.getUserActivePackages(db, student_id);
                                userPackages = allUserActivePackages.filter((item) => totalMapppings.indexOf(item.assortment_id) >= 0); // await CourseMysqlv2.checkVipByAssortment(db.mysql.read, totalMapppings, studentId);
                                if (userPackages.length) {
                                    batchId = userPackages[0].batch_id;
                                }
                            }
                        }
                    }
                    if (batchId > 1) {
                        query.batch_id = parseInt(batchId);
                    }
                }

                break;
        }
        if (entity_type === 'answered') {
            // Check if this qid exist in scheduler -> tread as a new qid and show fresh comments
            const isExist = await SchedulerContainer.checkQid(db, entity_id);
            if (isExist.length > 0) {
                query.entity_type = 'scheduler';
                query._id = {
                    $gte: ObjectID(SchedulerHelper.objectIdFromDate(new Date(moment().add(5, 'h').add(30, 'minutes').startOf('day')
                        .toISOString()))),
                };
            }
            // comments on sf were failing due to this
            query.is_doubt = query.is_doubt ? query.is_doubt : false;
            result = await db.mongo.read.collection('comments').find(query).sort({ _id: -1 }).skip(page_number * page_size)
                .limit(page_size)
                .toArray();
            if (page_number == 0 && student_id != 98) {
                let pinnedComment = await CommentPinned.getPinnedPostByQid(db.mysql.read, entity_id, batchId);
                if (!pinnedComment.length) {
                    pinnedComment = await CommentPinned.getPinnedPostByCourseId(db.mysql.read, totalMapppings, batchId);
                    if (!pinnedComment.length) {
                        pinnedComment = await CommentPinned.getPinnedPostByDefault(db.mysql.read);
                    }
                }
                for (let i = 0; i < pinnedComment.length; i++) {
                    const topPin = {
                        _id: 'topPin',
                        message: pinnedComment[i].message,
                        image: pinnedComment[i].message_image,
                        audio: '',
                        question_id: pinnedComment[i].message_qid,
                        answer_id: pinnedComment[i].message_aid,
                        reported_by: [],
                        liked_by: [],
                        replies_count: 0,
                        is_deleted: false,
                        is_profane: false,
                        entity_id: pinnedComment[i].id,
                        student_username: pinnedComment[i].username,
                        student_avatar: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5359795C-30F7-7F07-8B72-134AF38E02D5.webp',
                        is_admin: true,
                        user_tag: pinnedComment[i].user_tag,
                        createdAt: moment().format(),
                        updatedAt: moment().format(),
                        show_in: pinnedComment[i].show_in,
                    };
                    result.unshift(topPin);
                }
            }
        } else {
            result = await db.mongo.read.collection('comments').aggregate([
                {
                    $match: query,
                },
                {
                    $addFields: {
                        like_count: {
                            $size: {
                                $ifNull: [
                                    '$liked_by',
                                    [
                                    ],
                                ],
                            },
                        },
                    },
                },
                {
                    $sort: {
                        like_count: -1.0,
                        _id: isDoubtsReply ? 1 : -1,
                    },
                },
                {
                    $skip: page_number * page_size,
                },
                {
                    $limit: page_size,
                },
            ]).toArray();
        }

        let resultData = [];
        const resourceList = [];
        result = result.map((item) => {
            resourceList.push(item._id);
            item.student_avatar = `${config.staticCDN}engagement_framework/5359795C-30F7-7F07-8B72-134AF38E02D5.webp`;
            return item;
        });
        const bookmarkedDoubts = resourceList.length ? await CourseV2Mysql.getBookMarkedResourcesByResourceId(db.mysql.read, student_id, resourceList, 1) : [];
        const doubtItem = [];
        const myDoubtItem = [];
        const commentItem = [];
        const doubtsThreadTypes = ['doubts', 'my_doubts'];
        for (let index = 0; index < result.length; index++) {
            const item = result[index];
            if (doubtsThreadTypes.includes(filter) && (item.student_id === `${student_id}`)) {
                item.allow_reply = true;
            }
            const returnData = {};
            if (item.reported_by.indexOf(student_id) > -1) {
                continue;
            }
            // TODO
            item.resource_url = item.image;
            returnData.type = 'top_doubt_answer_text_image';
            item.type = 'top_doubt_answer_text_image';

            if ((typeof item.audio !== 'undefined') && (item.audio.length > 0)) {
                item.resource_url = item.audio;
                item.type = 'top_doubt_answer_audio';
                returnData.type = 'top_doubt_answer_audio';
            }

            if (item.liked_by.indexOf(student_id) > -1) {
                item.is_liked = 1;
            } else {
                item.is_liked = 0;
            }

            if (item.question_id) {
                item.resource_url = `${config.staticCDN}q-thumbnail/${item.question_id}.webp`;
                item.image = `${config.staticCDN}q-thumbnail/${item.question_id}.webp`;
                item.video_obj = {};
                item.video_obj.page = 'top_doubts';
                item.video_obj.question_id = item.question_id;
                console.log(supportedMediaList);
                console.log(item.question_id);
                console.log(item.answer_id);
                item.video_obj.video_resources = await AnswerControllerContainer.getAnswerVideoResource(db, config, parseInt(item.answer_id), parseInt(item.question_id), supportedMediaList, '870');
                returnData.type = 'top_doubt_answer_video';
                item.type = 'top_doubt_answer_video';
            }
            if (version_code > 962) {
                item.is_bookmarked = !!_.find(bookmarkedDoubts, ['comment_id', `${item._id}`]);
            }
            if (filter == 'answers') {
                returnData.data = item;
                resultData.push(returnData);
            } else if ((filter == 'doubts') && item.show_in && item.show_in === 'doubts') {
                doubtItem.push(item);
            } else if ((filter == 'my_doubts') && item.show_in && item.show_in === 'my_doubts') {
                myDoubtItem.push(item);
            } else if (item.show_in && item.show_in === 'comments') {
                commentItem.push(item);
            } else {
                resultData.push(item);
            }
        }
        resultData = resultData.filter((item) => item._id != 'topPin');
        let newResult = resultData;
        if (filter === 'doubts') {
            newResult = [...doubtItem, ...resultData];
        } else if (filter === 'my_doubts') {
            newResult = [...myDoubtItem, ...resultData];
        } else if (!filter) {
            newResult = [...commentItem, ...resultData];
        }
        resultData = newResult;
        // result = result.map((item) => {
        //     const returnData = {};

        //     // TODO
        //     item.resource_url = item.image;
        //     returnData.type = 'top_doubt_answer_text_image';

        //     if ((item.message.length === 0) && (typeof item.audio !== 'undefined') && (item.audio.length > 0)) {
        //         item.message = 'is message to dekhne ke liye apne app ko update karein '
        //             + 'https://play.google.com/store/apps/details?id=com.doubtnutapp';
        //         item.resource_url = item.audio;
        //         returnData.type = 'top_doubt_answer_audio';
        //     }

        //     if (item.liked_by.indexOf(student_id) > -1) {
        //         item.is_liked = 1;
        //     } else {
        //         item.is_liked = 0;
        //     }
        //     if (item.reported_by.indexOf(student_id) > -1) {
        //         return;
        //     }
        //     if (filter == 'answers') {
        //         if (item.question_id) {
        //             item.resource_url = `${config.staticCDN}q-thumbnail/${item.question_id}.webp`;
        //             item.video_obj = {};
        //             item.video_obj.page = 'top_doubts';
        //             item.video_obj.question_id = item.question_id;
        //             item.video_obj.video_resources = await AnswerControllerContainer.getAnswerVideoResource(db, config, item.answer_id, item.question_id, supportedMediaList, 870);
        //         }
        //         returnData.type = 'top_doubt_answer_video';
        //         returnData.data = item;
        //         return returnData;
        //     }
        //     return item;
        // });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: resultData,
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

            res.status(responseData.meta.code).json(responseData);
            // send comment to all users of same entity
            // get all student ids of entity type and id
            if ((typeof req.body.entity_type !== 'undefined') && (typeof req.body.entity_id !== 'undefined')) {
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

module.exports = { getListByEntity, add };
