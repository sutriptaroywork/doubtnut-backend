const _ = require('lodash');
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerContainerv13 = require('../../v13/answer/answer.container');

function getResultPageData(db, studentClass, locale) {
    const sql = 'select * from result_page_widgets where class = ? and locale = ? order by carousel_order';
    return db.query(sql, [studentClass, locale]);
}

function getResultDataById(db, id) {
    const sql = 'select * from result_page_widget where id in (?) order by student_rank and percentage';
    return db.query(sql, [id]);
}

function getResultAssortmentData(db, id) {
    const sql = 'select * from result_page_widget where carousel_id = ?';
    return db.query(sql, [id]);
}
async function getVideoByQuestionId(db, qid, config) {
    const question = await AnswerContainer.getByQuestionId(qid, db);
    let videoResource = [];
    if (_.get(question, '[0]', false)) {
        const supportedMediaList = ['DASH', 'BLOB'];
        videoResource = await AnswerContainerv13.getAnswerVideoResource(db, config, question[0].answer_id, question[0].question_id, supportedMediaList, 900);
        videoResource = videoResource.filter((er) => (er && supportedMediaList.includes(er.media_type)));
    }
    return videoResource;
}

async function getToppersTestimonialEach({ eachData, db, config }) {
    const video = await getVideoByQuestionId(db, eachData.question_id, config);
    return {
        image_url: eachData.image_url,
        name: eachData.name,
        name_size: '14',
        name_color: '#504949',
        roll: `Roll No:${eachData.roll_no}`,
        roll_size: '10',
        roll_color: '#504949',
        exam: eachData.year_exam,
        exam_size: '10',
        exam_color: '#504949',
        icon_url: 'https://user-images.githubusercontent.com/49483235/181906981-b2ed07cd-acb1-42bb-8061-d48a1c19a2fe.png',
        id: eachData.student_id,
        question_id: eachData.question_id,
        id_size: '8',
        id_color: '#a7a7a7',
        deeplink: `doubtnutapp://video?qid=${eachData.question_id}`,
        video_resource: video,
    };
}

async function getBnbData({
    db, carousel, courseDataItem, config,
}) {
    const assortmentDataNew = await getResultAssortmentData(db.mysql.read, courseDataItem.data.assortment_id);
    return {
        image_url: _.get(assortmentDataNew, '[0].image_url', null) || courseDataItem.data.image_bg,
        play_icon_url: `${config.cdn_url}images/2022/08/01/08-28-14-257-AM_icon_play.webp`,
        icon_url: `${config.cdn_url}engagement_framework/B7256C71-69F9-694A-9775-12698E281FC6.webp`,
        icon_bg: '#2559a2',
        bottom_image_url: `${config.cdn_url}engagement_framework/80AC7B23-4A0B-C16C-4502-8662E70AF3F6.webp`,
        course_name: courseDataItem.data.title,
        course_size: '12',
        course_color: '#504949',
        description: _.get(assortmentDataNew, '[0].title', null) || carousel.sharing_message,
        description_size: '10',
        description_color: '#424040',
        cost: '₹300/Month',
        cost_size: '12',
        cost_color: '#2559a2',
        id: 'Course ID #790',
        id_size: '10',
        id_color: '#969696',
        deeplink: courseDataItem.data.deeplink,
        cta_deeplink: courseDataItem.data.buy_deeplink,
    };
}

module.exports = {
    getResultPageData,
    getVideoByQuestionId,
    getResultAssortmentData,
    getResultDataById,
    getToppersTestimonialEach,
    getBnbData,
};
