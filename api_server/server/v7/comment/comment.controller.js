// const Comment = require('../../../modules/class')
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const fs = require('fs');
const _ = require('lodash');
const { ObjectId } = require('mongodb'); // or ObjectID
// const { execSync } = require('child_process');
const moment = require('moment');
const Utility = require('../../../modules/utility');
// const Notification = require('../../../modules/notifications');
// const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const CommentContainer = require('../../../modules/containers/comment');
const RedisCommentContainer = require('../../../modules/redis/comment');
// const StudentContainer = require('../../../modules/containers/student');
const Students = require('../../../modules/student');
const BannedUser = require('../../../modules/mysql/banneduser');
const VodSql = require('../../../modules/mysql/vod');
const BountyNotification = require('../../v1/bounty/bountyNotificationController');
const CourseRedisv2 = require('../../../modules/redis/coursev2');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const newtonNotifications = require('../../../modules/newtonNotifications');
const SchedulerMysql = require('../../../modules/mysql/scheduler');
const SchedulerContainer = require('../../../modules/containers/scheduler');
const { responseTemplate } = require('../../helpers/response.helper');
const CourserHelper = require('../course/course.helper');
const CourseSqlV2 = require('../../../modules/mysql/coursev2');
const Answer_Container = require('../../v13/answer/answer.container');
const CourseHelperV1 = require('../../v1/course/course.helper');

// const DNProperty = require('../../../modules/mysql/property');

// mongo -> doubts_info
const dataFile = require('../../../data/data');
require('../../../modules/mongo/comment');

bluebird.promisifyAll(mongoose);

const Comment = mongoose.model('Comment');
// const Post = mongoose.model('Post');
// Used For Controlling Comment Notifications
// const PRIMES = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
// const AFTER_PRIMES = 20; // AFTER 100 Comments, notifications are send every AFTER_PRIMES comments
const DEFAULT_COUNTRY = 'IN';
let db;

// function myLogger(key,msg,type="FgWhite"){
//     const colorMap = {
//         Reset : "\x1b[0m",
//         FgBlack : "\x1b[30m",
//         FgRed : "\x1b[31m",
//         FgGreen : "\x1b[32m",
//         FgYellow : "\x1b[33m",
//         FgBlue : "\x1b[34m",
//         FgMagenta : "\x1b[35m",
//         FgCyan : "\x1b[36m",
//         FgWhite : "\x1b[37m",
//         BgBlack : "\x1b[40m",
//         BgRed : "\x1b[41m",
//         BgGreen : "\x1b[42m",
//         BgYellow : "\x1b[43m",
//         BgBlue : "\x1b[44m",
//         BgMagenta : "\x1b[45m",
//         BgCyan : "\x1b[46m",
//         BgWhite : "\x1b[47m",
//     }
//     console.log(colorMap[type],key,...msg,colorMap["Reset"]);
// }

const dateFromObjectId = function (objectId) {
    return new Date(ObjectId(objectId).getTimestamp());
};

function calculateTta(answerId, questionId) {
    const answerDate = dateFromObjectId(answerId);
    const questionDate = dateFromObjectId(questionId);
    return answerDate.valueOf() - questionDate.valueOf();
}

// eslint-disable-next-line no-unused-vars
function notifMessage(count, sender, isAuthor) {
    let notifOther;
    if (isAuthor) {
        notifOther = count >= 2
            ? `and others have commented ${count} times on your post`
            : 'has commented on your post';
    } else {
        notifOther = count >= 2
            ? `and others have posted ${count} comments`
            : 'has posted a comment';
    }
    return `${sender} ${notifOther}`;
}

// eslint-disable-next-line no-unused-vars
function notifData(event, message, entityID, commentID, commentCount) {
    return {
        event: 'post_detail',
        title: message,
        message: 'Check now!!',
        data: JSON.stringify({
            post_id: entityID,
            feed_trigger: event,
            club_action: `${entityID}_${event}`,
            comment_id: commentID,
            comment_count: commentCount,
            actions: JSON.stringify([
                {
                    label: 'Mute',
                    action: 'mute',
                },
                {
                    label: 'Comment',
                    action: 'post_detail',
                },
            ]),
        }),
        firebase_eventtag: 'user_journey',
    };
}

function currentEpoch(minutes = 0) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    now.subtract(minutes, 'minutes');

    // const todayDate = now.startOf('day').format('YYYY-MM-DD');

    return now.valueOf();
}

async function getCourseDetailsWithBatchInfo(dbObj, studentId, entityID) {
    let batchId = 1;
    let courseDetailsInfoForComment = {};
    let totalMapppings = [];
    let userPackages = [];
    const totalMapppingsRedis = entityID ? await CourseRedisv2.getAllAssortmentsByQuestionId(dbObj.redis.read, entityID) : null;
    if (totalMapppingsRedis) {
        totalMapppings = JSON.parse(totalMapppingsRedis);
        if (totalMapppings.length) {
            const allUserActivePackages = await CourseContainerv2.getUserActivePackages(dbObj, studentId);
            userPackages = allUserActivePackages.filter((item) => totalMapppings.indexOf(item.assortment_id) >= 0); // await CourseMysqlv2.checkVipByAssortment(db.mysql.read, totalMapppings, studentId);
            if (userPackages.length) {
                userPackages[0].batch_id = parseInt(userPackages[0].batch_id);
                batchId = userPackages[0].batch_id;
                courseDetailsInfoForComment = { ...userPackages[0] };
            }
        }
    }

    return {
        batchId, courseDetailsInfoForComment,
    };
}
async function add(req, res, next) {
    try {
        // console.log("NEW COMMENT","REQUEST",req.body,"FgRed");
        const config = req.app.get('config');
        const { student_id } = req.user;
        const s3 = req.app.get('s3');
        const sqs = req.app.get('sqs');
        const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');
        const region = req.headers.country || DEFAULT_COUNTRY;
        db = req.app.get('db');
        req.body.student_id = req.user.student_id;
        let batchId = req.body.batch_id;
        const suggestedId = req.body.doubt_suggester_id;
        const suggesterResponse = req.body.doubt_suggester_response;
        const allowedSuggesterResponse = ['yes', 'bookmark'].includes(suggesterResponse);
        const assortmentId = parseInt(req.body.assortment_id) || 0;
        const reqOriginalCommentId = req.body.original_comment_id;
        let commentAlreadySuggested = [];
        if (suggestedId) {
            const suggestionsQuery = {
                entity_type: 'answered', entity_id: `${req.body.entity_id}`, is_deleted: false, student_id: `${req.user.student_id}`, suggested_id: suggestedId,
            };
            commentAlreadySuggested = await db.mongo.read.collection('comments').find(suggestionsQuery).toArray();
        }
        if (suggesterResponse === 'undo') {
            if (commentAlreadySuggested.length) {
                await db.mongo.write.collection('comments').findOneAndUpdate({ _id: ObjectId(`${commentAlreadySuggested[0]._id}`) }, { $set: { is_deleted: true } });
                await CourseSqlV2.setBookmarkedResource(db.mysql.write, req.user.student_id, `${commentAlreadySuggested[0]._id}`, assortmentId, 0, 1);
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: {
                    message: 'undo done',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (suggesterResponse === 'no') {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: {
                    icon_url: `${config.staticCDN}images/icon_small_close.webp`,
                    undo_text: 'Undo',
                    reply: 'Marked as Incorrect answer',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (suggesterResponse === 'bookmark_remove') {
            if (commentAlreadySuggested.length) {
                // await db.mongo.read.collection('comments').findOneAndUpdate({ _id: ObjectId(`${commentAlreadySuggested[0]._id}`) }, { $set: { is_deleted: true } });
                await CourseSqlV2.setBookmarkedResource(db.mysql.write, req.user.student_id, `${commentAlreadySuggested[0]._id}`, assortmentId, 0, 1);
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: {
                    icon_url: `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`,
                    undo_text: 'Undo',
                    reply: 'Bookmark Removed Succesfully',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (suggesterResponse === 'bookmark') {
            if (commentAlreadySuggested.length) {
                const { message, bookmark } = await CourseHelperV1.bookmarkResource(db, req.user.student_id, `${commentAlreadySuggested[0]._id}`, assortmentId, 'doubt');
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS!',
                    },
                    data: {
                        icon_url: bookmark ? `${config.staticCDN}engagement_framework/icon_small_bookmark_filled.webp` : `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`,
                        undo_text: 'Undo',
                        reply: message,
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        if (allowedSuggesterResponse && suggestedId) {
            const suggestionsQuery = {
                entity_type: 'answered', entity_id: `${req.body.entity_id}`, student_id: `${req.user.student_id}`, suggested_id: suggestedId,
            };
            commentAlreadySuggested = await db.mongo.read.collection('comments').find(suggestionsQuery).toArray();

            if (commentAlreadySuggested.length) {
                await db.mongo.read.collection('comments').findOneAndUpdate({ _id: ObjectId(`${commentAlreadySuggested[0]._id}`) }, { $set: { is_deleted: false } });
                const resultData = commentAlreadySuggested[0];
                resultData.is_deleted = false;
                resultData.icon_url = `${config.staticCDN}images/icon_small_tick.webp`;
                resultData.undo_text = 'Undo';
                resultData.reply = 'Marked as correct answer';
                if (suggesterResponse === 'bookmark') {
                    const studentId = req.user.student_id;
                    const resourceId = `${resultData._id}`;
                    const { message, bookmark } = await CourseHelperV1.bookmarkResource(db, studentId, resourceId, assortmentId, 'doubt');

                    resultData.icon_url = bookmark ? `${config.staticCDN}engagement_framework/icon_small_bookmark_filled.webp` : `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`;
                    resultData.undo_text = 'Undo';
                    resultData.reply = message;
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS!',
                    },
                    data: resultData,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            const prevComment = await db.mongo.read.collection('comments').findOne({ _id: ObjectId(suggestedId) });
            req.body.message = prevComment.message;
            req.body.suggested_id = suggestedId;
        }
        let courseDetailsInfoForComment = {};
        if (_.isEmpty(req.headers.version_code) || req.headers.version_code <= 628) {
            req.body.student_username = req.user.student_username;
        } else {
            req.body.student_username = (!_.isEmpty(req.user.student_fname)) ? `${req.user.student_fname} ${req.user.student_lname}` : req.user.student_username;
        }
        // req.body.student_username = (!_.isEmpty(req.user.student_fname)) ? req.user.student_fname + " " + req.user.student_lname : req.user.student_username

        req.body.student_avatar = req.user.img_url;
        let allowComment = true;

        const checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, student_id);
        if (req.body.entity_type && req.body.entity_type == 'answered') {
            const checkTimeout = await BannedUser.checkUserTimeOut(db.mysql.read, student_id, req.body.entity_id);
            if (checkTimeout && checkTimeout.length && checkTimeout[0].count) {
                allowComment = false;
            }
        }

        if (req.body.entity_type && req.body.entity_type === 'answered' && typeof (req.body.batch_id) === 'undefined') {
            if (!batchId) {
                const courseDetailsBatchInfo = await getCourseDetailsWithBatchInfo(db, student_id, req.body.entity_id);
                batchId = courseDetailsBatchInfo.batchId;
                courseDetailsInfoForComment = courseDetailsBatchInfo.courseDetailsInfoForComment;
            }
        }
        const checkUserIsPaid = await db.mysql.read.query('select count(*) as count from student_package_subscription where student_id = ? and is_active = 1', student_id);
        if (allowComment && checkbanned.length > 0 && req.body.student_id != 98) {
            allowComment = false;
            if (req.body.entity_type && req.body.entity_type == 'answered') {
                try {
                    // Dont Check ban fror live class because paid users even if banned should be able to comment!
                    if (checkUserIsPaid[0].count) {
                        // Paid users can comment in Liveclass even if banned
                        allowComment = true;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }
        if (req.body.student_id == 98) {
            req.body.is_admin = true;
            req.body.user_tag = 'Verified';
            req.body.student_username = req.body.admin_username;
            allowComment = true;
        }
        console.log('AllowComment', allowComment);
        if (!allowComment) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: {
                    message: 'YOUR ROADS END HERE #BANNED',
                },
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const question_id = Utility.findPatternInCommentMessage(req.body.message);
            if (question_id) {
                const question = await AnswerContainer.getByQuestionId(question_id, db);
                if (question.length > 0 || question[0].is_answered != 0) {
                    req.body.question_id = question_id;
                    req.body.answer_id = question[0].answer_id;
                    req.body.message = 'Click below to view its solution';
                }
            }
            // for audio on comment
            let resourceImage_S3_Url = '';
            let resourceAudio_S3_Url = '';
            let resourceImage = null;
            let resourceAudio = null;
            if (req.files.image && req.files.image[0]) {
                resourceImage = req.files.image[0];
            }
            if (req.files.audio && req.files.audio[0]) {
                // console.log("audfsdfgdsafgdfsfgbngvfd")
                resourceAudio = req.files.audio[0];
            }

            if (resourceImage) {
                const resourceImageData = fs.readFileSync(resourceImage.path);
                // let resourceImageData = fs.readFileSync(resourceImage)
                try {
                    await Utility.uploadTos3(s3, config.aws_ugc_image_bucket, resourceImage.filename, resourceImageData, resourceImage.mimetype);
                } catch (e) {
                    // let responseData = {
                    //   "meta": {
                    //     "code": 500,
                    //     "message": "Error While Uploading Image",
                    //   },
                    //   "data": null
                    // }
                    // res.status(responseData.meta.code).json(responseData);
                    next(e);
                }
                resourceImage_S3_Url = `${config.cdn_url}UGC_Images/${resourceImage.filename}`;
                Utility.deleteImage(resourceImage.destination + resourceImage.filename, fs);
            }
            if (resourceAudio) {
                const resourceAudioData = fs.readFileSync(resourceAudio.path);
                // let resourceAudioData = fs.readFileSync(resourceAudio)
                try {
                    await Utility.uploadTos3(s3, config.aws_ugc_audio_bucket, resourceAudio.filename, resourceAudioData, resourceAudio.mimetype);
                } catch (e) {
                    // let responseData = {
                    //   "meta": {
                    //     "code": 500,
                    //     "message": "Error While Uploading Audio",
                    //   },
                    //   "data": null

                    // }
                    // res.status(responseData.meta.code).json(responseData);
                    next(e);
                }
                resourceAudio_S3_Url = `${config.cdn_url}UGC_Audio/${resourceAudio.filename}`;
            }
            if (!req.body.question_id) {
                req.body.image = resourceImage_S3_Url;
                req.body.audio = resourceAudio_S3_Url;

                if (req.body.suggested_doubt_image) {
                    req.body.image = req.body.suggested_doubt_image;
                }
                if (req.body.suggested_doubt_audio) {
                    req.body.audio = req.body.suggested_doubt_audio;
                }
            }
            // req.body['contain_image'] = contain_image
            // req.body['contain_audio'] = contain_audio

            req.body.original_message = req.body.message;
            req.body.message = Utility.commentLengthCheck(req.body.message, dataFile.commentLength);
            if (req.body.entity_type === 'answered' && req.body.entity_id && !req.body.is_doubt) {
                req.body.is_doubt = false;
            }
            const doubtTags = ['doubt', 'डाउट'];

            if (req.body.message.toLowerCase().indexOf(doubtTags[0]) >= 0 || req.body.message.toLowerCase().indexOf(doubtTags[1]) >= 0) {
                req.body.is_doubt = (req.body.student_id != 98) && true;
            }

            let postParent;
            if (req.body.entity_type) {
                if (req.body.entity_type == 'comment') {
                    postParent = await db.mongo.read.collection('comments').findOne({ _id: ObjectId(req.body.entity_id) });
                    if (postParent) {
                        req.body.parent_id = postParent.entity_id;
                    }
                }
                req.body.is_mute = false;
                // myLogger("POST PARENT",[req.body.parent_id,"POST MUTE",req.body.is_mute],"FgRed");
            }
            req.body.is_deleted = true;
            let is_simulated = false;
            let is_free = 0;
            // eslint-disable-next-line no-restricted-globals
            if (req.body.entity_type === 'answered' && !isNaN(req.body.entity_id)) {
                is_simulated = true;
                const isExist = await SchedulerContainer.checkQid(db, req.body.entity_id);
                if (isExist.length > 0) {
                    req.body.entity_type = 'scheduler';
                }
                if (req.body.detail_id !== 'undefined') {
                    const forFree = await SchedulerMysql.checkEntityId(db.mysql.read, req.body.entity_id);
                    if (forFree.length > 0 && forFree[0].is_free) {
                        is_free = 1;
                    }
                }
            }
            if (region === 'US' || req.body.student_id == 98) {
                // !REMOVE AFTER US PROFANITY SQS IS LIVE ON US INFRA
                req.body.is_deleted = false;
            }
            const comment = new Comment(req.body);
            const result = await comment.save();
            // myLogger("NEW SAVED COMMENT",["RESULT",result,"\n"],"FgRed");
            let isLiveClassComment = false;
            // detail_id shows that the stream is live and screenshot can be taken on it
            if (typeof req.body.detail_id !== 'undefined' && req.body.detail_id.length) isLiveClassComment = true;

            if (isLiveClassComment) {
                const streamUrl = Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, `${req.body.entity_id}_H264xait`, config.liveclass.authKey);
                req.body.original_comment_id = result._id;
                req.body.streamUrl = streamUrl;
                req.body.endpoint = `${config.microUrl}/api/liveclasscomment/insert`;
                Utility.postAxios(req.body)
                    .catch(() => {
                        console.log('error');
                    });
            }
            let isLiveClassData = false;
            const isLiveClassStream = await SchedulerMysql.checkEntityIdForLiveClass(db.mysql.read, req.body.entity_id);
            if (isLiveClassStream.length && isLiveClassStream[0].stream_status === 'ACTIVE') {
                isLiveClassData = true;
            }
            if (typeof req.body.is_doubt !== 'undefined') {
                let resourceId = req.body.entity_id;
                if (req.body.entity_type === 'comment') {
                    resourceId = req.body.parent_id;
                    if (!batchId) {
                        const courseDetailsBatchInfo = await getCourseDetailsWithBatchInfo(db, student_id, req.body.parent_id);
                        courseDetailsInfoForComment = courseDetailsBatchInfo.courseDetailsInfoForComment;
                    }
                }
                const streamData = await VodSql.getCourseResourceByResourceReference(db.mysql.read, resourceId);
                const liveclassDetails = await VodSql.getLiveclassInfo(db.mysql.read, resourceId);
                req.body.is_doubt = +req.body.is_doubt;
                if (is_free && req.body.is_doubt && (!checkUserIsPaid[0].count)) {
                    const originalCommentId = result._id;
                    const obj = {};
                    obj.student_id = student_id;
                    let automatedReply = await CourserHelper.automatedReplyOnFreeClasses(db, req.body.student_username, req.body.message, is_simulated, is_free, obj, config, req.body.is_doubt, originalCommentId);
                    const commentReply = new Comment(automatedReply);
                    automatedReply = await commentReply.save();
                    await db.mongo.write.collection('comments').findOneAndUpdate(
                        {
                            _id: ObjectId(originalCommentId),
                        },
                        {
                            $inc: { replies_count: 1 },
                        },
                    );
                    result.replies_count = 1;
                } else if (streamData.length && liveclassDetails.length) {
                    req.body.original_comment_id = result._id;
                    req.body.is_answered = 0;
                    // await db.mongo.write.collection('doubt_comments').save({ ...req.body, ...streamData[0] });
                    // await db.mongo.write.collection('doubts_info').insertOne({
                    //     ...req.body, ...streamData[0], ...courseDetailsInfoForComment, ...liveclassDetails[0], is_deleted: false,
                    // });
                    const createdAt = currentEpoch();
                    if (!allowedSuggesterResponse && req.body.is_doubt) {
                        await elasticSearchAllDoubtsInstance.insertDoubt({
                            ...req.body, ...streamData[0], ...courseDetailsInfoForComment, ...liveclassDetails[0], is_deleted: false, createdAt, is_answered: 0, tta: null, is_top_doubt: null,
                        });
                    }
                }
                // get FacultyId from resource_reference
                // save in different collection
            }
            if (region !== 'US' && student_id !== 98) {
                // !REMOVE AFTER US PROFANITY SQS IS LIVE ON US INFRA
                Utility.sqsTrigger(sqs, config.profanity_sqs, { entity: result, entity_type: 'COMMENT' });
            }
            // }

            if (result) {
                // add/update top comment and comment count cache in redis
                if (allowedSuggesterResponse) {
                    let answer = await db.mongo.read.collection('comments').find({ entity_type: 'comment', entity_id: suggestedId }).sort({ _id: 1 }).toArray();
                    answer = answer[0];
                    delete answer._id;
                    delete answer.createdAt;
                    delete answer.updatedAt;
                    answer.entity_id = `${result._id}`;
                    await db.mongo.write.collection('comments').save({ ...answer });
                    await db.mongo.write.collection('comments').findOneAndUpdate(
                        {
                            _id: ObjectId(result._id),
                        },
                        {
                            $inc: { replies_count: 1 },
                        },
                    );
                    result._doc.icon_url = `${config.staticCDN}images/icon_small_tick.webp`;
                    result._doc.undo_text = 'Undo';
                    result._doc.reply = 'Marked as correct answer';
                }
                if (suggesterResponse === 'bookmark') {
                    const studentId = req.user.student_id;
                    const resourceId = `${result._id}`;
                    const { message, bookmark } = await CourseHelperV1.bookmarkResource(db, studentId, resourceId, assortmentId, 'doubt');

                    result._doc.icon_url = bookmark ? `${config.staticCDN}engagement_framework/icon_small_bookmark_filled.webp` : `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`;
                    result._doc.undo_text = 'Undo';
                    result._doc.reply = message;
                }
                await CommentContainer.updateCommentCount(req.body.entity_type, req.body.entity_id, Comment, db);
                await RedisCommentContainer.updateTopComment(req.body.entity_type, req.body.entity_id, result, db.redis.write);
                if (req.body.entity_type == 'comment') {
                    // if is answer then update answered in doubt collection
                    if (req.body.is_answer) {
                        // const answerUpdateData = await db.mongo.write.collection('doubt_answer').insertOne({ ...req.body });
                        const tta = calculateTta(`${result._id}`, `${reqOriginalCommentId}`);
                        // await db.mongo.write.collection('doubt_comments').findOneAndUpdate({ original_comment_id: ObjectId(req.body.entity_id) }, { $set: { is_answered: 1 } });
                        if (req.query.source == 'old_panel') {
                            // await db.mongo.write.collection('doubts_info').findOneAndUpdate({ original_comment_id: ObjectId(req.body.entity_id) }, { $set: { is_answered: 1, tta } });
                        } else {
                            const originalDoubtinES = await elasticSearchAllDoubtsInstance.getByOriginalCommentId(`${reqOriginalCommentId}`);
                            if (originalDoubtinES.hits.hits.length) {
                                await Promise.all(originalDoubtinES.hits.hits.map(async (eachHit) => {
                                    await elasticSearchAllDoubtsInstance.updateDoubt(eachHit._id, { is_answered: 1, tta });
                                    if (req.query.doubt_reply_answer !== 'true') {
                                        await elasticSearchAllDoubtsInstance.insertDoubtSuggestion({ ...eachHit._source, is_answered: 1, tta });
                                    }
                                }));
                            }
                        }
                    }
                    await db.mongo.write.collection('comments').findOneAndUpdate(
                        {
                            _id: ObjectId(req.body.entity_id),
                        },
                        {
                            $inc: { replies_count: 1 },
                        },
                    );
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS!',
                    },
                    data: result,
                };
                res.status(responseData.meta.code).json(responseData);
                BountyNotification.notificationForComment(db, result);

                // send comment to all users of same entity
                // get all student ids of entity type and id
                // if (req.body.entity_type === 'comment') {
                // const postParent = await db.mongo.read.collection('comments').findOne({ _id: ObjectId(req.body.entity_id) });
                if (postParent) {
                    req.body.entity_id = postParent.entity_id;
                    req.body.entity_type = postParent.entity_type;
                }
                console.log('postParent', postParent);
                // }

                if (postParent && req.body.entity_type === 'answered' && postParent.is_doubt) {
                    const postStudentID = parseInt(postParent.student_id);

                    const userLocale = await Students.getStudentLocale(postStudentID, db.mysql.read);
                    console.log(userLocale);
                    const notificationDate = {
                        title: 'Apke doubt ka jawab de diya gaya hai 😃',
                        message: 'Answer dekhne ke liye click karein',
                        event: 'video',
                        firebase_eventtag: 'DOUBT_ANSWER',
                        image: req.body.image ? req.body.image : '',
                        data: {
                            qid: postParent.entity_id,
                            page: 'LIVECLASS_NOTIFICATION',
                            doubt_comment_id: postParent._id.toString(),
                        },
                    };
                    if (userLocale[0] && userLocale[0].locale == 'hi') {
                        notificationDate.title = 'आपके डाउट का जवाब दे दिया गया है 😃';
                        notificationDate.message = 'जवाब देखने के लिए क्लिक करें';
                    }

                    const postGcmID = await CommentContainer.updateGCMIDByStudentID(postStudentID, db);
                    newtonNotifications.sendNotificationByFCM([{ id: postStudentID, gcmId: postGcmID }], notificationDate);
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
        next(e);
    }
}

async function updateTopComment(req, res) {
    db = req.app.get('db');
    const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

    const { comment_id, top_comment } = req.body;
    // console.log(typeof req.user.student_id)
    const query = Comment.where({ _id: comment_id });

    await Comment.updateOne(query, { $set: { is_top_doubt: parseInt(top_comment) } });
    if (req.query.source == 'old_panel') {
        // await db.mongo.write.collection('doubts_info').findOneAndUpdate({ _id: ObjectId(comment_id) }, { $set: { is_top_doubt: parseInt(top_comment) } });
    } else {
        const originalDoubtinES = await elasticSearchAllDoubtsInstance.getByOriginalCommentId(req.body.comment_id);
        await elasticSearchAllDoubtsInstance.updateDoubt(originalDoubtinES.hits.hits[0]._id, { is_top_doubt: parseInt(top_comment) });
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: null,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function updateDoubtAsComment(req, res) {
    db = req.app.get('db');
    const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

    const { is_doubt } = req.body;

    // console.log(typeof req.user.student_id)
    // await db.mongo.write.collection('doubt_comments').findOneAndUpdate({ original_comment_id: ObjectId(req.body.comment_id) }, { $set: { is_doubt: +is_doubt } });
    if (req.query.source == 'old_panel') {
        // await db.mongo.write.collection('doubts_info').findOneAndUpdate({ original_comment_id: ObjectId(req.body.comment_id) }, { $set: { is_doubt: +is_doubt } });
    } else {
        const originalDoubtinES = await elasticSearchAllDoubtsInstance.getByOriginalCommentId(req.body.comment_id);
        if (originalDoubtinES.hits.hits.length) {
            originalDoubtinES.hits.hits.map(async (eachHit) => {
                await elasticSearchAllDoubtsInstance.updateDoubt(eachHit._id, { is_doubt: +is_doubt });
            });
        }
    }
    await Comment.findOneAndUpdate({ _id: ObjectId(req.body.comment_id) }, { $set: { is_doubt: +is_doubt } });
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: null,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function updateCommentAsDoubt(req, res) {
    db = req.app.get('db');
    const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

    const {
        comment_id, is_doubt, student_id, entityId,
    } = req.body;
    // console.log(typeof req.user.student_id)
    const query = Comment.where({ _id: comment_id });
    const originalComment = await Comment.findOne(query, { _id: 0 });
    await Comment.updateOne(query, { $set: { is_doubt: true } });
    let courseDetailsInfoForComment = {};
    let totalMapppings;
    let userPackages = [];
    const totalMapppingsRedis = req.body.comment_id ? await CourseRedisv2.getAllAssortmentsByQuestionId(db.redis.read, comment_id) : null;

    if (totalMapppingsRedis) {
        totalMapppings = JSON.parse(totalMapppingsRedis);
        if (totalMapppings.length) {
            const allUserActivePackages = await CourseContainerv2.getUserActivePackages(db, student_id);
            userPackages = allUserActivePackages.filter((item) => totalMapppings.indexOf(item.assortment_id) >= 0); // await CourseMysqlv2.checkVipByAssortment(db.mysql.read, totalMapppings, studentId);
            if (userPackages.length) {
                userPackages[0].batch_id = parseInt(userPackages[0].batch_id);
                courseDetailsInfoForComment = { ...userPackages[0] };
            }
        }
    }
    const streamData = entityId ? await VodSql.getCourseResourceByResourceReference(db.mysql.read, entityId) : [];
    const liveclassDetails = entityId ? await VodSql.getLiveclassInfo(db.mysql.read, entityId) : [];
    query.is_doubt = +query.is_doubt;
    if (streamData.length && liveclassDetails.length) {
        query.original_comment_id = query._id;
        query.is_answered = 0;
        // await db.mongo.write.collection('doubts_info').insertOne({
        //     ...req.body, ...streamData[0], ...courseDetailsInfoForComment, ...liveclassDetails[0],
        // });
        const oc = originalComment._doc;
        oc.original_comment_id = comment_id;
        oc.is_answered = 0;
        delete oc.__v;
        oc.is_doubt = +is_doubt;
        oc.offset = oc.offset ? oc.offset.toString() : '0';
        const createdAt = currentEpoch();
        await elasticSearchAllDoubtsInstance.insertDoubt({
            ...oc, ...streamData[0], ...courseDetailsInfoForComment, ...liveclassDetails[0], is_deleted: false, createdAt, is_answered: 0, tta: null, is_top_doubt: null,
        });
    }

    // await db.mongo.write.collection('doubt_comments').findOneAndUpdate({ original_comment_id: ObjectId(req.body.comment_id) }, { $set: { is_doubt: +is_doubt } });
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: null,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getRepliesByEntity(req, res) {
    db = req.app.get('db');
    const { entityID } = req.body;
    console.log('fetch replies by entity id');
    const DoubtReplies = await db.mongo.read.collection('comments').find({ entity_id: parseInt(entityID), entity_type: 'comment' }).limit(100).toArray();

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: DoubtReplies,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getDoubtsByFaculty(req, res) {
    db = req.app.get('db');
    // const { facultyId } = req.params;
    // const TotalDoubtsCount = await db.mongo.read.collection('doubt_comments').find({ faculty_id: parseInt(facultyId), is_doubt: 1, is_answered: 0 }).count();
    // const doubtsData = await db.mongo.read.collection('doubt_comments').find({ faculty_id: parseInt(facultyId), is_doubt: 1, is_answered: 0 }).limit(100).toArray();

    const TotalDoubtsCount = 0;
    const doubtsData = [];
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: doubtsData,
        count: TotalDoubtsCount,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getAnsweredDoubtsByFaculty(req, res) {
    db = req.app.get('db');
    // const { facultyId } = req.params;
    // const TotalDoubtsCount = await db.mongo.read.collection('doubt_comments').find({ faculty_id: parseInt(facultyId), is_answered: 1 }).count();
    // const doubtsData = await db.mongo.read.collection('doubt_comments').find({ faculty_id: parseInt(facultyId), is_answered: 1 }).limit(100).toArray();

    const TotalDoubtsCount = 0;
    const doubtsData = [];
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: doubtsData,
        count: TotalDoubtsCount,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getDoubtsByFacultyByEntityId(req, res) {
    db = req.app.get('db');
    // const { facultyId } = req.params;
    // const { entityid } = req.params;
    // const TotalDoubtsCount = await db.mongo.read.collection('doubt_comments').find({
    //     faculty_id: parseInt(facultyId), is_answered: 0, is_doubt: 1, entity_id: entityid,
    // }).count();
    // const doubtsData = await db.mongo.read.collection('doubt_comments').find({
    //     faculty_id: parseInt(facultyId), is_answered: 0, is_doubt: 1, entity_id: entityid,
    // }).toArray();

    const TotalDoubtsCount = 0;
    const doubtsData = [];

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: doubtsData,
        count: TotalDoubtsCount,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getAnswerByCommentID(req, res) {
    db = req.app.get('db');
    const { commentID } = req.params;
    const query = {};
    query.entity_id = commentID;
    query.entity_type = 'comment';
    query.is_answer = true;
    const answer = await db.mongo.read.collection('comments').find(query).toArray();

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS!',
        },
        data: answer,
    };
    res.status(responseData.meta.code).json(responseData);
}
const objectIdFromDate = function (date) {
    return `${Math.floor(date.getTime() / 1000).toString(16)}0000000000000000`;
};

// eslint-disable-next-line no-unused-vars
function getQueryIndex(obj) {
    const {
        category, allResources, facultyName, locale,
    } = obj;
    let queryIndex = 'allDoubtsQuery';

    if (category && locale) {
        queryIndex = 'allDoubtsQuery_cl';
    }
    // new filters
    if (facultyName) {
        queryIndex = 'allDoubtsQuery_f';
    }

    if (facultyName && locale) {
        queryIndex = 'allDoubtsQuery_fl';
    }
    if (allResources.length > 0) {
        queryIndex = 'allDoubtsQuery_e';
    }
    if (allResources.length > 0 && locale) {
        queryIndex = 'allDoubtsQuery_el';
    }
    return queryIndex;
}

// _id is_doubt subject class locale isvod isAnswered category
// eslint-disable-next-line no-unused-vars
function buildQuery(obj) {
    const query = {};
    const now = new Date();
    const dt = new Date('2021-01-01T00:00:00.000Z');
    let objectId;
    switch (obj.recency) {
        case 'Last 1 Hour':
            now.setTime(now.getTime() - 1000 * 60 * 60);
            objectId = objectIdFromDate(now);
            query._id = { $gt: ObjectId(objectId) };
            break;
        case 'Last 5 Hours':
            now.setTime(now.getTime() - 1000 * 60 * 60 * 5);
            objectId = objectIdFromDate(now);
            query._id = { $gt: ObjectId(objectId) };
            break;
        case 'Last 10 Hours':
            now.setTime(now.getTime() - 1000 * 60 * 60 * 10);
            objectId = objectIdFromDate(now);
            query._id = { $gt: ObjectId(objectId) };
            break;
        case 'Last 24 hours':
            now.setTime(now.getTime() - 1000 * 60 * 60 * 24);
            objectId = objectIdFromDate(now);
            query._id = { $gt: ObjectId(objectId) };
            break;
        default:
            objectId = objectIdFromDate(dt);
            query._id = { $gt: ObjectId(objectId) };
            break;
    }
    query.is_doubt = { $in: [1, '1'] };
    query.subject = obj.subject ? obj.subject : { $exists: true };
    query.class = obj.studentClass ? parseInt(obj.studentClass) : { $exists: true }; // missing in 6,90,292
    query.isVod = obj.isVod ? parseInt(obj.isVod) : { $exists: true }; // missing in 6,96,710
    query.is_answered = obj.is_answered ? parseInt(obj.is_answered) : 0; // missing in 985

    if (obj.category) query.category = obj.category; // missing in 29,01,890
    if (obj.facultyName) query.faculty_name = obj.facultyName;
    if (obj.allResources.length > 0) query.entity_id = { $in: obj.allResources }; // missing in 986
    if (obj.locale) query.locale = obj.locale; // missing in 21,91,508

    return query;
}

function buildESQuery(obj) {
    const dt = new Date('2021-01-01T00:00:00.000Z');

    const query = {
        bool: {
            must: [],
            filter: [],
            should: [],
            must_not: [],
        },
    };

    switch (obj.recency) {
        case 'Last 1 Hour':
            // now.setTime(now.getTime() - 1000 * 60 * 60);
            query.bool.filter.push({
                range: {
                    createdAt: { gte: currentEpoch(60) },
                },
            });
            break;
        case 'Last 5 Hours':
            // now.setTime(now.getTime() - 1000 * 60 * 60 * 5);
            query.bool.filter.push({
                range: {
                    offset: { gte: currentEpoch(60 * 5) },
                },
            });
            break;
        case 'Last 10 Hours':
            // now.setTime(now.getTime() - 1000 * 60 * 60 * 10);
            query.bool.filter.push({
                range: {
                    createdAt: { gte: currentEpoch(60 * 10) },
                },
            });
            break;
        case 'Last 24 hours':
            // now.setTime(now.getTime() - 1000 * 60 * 60 * 24);
            query.bool.filter.push({
                range: {
                    createdAt: { gte: currentEpoch(60 * 24) },
                },
            });
            break;
        default:
            query.bool.filter.push({
                range: {
                    createdAt: { gte: dt.valueOf() },
                },
            });
            break;
    }
    query.bool.filter.push({
        terms: {
            is_doubt: [1, '1'],
        },
    });
    if (obj.subject) {
        query.bool.filter.push({
            term: {
                'subject.keyword': obj.subject,
            },
        });
    } else {
        query.bool.must.push({
            exists: {
                field: 'subject',
            },
        });
    }
    if (obj.studentClass) {
        query.bool.filter.push({
            match: {
                class: obj.studentClass,
            },
        });
    } else {
        query.bool.must.push({
            exists: {
                field: 'class',
            },
        });
    }
    if (obj.isVod) {
        query.bool.filter.push({
            term: {
                isVod: obj.isVod,
            },
        });
    } else {
        // query.bool.filter.push({
        //     term: {
        //         isVod: parseInt(obj.isVod),
        //     },
        // });
        query.bool.must.push({
            exists: {
                field: 'isVod',
            },
        });
    }
    if (obj.is_answered) {
        query.bool.filter.push({
            term: {
                is_answered: parseInt(obj.is_answered),
            },
        });
    } else {
        query.bool.filter.push({
            term: {
                is_answered: 0,
            },
        });
    }

    if (obj.category) {
        query.bool.filter.push({
            term: {
                category: obj.category,
            },
        });
    }
    if (obj.facultyName) {
        query.bool.filter.push({
            term: {
                'faculty_name.keyword': obj.facultyName,
            },
        });
    }
    if (obj.allResources.length > 0) {
        query.bool.filter.push({
            terms: {
                entity_id: [...obj.allResources],
            },
        });
    }
    if (obj.excludeResources.length > 0) {
        query.bool.must_not.push({
            terms: {
                entity_id: [...obj.excludeResources],
            },
        });
    }
    if (obj.locale) {
        query.bool.filter.push({
            match: {
                locale: obj.locale,
            },
        });
    }
    query.bool.filter.push({
        term: {
            is_deleted: false,
        },
    });

    const sort = [];
    if (obj.first === '1') {
        sort.push({ createdAt: 'asc' });
    }

    if (obj.latest === '1') {
        sort.push({ createdAt: 'desc' });
    }
    const queryBody = {
        sort,
        query,
    };

    return queryBody;
}
async function getDoubts(req, res) {
    // pagination page,limit
    try {
        db = req.app.get('db');
        const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

        let distinctEntityIds = [];
        let givenEntityIds = [];

        const excludeResources = [];
        if (req.query.entity_id) {
            givenEntityIds = req.query.entity_id
                .split(',')
                .map((eachId) => eachId.trim());
            if (req.query.exclude_qid) {
                excludeResources.push(...givenEntityIds);
            } else {
                distinctEntityIds.push(...givenEntityIds);
            }
        }
        if (req.query.courseId) {
            const courseResourceReferences = await VodSql.getVideoResourcesByAssortmentID(db.mysql.read, req.query.courseId);
            const distinctCourseResourceReferences = courseResourceReferences.map((resource) => resource.resource_reference);
            distinctEntityIds = _.concat(distinctEntityIds, distinctCourseResourceReferences);
        }
        req.query.allResources = distinctEntityIds;
        req.query.excludeResources = excludeResources;

        // return res.send("joi");

        // console.log(req.query, db.mongo.read);
        const esQueryBody = buildESQuery(req.query);

        let TotalDoubtsCount = 0;
        let doubtsData = [];

        if (req.query.source === 'old_panel') {
            // console.log(esQueryBody);
            // const queryIndex = getQueryIndex(req.query);
            // const query = buildQuery(req.query);

            // const TotalDoubtsRedis = await RedisCommentContainer.getAllDoubtsCount(db.redis.read, 'allDoubts');
            // TotalDoubtsCount = JSON.parse(TotalDoubtsRedis);
            // if (_.isEmpty(TotalDoubtsRedis)) {
            //     TotalDoubtsCount = await db.mongo.read.collection('doubts_info').find({ _id: query._id, is_answered: 0 }).count();
            //     await RedisCommentContainer.setAllDoubtsCount(db.redis.read, 'allDoubts', TotalDoubtsCount);
            // }

            // if (req.query.first === '1') {
            //     doubtsData = await db.mongo.read.collection('doubts_info').find(query).hint(queryIndex).sort({ _id: 1 })
            //         .limit(1000)
            //         .toArray();
            // }
            // if (req.query.latest === '1') {
            //     doubtsData = await db.mongo.read.collection('doubts_info').find(query).hint(queryIndex).sort({ _id: -1 })
            //         .limit(1000)
            //         .toArray();
            // }
            TotalDoubtsCount = 0;
            doubtsData = [];
        } else {
            const esDoubtsData = await elasticSearchAllDoubtsInstance.getDoubts(esQueryBody);
            const esDoubtsDataCount = await elasticSearchAllDoubtsInstance.getDoubtsCount({ query: esQueryBody.query });
            TotalDoubtsCount = esDoubtsDataCount.count;
            doubtsData = esDoubtsData.hits.hits.map((eachDoubt) => ({ elastic_id: eachDoubt._id, ...eachDoubt._source }));
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            esQueryBody,
            data: doubtsData,
            count: TotalDoubtsCount,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
            },
            message: 'Internal Server Error',
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function getAnswersByEntityIdNew(req, res) {
    db = req.app.get('db');
    const { entityId } = req.query;
    // const data = await db.mongo.read.collection('doubt_answer').find({ entity_id: entityId }).limit(1).toArray();
    const data = await db.mongo.read.collection('comments').find({ entity_type: 'comment', entity_id: entityId, is_deleted: false }).toArray();
    const originalComment = await db.mongo.read.collection('comments').findOne({ _id: ObjectId(entityId) });

    data.unshift(originalComment);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getFacultyNames(req, res) {
    db = req.app.get('db');
    const sql = 'select id, email, name from dashboard_users where type=\'FACULTY\'';
    const data = await db.mysql.read.query(sql, []);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getVideoByQid(req, res) {
    db = req.app.get('db');
    const config = req.app.get('config');
    const { qid } = req.query;

    const question = await AnswerContainer.getByQuestionId(qid, db);

    let videoResource = [];
    if (_.get(question, '[0]', false)) {
        const supportedMediaList = ['DASH', 'BLOB'];
        videoResource = await Answer_Container.getAnswerVideoResource(db, config, question[0].answer_id, question[0].question_id, supportedMediaList, 900);
        videoResource = videoResource.filter((er) => (er && supportedMediaList.includes(er.media_type)));
        if (videoResource.length > 0) {
            const crEntry = await CourseSqlV2.getCourseResourceByReference(db.mysql.read, qid);
            console.log(crEntry);
            videoResource[0].resClass = _.get(crEntry, '[0].class', null);
            videoResource[0].resChapter = _.get(crEntry, '[0].chapter', null);
        }
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: videoResource,
    };
    res.status(responseData.meta.code).json(responseData);
}

async function markDoubtAsSuggestion(req, res, next) {
    db = req.app.get('db');
    const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');
    try {
        const { original_comment_id } = req.body;
        if (!original_comment_id) {
            return res.status(400).json(responseTemplate('No comment id sent', '', 400));
        }

        const isDoubtinSuggestion = await elasticSearchAllDoubtsInstance.getSuggestionByOriginalCommentId(original_comment_id);
        if (isDoubtinSuggestion.hits.hits.length) {
            return res.status(200).json(responseTemplate('Already in Suggestion', '', 200));
        }

        const originalDoubtinES = await elasticSearchAllDoubtsInstance.getByOriginalCommentId(original_comment_id);
        if (originalDoubtinES.hits.hits.length) {
            await Promise.all(originalDoubtinES.hits.hits.map(async (doubt) => {
                const eachHit = doubt._source;
                const suggestDoubt = {
                    chapter: eachHit.chapter,
                    batch_id: eachHit.batch_id,
                    subject: eachHit.subject,
                    description: eachHit.description,
                    old_detail_id: eachHit.old_detail_id,
                    locale: eachHit.locale,
                    faculty_name: eachHit.faculty_name,
                    course_resource_id: eachHit.course_resource_id,
                    class: eachHit.class,
                    offset: eachHit.offset,
                    original_comment_id: eachHit.original_comment_id,
                    original_message: eachHit.original_message,
                    entity_id: eachHit.entity_id,
                    detail_id: eachHit.detail_id,
                    message: eachHit.message,
                    entity_type: eachHit.entity_type,
                    faculty_id: eachHit.faculty_id,
                    topic: eachHit.topic,
                    is_answered: eachHit.is_answered,
                    category: eachHit.category,
                    isVod: eachHit.isVod,
                };
                await elasticSearchAllDoubtsInstance.insertDoubtSuggestion(suggestDoubt);
            }));
            return res.status(200).json(responseTemplate('Doubts Inserted', 'Success', 200));
        }
        // await elasticSearchAllDoubtsInstance.insertDoubt({
        //     "chapter": "NUTRITION IN PLANTS",
        //     "batch_id": "1",
        //     "subject": "SCIENCE",
        //     "description": "Introduction| trophic Nutrition|Other Modes Of Nutrition |OMR",
        //     "old_detail_id": 508086,
        //     "locale": "ENGLISH",
        //     "student_avatar": "https://d10lpgp6xz60nq.cloudfront.net/images/upload_85042847_1639574005.jpg",
        //     "course_resource_id": 194555,
        //     "faculty_name": "ARISHA AHMED",
        //     "createdAt": 1645441987737,
        //     "endpoint": "http://gateway-internal.microservices.svc.cluster.local/api/liveclasscomment/insert",
        //     "is_deleted": false,
        //     "is_mute": false,
        //     "is_top_doubt": "",
        //     "audio": "",
        //     "class": 7,
        //     "is_doubt": 1,
        //     "streamUrl": "rtmp://live.doubtnut.com/live/649058747_H264xait?txSecret=ad54523e2e28d57b4c77cb7ba9564c75&txTime=31363431333031303733",
        //     "tta": 71000,
        //     "image": "",
        //     "offset": "1653",
        //     "original_comment_id": "61d4445137b0ef0030065246",
        //     "course_name": "Introduction|Autotrophic Nutrition|Other Modes Of Nutrition |OMR",
        //     "student_id": 85042847,
        //     "original_message": "#Doubt what are digestive juice",
        //     "entity_id": "649058747",
        //     "detail_id": "451365",
        //     "message": "#Doubt what are digestive juice",
        //     "entity_type": "answered",
        //     "faculty_id": 350,
        //     "student_username": "Harsh yadav",
        //     "topic": "NUTRITION IN PLANTS",
        //     "is_answered": 1,
        //     "category": "CBSE Boards",
        //     "isVod": 1
        // });

        return res.status(200).json(responseTemplate('No Doubts To Insert', 'Success', 200));
    } catch (err) {
        next(err);
    }
}

module.exports = {
    add, updateTopComment, getDoubtsByFaculty, updateCommentAsDoubt, updateDoubtAsComment, getRepliesByEntity, getDoubtsByFacultyByEntityId, getAnsweredDoubtsByFaculty, getAnswerByCommentID, getDoubts, getAnswersByEntityIdNew, getFacultyNames, getVideoByQid, markDoubtAsSuggestion,
};
