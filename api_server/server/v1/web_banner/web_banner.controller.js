const _ = require('lodash');
const WebBannerMysql = require('../../../modules/mysql/webBanner');
const questionContainer = require('../../../modules/containers/question');
const CcmContainer = require('../../../modules/containers/ClassCourseMapping');
const quizNotificationContainer = require('../../../modules/containers/quizNotification');

async function getBanner(req, res, next) {
    try {
        const db = req.app.get('db');
        const { question_id: qid, page_type: pageType } = req.query;
        const webBanners = await WebBannerMysql.getWebBanners(db.mysql.read, qid);
        const items = [];
        if (pageType === 'quiz-questions' || pageType === 'question-answer') {
            for (const banner of webBanners) {
                if (banner.action_type.trim() === 'course_detail') {
                    const { assortment_id: assortmentId } = JSON.parse(banner.action_data);
                    const redirectPageType = banner.action_type.trim();
                    const bannerUrl = banner.image_url;
                    items.push({
                        banner_url: bannerUrl,
                        assortment_id: assortmentId,
                        redirect_page_type: redirectPageType,
                    });
                } else if (banner.action_type.trim() === 'url') {
                    const { url } = JSON.parse(banner.action_data);
                    const redirectPageType = banner.action_type.trim();
                    const bannerUrl = banner.image_url;
                    items.push({
                        banner_url: bannerUrl,
                        redirect_url: url,
                        redirect_page_type: redirectPageType,
                    });
                }
            }
        }
        const respData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                items,
            },
        };
        res.status(respData.meta.code).json(respData);
    } catch (e) {
        next(e);
    }
}

async function getWebBanner(req, res, next) {
    try {
        const db = req.app.get('db');
        let { question_id: questionId, studentId } = req.query;
        const questionData = await questionContainer.getByQuestionId(questionId, db);
        let ccmIds = [];
        const respData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        if (!_.isEmpty(questionData)) {
            const packageData = await questionContainer.getQuestionPackageInfo(db, questionData[0].student_id);
            if (!_.isEmpty(packageData)) {
                ccmIds = await CcmContainer.getCcmIdFromCourseClass(db, questionData[0].class, packageData[0].target_group);
            }
        }
        if (!_.isEmpty(ccmIds)) {
            ccmIds = [ccmIds.id];
        } else {
            ccmIds = [];
        }

        const item = await quizNotificationContainer.getNotificationData(db, ccmIds, 11);
        if (_.isEmpty(item)) {
            return res.status(respData.meta.code).json(respData);
        }
        let bannerUrl = `${item.banner_url}?screen=WEB_VIDEO_PAGE&campaign=oswal_adv_campaign`;
        if (!_.isEmpty(studentId)) {
            bannerUrl = `${item.banner_url}?sid=${studentId}&screen=WEB_VIDEO_PAGE&campaign=oswal_adv_campaign`
        }
        respData.data = {
            banner_url: bannerUrl,
            deeplink: item.deeplink,
        };
        return res.status(respData.meta.code).json(respData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getBanner,
    getWebBanner,
};
