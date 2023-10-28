const _ = require('lodash');

const UtilityFlagr = require('../../../modules/Utility.flagr');
const Utility = require('../../../modules/utility');
const staticData = require('../../../data/data');
const StudentHelper = require('../student.helper');
const { BackpressMatchPageHelper } = require('./BackpressMatchpage.helper');
/**
 * description -> abstract to structure an experiment ""
 * @param {Object{}} contextMap
 * @method getVariantAttachment
 * @method parseAttachmentResponse
 * @method attachPostConditionalAttachmentData
 * @method setDefault
 * @returns {Object[]}
 */
// function DummyExperiment() {
//     this.response = {};
//     this.getVariantAttachment = () => this.response;

//     this.parseAttachmentResponse = () => this;

//     this.attachPostConditionalAttachmentData = () => this;

//     this.setDefault = () => this;
// }

function QAAlgoFlowExperiment(contextObj) {
    this.flag_name = 'search service versions';
    this.response_parse_key = 'payload';
    this.studentId = contextObj.studentId;
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.kinesisClient = contextObj.kinesisClient;
    this.db = contextObj.db;
    this.getVariantAttachment = async () => {
        if (Utility.isFlagrAttachmentDeterministic(this.studentId)) {
            this.response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        } else {
            this.response = await Utility.getFlagrResponseForAskV9(this.kinesisClient, this.studentId, this.telemetry, this.start);
        }
        this.parseAttachmentResponse()
            .attachPostConditionalAttachmentData();
        return this.response;
    };

    this.parseAttachmentResponse = () => {
        if (_.isNull(this.response)) {
            this.setDefault();
        }
        return this;
    };

    this.attachPostConditionalAttachmentData = async () => {
        if (!Object.keys(this.response).length) {
            this.response = null;
            return this;
        }

        if (this.response) {
            const {
                country,
            } = await StudentHelper.getUserCountryAndCurrency(this.db, this.studentId);
            switch (country) {
                case 'AE':
                    this.response.languageFilters = staticData.languageFilters[country];
                    break;
                default:
                    break;
            }
        }
        return this;
    };

    this.setDefault = () => {
        this.response = staticData.SEARCH_SERVICE_DEFAULT_VERSION;
        return this;
    };
}

function OcrRenderPriorityExperiment(contextObj) {
    this.flag_name = 'ocr_render_priority';
    this.response_parse_key = 'payload';
    this.xAuthToken = contextObj.studentInfo.xAuthToken;

    this.getVariantAttachment = async () => {
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this;

    this.attachPostConditionalAttachmentData = () => this;

    this.setDefault = () => this;
}

function VideoLanguageDisplayExperiment(contextObj) {
    this.flag_name = 'video-language-display';
    this.response_parse_key = 'payload';
    this.xAuthToken = contextObj.studentInfo.xAuthToken;

    this.getVariantAttachment = async () => {
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function AskV10SmExperiment(contextObj) {
    this.flag_name = 'askV10_sm_iterations';
    this.response_parse_key = 'payload';
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.getVariantAttachment = async () => {
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function UserHandwrittenBehaviourExperiment(contextObj) {
    this.flag_name = 'user_handwritten_behaviour';
    this.response_parse_key = 'payload';
    this.xAuthToken = contextObj.studentInfo.xAuthToken;

    this.getVariantAttachment = async () => {
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function MatchPageLayoutExperiment(contextObj) {
    this.flag_name = 'mp_layout_conditional_experiment';
    this.response_parse_key = 'payload';
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.joined_at = contextObj.studentInfo.created_at;
    this.getVariantAttachment = async () => {
        // if (Utility.getTimeDiffInHours(this.joined_at) > 24) {
        //     return null;
        // }
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function CameraToolTipAnimationExperiment(contextObj) {
    this.flag_name = 'camera_tooltip_d0experiment';
    this.response_parse_key = 'payload';
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.joined_at = contextObj.studentInfo.created_at;
    this.versionCode = contextObj.studentInfo.versionCode;
    this.min_version_code_support = 1000;

    this.getVariantAttachment = async () => {
        if (this.versionCode < this.min_version_code_support) {
            return null;
        }
        if (Utility.getTimeDiffInHours(this.joined_at) > 24) {
            return null;
        }
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function BackpressMatchPageExperiment(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'match_page_back_press_v2';
    this.response_parse_key = 'payload';

    this.getVariantAttachment = async () => {
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function BackpressMatchPageExperimentV2(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'backpress_mp_variant';
    this.response_parse_key = 'payload';

    this.getVariantAttachment = async () => {
        const response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        this.response = response;
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function QuestionAskReorderingExperiment(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'question_ask_reordering_experiments';
    this.response_parse_key = 'payload';

    this.getVariantAttachment = async () => {
        this.response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function AutoplayVariant(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'auto-play';
    this.response_parse_key = 'payload';
    this.version_code = parseInt(contextObj.versionCode);
    this.min_version_code_support = 765;

    this.getVariantAttachment = async () => {
        if (this.version_code < this.min_version_code_support) {
            return null;
        }
        this.response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function SrpVideoLanguageHindiExperiment(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'srp_video_lang_hindi';
    this.response_parse_key = 'payload';
    this.student_id = contextObj.studentId;

    this.getVariantAttachment = async () => {
        const flagrResponse = await UtilityFlagr.getFlagrResp({ xAuthToken: this.xAuthToken, body: { capabilities: { [this.flag_name]: {} }, entityId: this.student_id } }, 150);
        this.response = _.get(flagrResponse, `${this.flag_name}.${this.response_parse_key}`, null);
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function NoFilterMatchesOnMatchPageExperiment(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'no_filter_matches_on_match_page';
    this.response_parse_key = 'payload';
    this.version_code = parseInt(contextObj.versionCode);
    this.min_version_code_support = 765;

    this.getVariantAttachment = async () => {
        if (this.version_code < this.min_version_code_support) {
            return null;
        }
        this.response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

function TydFlowExperiment(contextObj) {
    this.xAuthToken = contextObj.studentInfo.xAuthToken;
    this.flag_name = 'search_service_tyd_versions';
    this.response_parse_key = 'payload';

    this.getVariantAttachment = async () => {
        this.response = await UtilityFlagr.callFlagr(this.xAuthToken, this.flag_name, `${this.flag_name}.${this.response_parse_key}`);
        return this.response;
    };

    this.parseAttachmentResponse = () => this.response;

    this.attachPostConditionalAttachmentData = () => this.response;

    this.setDefault = () => this.response;
}

class Experiment {
    static async getAttachment(experimentKey, {
        studentId,
        studentInfo,
    }) {
        this.experimentKeyFactoryFunctionMapping = {
            camera_tooltip: CameraToolTipAnimationExperiment,
            backpress_mp_variant: BackpressMatchPageExperiment,
            backpress_new_flow: BackpressMatchPageExperimentV2,
        };
        const contextObj = {
            studentId,
            studentInfo,
        };
        const ExperimentFactoryFunction = this.experimentKeyFactoryFunctionMapping[experimentKey];
        const experiment = new ExperimentFactoryFunction(contextObj);
        const attachment = await experiment.getVariantAttachment();
        return attachment;
    }

    static async getQAExperimentsAttachments({
        studentId,
        studentInfo,
        kinesisClient,
        db,
        start,
        telemetry,
        versionCode,
    }) {
        const contextObj = {
            studentId,
            kinesisClient,
            db,
            start,
            telemetry,
            studentInfo,
            versionCode,
        };
        const experiments = [
            {
                experiment: new QAAlgoFlowExperiment(contextObj),
                attachmentDestructuringKey: 'variantAttachment',
            },
            {
                experiment: new VideoLanguageDisplayExperiment(contextObj),
                attachmentDestructuringKey: 'videoLangDisplayAttachment',
            },
            {
                experiment: new OcrRenderPriorityExperiment(contextObj),
                attachmentDestructuringKey: 'ocrRenderPriorityAttachment',
            },
            {
                experiment: new AskV10SmExperiment(contextObj),
                attachmentDestructuringKey: 'askV10SmAttachment',
            },
            {
                experiment: new MatchPageLayoutExperiment(contextObj),
                attachmentDestructuringKey: 'mpConditionalLayoutChangesAttachment',
            },
            {
                experiment: new UserHandwrittenBehaviourExperiment(contextObj),
                attachmentDestructuringKey: 'userHandwrittenBehaviourAttachment',
            },
            {
                experiment: new QuestionAskReorderingExperiment(contextObj),
                attachmentDestructuringKey: 'matchesArrayReorderingAttachment',
            },
            {
                experiment: new AutoplayVariant(contextObj),
                attachmentDestructuringKey: 'autoPlayVariantAttachment',
            },
            {
                experiment: new SrpVideoLanguageHindiExperiment(contextObj),
                attachmentDestructuringKey: 'srpVideoLanguageHindiAttachment',
            },
            {
                experiment: new NoFilterMatchesOnMatchPageExperiment(contextObj),
                attachmentDestructuringKey: 'noFilterMatchesOnMatchPageAttachment',
            },
        ];

        if (BackpressMatchPageHelper.isBackpressAttachmentToBeEvaluated(versionCode)) {
            experiments.push({
                experiment: new BackpressMatchPageExperimentV2(contextObj),
                attachmentDestructuringKey: 'backpressMatchPageAttachment',
            });
        }

        const attachments = await Promise.all(experiments.map((x) => x.experiment.getVariantAttachment.call(contextObj)));
        const attachmentObj = {};
        for (let i = 0; i < experiments.length; i++) {
            attachmentObj[experiments[i].attachmentDestructuringKey] = attachments[i];
        }
        return attachmentObj;
    }

    static async getTydExperimentsAttachments({
        studentId,
        studentInfo,
        kinesisClient,
        db,
        start,
        telemetry,
        versionCode,
    }) {
        const contextObj = {
            studentId,
            kinesisClient,
            db,
            start,
            telemetry,
            studentInfo,
            versionCode,
        };
        const experiments = [
            {
                experiment: new TydFlowExperiment(contextObj),
                attachmentDestructuringKey: 'variantAttachment',
            },
            {
                experiment: new VideoLanguageDisplayExperiment(contextObj),
                attachmentDestructuringKey: 'videoLangDisplayAttachment',
            },
            {
                experiment: new AutoplayVariant(contextObj),
                attachmentDestructuringKey: 'autoPlayVariantAttachment',
            },
            {
                experiment: new SrpVideoLanguageHindiExperiment(contextObj),
                attachmentDestructuringKey: 'srpVideoLanguageHindiAttachment',
            },
            {
                experiment: new NoFilterMatchesOnMatchPageExperiment(contextObj),
                attachmentDestructuringKey: 'noFilterMatchesOnMatchPageAttachment',
            },
        ];

        const attachments = await Promise.all(experiments.map((x) => x.experiment.getVariantAttachment.call(contextObj)));
        const attachmentObj = {};
        for (let i = 0; i < experiments.length; i++) {
            attachmentObj[experiments[i].attachmentDestructuringKey] = attachments[i];
        }
        return attachmentObj;
    }
}

module.exports = Experiment;
