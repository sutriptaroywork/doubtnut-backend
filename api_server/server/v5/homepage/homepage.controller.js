const _ = require('lodash');
// const Icons = require('../../../modules/chapter')
// const IconsContainer = require('../../../modules/containers/icons')
const AnswerContainer = require('../../../modules/containers/answer');
const HomepageContainer = require('../../../modules/containers/homepage');
const QuestionContainer = require('../../../modules/containers/question');
const Utility = require('../../../modules/utility');

const HomepageHelper = require('./homepage.helper');

let db; let config; let
    client;
const moment = require('moment');

async function get(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const { student_class } = req.user;
        // let student_class=10
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        const { student_id } = req.user;
        const language = 'english';
        const type = '';
        const subtitle = '';
        const description = '';
        const { page } = req.params;
        const action_activity = 'pdf_viewer';
        const capsule_text = '';
        const capsule_bg_color = '#ffffff';
        const capsule_text_color = '#000000';
        const capsule = [capsule_text, capsule_text_color, capsule_bg_color];
        const button_text = ''; // go to
        const button_text_color = '#000000';
        const button_bg_color = '#f4e70c';
        const button = [button_text, button_text_color, button_bg_color];
        const duration_text_color = '#000000';
        const duration_bg_color = '#ffffff';
        const duration = [duration_text_color, duration_bg_color];
        const base_colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
        const color = Utility.generateColorArr(base_colors);
        const caraousel_limit = 8;
        const weekNo = moment().format('ww');
        const base_url = `${config.staticCDN}q-thumbnail/`;
        const cdn_url = `${config.staticCDN}images/`;
        const subjectUrl = [`${cdn_url}physics_tricky.png`, `${cdn_url}chemistry_tricky.png`, `${cdn_url}maths_tricky.png`, `${cdn_url}biology_tricky.png`, `${cdn_url}default_tricky.png`];
        const data = {
            student_id,
            student_class,
            page,
            home_page: 'HOME_PAGE',
            base_url,
            type,
            caraousel_limit,
            description,
            subtitle,
            action_activity,
            capsule,
            duration,
            button,
            color,
            page_param: 'HOME_FEED',
            language,
            version_code,
            week_no: weekNo,
            subjectUrl,
        };
        const promise = [];
        promise.push(AnswerContainer.getPreviousHistory(student_id, db));
        promise.push(QuestionContainer.getPreviousHistory(student_id, db));
        const result1 = await Promise.all(promise);

        let ocr = ''; let question_id = '0';
        if (result1[0].length > 0 && result1[1].length > 0) {
            if (typeof result1[0][0].parent_id !== 'undefined' && result1[0][0].parent_id == result1[1][0].question_id) {
                question_id = result1[0][0].question_id;
                const d = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                if (d.length > 0) {
                    ocr = d[0].ocr_text;
                }
            } else if (result1[0][0].question_id !== result1[1][0].question_id && result1[1].length > 0) {
                question_id = result1[1][0].question_id;
                ocr = result1[1][0].ocr_text;
            }
        }
        data.ocr = ocr;
        data.question_id = question_id;

        const result = await HomepageContainer.getCacheHomepage(data, config, HomepageHelper, db, elasticSearchInstance);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: result,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
    // console.log(e)
        next(e);
    }
}

module.exports = { get };
