/**
 * @Author: xesloohc
 * @Date:   2019-07-04T12:34:48+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-06T01:43:37+05:30
 */


const fs = require('fs');
const Utility = require('../../../modules/utility');
const redisFeed = require('../../../modules/redis/feed');
const PostModel = require('../../../modules/mongo/post');
const BannedUser = require('../../../modules/mysql/banneduser');
const dataFile = require('../../../data/data');

let db; let
    config;


async function add(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const s3 = req.app.get('s3');
    const sqs = req.app.get('sqs');

    // //console.log(req.files);
    // //console.log(req.user);
    const { student_id } = req.user;
    let resourceImage_S3_Url = '';
    let resourceAudio_S3_Url = '';
    const resourceVideo_S3_Url = '';
    let contain_text = false;
    let contain_audio = false;
    const contain_video = false;
    let contain_image = false;
    let resourceImage = null;
    let resourceAudio = null;
    // let resourceVideo = null;
    const { text } = req.body;
    // let isDirty = profanity.isMessageDirty(req.body.text);
    const isDirty = 0;
    const { type } = req.body;
    const { url } = req.body;
    const class_group = req.user.student_class;
    const { student_username } = req.user;
    const student_avatar = req.user.img_url;
    // let resourceImage = req.body.image;
    // let resourceAudio = req.body.audio;
    // let resourceVideo = null;

    const checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, student_id);
    if (checkbanned.length > 0) {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: {
                student_username,
                profile_image: student_avatar,
                student_id: req.user.student_id,
                id: 'BANNED',
                type: 'ugc',
                post_type: 'JUSTASTHOUGHT',
                text,
                image_url: '',
                audio: '',
                video: '',
                created_at: '2019-04-23',
                top_comment: {},
                comments_count: 0,
                like_count: 0,
                is_like: 0,
                og_title: '',
                og_des: '',
                og_url: '',
                og_image: '',
                // "like_count": 0,
                // "is_like": 0
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } else {
        if (req.files.image && req.files.image[0]) {
            resourceImage = req.files.image[0];
        }
        if (req.files.audio) {
            resourceAudio = req.files.audio[0];
        }
        // if (req.files.video) {
        //     resourceVideo = req.files.video[0];
        // }


        if (!req.files && !text) {
            const responseData = {
                meta: {
                    code: 500,
                    message: 'No Data Provided',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
        if (text) {
            contain_text = true;
        }
        if (resourceImage) {
            const resourceImageData = fs.readFileSync(resourceImage.path);
            // let resourceImageData = fs.readFileSync(resourceImage)
            try {
                await Utility.uploadTos3(s3, config.aws_ugc_image_bucket, resourceImage.filename, resourceImageData, resourceImage.mimetype);
            } catch (e) {
                next(e);
                // let responseData = {
                //   "meta": {
                //     "code": 500,
                //     "message": "Error While Uploading Image",
                //   },
                //   "data": null
                // }
                // res.status(responseData.meta.code).json(responseData);
            }
            resourceImage_S3_Url = `${config.cdn_url}UGC_Images/${resourceImage.filename}`;
            contain_image = true;
            Utility.deleteImage(resourceImage.destination + resourceImage.filename, fs);
        }
        if (resourceAudio) {
            const resourceAudioData = fs.readFileSync(resourceAudio.path);
            // let resourceAudioData = fs.readFileSync(resourceAudio)
            try {
                await Utility.uploadTos3(s3, config.aws_ugc_audio_bucket, resourceAudio.filename, resourceAudioData, resourceAudio.mimetype);
            } catch (e) {
                next(e);
                // let responseData = {
                //   "meta": {
                //     "code": 500,
                //     "message": "Error While Uploading Audio",
                //   },
                //   "data": null
                // }
                // res.status(responseData.meta.code).json(responseData);
            }
            resourceAudio_S3_Url = `${config.cdn_url}UGC_Audio/${resourceAudio.filename}`;
            contain_audio = true;
        }

        const postData = {
            student_id,
            type,
            text,
            url,
            image: resourceImage_S3_Url,
            audio: resourceAudio_S3_Url,
            video: resourceVideo_S3_Url,
            class_group,
            student_username,
            student_avatar,
            contain_text,
            contain_image,
            contain_audio,
            contain_video,
        };
        if (typeof req.body.og_title !== 'undefined') {
            postData.og_title = req.body.og_title;
        }
        if (typeof req.body.og_des !== 'undefined') {
            postData.og_des = req.body.og_des;
        }

        if (isDirty) {
            postData.is_deleted = true;
            postData.is_moderated = true;
            postData.moderated_by = { student_username: 'Xesloohc' };
        }
        if (typeof req.body.og_image !== 'undefined') {
            postData.og_image = req.body.og_image;
        }
        if (typeof req.body.og_url !== 'undefined') {
            postData.og_url = req.body.og_url;
            postData.og_url = Utility.commentLengthCheck(postData.og_url, dataFile.commentLength);
            if (postData.og_url === ' ') {
                delete postData.og_url;
                delete postData.og_image;
                delete postData.og_title;
                delete postData.og_des;
            }
        }

        postData.original_text = postData.text;
        postData.text = Utility.commentLengthCheck(postData.text, dataFile.commentLength);

        const post = new PostModel(postData);

        post.save().then(async (result) => {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    student_username: result.student_username,
                    profile_image: result.student_avatar,
                    student_id: req.user.student_id,
                    id: result._id,
                    type: 'ugc',
                    post_type: result.type,
                    text: result.text,
                    image_url: result.image,
                    audio: result.audio,
                    video: result.video,
                    created_at: result.createdAt,
                    top_comment: {},
                    comments_count: 0,
                    like_count: 0,
                    is_like: 0,
                    og_title: result.og_title,
                    og_des: result.og_des,
                    og_url: result.og_url,
                    og_image: result.og_image,
                    // "like_count": 0,
                    // "is_like": 0
                },
            };
            Utility.sqsTrigger(sqs, config.profanity_sqs, { entity: result, entity_type: 'POST' });
            /*
        Activity Stream Entry
       */
            db.redis.read.publish('activitystream_service', JSON.stringify({
                actor_id: req.user.student_id,
                actor_type: 'USER',
                actor: { student_username: result.student_username, user_avatar: result.student_avatar },
                verb: 'POST',
                object: result,
                object_id: result._id,
                object_type: 'UGC',
                target_id: '',
                target_type: '',
                target: '',
            }));
            res.status(responseData.meta.code).json(responseData);


            await redisFeed.removeUgcContent(req.user.student_class, 1, 1, db.redis.write);
        }).catch((error) => {
            // //console.log(error)
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 500,
            //     "message": "Error While Inserting Record",
            //   },
            //   "data": null,
            //   "error":error
            // }
            // res.status(responseData.meta.code).json(responseData);
        });
    }
}
async function deletePost(req, res, next) {
    try {
        db = req.app.get('db');

        config = req.app.get('config');
        const { postId } = req.params;
        const { student_id } = req.user;

        const postData = {
            _id: postId,
        };
        // let post = new PostModel(postData);
        PostModel.findOne(postData).then(async (result1) => {
            // //console.log(result);
            const savedPost = result1;
            if (result1.student_id === student_id) {
                savedPost.is_deleted = 1;
                savedPost.is_visible = 0;
                const post = new PostModel(savedPost);
                post.save().then(async (result) => {
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: {},
                    };
                    /*
         Activity Stream Entry
       */
                    db.redis.read.publish('activitystream_service', JSON.stringify({
                        actor_id: req.user.student_id,
                        actor_type: 'USER',
                        actor: { student_username: result.student_username, user_avatar: result.student_avatar },
                        verb: 'DELETE',
                        object: result,
                        object_id: result._id,
                        object_type: 'UGC',
                        target_id: '',
                        target_type: '',
                        target: '',
                    }));
                    res.status(responseData.meta.code).json(responseData);
                });
            } else {
                throw Error('Post Does Not Belongs To Logged In User');
            }
        });
    } catch (e) {
        next(e);
    }
}

module.exports = { add, deletePost };
