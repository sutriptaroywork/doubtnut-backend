/* eslint-disable no-unused-expressions */
/* eslint-disable no-sequences */
/* eslint-disable prefer-const */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
const mongoose = require('mongoose');
const _ = require('lodash');

const Utility = require('../../../modules/utility');
const QuestionContainer = require('../../../modules/containers/question');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const homepageContainer = require('../../../modules/containers/homepage');
const { homeBanner } = require('../../v3/tesla/tesla.utils');
const QuestionMysql = require('../../../modules/mysql/question');
const StaticData = require('../../../data/data');

let db; let config;

async function getLandingData(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');
    const mongoClient = db.mongo;

    try {
        const data = {
            title: StaticData.landing_page_data.title,
            subTitle: StaticData.landing_page_data.subTitle,
            videoThumbnail: `${config.cdn_url}q-thumbnail/647089413.png`,
            videoUrl: `${config.cdn_url}testimonial/2021_toppers_feedback.mp4`,
        };

        const homepageCalls = [
            homepageContainer.gethomepageCarousel(db, 'BOARD_EXAM_2021', 'library_video', '12', 'en'),
            mongoClient.read.collection('mweb_landing_banners').find({ is_active: 1 }).sort({ position: 1 }).toArray(),
        ];
        const homepageData = await Promise.all(homepageCalls);
        const boardExam2021Data = homepageData[0];
        const bannerData = homepageData[1];

        if (boardExam2021Data.length > 0) {
            const base_colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
            const color = Utility.generateColorArr(base_colors);
            const capsule_text = '';
            const capsule_bg_color = '#ffffff';
            const capsule_text_color = '#000000';
            const capsule = [capsule_text, capsule_text_color, capsule_bg_color];
            const mappedPlaylistId = boardExam2021Data[0].mapped_playlist_id;
            const duration_text_color = '#000000';
            const duration_bg_color = '#ffffff';
            const duration = [duration_text_color, duration_bg_color];
            const itemsList = [];

            let libraryData = await QuestionContainer.getLibraryVideos(boardExam2021Data[0].type, `${config.staticCDN}q-thumbnail/`, _.sample(color), boardExam2021Data[0].data_type, '', 'HOME_FEED', capsule, '12', '416006', mappedPlaylistId, 'english', 10, duration, db);
            if (libraryData && libraryData.length > 0) {
                const boardExamWidget = {
                    title: boardExam2021Data[0].title,
                };
                const questionIds = [];
                libraryData = libraryData.map((libraryItem) => {
                    libraryItem.image_url = buildStaticCdnUrl(libraryItem.image_url);
                    questionIds.push(libraryItem.question_id.toString());
                    return libraryItem;
                });
                const answerData = await QuestionMysql.getAnswersByQids(db.mysql.read, questionIds);
                libraryData.forEach((elem) => {
                    const answerVideo = answerData.filter((x) => x.question_id == elem.question_id);
                    if (answerVideo.length > 0) {
                        const mappedObject = {
                            title: elem.question,
                            subtitle: '',
                            image_url: elem.image_url,
                            video_url: `https://d3cvwyf9ksu0h5.cloudfront.net/${answerVideo[0].answer_video}`,
                            id: elem.question_id,
                        };
                        itemsList.push(mappedObject);
                    }
                });
                if (itemsList.length > 0) {
                    boardExamWidget.items = itemsList;
                }
                data.boardExamWidget = boardExamWidget;
            }
        }

        if (!_.isEmpty(bannerData)) {
            data.bannerWidget = bannerData;
        }
        data.surveyWidget = {
            title: StaticData.landing_page_data.surveyWidgetTitle,
            call_button_cta_text: StaticData.landing_page_data.callButtontext,
        };

        data.coupon_codes = StaticData.landing_page_data.couponCodes;

        responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function saveStudentQuery(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');
    const mongoClient = db.mongo;

    try {
        const { phone } = req.body;
        try {
            mongoClient.write.collection('student_query').insertOne({
                phone,
            });
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                },
                data: 'Inserted',
                success_msgs: StaticData.landing_page_data.successMsgs,
            };
        } catch (err) {
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                },
                data: 'Error from catch block while inserting data',
                error_msgs: StaticData.landing_page_data.errorMsgs,
            };
        }
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

module.exports = {
    getLandingData,
    saveStudentQuery,
};
