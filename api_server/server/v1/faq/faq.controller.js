const _ = require('lodash');
const Faq = require('../../../modules/mysql/faq');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');

async function get(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        const { bucket, priority } = req.query;
        const { version_code: versionCode } = req.headers;
        let bucketNames = '';
        if (!bucket) {
            bucketNames = ['feature_explainer'];
        } else {
            bucketNames = bucket.split(',');
        }
        const faqData = await Faq.getByLocale(db.mysql.read, bucketNames, locale, versionCode);
        let data = await Promise.all(faqData.map(async (item) => {
            if (item.thumbnail) {
                item.thumbnail = buildStaticCdnUrl(item.thumbnail);
            }
            if (item.question_id) {
                const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, item.question_id);
                if (answerData.length) {
                    const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, item.question_id, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
                    item.video_resources = videoResources;
                }
            }
            if (item.type === 'video') {
                item.page = 'COURSE_FAQ';
                item.video_icon_url = `${config.staticCDN}engagement_framework/38F31752-0875-3174-AF05-D9559D4F4ECB.webp`;
            }
            return item;
        }));
        let isExpandTrue = false;
        const headers = data.filter((item) => item.type === 'header');
        data = data.filter((item) => item.type !== 'header');
        data = data.map((item, index) => {
            if (item.bucket === bucket && item.priority === +priority) {
                item.is_expand = true;
                isExpandTrue = true;
            }
            if (index === 0 && !priority) {
                item.is_expand = true;
                isExpandTrue = true;
            }
            return item;
        });
        if (!isExpandTrue && data.length) {
            data[0].is_expand = true;
        }
        const defaultFAQHeader = {
            hi: 'सबसे ज़्यादा पूछे जाने वाले सवाल',
            en: 'FAQ',
        };
        const widgets = [];
        widgets.push({
            widget_type: 'faq',
            widget_data: {
                faq_list: data,
            },
        });
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                header: bucketNames.length > 1 || bucketNames[0] === 'all' || !_.get(headers[0], 'question', false) ? defaultFAQHeader[locale] : headers[0].question,
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
module.exports = {
    get,
};
