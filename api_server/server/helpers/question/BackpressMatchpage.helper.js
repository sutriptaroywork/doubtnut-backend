const _ = require('lodash');
const logger = require('winston');
const QuestionHelper = require('../question.helper');

/**
 * @description check if user has last four questions consecutive unmatched
 * @param {Object} elasticSearchInstance
 * @param {Integer} studentId
 * @returns {Boolean}
 */
async function isFourConsecutiveUnmatchedQuestionsFeedbackEligible(elasticSearchInstance, studentId) {
    try {
        const questions = await QuestionHelper.getStudentRecentlyAskedQuestions(elasticSearchInstance, [{
            term: {
                student_id: studentId,
            },
        }],
        4);
        return questions.filter((x) => x._source.is_matched === 1).length === 0;
    } catch (e) {
        console.log(e);
        return false;
    }
}

/**
 * @description get variant id for popup display strategy, by check last 4 questions of user,
 * if they were all unmatched then we'll show user feedback popup else user questions flow
 */
function BackpressPopupDisplayStrategyV1() {
    this.getCustomPopupVariantId = async (elasticSearchUserQuestionsInstance, studentId, backpressPopupVariantIdClientSideMappingByType) => {
        const showBookFeedbackPopup = await isFourConsecutiveUnmatchedQuestionsFeedbackEligible(elasticSearchUserQuestionsInstance, studentId);
        const backpressMatchPageVariant = showBookFeedbackPopup ? backpressPopupVariantIdClientSideMappingByType.book : backpressPopupVariantIdClientSideMappingByType.p2p_video;
        return backpressMatchPageVariant;
    };
}

function BackpressPopupDisplayStrategyManager() {
    this.strategy = null;
    this.extractStrategy = (_attachment) => _attachment.strategy;

    this.getStrategy = (_attachment) => {
        if (!this.strategy) {
            const strategyVersion = this.extractStrategy(_attachment);
            switch (strategyVersion) {
                case '4_q_mr_0': {
                    this.strategy = new BackpressPopupDisplayStrategyV1();
                    break;
                }
                default:
                    break;
            }
        }
        return this.strategy;
    };
}
class BackpressMatchPageHelper {
    static maxVersionCodeBackpressControlByClient = 1021;

    static backpressPopupVariantIdClientSideMappingByType = {
        p2p_video: 1,
        questionnaire: 2,
        book: 3,
    };

    static isBackpressAttachmentToBeEvaluated = (versionCode) => versionCode >= this.maxVersionCodeBackpressControlByClient;

    static initBackpressMatchPageVariant = (versionCode, sourceVal) => {
        if (!this.isBackpressAttachmentToBeEvaluated(versionCode)) {
            return sourceVal;
        }
        return null;
    }

    static getVariantId = async ({
        attachment, studentId, studentInfo, elasticSearchUserQuestionsInstance, backpressMatchPageVariant,
    }) => {
        let variantId = null;
        try {
            if (!BackpressMatchPageHelper.isBackpressAttachmentToBeEvaluated(studentInfo.versionCode)) {
                return backpressMatchPageVariant;
            }
            if (_.isNull(attachment)) {
                return null;
            }
            const _attachment = attachment;
            variantId = _.get(_attachment, 'attachment.variantNumber', null);
            if (!_.isNull(variantId)) {
                return variantId;
            }
            const backpressPopupDisplayStrategyManager = new BackpressPopupDisplayStrategyManager();
            const backpressPopupDisplayStrategy = backpressPopupDisplayStrategyManager.getStrategy(_attachment);
            if (_.isNull(backpressPopupDisplayStrategy)) {
                throw new Error('No strategy found');
            } else {
                variantId = await backpressPopupDisplayStrategy.getCustomPopupVariantId(elasticSearchUserQuestionsInstance, studentId, this.backpressPopupVariantIdClientSideMappingByType);
            }
            return variantId;
        } catch (e) {
            logger.error({ tag: 'ask', source: 'Backpress Custom Null Strategy', error: e });
            return null;
        }
    };
}

module.exports = {
    BackpressMatchPageHelper,
    BackpressPopupDisplayStrategyManager,
};
