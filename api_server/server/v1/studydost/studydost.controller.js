const _ = require('lodash');
const moment = require('moment');
const logger = require('../../../config/winston').winstonLogger;
const StudyDostManager = require('../../helpers/studydost');
const doubtPeCharchaMysql = require('../../../modules/mysql/doubtPeCharcha');
const studyGroupMysql = require('../../../modules/mysql/studyGroup');
const { setStudyGroupDetail } = require('../../../modules/redis/studygroup');
const { sendFcm } = require('../../../modules/utility');
const { getFcmId } = require('../../../modules/mysql/studydost');
const redisLibrairy = require("../../../modules/redis/library");
const redisClient = require("../../../config/redis");
const p2pData = require("../../../data/doubtPeCharcha.data");
const microService = require("../../../modules/microservice");
const DoubtPeCharchaHelper = require("../../helpers/doubtPeCharcha");

async function request(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        console.log(studentId, locale, studentClass);
        const studyDostObj = new StudyDostManager(req, studentClass, studentId, locale, db, config, db.mongo);
        const requestedData = await studyDostObj.request();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: requestedData,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'studydost', source: 'request', error: errorLog });
        next(e);
    }
}
function isInt(value) {
    return !isNaN(value)
        && parseInt(Number(value)) == value
        && !isNaN(parseInt(value, 10));
}

async function sendNotification(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { student_fname: studentName } = req.user;
        const { locale } = req.user;
        const roomId = req.body.room_id;
        console.log(roomId, ' ROOM ID');
        const { message } = req.body;
        const { active_students: activeStudents } = req.body;
        const { is_profane: isProfane } = req.body;
        const studyDostObj = new StudyDostManager(req, studentClass, studentId, locale, db, config, db.mongo);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        if (!isInt(roomId)) {
            if (roomId.startsWith('p2p') && !isProfane) {
                try {
                    // p2p room
                    const isHost = await doubtPeCharchaMysql.isHost(roomId, studentId, db.mysql.read);
                    let hostData = [];
                    const notificationData = {
                        event: 'doubt_pe_charcha',
                        image: null,
                        firebase_eventtag: 'p2p',
                    };
                    if (isHost && isHost[0].EXIST === 0) {
                        console.log('yes helper requested');
                        let sendMessage = message;
                        if (typeof (message) === 'object' && _.has(message, 'widget_data.child_widget.widget_data.title')) {
                            sendMessage = message.widget_data.child_widget.widget_data.title;
                        }
                        notificationData.title = 'Aapke doubt group pe helper ne response kiya hai';
                        notificationData.message = sendMessage;
                        notificationData.firebase_eventtag = 'p2p_helper_reply';
                        notificationData.data = {
                            title: 'Doubt', room_id: roomId, room_type: 'p2p', is_host: true, is_reply: true, is_message: true,
                        };
                        hostData = await doubtPeCharchaMysql.getHostDetailsNotification(roomId, activeStudents, db.mysql.read);
                        const isWhatsappOpted = await redisLibrairy.getByKey(`P2P_WA_${roomId}`, redisClient);
                        if (isWhatsappOpted) {
                            const p2pObj = new DoubtPeCharchaHelper(req, studentClass, studentId, locale, db, config, db.mongo);
                            const roomDeeplink = await p2pObj.getRoomBranchLink();
                            const data = {
                                phone: parseInt(`91${hostData[0].mobile}`),
                                studentId: hostData[0].student_id,
                                text: `${p2pData.on_each_msg_whatsapp}\n${roomDeeplink}`,
                                preview: false,
                                bulk: false,
                            };
                            microService.requestMicroServer('/api/whatsapp/send-text-msg', data, this.req.headers['x-auth-token'], this.req.headers.version_code, 'PUT');
                        }
                    } else if (isHost && isHost[0].EXIST === 1) {
                        console.log('owner replied');
                        const name = studentName || 'Doubtnut user';
                        notificationData.title = `${name} has replied on the group!`;
                        notificationData.message = 'Join karen wapis and doubt ko milke karen solve turant!';
                        notificationData.firebase_eventtag = 'p2p_asker_reply';
                        notificationData.data = {
                            title: 'Doubt', room_id: roomId, room_type: 'p2p', is_host: false, is_reply: true, is_message: true,
                        };
                        hostData = await doubtPeCharchaMysql.getHelperDetails(roomId, activeStudents, db.mysql.read);
                    }
                    if (hostData.length) {
                        for (let i = 0; i < hostData.length; i++) {
                            if (hostData[i].gcm_reg_id) {
                                sendFcm(hostData[i].student_id, hostData[i].gcm_reg_id, notificationData, null, null);
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
                return res.status(responseData.meta.code).json(responseData);
            } if (roomId.startsWith('sg-')) {
                // we're only updating LAST_SENT
                setStudyGroupDetail(roomId, 'LAST_SENT', moment().add(5, 'hours').add(30, 'minutes').toDate(), db.redis.write);
                return res.status(responseData.meta.code).json(responseData);
            }
            const roomDetails = await studyDostObj.getStudyDostRoomId();
            if (roomDetails && roomDetails.room_id) {
                // studydost room
                const studyDostStudentId = (roomDetails.student1 === req.user.student_id ? roomDetails.student2 : roomDetails.student1);
                const notificationData = {
                    event: 'live_class_chat',
                    title: 'आपके स्टडी दोस्त ने आपको मैसेज किया है!',
                    image: null,
                    firebase_eventtag: 'studydost',
                    message,
                    data: { assortment_id: roomId, title: 'Study Dost', room_type: 'studydost' },
                };
                const fcmId = await getFcmId(db.mysql.read, studyDostStudentId);
                if (fcmId && fcmId[0].gcm_reg_id) {
                    sendFcm(studyDostStudentId, fcmId[0].gcm_reg_id, notificationData, null, null);
                }
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        responseData.meta = { code: 400, success: false, message: 'FAILURE' };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function blockRoom(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        let studentClass = req.user.student_class;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        const studyDostObj = new StudyDostManager(req, studentClass, studentId, locale, db, config, db.mongo);
        if (req.method === 'GET') {
            if (await studyDostObj.isRoomBlocked()) {
                responseData.data = {
                    is_blocked: true,
                    level: 0,
                    description: 'Find Your Doubtnut Study Dost and learn Together',
                    cta_text: 'Request for Doubtnut Study Dost',
                    image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4D763EA8-AA87-4964-21FB-5373DFD5C9DE.webp',
                };
            } else {
                responseData.data = { is_blocked: false, level: 2 };
            }
        } else if (req.method === 'POST') {
            console.log('POST');
            await studyDostObj.blockRoom();
            responseData.data = {
                is_blocked: true,
                level: 0,
                description: 'Find Your Doubtnut Study Dost and learn Together',
                cta_text: 'Request for Doubtnut Study Dost',
                image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4D763EA8-AA87-4964-21FB-5373DFD5C9DE.webp',
            };
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e, 'eeeee');
        next(e);
    }
}

module.exports = {
    request,
    blockRoom,
    sendNotification,
};
