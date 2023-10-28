const moment = require('moment');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const VideoView = require('./videoView');
const Utility = require('./utility');
const Constant = require('./constants');
const Milestones = require('./mysql/milestones');
const Question = require('./question');
const Feedback = require('./feedback');
const Student = require('./student');
const TestSeries = require('./mysql/testseries');
const Feed = require('./feed');
const redisVV = require('./redis/videoView');
const AnswerContainer = require('./containers/answer');

// const appConstants = require('./constants');
// const badgeDetails = appConstants.getBadgeDetails();
/**
  DON'T DELETE
  Disabled Zeroth day notification in sendFcm , if needed to enabled at zero day check sendFcm
* */

module.exports = class Notifications {
    static getLiveClassResourcesQuery() {
        return 'select a.* from (SELECT * FROM liveclass_course_resources WHERE  player_type=\'liveclass\' and resource_reference is not null and resource_type=4) as a left join (SELECT * FROM liveclass_course_details where live_at>=? AND live_at<?) as b on a.liveclass_course_detail_id=b.id where b.id is not null';
    }

    static _getAllNotifications(student_id, database) {
        const sql = 'select * from notifications where student_id =?';
        return database.query(sql, [student_id]);
    }

    static sendNotificationToStudent(type, student_id, admin, db) {
        this.checkUserActiveNotification(type, db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
                Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                    const notification_data1 = {
                        event: 'user_journey',
                        title: notification_data[0].title,
                        message: notification_data[0].message,
                        image: notification_data[0].image_url,
                        data: JSON.stringify({ random: '1' }),
                    };
                    Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, 'user_journey', null, db);
                }).catch((error) => {
                    console.log(error);
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static sendNotification(student_id, event, title, message, image, data, admin, db) {
        Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
            const notification_data1 = {
                event,
                title,
                message,
            };
            if (image !== null) {
                notification_data1.image = image;
            }
            if (data !== null) {
                notification_data1.data = JSON.stringify(data);
            } else {
                notification_data1.data = JSON.stringify({ random: '1' });
            }
            console.log(notification_data1);
            console.log(student_id);
            console.log(studentData[0].gcm_reg_id);
            Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, 'user_journey', null, db);
        }).catch((error) => {
            console.log(error);
        });
    }

    static sendMocktestSubmitNotification(student_id, test_id, admin, db, cdn_url) {
        Student.getGcmByStudentId(student_id, db.mysql.read).then(async (studentData) => {
            const mock_test_notification = await Feed.getCustomQoutes(db.mysql.read, 'MOCK_TEST_SUBMIT_NOTIFICATION');
            const test_data = await TestSeries.getTestSeriesById(db.mysql.read, test_id);
            if (test_data[0].solution_pdf) {
                const notification_data1 = {
                    event: mock_test_notification[0].action,
                    title: mock_test_notification[0].quote,
                    message: mock_test_notification[0].quote_message,
                    data: JSON.stringify({ pdf_url: cdn_url + test_data[0].solution_pdf }),
                };
                Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, 'user_journey', null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static getPendingNotification(student_id, mongodb, cb) {
        const query = { student_id, status: 'pending' };
        mongodb.collection('notification_logs').find(query).limit(1).toArray((err, result) => {
            if (err || !result || !result.length) {
                return cb(err, []);
            }
            mongodb.collection('notification_logs').updateMany({ _id: result[0]._id }, { $set: { status: 'sent' } });
            cb(null, result);
        });

        // let data = [{
        //   "trigger": "home",
        //   "event": "video",
        //   "title": "Video page",
        //   "message": "Begin where you left last time",
        //   "image": "https://doubtnutvideobiz.blob.core.windows.net/q-thumbnail/123.png",
        //   "button_text": "Goto",
        //   "data": JSON.stringify({
        //     "qid": '123',
        //     "page": "INAPP"
        //   })
        // },
        //   {
        //     "trigger": "library",
        //     "event": "video",
        //     "title": "Your Question has been Answered",
        //     "message": "Congrats! Our expert answered your question.",
        //     "image": "https://doubtnutvideobiz.blob.core.windows.net/q-thumbnail/123.png",
        //     "button_text": "Goto",
        //     "data": JSON.stringify({
        //       "qid": "123",
        //       "page": "INAPP"
        //     })
        //   }
        // ]
        // return cb(null, data)
    }

    static async getPendingNotificationNew(mongodb, studentId) {
        const query = { student_id: +studentId, status: 'pending' };
        const data = await mongodb.collection('notification_logs').find(query).limit(1).toArray();
        if (!data || !data.length || !data[0].message) {
            return [];
        }
        mongodb.collection('notification_logs').updateMany({ _id: data[0]._id }, { $set: { status: 'sent' } });
        return data;
    }

    static async firstQuestionEver(sid, qid, gcm_reg_id, admin, db) {
        // check active
        const external_url = Constant.getUpdateAppUrl();
        this.checkUserActiveNotification('first_delight_match', db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0 && notification_data[0].type == 'first_delight_match') {
                Question.firstQuestionAsk(sid, qid, db.mysql.read).then((result) => {
                    console.log('result');
                    console.log(result);
                    if (result && result.length > 0 && result[0].show_rating === 1) {
                        const param = { url: external_url };
                        // send notification
                        const notification_data1 = {
                            event: 'external_url',
                            title: notification_data[0].title,
                            message: notification_data[0].message,
                            image: notification_data[0].image_url,
                            data: JSON.stringify(param),
                        };
                        Utility.sendFcm(sid, gcm_reg_id, notification_data1, 'first_delight_match', null, db);
                    }
                }).catch((error) => {
                    console.log('error 1');
                    console.log(error);
                });
            }
        }).catch((error) => {
            console.log('error 2');
            console.log(error);
        });
    }

    static async completeVideoView(qid, student, admin, db, config) {
        this.getLiveClasses(db.mysql.read).then(async (data) => {
            const questionIds = data.map((a) => a.resource_reference);
            if (questionIds.includes(qid)) {
                const notificationPayload = {};
                notificationPayload.event = 'live_class';
                notificationPayload.image = `${config.staticCDN}q-thumbnail/${qid}.png`;
                notificationPayload.data = {};
                notificationPayload.data.id = qid;
                notificationPayload.data.page = 'LIVECLASS';
                notificationPayload.data.resource_type = 'video';
                if (student.student_class == '9') {
                    if (student.locale == 'hi') {
                        notificationPayload.title = 'कहीं की जल्दी है? इस कॉन्टेस्ट पर डालो नज़र!';
                        notificationPayload.message = 'क्विज खेल बनो रोज़ विनर रु30000 तक के इनाम के!';
                        notificationPayload.s_n_id = '9WLIVH';
                        notificationPayload.firebase_eventtag = '9WLIVH';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '9WLIVH', null, db);
                    } else {
                        notificationPayload.title = 'Kahin ki jaldi hai? Is contest par daalo nazar!';
                        notificationPayload.message = 'Quiz khel bano winner Rs.30000 tak ke prize ke!';
                        notificationPayload.s_n_id = '9WLIV';
                        notificationPayload.firebase_eventtag = '9WLIV';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '9WLIV', null, db);
                    }
                } else if (student.student_class == '10') {
                    if (student.locale == 'hi') {
                        notificationPayload.title = 'बढ़ चुके हैं आपके विनर बनने के चांस!';
                        notificationPayload.message = 'कॉन्टेस्ट खेल, जीतो रु30000 तक के इनाम!';
                        notificationPayload.s_n_id = '10WLIVH';
                        notificationPayload.firebase_eventtag = '10WLIVH';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '10WLIVH', null, db);
                    } else {
                        notificationPayload.title = 'Badh chuke hain aapke winner banne ke chance!';
                        notificationPayload.message = 'Quiz khel jeeto Rs30000 tak ke prize!';
                        notificationPayload.s_n_id = '10WLIV';
                        notificationPayload.firebase_eventtag = '10WLIV';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '10WLIV', null, db);
                    }
                } else if (student.student_class == '11') {
                    if (student.locale == 'hi') {
                        notificationPayload.title = 'कैलेंडर पर मार्क कर लो कल की डेट!';
                        notificationPayload.message = 'कॉन्टेस्ट खेल बनो विनर रु30000 तक के इनाम के!';
                        notificationPayload.s_n_id = '11WLIVH';
                        notificationPayload.firebase_eventtag = '11WLIVH';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '11WLIVH', null, db);
                    } else {
                        notificationPayload.title = 'Calender par mark kar lo kal ki date!';
                        notificationPayload.message = 'Quiz khel bano winner Rs30000 tak ke prize ke!';
                        notificationPayload.s_n_id = '11WLIV';
                        notificationPayload.firebase_eventtag = '11WLIV';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '11WLIV', null, db);
                    }
                } else if (student.student_class == '12') {
                    if (student.locale == 'hi') {
                        notificationPayload.title = 'आपकी मंज़िल है बहुत करीब, खेलो कॉन्टेस्ट!';
                        notificationPayload.message = 'करो रु30000 तक के इनाम अपने नाम!';
                        notificationPayload.s_n_id = '12WLIVH';
                        notificationPayload.firebase_eventtag = '12WLIVH';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '12WLIVH', null, db);
                    } else {
                        notificationPayload.title = 'Aapki manzil hai bahut paas!, Khelo contest!\n';
                        notificationPayload.message = 'Karo Rs30000 tak ke prize apne naam!';
                        notificationPayload.s_n_id = '12WLIV';
                        notificationPayload.firebase_eventtag = '12WLIV';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '12WLIV', null, db);
                    }
                } else if (student.student_class == '13') {
                    if (student.locale == 'hi') {
                        notificationPayload.title = 'आपकी मंज़िल है बहुत करीब, खेलो कॉन्टेस्ट!';
                        notificationPayload.message = 'करो रु30000 तक के इनाम अपने नाम!';
                        notificationPayload.s_n_id = '13WLIVH';
                        notificationPayload.firebase_eventtag = '13WLIVH';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '13WLIVH', null, db);
                    } else {
                        notificationPayload.title = 'Aapki manzil hai bahut paas!, Khelo contest!\n';
                        notificationPayload.message = 'Karo Rs30000 tak ke prize apne naam!';
                        notificationPayload.s_n_id = '13WLIV';
                        notificationPayload.firebase_eventtag = '13WLIV';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, '13WLIV', null, db);
                    }
                }
            }
        }).catch((error) => {
            console.log('error 1');
            console.log(error);
        });
    }

    static async incompleteVideoView(qid, student, admin, db, config) {
        this.getLiveClasses(db.mysql.read).then(async (data) => {
            const questionIds = data.map((a) => a.resource_reference);
            if (questionIds.includes(qid)) {
                const qIds = await redisVV.getLiveClassIncomplete(student.student_id, db.redis.read);
                let qIdsArray = [];
                if (qIds != null) {
                    qIdsArray = qIds.split(',');
                }
                const stCount = qIdsArray.length;
                if (!qIdsArray.includes(qid)) {
                    const notificationPayload = {};
                    let dateUTC = new Date();
                    dateUTC = dateUTC.getTime();
                    const dateIST = new Date(dateUTC);
                    // date shifting for IST timezone (+5 hours and 30 minutes)
                    dateIST.setHours(dateIST.getHours() + 5);
                    dateIST.setMinutes(dateIST.getMinutes() + 30);
                    const todayEnd = new Date(dateIST);
                    todayEnd.setHours(23);
                    todayEnd.setMinutes(59);
                    const expire = Math.floor((todayEnd - dateIST) / 1000);
                    notificationPayload.event = 'live_class';
                    notificationPayload.image = `${config.staticCDN}q-thumbnail/${qid}.png`;
                    notificationPayload.data = {};
                    notificationPayload.data.id = qid;
                    notificationPayload.data.page = 'LIVECLASS';
                    notificationPayload.data.resource_type = 'video';
                    if (stCount == 0) {
                        if (student.locale == 'hi') {
                            notificationPayload.title = 'क्या फ्री क्लासेज नहीं कर रहे अटेंड?';
                            notificationPayload.message = 'तो आप हाथ से गंवा रहे हैं रु30000 तक के इनाम के!';
                            notificationPayload.s_n_id = 'LIVE1';
                            notificationPayload.firebase_eventtag = 'LIVE1';
                            Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, 'LIVE1', null, db);
                            qIdsArray.push(qid);
                            const str = qIdsArray.join();
                            redisVV.setLiveClassIncomplete(student.student_id, str, expire, db.redis.write);
                        } else {
                            notificationPayload.title = 'Free classes nahin kar rahe attend?';
                            notificationPayload.message = 'Ganwaa rahe hain Rs.30000 tak ke prizes!';
                            notificationPayload.s_n_id = 'LIVE2';
                            notificationPayload.firebase_eventtag = 'LIVE2';
                            Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, 'LIVE2', null, db);
                            qIdsArray.push(qid);
                            const str = qIdsArray.join();
                            redisVV.setLiveClassIncomplete(student.student_id, str, expire, db.redis.write);
                        }
                    } else if (stCount == 1) {
                        if (student.locale == 'hi') {
                            notificationPayload.title = 'जब पढोगे और बढ़ोगे, तभी तो विनर बनोगे!';
                            notificationPayload.message = 'रु30000 तक के इनाम के! बिलकुल न करें इग्नोर!';
                            notificationPayload.s_n_id = 'LIVE3';
                            notificationPayload.firebase_eventtag = 'LIVE3';
                            Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, 'LIVE3', null, db);
                            qIdsArray.push(qid);
                            const str = qIdsArray.join();
                            redisVV.setLiveClassIncomplete(student.student_id, str, expire, db.redis.write);
                        } else {
                            notificationPayload.title = 'Padhoge aur badhoge, tabhi winner banoge!';
                            notificationPayload.message = 'Rs.30000 tak ke prizes ke! Na karein ignore!Rs.30000 tak ke prizes ke! Na karein ignore!';
                            notificationPayload.s_n_id = 'LIVE4';
                            notificationPayload.firebase_eventtag = 'LIVE4';
                            Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, 'LIVE4', null, db);
                            qIdsArray.push(qid);
                            const str = qIdsArray.join();
                            redisVV.setLiveClassIncomplete(student.student_id, str, expire, db.redis.write);
                        }
                    } else if (student.locale == 'hi') {
                        notificationPayload.title = 'डाउटनट लाया है पढ़ते रहो बढ़ते रहो कॉन्टेस्ट!';
                        notificationPayload.message = 'फ्री क्लासेज अटेंड कर जीतो रु30000 तक के इनाम के!';
                        notificationPayload.s_n_id = 'LIVE5';
                        notificationPayload.firebase_eventtag = 'LIVE5';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, 'LIVE5', null, db);
                        qIdsArray.push(qid);
                        const str = qIdsArray.join();
                        redisVV.setLiveClassIncomplete(student.student_id, str, expire, db.redis.write);
                    } else {
                        notificationPayload.title = 'Khelo Padhte Raho Badhte Raho contest!';
                        notificationPayload.message = 'Free classes dekho, jeeto Rs.30000 tak ke prize!';
                        notificationPayload.s_n_id = 'LIVE6';
                        notificationPayload.firebase_eventtag = 'LIVE6';
                        Utility.sendFcm(student.student_id, student.gcm_reg_id, notificationPayload, 'LIVE6', null, db);
                        qIdsArray.push(qid);
                        const str = qIdsArray.join();
                        redisVV.setLiveClassIncomplete(student.student_id, str, expire, db.redis.write);
                    }
                }
            }
        }).catch((error) => {
            console.log('error 1');
            console.log(error);
        });
    }

    static checkLastNdaysNquestionAsk(sid, gcm_reg_id, admin, db) {
        const mongoRead = db.mongo.read;
        // check active
        const external_url = Constant.getUpdateAppUrl();
        this.checkUserActiveNotification('loyal_30days', db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0 && notification_data[0].type == 'loyal_30days') {
                // check last sent notification time
                mongoRead.collection('notification_logs').findOne({
                    student_id: sid,
                    type: 'loyal_30days',
                    time: {
                        $gte: moment().subtract(30, 'd').toDate(),
                    },
                }, (err, res) => {
                    if (err) {
                        console.log(err);
                        // cb(false);
                    }
                    console.log('res');
                    console.log(res);
                    if (res) {
                        console.log('exist');
                        // update its time
                        // self.updateNotificationSetting(student_id, mongoWrite, function (err, res) {
                        // if (err !== false) {
                        // cb(true)
                        // }
                        // cb(false)
                        // })
                    } else {
                        console.log('not exist');
                        // send notification
                        const notification_data1 = {
                            event: 'external_url',
                            title: notification_data[0].title,
                            message: notification_data[0].message,
                            image: notification_data[0].image_url,
                            data: JSON.stringify({ url: external_url }),
                        };
                        Utility.sendFcm(sid, gcm_reg_id, notification_data1, 'loyal_30days', null, db);
                        // self.insertNotificationSetting(student_id, mongoWrite, function (err, res) {
                        // if (err != false) {
                        // cb(true)
                        // }
                        // cb(true)
                        // })
                    }
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static checkNotificationSetting(student_id, db, cb) {
        console.log('student');
        console.log(student_id);

        const mongoRead = db.mongo.read;
        const mongoWrite = db.mongo.write;
        const self = this;
        mongoRead.collection('notification_setting').findOne({
            student_id,
            status: false,
            date: {
                $lt: moment().subtract(7, 'd').toDate(),
            },
        }, (err, res) => {
            if (err) {
                console.log(err);
                cb(false);
            }
            console.log('res');
            console.log(res);
            if (res) {
                console.log('exist');
                // update its time
                self.updateNotificationSetting(student_id, mongoWrite, () => {
                    // if (err !== false) {
                    cb(true);
                    // }
                    // cb(false)
                });
            } else {
                console.log('not exist');
                self.insertNotificationSetting(student_id, mongoWrite, () => {
                    // if (err != false) {
                    cb(true);
                    // }
                    // cb(true)
                });
            }
        });
    }

    static insertNotificationSetting(student_id, mongoDb, cb) {
        mongoDb.collection('notification_setting').insertOne({
            student_id,
            status: false,
            date: moment().toDate(),
        }, (err, res) => {
            if (err) {
                cb(true, err);
            }
            cb(false, res);
        });
    }

    static updateNotificationSetting(student_id, mongoDb, cb) {
        mongoDb.collection('notification_setting').update({
            student_id,
        }, { $set: { date: moment().toDate() } }, (err, res) => {
            if (err) {
                cb(true, err);
            }
            cb(false, res);
        });
    }

    static async resumeVideoNotification(sid, qid, answer_id, video_time, view_id, db) {
        const mongo = db.mongo.write;
        const result = await AnswerContainer.getByQuestionIdWithTextSolution(qid, db);
        const duration = (result.length && result[0].duration) ? result[0].duration : null;
        if (duration && (parseInt(duration) - parseInt(video_time)) >= 10) {
            const res = await this.checkUserActiveNotification('resume_video', db.mysql.read);
            if (res.length && res[0].type == 'resume_video') {
                const data = {
                    trigger: 'home',
                    event: 'video',
                    title: res[0].title,
                    message: res[0].message,
                    image: `${res[0].image_url + qid}.png`,
                    button_text: res[0].button_text,
                    data: JSON.stringify({
                        qid,
                        page: 'INAPP',
                        title: (result.length && result[0].ocr_text) ? result[0].ocr_text : '',
                        image: `${res[0].image_url + qid}.png`,
                        video_time,
                        duration,
                    }),
                };
                mongo.collection('notification_logs').update({ student_id: sid, type: res[0].type }, {
                    student_id: sid,
                    time: new Date(),
                    type: res[0].type,
                    message: data,
                    status: 'pending',
                    ias_status: 'pending',
                }, { upsert: true });
            }
        }
    }

    static checkUserActiveNotification(notificationType, database) {
        const sql = 'select * from user_notification where type = ? and isActive=1';
        return database.query(sql, [notificationType]);
    }

    static getLiveClasses(database) {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const todayStartDateTime = now.startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todayEndDateTime = now.endOf('day').format('YYYY-MM-DD HH:mm:ss');
        return database.query(this.getLiveClassResourcesQuery(), [todayStartDateTime, todayEndDateTime]);
    }

    static compare(dateTimeA, dateTimeB) {
        const momentA = moment(dateTimeA).startOf('day');
        const momentB = moment(dateTimeB).startOf('day');
        // console.log(momentA +"_"+momentB)
        if (momentA > momentB) return 1;
        if (momentA < momentB) return -1;
        return 0;
    }

    static getBadges(btype, db) {
        const sql = 'select * from user_badges where is_active =1 and type= ?';
        return db.query(sql, [btype]);
    }

    static async videoCountNotifications(student_id, gcm_reg_id, question_id, config, admin, db) {
        const promises = [];
        // get total videos of student
        promises.push(VideoView.checkVideoViewCountByStId(student_id, db.mysql.read));
        // get streak for student for a day
        // promises.push(VideoView.checkVideoViewCountByStIdOfDay(student_id, db.mysql.read))
        // check yesterday trending question
        promises.push(VideoView.checkYesterdayTrendingQuestion(student_id, db.mysql.read));

        const resolvedPromises = await Promise.all(promises);
        const count_values = resolvedPromises[0];
        let isTrending = 0;
        // if (resolvedPromises[1] && resolvedPromises[1].length == 10) {
        //   dayVideos = 1
        // }
        if (resolvedPromises[1] && resolvedPromises[1].length == 2) {
            isTrending = 1;
        }

        if (isTrending) {
            this.checkUserActiveNotification('video_trending', db.mysql.read).then((notification_data) => {
                if (notification_data.length > 0) {
                    // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                    const notification_data1 = {
                        event: 'user_journey',
                        title: notification_data[0].title,
                        message: notification_data[0].message,
                        image: notification_data[0].image_url,
                        data: JSON.stringify({ random: '1' }),
                    };
                    Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'video_trending', null, db);
                    // }).catch(error => {
                    //   console.log(error)
                    // })
                }
            }).catch((error) => {
                console.log(error);
            });
        }
        let c = 0; let
            d = 0;
        const benchmarks = await this.getBadges('videos_viewed', db.mysql.read);
        console.log('becnhmark');
        const benchmarks_array = benchmarks.map((values) => values.upper_count);
        console.log('becnhmark1');
        console.log(benchmarks_array);
        if (count_values.length > 0) {
            console.log(count_values.length);
            if (count_values.length == 1) {
                console.log('first video watch');
                // check for active notification
                this.checkUserActiveNotification('first_video_watch', db.mysql.read).then((notification_data) => {
                    if (notification_data.length > 0) {
                        // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                        const notification_data1 = {
                            event: 'user_journey',
                            title: notification_data[0].title,
                            message: notification_data[0].message,
                            image: notification_data[0].image_url,
                            data: JSON.stringify({ random: '1' }),
                        };
                        Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'first_video_watch', null, db);
                        // }).catch(error => {
                        //   console.log(error)
                        // })
                    }
                }).catch((error) => {
                    console.log(error);
                });
            } else {
                for (let i = 0; i < count_values.length; i++) {
                    // console.log(count_values[i]['created_at'])
                    if (this.compare(count_values[i].created_at, new Date()) == 0) {
                        c++;
                    }
                    d++;
                }
                if (c == 10) {
                    console.log('10 question in a day');
                    this.checkUserActiveNotification('user_video_streak', db.mysql.read).then((notification_data) => {
                        if (notification_data.length > 0) {
                            // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                            const notification_data1 = {
                                event: 'user_journey',
                                title: notification_data[0].title,
                                message: notification_data[0].message,
                                image: notification_data[0].image_url,
                                data: JSON.stringify({ random: '1' }),
                            };
                            Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'user_video_streak', null, db);
                            // }).catch(error => {
                            //   console.log(error)
                            // })
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                console.log('c');
                console.log(c);
                if (c == 10 || c == 50 || c == 100 || c == 200) {
                    // milestone
                    await Milestones.addMilestone('video_view', student_id, c, db.mysql.write);
                    // send notification
                    const type = `${c}_video_per_day`;
                    const notificationData = await this.checkUserActiveNotification(type, db.mysql.read);
                    if (notificationData.length > 0) {
                        const notification_data1 = {
                            event: 'user_journey',
                            title: notificationData[0].title,
                            message: notificationData[0].message,
                            image: notificationData[0].image_url,
                            data: JSON.stringify({ random: '1' }),
                        };
                        Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'first_n_video_watch', null, db);
                        // }).catch(error => {
                        //   console.log(error)
                        // })
                    }
                }

                if (d == 5 || d == 10 || d == 25 || d == 50 || d == 100 || d == 200) {
                    this.checkUserActiveNotification('first_n_video_watch', db.mysql.read).then((notification_data) => {
                        if (notification_data.length > 0) {
                            // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                            const notification_data1 = {
                                event: 'user_journey',
                                title: notification_data[0].title,
                                message: notification_data[0].message,
                                image: notification_data[0].image_url,
                                data: JSON.stringify({ random: '1' }),
                            };
                            Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'first_n_video_watch', null, db);
                            // }).catch(error => {
                            //   console.log(error)
                            // })
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                } else if (_.includes(benchmarks_array, d)) {
                    console.log('Hurray You unlocked a badge');
                    this.checkUserActiveNotification('videowatch_benchmark_hit', db.mysql.read).then((notification_data) => {
                        if (notification_data.length > 0) {
                            // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                            const notification_data1 = {
                                event: 'user_journey',
                                title: notification_data[0].title,
                                message: notification_data[0].message,
                                image: notification_data[0].image_url,
                                data: JSON.stringify({ random: '1' }),
                            };
                            Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'videowatch_benchmark_hit', null, db);
                            // }).catch(error => {
                            //   console.log(error)
                            // });
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                } else {
                    const v = benchmarks_array.filter((value) => {
                        if (((value - d) == 10) || ((value - d) == 50)) {
                            return value;
                        }
                        return null;
                    });
                    if (v.length > 0) {
                        this.checkUserActiveNotification('next_badge_video', db.mysql.read).then((notification_data) => {
                            if (notification_data.length > 0) {
                                // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                                const notification_data1 = {
                                    event: 'user_journey',
                                    title: notification_data[0].title,
                                    message: notification_data[0].message,
                                    image: notification_data[0].image_url,
                                    data: JSON.stringify({ random: '1' }),
                                };
                                Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'next_badge_video', null, db);
                                // }).catch(error => {
                                //   console.log(error)
                                // });
                            }
                        }).catch((error) => {
                            console.log(error);
                        });
                    }
                }
            }
        }
        // }).catch(error => { console.log(error) })
    }

    static async questionCountNotifications(student_id, gcm_reg_id, config, admin, db) {
        const promises = [];
        console.log('notification');
        promises.push(Question.checkQuestionsAskedCount(student_id, db.mysql.read));
        // promises.push(Question.checkQuestionsAskedCountOfaDay(student_id, db.mysql.read))
        // let count_values = await Question.checkQuestionsAskedCount(student_id, db.mysql.read);
        const resolvedPromises = await Promise.all(promises);
        // if (resolvedPromises[1] && resolvedPromises[1].length == 10) {
        //   dayQuestions = 1
        // }
        // if (dayQuestions) {
        //   this.checkUserActiveNotification("user_question_streak", db.mysql.read).then((notification_data) => {
        //     if (notification_data.length > 0) {
        //       // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
        //       let notification_data1 = {
        //         "event": "user_journey",
        //         "title": notification_data[0]['title'],
        //         "message": notification_data[0]['message'],
        //         "image": notification_data[0]['image_url']
        //       }
        //       Utility.sendFcm(student_id, gcm_reg_id, notification_data1, admin, db)
        //       // }).catch(error => {
        //       //   console.log(error)
        //       // })
        //     }
        //   }).catch(error => {
        //     console.log(error)
        //   })
        // }
        const count_values = resolvedPromises[0];
        let c = 0; let d = 0; let
            e = 0;
        const benchmarks = await this.getBadges('question', db.mysql.read);
        const benchmarks_array = benchmarks.map((values) => values.upper_count);
        console.log(benchmarks_array);

        if (count_values.length > 0) {
            if (count_values.length == 1) {
                // check for active notification
                this.checkUserActiveNotification('first_question', db.mysql.read).then((notification_data) => {
                    if (notification_data.length > 0) {
                        // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                        const notification_data1 = {
                            event: 'user_journey',
                            title: notification_data[0].title,
                            message: notification_data[0].message,
                            image: notification_data[0].image_url,
                            data: JSON.stringify({ random: '1' }),
                        };
                        Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'first_question', null);
                        // }).catch(error => {
                        //   console.log(error)
                        // })
                    }
                }).catch((error) => {
                    console.log(error);
                });
            } else {
                const beforeTime = moment().add(-30, 'days').valueOf();
                const currentTimestamp = new Date().getTime();
                for (let i = 0; i < count_values.length; i++) {
                    if (this.compare(count_values[i].timestamp, new Date()) == 0) {
                        c++;
                    }
                    const q_timestamp = moment(count_values[i].timestamp).valueOf();
                    if ((q_timestamp > beforeTime) && (q_timestamp < currentTimestamp)) {
                        e++;
                    }
                    d++;
                }
                console.log(`c=${c}`);
                console.log(`d=${d}`);
                console.log(`e=${e}`);
                if (e >= 15) {
                    // this.checkLastNdaysNquestionAsk(student_id, gcm_reg_id, admin, db)
                }
                // if (c == 10) {
                //   this.checkUserActiveNotification("user_question_streak", db.mysql.read).then((notification_data) => {
                //     if (notification_data.length > 0) {
                //       // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                //       let notification_data1 = {
                //         "event": "user_journey",
                //         "title": notification_data[0]['title'],
                //         "message": notification_data[0]['message'],
                //         "image": notification_data[0]['image_url']
                //       }
                //       Utility.sendFcm(student_id, gcm_reg_id, notification_data1, "user_question_streak", admin, db)
                //       // }).catch(error => {
                //       //   console.log(error)
                //       // })
                //     }
                //   }).catch(error => {
                //     console.log(error)
                //   })
                // }
                if (c == 3 || c == 10 || c == 50 || c == 200) {
                    // milestone
                    console.log('c');
                    console.log(c);
                    await Milestones.addMilestone('question_asked', student_id, c, db.mysql.write);
                    const type = `${c}_question_per_day`;
                    const notificationData = await this.checkUserActiveNotification(type, db.mysql.read);
                    if (notificationData.length > 0) {
                        const notification_data1 = {
                            event: 'user_journey',
                            title: notificationData[0].title,
                            message: notificationData[0].message,
                            image: notificationData[0].image_url,
                            data: JSON.stringify({ random: '1' }),
                        };
                        Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'first_n_video_watch', null, db);
                        // }).catch(error => {
                        //   console.log(error)
                        // })
                    }
                }
                if (d == 5 || d == 10 || d == 25 || d == 50 || d == 100 || d == 200) {
                    this.checkUserActiveNotification('first_n_question', db.mysql.read).then((notification_data) => {
                        if (notification_data.length > 0) {
                            // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                            const notification_data1 = {
                                event: 'user_journey',
                                title: notification_data[0].title,
                                message: notification_data[0].message,
                                image: notification_data[0].image_url,
                                data: JSON.stringify({ random: '1' }),
                            };
                            Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'first_n_question', null, db);
                            // }).catch(error => {
                            //   console.log(error)
                            // })
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                if (_.includes(benchmarks_array, d)) {
                    console.log('Hurray You unlocked a badge');

                    this.checkUserActiveNotification('ask_benchmark_hit', db.mysql.read).then((notification_data) => {
                        if (notification_data.length > 0) {
                            // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                            const notification_data1 = {
                                event: 'user_journey',
                                title: notification_data[0].title,
                                message: notification_data[0].message,
                                image: notification_data[0].image_url,
                                data: JSON.stringify({ random: '1' }),
                            };
                            Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'ask_benchmark_hit', null, db);
                            // }).catch(error => {
                            //   console.log(error)
                            // })
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                } else {
                    const v = benchmarks_array.filter((value) => {
                        if (((value - d) == 10) || ((value - d) == 50)) {
                            return value;
                        }
                        return null;
                    });
                    if (v.length > 0) {
                        this.checkUserActiveNotification('next_badge_question', db.mysql.read).then((notification_data) => {
                            if (notification_data.length > 0) {
                                // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                                const notification_data1 = {
                                    event: 'user_journey',
                                    title: notification_data[0].title,
                                    message: notification_data[0].message,
                                    image: notification_data[0].image_url,
                                    data: JSON.stringify({ random: '1' }),
                                };
                                Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'next_badge_question', null, db);
                                // }).catch(error => {
                                //   console.log(error)
                                // });
                            }
                        }).catch((error) => {
                            console.log(error);
                        });
                    }
                }
            }
        }
    }

    static communityUpvoteQuestion(student_id, question_id, admin, db) {
        this.checkUserActiveNotification('upvote_question', db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
                Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                    console.log(studentData);
                    const notification_data1 = {
                        event: 'community_question',
                        title: notification_data[0].title,
                        message: notification_data[0].message,
                        image: notification_data[0].image_url,
                        data: JSON.stringify({
                            qid: question_id,
                        }),
                    };
                    Utility.sendFcm(student_id, studentData[0].gcm_reg_id, notification_data1, 'upvote_question', null, db);
                }).catch((error) => {
                    console.log(error);
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static communityQuestionPosted(student_id, gcm_reg_id, question_id, admin, db) {
        this.checkUserActiveNotification('community_ask', db.mysql.read).then((notification_data) => {
            console.log('notification_data');
            console.log(notification_data);
            if (notification_data.length > 0) {
                // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                const notification_data1 = {
                    event: 'community_question',
                    title: notification_data[0].title,
                    message: notification_data[0].message,
                    image: notification_data[0].image_url,
                    data: JSON.stringify({
                        qid: question_id,
                        resource_type: 'video',
                    }),
                };
                Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'community_ask', null, db);
                // }).catch(error => {
                //   console.log(error)
                // })
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static communityQuestionVoted(student_id, gcm_reg_id, question_id, admin, db) {
        this.checkUserActiveNotification('community_voted', db.mysql.read).then((notification_data) => {
            console.log('notification_data');
            console.log(notification_data);
            if (notification_data.length > 0) {
                // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                const notification_data1 = {
                    event: 'community_question',
                    title: notification_data[0].title,
                    message: notification_data[0].message,
                    image: notification_data[0].image_url,
                    data: JSON.stringify({
                        qid: question_id,
                        resource_type: 'video',
                    }),
                };
                Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'community_voted', null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static askExpert(student_id, gcm_reg_id, question_id, admin, db) {
        this.checkUserActiveNotification('solve_it_for_me', db.mysql.read).then((notification_data) => {
            if (notification_data.length > 0) {
                // Student.getGcmByStudentId(student_id, db.mysql.read).then((studentData) => {
                const notification_data1 = {
                    event: 'user_journey',
                    title: notification_data[0].title,
                    message: notification_data[0].message,
                    image: notification_data[0].image_url,
                    data: JSON.stringify({ random: '1' }),
                };
                Utility.sendFcm(student_id, gcm_reg_id, notification_data1, 'solve_it_for_me', null, db);
                // }).catch(error => {
                //   console.log(error)
                // })
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static async addVideoFeedbackNotification(rating, student_id, gcm_reg_id, admin, db) {
        let message;

        if (rating == 5) {
            let sendNotification = true;
            const recents = await Feedback.getLast3VideoFeedback(student_id, db.mysql.read);
            if (recents && recents.length >= 3) {
                recents.forEach((rows) => {
                    if (rows.rating <= 3) {
                        sendNotification = false;
                    }
                });
                if (!sendNotification) {
                    const result = await this.checkUserActiveNotification('user_like_answers', db.mysql.read);
                    console.log(`result${result}`);
                    if (result.length > 0) {
                        console.log('results');
                        console.log(`hello${result}`);
                        message = {};
                        message.event = 'user_journey';
                        message.image = result[0].image_url;
                        message.message = result[0].message;
                        message.title = result[0].title;
                        message.data = JSON.stringify({ random: '1' });
                    }
                    Utility.sendFcm(student_id, gcm_reg_id, message, 'user_like_answers', null, db);
                }
            }
        } else {
            let sendNotification = true;
            const recents = await Feedback.getLast3VideoFeedback(student_id, db.mysql.read);
            if (recents && recents.length >= 3) {
                recents.forEach((rows) => {
                    if (rows.rating > 3) {
                        sendNotification = false;
                    }
                });
                if (!sendNotification) {
                    const result = await this.checkUserActiveNotification('user_dislike_answers', db.mysql.read);
                    if (result.length > 0) {
                        message = {};
                        message.event = 'user_journey';
                        message.image = result[0].image_url;
                        message.message = result[0].message;
                        message.title = result[0].title;
                        message.data = JSON.stringify({ random: '1' });
                        Utility.sendFcm(student_id, gcm_reg_id, (message), 'user_dislike_answers', null, db);
                    }
                }
            }
        }
    }

    static async userSignupNotification(student_id, gcm_reg_id, admin, db) {
        this.checkUserActiveNotification('signup', db.mysql.read).then((result) => {
            if (result.length > 0) {
                const notification_data = {
                    event: 'daily_contest',
                    title: result[0].title,
                    message: result[0].message,
                    image: result[0].image_url,
                    data: JSON.stringify({ qid: 2169870, page: 'NOTIFICATION', resource_type: 'video' }),
                };
                Utility.sendFcm(student_id, gcm_reg_id, notification_data, 'signup', null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static async userInviteNotification(student_id, gcm_reg_id, admin, db) {
        this.checkUserActiveNotification('invite', db.mysql.read).then((result) => {
            if (result.length > 0) {
                const notification_data = {
                    event: 'invite',
                    title: result[0].title,
                    message: result[0].message,
                    image: result[0].image_url,
                    date: JSON.stringify({ random: '1' }),
                };
                Utility.sendFcm(student_id, gcm_reg_id, notification_data, 'invite', null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static commentEntityNotification(fcm_id, entity_type, entity_id, username, admin, db) {
        this.checkUserActiveNotification('comment_entity_thread', db.mysql.read).then((result) => {
            if (result.length > 0) {
                result[0].title = result[0].title.replace(/Someone/i, username);
                const notification_data = {
                    event: 'feed_details',
                    title: result[0].title,
                    message: result[0].message,
                    image: result[0].image_url,
                    data: JSON.stringify({ type: entity_type, id: entity_id }),
                };
                const topic = `${entity_type}_${entity_id}`;
                Utility.sendEntityNotification(topic, fcm_id, notification_data, null);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static commentNotification(fcm_id, entity_type, entity_id, username, student_id, admin, db) {
        this.checkUserActiveNotification('comment_entity_thread', db.mysql.read).then((result) => {
            if (result.length > 0) {
                result[0].title = result[0].title.replace(/Someone/i, username);
                let notification_data = {};
                if (entity_type == 'new_feed_type') {
                    notification_data = {
                        event: 'post_detail',
                        title: result[0].title,
                        message: result[0].message,
                        image: result[0].image_url,
                        data: JSON.stringify({ post_id: entity_id, feed_trigger: 'post_comment_all' }),
                    };
                } else {
                    notification_data = {
                        event: 'feed_details',
                        title: result[0].title,
                        message: result[0].message,
                        image: result[0].image_url,
                        data: JSON.stringify({ type: entity_type, id: entity_id }),
                    };
                }
                const topic = `${entity_type}_${entity_id}`;
                Utility.sendNoNotification(topic, fcm_id, notification_data, entity_id, entity_type, student_id, null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static commentEntityOwnerNotification(student_id, gcm_reg_id, entity_type, entity_id, username, admin, db) {
        this.checkUserActiveNotification('comment_entity', db.mysql.read).then((result) => {
            if (result.length > 0) {
                result[0].title = result[0].title.replace(/Someone/i, username);
                let notification_data = {};
                if (entity_type == 'new_feed_type') {
                    notification_data = {
                        event: 'post_detail',
                        title: result[0].title,
                        message: result[0].message,
                        image: result[0].image_url,
                        data: JSON.stringify({ post_id: entity_id }),
                    };
                } else {
                    notification_data = {
                        event: 'feed_details',
                        title: result[0].title,
                        message: result[0].message,
                        image: result[0].image_url,
                        data: JSON.stringify({ type: entity_type, id: entity_id }),
                    };
                }
                Utility.sendFcm(student_id, gcm_reg_id, notification_data, 'comment_entity', null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static commentLikeNotification(student_id, gcm_reg_id, entity_type, entity_id, username, admin, db) {
        this.checkUserActiveNotification('comment_like', db.mysql.read).then((result) => {
            if (result.length > 0) {
                result[0].title = result[0].title.replace(/Someone/i, username);
                let notification_data = {};
                if (entity_type == 'new_feed_type') {
                    notification_data = {
                        event: 'post_detail',
                        title: result[0].title,
                        message: result[0].message,
                        image: result[0].image_url,
                        data: JSON.stringify({ post_id: entity_id, feed_trigger: 'post_like_comment' }),
                    };
                } else {
                    notification_data = {
                        event: 'feed_details',
                        title: result[0].title,
                        message: result[0].message,
                        image: result[0].image_url,
                        data: JSON.stringify({ type: entity_type, id: entity_id, feed_trigger: 'post_like_reply' }),
                    };
                }
                Utility.sendFcm(student_id, gcm_reg_id, notification_data, 'comment_like', null, db);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    static async getScheduleNotification(student_id, mongodb) {
        const query = {
            createdAt: {
                $gte: new Date(moment().startOf('day').toISOString()),
            },
            studentId: student_id.toString(),
            'data.event': 'video',
            $or: [{ in_app_seen: { $exists: false } }, { in_app_seen: false }],

        };
        return mongodb.collection('notification').find(query).sort({ time: -1 }).limit(1)
            .toArray();
    }

    static async updateInAppShownInScheduleNotification(post_id, mongodb) {
        return mongodb.collection('notification').update({ _id: ObjectID(post_id) }, { $set: { in_app_seen: true } });
    }

    static async liveClassNotification(db, notificationLogData, mysqlData) {
        const mongo = db.mongo.write;
        try {
            await mongo.collection('notification_logs').insertOne(notificationLogData);
            Student.insertNotificationRecord(db.mysql.write, mysqlData);
        } catch (err) {
            console.log(err);
        }
    }

    static async removeLiveClassNotification(db, type) {
        const mongo = db.mongo.write;
        const deleteObj = {
            type,
        };
        try {
            await mongo.collection('notification_logs').remove(deleteObj);
        } catch (err) {
            console.log(err);
            return 0;
        }
        return 1;
    }

    static async getLastWatchedVideoForIas(mongodb, studentId) {
        const query = { student_id: studentId, ias_status: 'pending' };
        const lastWatchedVideo = await mongodb.collection('notification_logs').find(query).limit(1).toArray() || [];
        if (!lastWatchedVideo || !lastWatchedVideo.length || !lastWatchedVideo[0].message || !lastWatchedVideo[0].message.data || !JSON.parse(lastWatchedVideo[0].message.data).duration) {
            return [];
        }
        mongodb.collection('notification_logs').updateMany({ _id: lastWatchedVideo[0]._id }, { $set: { ias_status: 'sent' } });
        return [JSON.parse(lastWatchedVideo[0].message.data)];
    }
};
