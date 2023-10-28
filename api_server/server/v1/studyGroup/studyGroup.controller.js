const _ = require('lodash');
const moment = require('moment');
const StudyGroupHelper = require('../../helpers/studyGroup.helper');
const logger = require('../../../config/winston').winstonLogger;
const StudyGroupMySql = require('../../../modules/mysql/studyGroup');
const StudyGroupData = require('../../../data/studyGroup.data');
const studentRedis = require('../../../modules/redis/student');
const studyGroupRedis = require('../../../modules/redis/studygroup');
const answerBl = require('../../v13/answer/answer.bl');

async function create(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.create();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function listGroups(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.listGroups();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function leaveGroup(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.leaveGroup();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function blockFromGroup(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.blockFromGroup();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function updateGroupInfo(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.updateGroupInfo();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function canCreateGroup(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.canCreateGroup();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function groupInfo(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.groupInfo();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function invite(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.invite();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function accept(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.accept();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'create', error: errorLog });
        next(e);
    }
}

async function invitationStatus(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.invitationStatus();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'invitationStatus', error: errorLog });
        next(e);
    }
}

async function getSignedURL(req, res, next) {
    try {
        const s3 = req.app.get('s3');
        const signedUrlExpireSeconds = 60 * 60;
        const { content_type, file_ext, file_name } = req.query;
        const { student_id } = req.user;
        const timestamp = moment().unix();
        let tfile_name = '';
        if (!file_name) {
            tfile_name = '';
        } else {
            tfile_name = file_name.replace(`.${file_ext}`, '');
        }
        const fileName = `${tfile_name}_study_group_${student_id}_${timestamp}.${file_ext}`;
        // const myBucket = `doubtnut-user-uploads/${bucketNameMapping[content_type]}/${moment().format('YYYY-MM-DD')}`;
        const myBucket = 'doubtnut-static/studygroup/images';
        const url = s3.getSignedUrl('putObject', {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: 'public-read',
            ContentType: content_type,
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                url,
                file_name: fileName,
                full_url: `${req.app.get('config').cdn_url}studygroup/images/${fileName}`,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.log(error, ' error');
        next(error);
    }
}

async function mute(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const studyGroupObj = new StudyGroupHelper(req, studentClass, req.user.student_id, req.user.locale, req.user.student_fname, db, config, db.mongo);
        const data = await studyGroupObj.mute();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studygroup', source: 'mute', error: errorLog });
        next(e);
    }
}

async function updateGroupCache(req, res, next) {
    try {
        const db = req.app.get('db');
        const { group_id: groupId, field } = req.body;
        const { student_id: studentId } = req.user;
        if (groupId.matches(`(sg-|USER7:${studentId}).*`)) {
            studyGroupRedis.delStudyGroupCache(groupId, field, db.redis.write);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
    }
}

async function isStudyGroupEnabled(req) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const response = { enabled: true, isGroupExist: false };
        const officialStudentIds = [98];
        if (officialStudentIds.includes(studentId)) {
            return response;
        }
        const studyGroupData = await StudyGroupMySql.isActiveOnStudyGroup(studentId, db.mysql.read);
        if (studyGroupData && studyGroupData[0].ACTIVE === 1) {
            response.isGroupExist = true;
        }
        return response;
    } catch (e) {
        console.log(e);
        return { enabled: true, isGroupExist: false };
    }
}

async function isNotificationEnabled(studentId, db) {
    try {
        let isMute = false;
        const data = await studentRedis.get7Day(db.redis.read, 'SG_FEATURE_MUTE', studentId);
        if (!_.isNull(data)) {
            isMute = JSON.parse(data);
        } else {
            const studyGroupFeature = await StudyGroupMySql.isFeatureMute(studentId, db.mysql.read);
            if (studyGroupFeature.length) {
                isMute = Boolean(studyGroupFeature[0].is_mute);
            }
            studentRedis.set7Day(db.redis.write, 'SG_FEATURE_MUTE', studentId, isMute);
        }
        return isMute;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function isNotificationEnabledV2(studentId, db) {
    try {
        // This is SQL driven function, not using redis, because everything has been shifted to micro
        let isMute = false;
        const studyGroupFeature = await StudyGroupMySql.isFeatureMute(studentId, db.mysql.read);
        if (studyGroupFeature.length) {
            isMute = Boolean(studyGroupFeature[0].is_mute);
        }
        return isMute;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function unreadMessageWidget(request, timeout = 100) {
    try {
        return false;
        // const headers = { 'Content-Type': 'application/json', 'x-auth-token': request.headers['x-auth-token'] };
        // const { data } = await inst.configMicroInst({
        //     method: 'GET',
        //     url: `${request.app.get('config').microUrl}/api/study-chat/unread-count`,
        //     timeout,
        //     headers,
        // });
        // if (data && data.data.is_widget_available) {
        //     return data.data.widget;
        // }
    } catch (e) {
        console.error(e);
    }
    return false;
}

async function postLiveClassStartMessageByTeacher(liveStreamDetails, req, db, resourceReference, config, resourceID, courseResourceObject) {
    const activeStudyGroupIds = await StudyGroupMySql.getLiveClassStudyGroupIds(db.mysql.read, resourceID);
    if (activeStudyGroupIds && activeStudyGroupIds.length && liveStreamDetails.length) {
        await answerBl.postStudyGroupMessage(db, req, liveStreamDetails[0].topic, liveStreamDetails[0].display);
        for (let i = 0; i < activeStudyGroupIds.length; i++) {
            const childWidget = {
                widget_data: {
                    deeplink: `doubtnutapp://video?qid=${resourceReference}&page=STUDYGROUP`,
                    question_text: liveStreamDetails[0].topic,
                    id: 'question',
                },
                widget_type: 'widget_asked_question',
            };
            const message = {
                widget_data: {
                    child_widget: childWidget,
                    created_at: moment().valueOf(),
                    student_img_url: `${config.cdn_url}${StudyGroupData.studygroupUserSenderIcon}`,
                    title: StudyGroupData.teacherTakingClass.replace('<>', courseResourceObject[0].expert_name),
                    sender_detail: StudyGroupData.senderDetail,
                    visibility_message: '',
                    widget_display_name: StudyGroupData.widgetDisplayName,
                    cta_text: StudyGroupData.widgetCta,
                    cta_color: StudyGroupData.widgetCtaColor,
                    deeplink: `doubtnutapp://video?qid=${resourceReference}&page=STUDYGROUP`,
                },
                widget_type: 'widget_study_group_parent',
            };

            const data = JSON.stringify({
                message,
                room_id: activeStudyGroupIds[i].group_id,
                room_type: 'public_groups',
                student_id: activeStudyGroupIds[i].created_by,
                attachment: '',
                attachment_mime_type: '',
                student_displayname: StudyGroupData.displayName,
                student_img_url: `${config.cdn_url}${StudyGroupData.studygroupUserSenderIcon}`,
            });
            answerBl.postMessage(data, true, req);
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
}

module.exports = {
    create,
    listGroups,
    leaveGroup,
    blockFromGroup,
    updateGroupInfo,
    canCreateGroup,
    groupInfo,
    invite,
    accept,
    invitationStatus,
    getSignedURL,
    isStudyGroupEnabled,
    mute,
    isNotificationEnabled,
    updateGroupCache,
    unreadMessageWidget,
    isNotificationEnabledV2,
    postLiveClassStartMessageByTeacher,
};
