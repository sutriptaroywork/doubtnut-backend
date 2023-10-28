const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const AnswerMysql = require('../../../modules/mysql/answer');
const VodSql = require('../../../modules/mysql/vod');
const CourseMysql = require('../../../modules/mysql/course');

async function generateQidandWidgets(db, vodData, parentQid) {
    const parentQues = await Question.getByQuestionId(parentQid, db.mysql.read);
    if (!parentQues.length) {
        return {
            success: false,
            generatedQid: null,
            msg: 'Parent Qid Details not found',
        };
    }
    const parentVod = await VodSql.getVodByQid(db.mysql.read, parentQid);

    const parentAns = await Answer.getAnswerByQuestionId(parentQid, db.mysql.read);
    let parentAnsVidRes = [];
    if (parentAns.length > 0) {
        parentAnsVidRes = await AnswerMysql.getAllAnswerVideoResource(db.mysql.read, parentAns[0].answer_id);
    }

    if (!parentVod.length || !parentQues.length || !parentAns.length || !parentAnsVidRes.length) {
        return {
            success: false,
            generatedQid: null,
            msg: 'Parent Qid Details not found',
        };
    }

    const chapterData = await VodSql.getChapterIdandOrderByMasterChapter(db.mysql.read, vodData.class, vodData.subject, vodData.state, vodData.language, vodData.master_chapter);
    const stateArray = [vodData.state];
    const languagesArray = [vodData.language];
    const courseIdsData = await VodSql.getCourseIdsByClassMeta(db.mysql.read, vodData.class, vodData.subject, stateArray, languagesArray, vodData.year_exam);
    const alreadyScheduled = await CourseMysql.getPreviousClassesOfUpcomingClass(db.mysql.read, vodData);
    const lectureID = `${alreadyScheduled ? alreadyScheduled.length + 1 : 1}`;
    const subjectIdData = await VodSql.getSubjectIdFromClassAndSubject(db.mysql.read, vodData.class, vodData.subject);
    if (!subjectIdData.length || !courseIdsData.length || !chapterData.length) {
        return {
            success: false,
            generatedQid: null,
            msg: 'Error All  Details Not Filled',
        };
    }
    // getAnswerVideoResource
    const doubt = `VOD_${vodData.class}_${vodData.language.substr(0, 3)}_${vodData.state}_${(`00${subjectIdData[0].subject_order}`).slice(-3)}_${subjectIdData[0].id}_${(`0000${chapterData[0].chapter_order}`).slice(-4)}_${chapterData[0].id}_${(`00${lectureID}`).slice(-3)}`;

    // create question, answer, answer_video_resource
    const question = {};
    const vodSid = -142;
    question.student_id = vodSid;
    question.class = vodData.class;
    question.subject = vodData.subject;
    question.question = vodData.description;
    question.ocr_text = vodData.description;
    question.original_ocr_text = vodData.description;
    question.book = 'DN_VOD';
    question.chapter = vodData.master_chapter;
    question.is_answered = 1;
    question.doubt = doubt;
    const questionResult = await Question.addQuestion(question, db.mysql.write);
    const questionID = questionResult.insertId;
    // create answer
    const answer = {};
    answer.expert_id = vodSid;
    answer.question_id = questionID;
    answer.answer_video = `${doubt}.mp4`;
    answer.youtube_id = doubt;
    answer.duration = parentAns[0].duration;
    answer.vdo_cipher_id = parentAns[0].vdo_cipher_id;
    answer.is_vdo_ready = parentAns[0].is_vdo_ready;
    answer.aspect_ratio = parentAns[0].aspect_ratio;

    // generate answer
    const answerResult = await Answer.addSearchedAnswer(answer, db.mysql.write);
    const answerID = answerResult.insertId;

    await Promise.all(parentAnsVidRes.map(async (eachAnswerResource) => {
        const answerVideoResource = {};
        answerVideoResource.answer_id = answerID;
        answerVideoResource.resource = eachAnswerResource.resource;
        answerVideoResource.resource_type = eachAnswerResource.resource_type;
        answerVideoResource.resource_order = eachAnswerResource.resource_order;

        // ask this
        answerVideoResource.is_active = eachAnswerResource.is_active;
        answerVideoResource.video_offset = eachAnswerResource.video_offset;
        answerVideoResource.filesize_bytes = eachAnswerResource.filesize_bytes;
        answerVideoResource.vdo_cipher_id = eachAnswerResource.vdo_cipher_id;
        await AnswerMysql.addAnswerVideoResource(db.mysql.write, answerVideoResource);
    }));

    await VodSql.updateMeta(db.mysql.write, vodData.id, { question_id: questionID });

    const parentVodWidgets = await VodSql.getWidgetDataByScheduleId(db.mysql.read, parentVod[0].id);

    await Promise.all(parentVodWidgets.map(async (eachVodWidget) => {
        const newVodWidget = {};
        newVodWidget.widget_type = eachVodWidget.widget_type;
        newVodWidget.widget_data = eachVodWidget.widget_data;
        newVodWidget.widget_meta = eachVodWidget.widget_meta;
        newVodWidget.visibility_timestamp = eachVodWidget.visibility_timestamp;
        newVodWidget.is_deleted = eachVodWidget.is_deleted;
        newVodWidget.vod_schedule_id = vodData.id;

        await VodSql.addWidget(db.mysql.write, newVodWidget);
    }));

    const parentVodTopics = await VodSql.getTopicByScheduleId(db.mysql.read, parentVod[0].id);
    const isVodTopics = await VodSql.getTopicByScheduleId(db.mysql.read, vodData.id);

    if (!isVodTopics.length) {
        await Promise.all(parentVodTopics.map(async (eachVodTopic) => {
            const newVodTopic = { ...eachVodTopic };
            delete newVodTopic.id;
            newVodTopic.vod_schedule_id = vodData.id;

            await VodSql.insertTopic(db.mysql.write, newVodTopic);
        }));
    }

    return {
        success: true,
        generatedQid: questionID,
        msg: 'Qid Successfully created',
    };
}

module.exports = {
    generateQidandWidgets,
};
