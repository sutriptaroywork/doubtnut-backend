const moment = require('moment');
const Notification = require('../../../modules/notifications');
const redisAnswer = require('../../../modules/redis/answer');
const CourseContainer = require('../../../modules/containers/coursev2');

function getAllAction(req, res, next) {
    // let student_id = req.user.student_id;
    const db = req.app.get('db');
    const { student_id } = req.user;
    Notification._getAllNotifications(student_id, db.mysql.read).then((values) => {
        const result = [];

        if (values.length > 0) {
            values.forEach((arr_item) => {
                // console.log("hello");
                arr_item.content = arr_item.content.replace("u'", "'");

                result.push(arr_item);
            });
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: result,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: 'No Notifications for You',
            };
            res.status(responseData.meta.code).json(responseData);
        }
    }).catch((error) => {
        next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "message": "BAD ERROR"
        //   },
        //   "data": "Something went wrong"
        // }
        // res.status(responseData.meta.code).json(responseData);
    });
}

function getContentType(etTime, bufferDay) {
    const timeStamp = moment().add(5, 'h').add(30, 'minutes').unix();
    if (etTime && (timeStamp - (+etTime)) > 0) {
        return 1;
    }
    if (bufferDay && (timeStamp - (+bufferDay)) > 0) {
        return 2;
    }
    return 0;
}

function getPending(req, res, next) {
    const db = req.app.get('db');
    const config = req.app.get('config');
    const { student_id } = req.user;
    const { version_code: versionCode } = req.headers;

    try {
        Notification.getPendingNotification(student_id, db.mongo.read, async (err, response) => {
            if (err == null) {
                const data = [];
                if (+versionCode <= 1010) {
                    for (let i = 0; i < response.length; i++) {
                        data.push(response[i].message);
                    }

                    if (+versionCode >= 972) {
                        const [etTime, bufferDay, userActiveCourses] = await Promise.all([
                            redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, student_id, 'LIVECLASS_VIDEO_LF_ET_TIME'),
                            redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, student_id, 'LIVECLASS_VIDEO_LF_ET_BUFFER_TIME'),
                            CourseContainer.getUserActivePackages(db, student_id),
                        ]);
                        const contentType = getContentType(etTime, bufferDay);
                        if (userActiveCourses && userActiveCourses.length === 0) {
                            if (contentType) {
                                data[0] = {
                                    trigger: 'home',
                                    title: 'YOU WERE WATCHING',
                                    message: '...continue watching from here:',
                                    image: `${config.cdn_url}q-thumbnail/649058082.png`,
                                    button_text: 'Watch Now',
                                    data: '',
                                    event: 'homepage_continue_watching',
                                    deeplink_url: `doubtnutapp://bottom_sheet_widget?widget_type=homepage_continue_watching&user_category=${contentType}`,
                                };
                            } else if (data.length && data[0].event === 'video') {
                                data.splice(0, 1);
                            }
                        }
                    }
                }

                const responseData = {
                    meta: {
                        code: 200,
                        message: 'SUCCESS',
                    },
                    data,
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                next(err);
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllAction, getPending };
