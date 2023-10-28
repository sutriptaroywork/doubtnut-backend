const _ = require('lodash');
const logger = require('../config/winston').winstonLogger;
const { WidgetFactory } = require('../server/helpers/question/widget.helper');
const { MatchPageConditionalLayoutStrategyManager } = require('../server/helpers/question/LayoutExperiment.helper');
const Data = require('../data/data');
const Utility = require('../modules/utility');
const staticData = require('../data/data');
const QuestionHelper = require('../server/helpers/question.helper');
const config = require('../config/config');
const fuzz = require('fuzzball');

function isRequestViableForHandwrittenExperiment(attachmentData) {
    if (_.get(attachmentData, 'userHandwrittenBehaviourAttachment', null)) {
        return true;
    }
    return false;
}

function isRequestViableForMatchPageConditionalLayoutExperiment(attachmentData) {
    if (_.get(attachmentData, 'mpConditionalLayoutChangesAttachment.enabled', null)) {
        return true;
    } return false;
}

function disableExactMatchExperimentForQuestionWithTextSolution(matchedQuestions) {
    if (_.get(matchedQuestions, '[0]._source.is_exact_match', false) && _.get(matchedQuestions, '[0].resource_type', null) !== 'video') {
        matchedQuestions[0]._source.is_exact_match = false;
    }
}

function disableScrollAnimationConditionally(response, attachmentData) {
    const { matches_quality: matchesQuality } = response;
    const commonCondition = typeof matchesQuality !== 'undefined';
    const poorMatchesCondition = commonCondition && matchesQuality.toLowerCase() === 'poor';
    const exactMatchesCondition = commonCondition && matchesQuality.toLowerCase() === 'exact';
    const similarMatchesCondition = commonCondition && (_.get(attachmentData, 'mpConditionalLayoutChangesAttachment.strategy', null) === 'v1') && matchesQuality.toLowerCase() === 'similar';
    if (poorMatchesCondition || exactMatchesCondition || similarMatchesCondition) {
        response.scroll_animation = false;
    }
}

function addQuestionThumbnailKey(language, languageCode, matchedQuestion) {
    if ((language === 'english') && (_.get(matchedQuestion, '_source.subject') === 'MATHS')) {
        matchedQuestion.question_thumbnail = `${config.staticCDN}q-thumbnail/${languageCode}_${matchedQuestion._id}.png`;
    } else {
        matchedQuestion.question_thumbnail = `${config.staticCDN}q-thumbnail/${matchedQuestion._id}.png`;
    }
}

function addQuestionThumbnailLocalisedKey(languageCode, matchedQuestion, versionCode, variantAttachment) {
    if (versionCode >= 775) {
        // matchedQuestion.question_thumbnail_localized = `${config.staticCDN}q-thumbnail-localized/${matchedQuestion._id}/${language || 'english'}.webp`;
        matchedQuestion.question_thumbnail_localized = `${config.cdn_url}question-thumbnail/${languageCode || 'en'}_${matchedQuestion._id}.webp`;
        if (variantAttachment && variantAttachment.addOptionsToThumbnail && _.get(matchedQuestion, '_source.thumbnail.include_options', false) && languageCode === 'en') {
            matchedQuestion.question_thumbnail_localized = `${config.staticCDN}question-thumbnail-with-options/${languageCode}_${matchedQuestion._id}.webp`;
        } else if (variantAttachment && variantAttachment.addCorrectedQuestionThumbnail && _.get(matchedQuestion, '_source.thumbnail.corrected', false) && languageCode === 'en') {
            matchedQuestion.question_thumbnail_localized = `${config.staticCDN}question-thumbnail-corrected/${languageCode}_${matchedQuestion._id}.webp`;
        }
    }
}

/**
 *
 * @param {string} language
 * @param {string} languageCode
 * @param {Object} matchedQuestion
 * @param {integer} versionCode
 * @param {Object{Object}} attachmentData
 * @description add question_thumbnail and question_thumbnail_localized keys to matches array response
 */
function addQuestionThumbnailToMatchesArray(language, languageCode, matchedQuestion, versionCode, attachmentData) {
    const variantAttachment = _.get(attachmentData, 'variantAttachment', null);
    if (variantAttachment) {
        addQuestionThumbnailKey(language, languageCode, matchedQuestion);
        addQuestionThumbnailLocalisedKey(languageCode, matchedQuestion, versionCode, variantAttachment);
    }
}

function addNoFilterMatchesArrWidget(_req, noFilterMatchesArray, matchesArray, language, languageCode, versionCode, attachmentData, ocr) {
    try {
        const { userQuestionsAnalysisLogging } = _req;
        const questionId = _.get(userQuestionsAnalysisLogging, 'question_id', 0);
        const widgetFlag = QuestionHelper.noFilterMatchesWidgetDisplayCheck(noFilterMatchesArray, matchesArray, ocr);
        if (widgetFlag) {
            const items = [];
            const noFilterMatchesOnMatchPageAttachment = _.get(attachmentData, 'noFilterMatchesOnMatchPageAttachment', {});
            for (let i = 0; i < noFilterMatchesArray.length; i++) {
                if (!noFilterMatchesArray[i]._id.includes('COMPUTATIONAL')) {
                    addQuestionThumbnailToMatchesArray(language, languageCode, noFilterMatchesArray[i], versionCode, attachmentData);
                    const id = _.get(noFilterMatchesArray[i], '_id', 0);
                    const page = 'SRP_NO_FILTER';
                    const resourceTypeFlag = _.get(noFilterMatchesArray[i], 'resource_type', '') === 'text';
                    const obj = {
                        type: 'widget_library_card',
                        data: {
                            id,
                            title: _.get(noFilterMatchesArray[i], '_source.ref', 'English'),
                            page,
                            thumbnail: _.get(noFilterMatchesArray[i], 'question_thumbnail_localized', null),
                            card_width: noFilterMatchesOnMatchPageAttachment.card_width,
                            card_ratio: noFilterMatchesOnMatchPageAttachment.card_ratio,
                            deeplink: `doubtnutapp://video?qid=${id}:${questionId}&page=${page}`,
                            ocr_text: _.get(noFilterMatchesArray[i], '_source.ocr_text', 'no_ocr'),
                            background_color: noFilterMatchesOnMatchPageAttachment.background_color,
                        },
                    };
                    if (resourceTypeFlag) {
                        obj.data.deeplink += '&resource_type=text';
                    }
                    items.push(obj);
                } else {
                    noFilterMatchesOnMatchPageAttachment.suggestionCount++;
                }
            }
            userQuestionsAnalysisLogging.no_filter_matches_display = true;
            matchesArray.splice(noFilterMatchesOnMatchPageAttachment.positionOfMatches, 0, {
                _id: '',
                _index: '',
                _type: '',
                _score: 100,
                _source: {},
                resource_type: 'widget',
                widget_data: {
                    type: 'widget_parent',
                    data: {
                        title: _req.user.locale === 'hi' ? noFilterMatchesOnMatchPageAttachment.title.hi : noFilterMatchesOnMatchPageAttachment.title.en,
                        title_text_size: noFilterMatchesOnMatchPageAttachment.title_size,
                        is_title_bold: true,
                        scroll_direction: 'horizontal',
                        items,
                    },
                },
            });
        }
    } catch (e) {
        console.error(e);
    }
}

function addQuestionsLogsToElastic(req) {
    const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
    const { userQuestionsAnalysisLogging } = req;
    if (typeof userQuestionsAnalysisLogging !== 'undefined') {
        const qid = userQuestionsAnalysisLogging.question_id;
        elasticSearchUserQuestionsInstance.addUserQuestionLogsToElastic('user-questions', qid, userQuestionsAnalysisLogging);
    }
}

async function generateAskResponse(result, _req, res, next) {
    try {
        if (result.error || result instanceof (Error)) {
            throw result;
        }
        const respData = result.getData();
        const { attachmentData } = _req;
        const {
            version_code: versionCode,
        } = _req.headers;
        const locale = QuestionHelper.getLocale(_req.body.locale, _req.user.locale) || 'en';
        const language = Utility.getLanguageByUserLocale(staticData.languageObject, locale) || 'english';
        const languageCode = respData.question_locale;
        const { matched_questions: matchedQuestions } = respData;
        disableExactMatchExperimentForQuestionWithTextSolution(matchedQuestions);

        for (let i = 0; i < matchedQuestions.length; i++) {
            if (!matchedQuestions[i]._id.includes('COMPUTATIONAL')) {
                addQuestionThumbnailToMatchesArray(language, languageCode, matchedQuestions[i], versionCode, attachmentData);
            }
        }
        addNoFilterMatchesArrWidget(_req, respData.noFilterMatchArray, matchedQuestions, language, languageCode, versionCode, attachmentData, respData.ocr_text);
        if (versionCode >= Data.mp_keys_changes_min_version_code) {
            const mpConditionalLayoutExperimentStrategyManager = new MatchPageConditionalLayoutStrategyManager();
            let mpConditionalLayoutExperimentStrategy = null;
            if (isRequestViableForMatchPageConditionalLayoutExperiment(attachmentData)) {
                mpConditionalLayoutExperimentStrategy = mpConditionalLayoutExperimentStrategyManager.getStrategy(_.get(attachmentData, 'mpConditionalLayoutChangesAttachment', null));
            } else {
                mpConditionalLayoutExperimentStrategy = mpConditionalLayoutExperimentStrategyManager.getStrategy(null);
            }

            for (let i = 0; i < matchedQuestions.length; i++) {
                if (!_.isEmpty(matchedQuestions[i]._source) && !_.isNull(mpConditionalLayoutExperimentStrategy)) {
                    mpConditionalLayoutExperimentStrategy.doAction(i, respData);
                }
            }

            const wigetFactory = new WidgetFactory(versionCode);
            if (isRequestViableForMatchPageConditionalLayoutExperiment(attachmentData)) {
                if (typeof respData.matches_quality !== 'undefined' && respData.matches_quality.toLowerCase() === 'poor') {
                    const widget = wigetFactory.create('text', 'poor_solutions');
                    if (!_.isNull(widget)) {
                        matchedQuestions.unshift(widget);
                        respData.matched_questions = matchedQuestions;
                    }
                }
                disableScrollAnimationConditionally(respData, attachmentData);
            }
            result.setData(respData);
        }
        addQuestionsLogsToElastic(_req);
        next(result);
    } catch (e) {
        console.log(e);
        logger.error({ tag: 'ask', source: 'generate Ask Response', error: e });
        next(e);
    }
}

module.exports = {
    generateAskResponse,
    addNoFilterMatchesArrWidget,
};
