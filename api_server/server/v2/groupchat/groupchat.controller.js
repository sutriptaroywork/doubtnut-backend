/**
 * @Author: xesloohc
 * @Date:   2019-05-06T15:04:29+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-24T19:47:23+05:30
 */


const _ = require('lodash');
const moment = require('moment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const fs = require('fs');
const GroupChatRoomMysql = require('../../../modules/mysql/groupchat_room');
const GroupChatMessageModel = require('../../../modules/mongo/groupchatmessage');
const GroupchatRedis = require('../../../modules/redis/groupchatmessage');
const AnswerContainer = require('../../../modules/containers/answer');
const Utility = require('../../../modules/utility');
const BannedUser = require('../../../modules/mysql/banneduser');

bluebird.promisifyAll(mongoose);

let config; let db; let sqs;
async function getGroups(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let classGroup = req.user.student_class;
        if (classGroup === undefined || classGroup === '') {
            classGroup = 12;
        }
        const groups = await GroupChatRoomMysql.getRooms(db.mysql.read, classGroup);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: groups,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function addMessage(req, res, next) {
    try {
        config = req.app.get('config');
        sqs = req.app.get('sqs');
        // const publicPath = req.app.get('publicPath');
        // console.log(publicPath);
        // let blobService = req.app.get('blobService')
        // console.log(admin);
        const s3 = req.app.get('s3');
        // console.log(s3);
        db = req.app.get('db');
        req.body.student_id = req.user.student_id;
        // req.body.student_username = (!_.isEmpty(req.user.student_fname)) ? req.user.student_fname + " " + req.user.student_lname : req.user.student_username
        if (_.isEmpty(req.headers.version_code) || req.headers.version_code <= 628) {
            req.body.student_username = req.user.student_username;
        } else {
            req.body.student_username = (!_.isEmpty(req.user.student_fname)) ? `${req.user.student_fname} ${req.user.student_lname}` : req.user.student_username;
        }
        req.body.student_avatar = req.user.img_url;


        if (typeof req.body.message !== 'undefined' && req.body.message.length > 0) {
            const questionId = Utility.findPatternInCommentMessage(req.body.message);
            // console.log(question_id)
            if (questionId) {
                req.body.question_id = questionId;
                req.body.message = 'Click below to view its solution';
                // get thumbnail image of question
                let question = await AnswerContainer.getByQuestionId(questionId, db);
                if (question.length > 0) {
                    question = question[0];
                    // console.log("question")
                    // console.log(question)
                    req.body.image = (question.matched_question == null) ? (`${config.blob_url}q-thumbnail/${question.question_id}.png`) : (`${config.blob_url}q-thumbnail/${question.matched_question}.png`);
                    // console.log(req.body.image)
                }
            }
        }


        // for audio on comment
        let resourceImageS3Url = '';
        let resourceAudioS3Url = '';
        let containAudio = false;
        let containImage = false;
        let resourceImage = null;
        let resourceAudio = null;
        if (req.files.image && req.files.image[0]) {
            resourceImage = req.files.image[0];
        }
        if (req.files.audio) {
            // console.log("audfsdfgdsafgdfsfgbngvfd")
            resourceAudio = req.files.audio[0];
        }

        // const { url } = req.body;
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
            resourceImageS3Url = `${config.cdn_url}UGC_Images/${resourceImage.filename}`;
            containImage = true;
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
            resourceAudioS3Url = `${config.cdn_url}UGC_Audio/${resourceAudio.filename}`;
            containAudio = true;
        }
        if (!req.body.question_id) {
            req.body.image = resourceImageS3Url;
            req.body.audio = resourceAudioS3Url;
        }


        req.body.contain_image = containImage;
        req.body.contain_audio = containAudio;


        const checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, req.body.student_id);
        if (checkbanned.length > 0) {
            req.body.is_deleted = true;
            const comment = new GroupChatMessageModel(req.body);
            const result = await comment.save();
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!',
                },
                data: result,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const originalMessage = req.body.message;
            let duplicateMessage = _.join(_.split(req.body.message, '\n', 10), '\n');
            if (duplicateMessage.length > 1000) {
                duplicateMessage = duplicateMessage.substring(0, 1000).concat('...........');
                req.body.message = duplicateMessage;
            }
            req.body.original_message = originalMessage;
            req.body.is_deleted = true;
            const comment = new GroupChatMessageModel(req.body);
            const result = await comment.save();
            Utility.sqsTrigger(sqs, config.profanity_sqs, { entity: result, entity_type: 'GROUP_CHAT' });
            if (result) {
                // add/update top comment and comment count cache in redis
                if ((result.message.length === 0) && (typeof result.audio !== 'undefined') && (result.audio.length > 0)) {
                    result.message = 'is message to dekhne ke liye apne app ko update karein '
            + 'https://play.google.com/store/apps/details?id=com.doubtnutapp';
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
async function getMessagesByGroupId(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const groupId = req.params.id;
        let { cursor } = req.query;
        let response = [];

        const studentId = req.user.student_id;
        if (typeof cursor !== 'undefined' && cursor != '0') {
            response = await GroupChatMessageModel.find({ entity_id: groupId, is_deleted: false, _id: { $gt: cursor } });
        } else {
            response = await GroupChatMessageModel.find({ entity_id: groupId, is_deleted: false }).sort({ _id: -1 }).limit(30);
            response = _.reverse(response);
        }
        if (response.length) {
            cursor = _.last(response);
            cursor = cursor._id;
        }

        const isFirstMessage = await GroupchatRedis.getIsSeenToday(db.redis.read, studentId);

        if (!isFirstMessage && req.user.gcm_reg_id) {
            GroupchatRedis.setIsSeenToday(db.redis.write, studentId);
            const messageTosend = {};
            messageTosend.data = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'CENTER',
                popup_type: 'popup_alert',
                message: 'Be Careful Yahan ashlil, abusive ya offensive language ka use nahi karein',
                description: JSON.stringify([' Isse aap block ho sakte hai 🚫', ' Aap pe sec. 499 IPC ke under legal action bhi ho sakta hai']),
                button_text: 'Okay, I Will Be Careful',
                img_url: '',
            };
            messageTosend.token = req.user.gcm_reg_id;
            messageTosend.android = {
                priority: 'normal',
                ttl: 4500,
            };

            await Utility.sendFcm(req.user.student_id, req.user.gcm_reg_id, messageTosend);
        }
        // if (req.query.cursor == '0') {
        //     const answerItQuestion = await FeedContainer.getCommunityQuestionsForFeed(1, 5, 1, req.user.student_class, db);
        //     console.log(answerItQuestion);
        //     if (answerItQuestion.length) {
        //         const deeplink = await Utility.generateDeepLink(config, 'groupchat_answerit', 'forum_shared_detail_feed', 'gc_answerit', answerItQuestion[0].id, 'unanswered', null, null);
        //         const answerItFormatting = {
        //             message: `Is Sawal Ka Jawaab Kya Hai Link Par Click Karke Comments Mai Batao . ${deeplink.url} \n #challenge`,
        //             parent_id: null,
        //             image: `${config.cdn_url}images/${answerItQuestion[0].question_image}`,
        //             audio: '',
        //             original_message: 'hiiii',
        //             reported_by: [],
        //             liked_by: [],
        //             is_deleted: false,
        //             is_profane: false,
        //             _id: '0',
        //             entity_type: 'STUDY',
        //             entity_id: '1',
        //             student_id: answerItQuestion[0].student_id,
        //             student_username: answerItQuestion[0].student_username,
        //             student_avatar: null,
        //             createdAt: answerItQuestion[0].created_at,
        //             updatedAt: answerItQuestion[0].created_at,
        //             __v: 0,
        //         };
        //         response.push(answerItFormatting);
        //     }
        // }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: { messages: response, cursor },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}


async function getStats(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const currentDay = moment();
        currentDay.set({
            hour: 0, minute: 0, second: 0, millisecond: 0,
        }).toDate();
        const yesterday = currentDay.subtract(1, 'day');
        // console.log(currentDay);
        // console.log(yesterday);
        const query = {
            createdAt: {
                // "$gt": moment().subtract(1, 'd').toDate()
                $gt: moment()
                    .utcOffset(0)
                    .set({
                        hour: 0, minute: 0, second: 0, millisecond: 0,
                    })
                    .subtract(1, 'd')
                    .toDate(),
                $lt: moment()
                    .utcOffset(0)
                    .set({
                        hour: 0, minute: 0, second: 0, millisecond: 0,
                    })
                    .toDate(),
            },
        };
        // let response = await GroupChatMessageModel.aggregate([{$group :{_id : '$entity_id', count : {$sum : 1},uniqueUsers: {$addToSet: "$student_id"}}}])
        // let response3 = await GroupChatMessageModel.find(query)
        const response2 = await GroupChatMessageModel.aggregate([{ $match: query }, { $group: { _id: { group_id: '$entity_id', student_id: '$student_id', date: yesterday.format('MMM Do YY') }, count: { $sum: 1 } } }]);


        const csvdata = _.map(response2, (value) => {
            const data = {};
            data.date = value._id.date;
            data.group_id = value._id.group_id;
            data.student_id = value._id.student_id;
            data.message_count = value.count;
            return data;
        });
        const fields = ['date', 'group_id', 'student_id', 'message_count'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(csvdata);
        res.setHeader('Content-disposition', 'attachment; filename=testing.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
    } catch (e) {
        next(e);
    }
}
module.exports = {
    getGroups, addMessage, getMessagesByGroupId, getStats,
};
