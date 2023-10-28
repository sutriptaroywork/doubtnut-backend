const _ = require('lodash');
const VodSql = require('../../../modules/mysql/vod');
const doubtsSuggesterHelper = require('./doubtSuggester.helper');
const { responseTemplate } = require('../../helpers/response.helper');
const AnswerControllerContainer = require('../../v13/answer/answer.container');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');

let db;

async function getSuggestions(req, res, next) {
    db = req.app.get('db');
    const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

    try {
        const {
            question_id: questionId, offset, doubt_msg: doubtMsg, studentClass, chapter, get_solution: getSolution,
        } = req.query;

        const relevantQids = [];

        if (questionId) {
            relevantQids.push(questionId);
            const parentQid = VodSql.getParentQidByVodQid(db.mysql.read, questionId);
            if (_.get(parentQid, '[0].parent_qid', null)) {
                relevantQids.push(parentQid[0].parent_qid);
            }
        }
        const suggestionObj = {
            questionIds: relevantQids,
            offset,
            doubtMsg,
        };
        let doubtSuggestionQuery = doubtsSuggesterHelper.buildDoubtSuggestQuery(suggestionObj);

        let doubtSuggestions = await elasticSearchAllDoubtsInstance.getDoubtSuggestions(doubtSuggestionQuery);

        let suggestionsData = doubtSuggestions.hits.hits.map((eachHit) => eachHit._source);

        if (!suggestionsData.length) {
            delete suggestionObj.doubtMsg;
            doubtSuggestionQuery = doubtsSuggesterHelper.buildDoubtSuggestQuery(suggestionObj);
            doubtSuggestions = await elasticSearchAllDoubtsInstance.getDoubtSuggestions(doubtSuggestionQuery);
            suggestionsData = doubtSuggestions.hits.hits.map((eachHit) => eachHit._source);
        }

        if (!suggestionsData.length) {
            const chapterSuggestionObj = {
                studentClass,
                chapter,
            };
            doubtSuggestionQuery = doubtsSuggesterHelper.buildDoubtSuggestChapterQuery(chapterSuggestionObj);
            doubtSuggestions = await elasticSearchAllDoubtsInstance.getDoubtSuggestions(doubtSuggestionQuery);
            suggestionsData = doubtSuggestions.hits.hits.map((eachHit) => eachHit._source);
        } else {
            suggestionsData = suggestionsData.map((doubt) => {
                doubt.absOffsetDif = Math.abs(parseInt(doubt.offset) - offset);
                return doubt;
            });

            suggestionsData = suggestionsData.sort((a, b) => a.absOffsetDif - b.absOffsetDif);
        }

        if (getSolution) {
            if (suggestionsData.length > 0) {
                const commentIds = suggestionsData.map((s) => s.original_comment_id);

                const query = { entity_type: 'comment', entity_id: { $in: commentIds }, is_deleted: false };

                const commentAnswers = await db.mongo.read.collection('comments').find(query).toArray();

                const commentAnswersByID = _.groupBy(commentAnswers, 'entity_id');

                suggestionsData = suggestionsData.map((s) => {
                    let doubtMessage = s.original_message;
                    doubtMessage = doubtMessage.replace(/(^|\W)#(\w+)/g, '');
                    doubtMessage = doubtMessage.replace(/#डाउट/g, '');

                    s.original_message = `#Doubt ${doubtMessage}`;
                    s.answer = commentAnswersByID[s.original_comment_id][0];

                    return s;
                });
            }
        }
        return res.status(200).json(responseTemplate('Success', suggestionsData, 200));
    } catch (e) {
        next(e);
    }
}

async function getAppSuggestions(req, res, next) {
    db = req.app.get('db');
    const config = req.app.get('config');
    const elasticSearchAllDoubtsInstance = req.app.get('elasticSearchAllDoubtsInstance');

    let { supported_media_type } = req.query;
    supported_media_type = supported_media_type || 'DASH%2CHLS%2CRTMP%2CBLOB%2CYOUTUBE';
    supported_media_type = decodeURIComponent(supported_media_type);
    let supportedMediaList = [];
    if (supported_media_type) {
        supportedMediaList = _.split(supported_media_type, ',');
    }
    try {
        const {
            question_id: questionId, offset, doubt_msg: doubtMsg, question_class: studentClass, chapter,
            is_vip: isVip = false, is_premium: isPremium = false, is_rtmp: isRtmp = true,
        } = req.body;
        const { locale: studentLocale, student_id: studentId } = req.user;
        const relevantQids = [];

        let suggestionsData = [];

        if (isVip && isPremium && !isRtmp) {
            if (questionId) {
                relevantQids.push(questionId);
                const parentQid = VodSql.getParentQidByVodQid(db.mysql.read, questionId);
                if (_.get(parentQid, '[0].parent_qid', null)) {
                    relevantQids.push(parentQid[0].parent_qid);
                }
            }
            const suggestionObj = {
                questionIds: relevantQids,
                offset,
                doubtMsg,
            };
            let doubtSuggestionQuery = doubtsSuggesterHelper.buildDoubtSuggestQuery(suggestionObj);

            let doubtSuggestions = await elasticSearchAllDoubtsInstance.getDoubtSuggestions(doubtSuggestionQuery);

            suggestionsData = doubtSuggestions.hits.hits.map((eachHit) => eachHit._source);

            if (!suggestionsData.length) {
                delete suggestionObj.doubtMsg;
                doubtSuggestionQuery = doubtsSuggesterHelper.buildDoubtSuggestQuery(suggestionObj);

                doubtSuggestions = await elasticSearchAllDoubtsInstance.getDoubtSuggestions(doubtSuggestionQuery);
                suggestionsData = doubtSuggestions.hits.hits.map((eachHit) => eachHit._source);
            }

            if (!suggestionsData.length) {
                const chapterSuggestionObj = {
                    studentClass,
                    chapter,
                };
                doubtSuggestionQuery = doubtsSuggesterHelper.buildDoubtSuggestChapterQuery(chapterSuggestionObj);
                doubtSuggestions = await elasticSearchAllDoubtsInstance.getDoubtSuggestions(doubtSuggestionQuery);
                suggestionsData = doubtSuggestions.hits.hits.map((eachHit) => eachHit._source);
            } else {
                suggestionsData = suggestionsData.map((doubt) => {
                    doubt.absOffsetDif = Math.abs(parseInt(doubt.offset) - offset);
                    return doubt;
                });

                suggestionsData = suggestionsData.sort((a, b) => a.absOffsetDif - b.absOffsetDif);
            }
            suggestionsData = _.uniqBy(suggestionsData, 'original_comment_id');
            suggestionsData = suggestionsData.filter((s) => !s.image);
            suggestionsData = suggestionsData.slice(0, 20);
            if (suggestionsData.length > 0) {
                const commentIds = suggestionsData.map((s) => s.original_comment_id);

                const answersQuery = {
                    entity_type: 'comment', entity_id: { $in: commentIds }, is_deleted: false,
                };
                const commentAnswers = await db.mongo.read.collection('comments').find(answersQuery).toArray();

                // const suggestionsQuery = { student_id: `${studentId}`, suggested_id: { $in: commentIds }, is_deleted: false };
                const suggestionsQuery = {
                    entity_type: 'answered', entity_id: `${questionId}`, is_deleted: false, student_id: `${studentId}`, suggested_id: { $in: commentIds },
                };

                const commentAlreadySuggested = await db.mongo.read.collection('comments').find(suggestionsQuery).toArray();
                const resourceList = commentAlreadySuggested.map((item) => item._id);

                let bookmarkedDoubts = [];
                if (resourceList.length) {
                    bookmarkedDoubts = await CourseV2Mysql.getBookMarkedResourcesByResourceId(db.mysql.read, studentId, resourceList, 1);
                }

                const commentAnswersByID = _.groupBy(commentAnswers, 'entity_id');

                suggestionsData = await Promise.all(suggestionsData.map(async (s) => {
                    let doubtMessage = s.original_message;
                    doubtMessage = doubtMessage.replace(/(^|\W)#(\w+)/g, '');
                    doubtMessage = doubtMessage.replace(/#डाउट/g, '');

                    if (studentLocale === 'hi') {
                        s.original_message = `#Doubt ${doubtMessage}`;
                    } else {
                        s.original_message = `#डाउट ${doubtMessage}`;
                    }
                    s.answer = commentAnswersByID[s.original_comment_id][0];

                    s.type = 'text';
                    if (s.answer.image) {
                        s.type = 'image';
                    } else if (s.answer.audio) {
                        s.type = 'audio';
                    } else if (s.answer.question_id) {
                        s.type = 'video';
                        s.answer.resource_url = `${config.staticCDN}q-thumbnail/${s.answer.question_id}.webp`;
                        s.answer.image = `${config.staticCDN}q-thumbnail/${s.answer.question_id}.webp`;
                        s.answer.video_obj = {};
                        s.answer.video_obj.page = 'top_doubts';
                        s.answer.video_obj.question_id = s.answer.question_id;
                        s.answer.video_obj.video_resources = await AnswerControllerContainer.getAnswerVideoResource(db, config, parseInt(s.answer.answer_id), parseInt(s.answer.question_id), supportedMediaList, '870');
                        s.answer.type = 'top_doubt_answer_video';
                    }
                    s.title = s.original_message.replace(doubtMsg, `<b>${doubtMsg}</b>`);

                    s.title_color = '#000000';
                    s.title_size = '14';
                    s.is_expand = false;
                    s.is_bookmarked = false;
                    s.feedback_state = 'not_recorded';
                    const alreadySuggested = _.find(commentAlreadySuggested, ['suggested_id', `${s.original_comment_id}`]);
                    if (alreadySuggested) {
                        s.is_bookmarked = !!_.find(bookmarkedDoubts, ['comment_id', `${alreadySuggested._id}`]);
                        s.icon_url = `${config.staticCDN}images/icon_small_tick.webp`;
                        s.reply = 'Marked as correct answer';
                        s.undo_text = 'Undo';
                        s.feedback_state = 'recorded';
                        s.feedback_state_type = true;
                    }
                    return s;
                }));
            }
        }
        const widgets = {
            count_suggestions: suggestionsData.length,
            widgets: [
                {
                    type: 'widget_doubt_suggester',
                    data: {
                        title: 'RELATED SOLVED DOUBTS',
                        title_color: '#808080',
                        title_size: '12',
                        not_bookmarked_icon: `${config.staticCDN}images/2022/07/08/05-49-47-778-AM_icon_small_bookmark_line.webp`,
                        bookmarked_icon: `${config.staticCDN}images/2022/07/08/05-51-58-206-AM_icon_small_bookmark_filled.webp`,
                        is_this_correct_text: 'Is this correct?',
                        tick_icon_url: `${config.staticCDN}images/2022/07/08/05-53-58-385-AM_icon_small_tick.webp`,
                        cross_icon_url: `${config.staticCDN}images/2022/07/08/05-55-30-953-AM_icon_small_close.webp`,
                        play_icon_url: `${config.staticCDN}images/icon_small_play_small.webp`,
                        correct_text: 'Marked as correct answer',
                        incorrect_text: 'Marked as incorrect answer',
                        correct_icon: `${config.staticCDN}images/icon_small_tick.webp`,
                        incorrect_icon: `${config.staticCDN}images/icon_small_close.webp`,
                        items: suggestionsData,
                    },
                    layout_config: {
                        margin_top: 12,
                        margin_left: 12,
                        margin_right: 12,
                        margin_bottom: 0,
                    },
                },
            ],
        };
        return res.status(200).json(responseTemplate('Success', widgets, 200));
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getSuggestions,
    getAppSuggestions,
};
