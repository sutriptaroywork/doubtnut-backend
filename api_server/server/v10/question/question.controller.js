/* eslint-disable import/no-extraneous-dependencies */
/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
 * @Last modified by:   Abhishek Sinha
 * @Last modified time: 2019-12-14T17:36:32+05:30
*/
const fuzz = require('fuzzball');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const mathsteps = require('mathsteps');
const bluebird = require('bluebird');
const _ = require('lodash');
const Question = require('../../../modules/question');
const Utility = require('../../../modules/utility');
const Notification = require('../../../modules/notifications');
// const Constant = require('../../../modules/constants');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionRedis = require('../../../modules/redis/question');
// const AnswerRedis = require('../../../modules/redis/answer');
// const QuestionSql = require('../../../modules/mysql/question');
// const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const staticData = require('../../../data/data');
const liveclassData = require('../../../data/liveclass.data');
const responseSchema = require('../../../responseModels/question/v9/question');
// const QuestionLog = require('../../../modules/mongo/questionAsk');
const QuestionHelper = require('../../helpers/question.helper');
const telemetry = require('../../../config/telemetry');
const AnswerMysql = require('../../../modules/mysql/answer');
const bl = require('../../v9/question/question.bl');
const answerBl = require('../../v11/answer/answer.bl');
const UtilityFlagr = require('../../../modules/Utility.flagr');
// const UtilityRedis = require('../../../modules/redis/utility.redis');
const QuestionsAskedRetryCounter = require('../../../modules/redis/questionAskedRetryCounter');
const QuestionAskPersonalisationContainer = require('../../../modules/containers/questionAskPersonalisation');
const EditOcrFeedback = require('../../../modules/editOcrFeedback');
const { isUsRegion } = require('../../../modules/utility');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const p2pData = require('../../../data/doubtPeCharcha.data');
const kafka = require('../../../config/kafka');
const Data = require('../../../data/data');
const StudentRedis = require('../../../modules/redis/student');
const StudentHelper = require('../../helpers/student.helper');
const ReferAndEarnHelper = require('../../helpers/referAndEarn.helper');
const D0UserManager = require('../../helpers/d0User.helper');
const Response = require('../../../modules/response');
const ExperimentHelper = require('../../helpers/question/experiments.helper');
const { BackpressMatchPageHelper } = require('../../helpers/question/BackpressMatchpage.helper');
const DuplicateQuestionMapByTag = require('../../../modules/duplicateQuestionMap');
const ViserOcrBatchHelper = require('../../helpers/question/ocr.viser.batch.helper');
const { thumbnailUrl } = require('../../../data/rewards.data');

bluebird.promisifyAll(fs);

let db;
let elasticSearchInstance;
let elasticSearchTestInstance;
let elasticSearchLtrInstance;
let config;
let blobService;
let elasticSearchUserQuestionsInstance;

async function ask(req, res, next) {
    const start = new Date();
    try {
        const timestamp = moment().unix();
        let timestampToUse = null;
        let clientFileName = null;
        const insertedQuestion = {};
        let userQuestionsAnalysisLogging = {};
        req.userQuestionsAnalysisLogging = userQuestionsAnalysisLogging;
        const userProfile = {};
        let studentCourseDetails;
        let donnotLogUserQuestions = false;
        config = req.app.get('config');
        let uploadedQuestionImageName = req.body.uploaded_image_name;
        const uploadedImageQuestionId = req.body.uploaded_image_question_id;
        let { retry_counter } = req.body;
        const { cropped_image_url, google_vision_image_ocr } = req.body;
        const { other_multiple_images_selected } = req.body;
        const checkBlurImages = false;
        const region = req.body.region || req.headers.country;
        let doubt_id; let newFieldToUpdate;
        let isTyd = false;
        let insertComputationalQuestion = false;
        const isChemistryDiagramOcrValid = false;
        if (Utility.isFixNeededForQuestionAskHistory(cropped_image_url, retry_counter)) {
            uploadedQuestionImageName = Utility.getFileNameFromUrlStringForQuestionImage(`${config.cdn_url}images/`, cropped_image_url);
        }
        const sns = req.app.get('sns');
        const kinesisClient = req.app.get('kinesis');
        const sqs = req.app.get('sqs');
        const { questionInitSnsUrl, userQuestionSnsUrl } = staticData;
        const questionImageAlreadyUploadedFlag = Utility.isImageUploadedForQuestionAsk(uploadedQuestionImageName, uploadedImageQuestionId);
        const questionImageUrl = questionImageAlreadyUploadedFlag ? `${config.cdn_url}images/${uploadedQuestionImageName}` : null;
        const { selected_image_url } = req.body;
        const isMultipleImageSelected = !!(selected_image_url);
        let ocrAlreadyExtractedFromImageFlag = false;
        const translate2 = req.app.get('translate2');
        blobService = req.app.get('blobService');
        const publicPath = req.app.get('publicPath');
        db = req.app.get('db');
        const s3 = req.app.get('s3');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        elasticSearchLtrInstance = req.app.get('elasticSearchLtrInstance');
        let questionText = req.body.question_text || staticData.question_logging.question_text;
        let studentId;
        if (req.body.udid) {
            studentId = await QuestionHelper.getStudentIdFromUdid(db, req.body.udid);
        } else {
            studentId = req.user.student_id;
            studentId = (studentId) ? parseInt(studentId) : staticData.question_logging.studentId;
        }
        userProfile.studentId = studentId;
        if (uploadedQuestionImageName) {
            const imageNameArray = uploadedQuestionImageName.split('_').join(',').split('.').join(',')
                .split(',');
            timestampToUse = imageNameArray[2];
            doubt_id = `${studentId}_${timestampToUse}`;
        } else {
            doubt_id = `${studentId}_${timestamp}`;
        }
        const xAuthToken = req.headers['x-auth-token'];
        const { colorVersion, clientSource } = req.body;
        let isExactMatch = false;
        const subject = req.body.subject || staticData.question_logging.subject;
        const chapter = req.body.chapter || staticData.question_logging.chapter;
        const ques = req.body.question || staticData.question_logging.question;
        const studentClass = req.body.class || staticData.question_logging.class;
        let limit = req.body.limit || staticData.question_logging.limit;
        const imageAngle = req.body.image_angle || staticData.question_logging.image_angle;
        const questionImage = req.body.question_image;
        const versionCode = req.headers.version_code;
        // TODO:  handle default by flagr if there are issuses on the same
        const checkExactMatch = Utility.isExactMatchFlowHandledViaBackend(versionCode) ? true : req.body.checkExactMatch;
        const checkExactTag = Utility.isExactMatchFlowHandledViaBackend(versionCode) ? true : req.body.checkExactTag;
        let backpressMatchPageVariant = BackpressMatchPageHelper.initBackpressMatchPageVariant(versionCode, req.body.backpressMatchPageVariant);
        const duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
        clientFileName = req.body.file_name;
        let matchesArray; let matchesArrayLanguageConstraint;
        let preSavedOcrTextData;
        let language;
        let handwritten = 0;
        let stringDiffResp; let stringDiffRespNoFilter; let info; let isOnlyEquation; let cymathString; let cleanedOcr; let equationOcrText;
        let isb64ConversionRequired = 0;
        const userQuestionsLogsMongoDb = {};
        let skipOcrAndElasticSearch = false;
        let ocrRenderPriorityAttachment = null;
        let isSearchServiceFlagrDeterministic = false;
        let askV10SmAttachment = null;
        let locale = QuestionHelper.getLocale(req.body.locale, req.user.locale);
        userProfile.appLocale = req.user.locale || 'en';
        let metadata = QuestionHelper.getMetadataValue(req.body.metadata, staticData.question_logging.metadata);
        // -------- mongo data insertion ------ //
        userQuestionsLogsMongoDb.student_id = studentId;
        // userQuestionsLogsMongoDb.isAbEligible = -1;
        userQuestionsLogsMongoDb.studentClass = studentClass;
        const { supported_media_type: supportedMediaList } = req.body;
        const isQuestionOcrEdited = !!(uploadedImageQuestionId && questionText && questionText.length > 0);
        const ocrExtractedFromImage = !!(req.body.question_text_source === 'image');
        let useIasFlag = false;
        const response = new Response({});
        if (config.handle_question_ask_retry_logic && !isQuestionOcrEdited) {
            const questionAskedCounterLogging = await QuestionsAskedRetryCounter.getCount(db.redis.read, uploadedImageQuestionId);
            if (!_.isNull(questionAskedCounterLogging)) {
                retry_counter = 1;
            } else {
                QuestionsAskedRetryCounter.setCount(db.redis.write, uploadedImageQuestionId);
            }
        }

        if (retry_counter && retry_counter >= 1 && !isMultipleImageSelected) {
            // QuestionHelper.setResponseForSearchFailures(response);
            // return next(response);
            const questionAskFlowAlreadyProgressedData = await QuestionHelper.getRetryRequestProgressResponse(db, config, elasticSearchTestInstance, Utility, fuzz, req.body.locale, uploadedImageQuestionId, uploadedQuestionImageName, studentId);
            if (!_.isEmpty(questionAskFlowAlreadyProgressedData)) {
                if (questionAskFlowAlreadyProgressedData.retry_request_progress_level == 'ocr_text' || questionAskFlowAlreadyProgressedData.retry_request_progress_level == 'qid_matches_array') {
                    if (!_.isEmpty(questionAskFlowAlreadyProgressedData.retry_request_progress_data.matches_arr)) {
                        skipOcrAndElasticSearch = true;
                        matchesArray = questionAskFlowAlreadyProgressedData.retry_request_progress_data.matches_arr;
                    }
                    if (!_.isEmpty(questionAskFlowAlreadyProgressedData.retry_request_progress_data.ocr_data)) {
                        ocrAlreadyExtractedFromImageFlag = true;
                        preSavedOcrTextData = questionAskFlowAlreadyProgressedData.retry_request_progress_data.ocr_data;
                    }
                    if (!_.isEmpty(questionAskFlowAlreadyProgressedData.retry_request_progress_data.extras) && skipOcrAndElasticSearch) {
                        ({
                            stringDiffResp,
                            info,
                            isOnlyEquation,
                            cymathString,
                            cleanedOcr,
                            equationOcrText,
                        } = questionAskFlowAlreadyProgressedData.retry_request_progress_data.extras);
                    }
                }
            }
        }

        let stLangCode;
        let useComposerApi = false;
        const filedToUpdate = {}; let promises = []; let searchFieldName = 'ocr_text';
        // eslint-disable-next-line radix
        studentId = (studentId) ? parseInt(studentId) : staticData.question_logging.studentId;
        if (staticData.web_ask_values.includes(ques)) {
            locale = staticData.question_logging.locale;
        }
        insertedQuestion.student_id = studentId;
        insertedQuestion.class = studentClass;
        insertedQuestion.subject = subject;
        insertedQuestion.book = subject;
        insertedQuestion.chapter = chapter;
        insertedQuestion.question = staticData.question_logging.question_v10;
        insertedQuestion.doubt = ques;
        insertedQuestion.locale = locale;
        const color = versionCode > 645 && colorVersion === 2 ? [staticData.color.white] : staticData.colors;
        const platformTabs = staticData.platform_tabs;
        let insertQuestionResult;

        if (!questionImageAlreadyUploadedFlag || (isMultipleImageSelected && other_multiple_images_selected)) {
            insertQuestionResult = await Question.addQuestionAliasedTable(insertedQuestion, db.mysql.write);
            let {subject, chapter} = insertedQuestion;
            await QuestionRedis.setUserAskedQuestionData(db.redis.write, insertQuestionResult.insertId, { subject, chapter });
            // fire kafka event for insertion
            insertedQuestion.uuid = insertQuestionResult.insertId;
            insertedQuestion.timestamp = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            insertedQuestion.action = Data.ask_vvs.insert_question;
            // kafka.publish(kafka.topics.askVvs, studentId, { ...insertedQuestion });
            const newInsertedQuestion = { ...insertedQuestion };
            delete newInsertedQuestion.uuid;
            delete newInsertedQuestion.action;
            delete newInsertedQuestion.question;
            delete newInsertedQuestion.doubt;
            delete newInsertedQuestion.difficulty;
            newInsertedQuestion.doubt_id = doubt_id;
            newInsertedQuestion.iteration = staticData.question_logging.question_v10;
            newInsertedQuestion.source = req.body.clientSource || 'NA';
            newInsertedQuestion.reference_question_id = insertQuestionResult.insertId;
        }
        const feedback = staticData.match_page_feedback;
        const isSubscribed = 0;
        let qid;
        if ((!questionImageAlreadyUploadedFlag && !isQuestionOcrEdited) || (isMultipleImageSelected && other_multiple_images_selected)) {
            qid = insertQuestionResult.insertId;
        } else {
            qid = uploadedImageQuestionId;
        }

        await QuestionRedis.setUserLastAskedQId(db.redis.write, studentId, qid);
        userQuestionsAnalysisLogging.question_id = qid;
        userQuestionsAnalysisLogging.is_matched = 0;
        userQuestionsAnalysisLogging.v_ctr_et_gt_0 = 0;
        userQuestionsAnalysisLogging.student_id = studentId;
        userQuestionsAnalysisLogging.user_locale = req.user.locale || 'en';
        userQuestionsAnalysisLogging.class = req.user.student_class || 12;
        userQuestionsAnalysisLogging.doubt = ques;

        const uuid = uuidv4();
        QuestionHelper.sendSnsMessage({
            type: 'question-init',
            sns,
            uuid,
            qid,
            studentId,
            studentClass,
            subject,
            chapter,
            version: insertedQuestion.question,
            ques,
            locale,
            UtilityModule: Utility,
            questionInitSnsUrl,
            config,
        });

        insertedQuestion.question_id = qid;
        let ocr; let fileName = null;
        let ocrData;
        if (ocrAlreadyExtractedFromImageFlag) {
            ocrData = preSavedOcrTextData;
        }
        let originalOcr;
        let ocrType = 1;
        let variantAttachment = null;
        let noFilterMatchesOnMatchPageAttachment = null;
        let videoLangDisplayAttachment = null;
        let backpressUserMatchesAttachment = null;
        let backpressUserMatchesStrategyAttachment = null;
        let userHandwrittenBehaviourAttachment = null;
        let preprocessMatchesArray;
        let backpressMatchPageAttachment = null;
        let mpConditionalLayoutChangesAttachment = null;
        let matchesArrayReorderingAttachment = null;
        let autoPlayVariantAttachment = null;
        let srpVideoLanguageHindiAttachment = null;
        let isBlur = null;
        let is_skipped = 0;
        let preprocessMatchedObject;
        let isDiagramPresent = false;
        let orientation = 0;
        let isNonViableImageTextDataExtractionSuccess = false;
        language = Utility.getLanguageByUserLocale(staticData.languageObject, locale);
        if (typeof language === 'undefined') {
            language = staticData.question_logging.language;
        }
        if (qid) {
            if (skipOcrAndElasticSearch) {
                donnotLogUserQuestions = true;
                filedToUpdate.question_image = uploadedQuestionImageName;
                filedToUpdate.ocr_text = info.query_ocr_text;
            }
            // -- mongo data insertion --- //
            if (!skipOcrAndElasticSearch) {
                let iasMatchesArr = [];
                userQuestionsLogsMongoDb.qid = qid;
                const host = `${req.protocol}://${req.headers.host}`;
                if ((typeof questionText === 'undefined' || questionText.length === 0) && (typeof questionImage !== 'undefined' && questionImage.length > 0)) {
                    promises = [];
                    const attachmentData = await ExperimentHelper.getQAExperimentsAttachments({
                        studentId,
                        studentInfo: {
                            xAuthToken,
                            created_at: req.user.created_at,
                        },
                        kinesisClient,
                        db,
                        telemetry,
                        start,
                        versionCode,
                    });

                    ({
                        variantAttachment,
                        ocrRenderPriorityAttachment,
                        askV10SmAttachment,
                        videoLangDisplayAttachment,
                        mpConditionalLayoutChangesAttachment,
                        userHandwrittenBehaviourAttachment,
                        backpressMatchPageAttachment,
                        matchesArrayReorderingAttachment,
                        autoPlayVariantAttachment,
                        srpVideoLanguageHindiAttachment,
                        noFilterMatchesOnMatchPageAttachment,
                    } = attachmentData);

                    // TODO some logic for deciding attachment between search and reordering
                    // if (variantAttachment && variantAttachment.key === 'v_reorder') {
                    // // if (true) {
                    //     variantAttachment = matchesArrayReorderingAttachment;
                    // }

                    backpressUserMatchesAttachment = null;
                    backpressUserMatchesStrategyAttachment = null;
                    req.attachmentData = attachmentData;
                    [backpressMatchPageVariant, studentCourseDetails] = await Promise.all([
                        BackpressMatchPageHelper.getVariantId({
                            attachment: backpressMatchPageAttachment,
                            studentId,
                            studentInfo: {
                                xAuthToken,
                                versionCode,
                            },
                            elasticSearchUserQuestionsInstance,
                            QuestionHelperModule: QuestionHelper,
                            backpressMatchPageVariant,
                        }),
                        StudentCourseMapping.getStudentCourse(db.mysql.read, studentId),
                    ]);
                    if (!_.isEmpty(studentCourseDetails)) {
                        userProfile.schoolBoard = studentCourseDetails[0].course;
                    }

                    if (!_.isEmpty(cropped_image_url) || !_.isEmpty(questionImageUrl)) {
                        if (questionImageAlreadyUploadedFlag) {
                            fileName = questionImageUrl.replace(`${config.cdn_url}images/`, '');
                            if (isMultipleImageSelected) {
                                fileName = selected_image_url.replace(`${config.cdn_url}images/`, '');
                            }
                        } else {
                            fileName = cropped_image_url.replace(`${config.cdn_url}images/`, '');
                        }
                        isb64ConversionRequired = 1;
                    } else if (uploadedQuestionImageName) {
                        isb64ConversionRequired = 1;
                        fileName = uploadedQuestionImageName;
                    } else {
                        fileName = await QuestionHelper.handleImage(questionImage, fs, qid, config, s3, publicPath, blobService, variantAttachment, clientFileName);
                    }
                    filedToUpdate.question_image = fileName;
                    insertedQuestion.question_image = fileName;
                    userQuestionsAnalysisLogging.question_image = fileName;
                    if (Utility.isStudentIdEligibleForRepeatQuestionsPersonalisation(studentId)) {
                        variantAttachment = staticData.questionAskPersonalisation.varaintAttachmentStructure;
                    }

                    ocrData = await QuestionHelper.handleOcrGlobal({
                        image: questionImage, host, fileName, translate2, variantAttachment, config, next, studentId, isb64ConversionRequired, qid, db, retryCounter: retry_counter, userQuestionsAnalysisLogging, userQuestionsLogsMongoDb,
                    });
                    if (!isChemistryDiagramOcrValid && variantAttachment && variantAttachment.includeSmilesInOcr) {
                        variantAttachment.includeSmilesInOcr = false;
                    }
                    if (!QuestionHelper.isImageTextViableToSearch(ocrData, variantAttachment)) {
                        if (askV10SmAttachment && askV10SmAttachment.iteration) {
                            const { iteration } = askV10SmAttachment;
                            variantAttachment.version = 'askV10_sm';
                            if (iteration === 'chemistry_diagram') {
                                const resp = await QuestionHelper.performOrganicChemistryDiagramFlow(variantAttachment, config, ocrData, fileName, questionImage, host, translate2, userQuestionsAnalysisLogging);
                                ocrData = resp.ocrData;
                                variantAttachment = resp.variantAttachment;
                                userQuestionsAnalysisLogging = resp.userQuestionsAnalysisLogging;
                                isNonViableImageTextDataExtractionSuccess = true;
                                variantAttachment.versionSuffix = askV10SmAttachment.version_suffix;
                            } else if (iteration === 'viser_diagram') {
                                isNonViableImageTextDataExtractionSuccess = true;
                                askV10SmAttachment.success = true;
                                variantAttachment.versionSuffix = askV10SmAttachment.version_suffix;
                                if (typeof askV10SmAttachment.results_size !== 'undefined') {
                                    askV10SmAttachment.results_size = 20;
                                }
                            }
                        }
                    }
                    isDiagramPresent = _.get(ocrData, 'mathpix_log.isDiagramPresent', false);
                    if (isDiagramPresent) {
                        is_skipped = 11;
                    }
                    orientation = isDiagramPresent ? _.get(ocrData, 'mathpix_log.orientation') : '0';
                    userProfile.questionLocale = ocrData.locale;
                    userQuestionsAnalysisLogging.ocr_text = ocrData.ocr;
                    userQuestionsAnalysisLogging.ocr_service = ocrData.ocr_origin;
                    userQuestionsAnalysisLogging.question_locale = ocrData.locale;
                    userQuestionsAnalysisLogging.ocr_service_response_time = ocrData.response_time;
                    if (ocrData.ocr_type == 7 && ocrData.mathpix_log) {
                        userQuestionsAnalysisLogging.diagram = ocrData.mathpix_log.diagram;
                        userQuestionsAnalysisLogging.diagram_score = ocrData.mathpix_log.diagram_score;
                        userQuestionsAnalysisLogging.orientation = ocrData.mathpix_log.orientation;
                        if (ocrData.mathpix_log.diagram) {
                            is_skipped = 11;
                        }
                    }
                    if (ocrData.ocr_type == 0 && ocrData.mathpix_log != undefined && ocrData.mathpix_log.detection_map != undefined) {
                        userQuestionsAnalysisLogging.contains_table = ocrData.mathpix_log.detection_map.contains_table;
                        userQuestionsAnalysisLogging.contains_chart = ocrData.mathpix_log.detection_map.contains_chart;
                        userQuestionsAnalysisLogging.contains_diagram = ocrData.mathpix_log.detection_map.contains_diagram;
                        userQuestionsAnalysisLogging.contains_graph = ocrData.mathpix_log.detection_map.contains_graph;
                        userQuestionsAnalysisLogging.is_blank = ocrData.mathpix_log.detection_map.is_blank;
                        userQuestionsAnalysisLogging.is_inverted = ocrData.mathpix_log.detection_map.is_inverted;
                        userQuestionsAnalysisLogging.is_printed = ocrData.mathpix_log.detection_map.is_printed;
                        userQuestionsAnalysisLogging.is_not_math = ocrData.mathpix_log.detection_map.is_not_math;
                        userQuestionsAnalysisLogging.latex_confidence = ocrData.mathpix_log.latex_confidence;
                        userQuestionsAnalysisLogging.latex_confidence_rate = ocrData.mathpix_log.latex_confidence_rate;
                        userQuestionsAnalysisLogging.auto_rotate_confidence = ocrData.mathpix_log.auto_rotate_confidence;
                        userQuestionsAnalysisLogging.auto_rotate_degrees = ocrData.mathpix_log.auto_rotate_degrees;

                        if (ocrData.mathpix_log.detection_map.contains_diagram) {
                            is_skipped = 11;
                        }
                    }
                    if (ocrData.ocr_type == 0 && ocrData.mathpix_log != undefined && ocrData.mathpix_log.mathpixText) {
                        const diagramArr = [];
                        if (ocrData.mathpix_log.line_data != undefined) {
                            const lineDataArr = ocrData.mathpix_log.line_data;
                            lineDataArr.forEach((element) => {
                                if (element.type === 'diagram') {
                                    diagramArr.push(element.cnt);
                                }
                            });
                        }
                        userQuestionsAnalysisLogging.diagram_coordinates = diagramArr;
                        userQuestionsAnalysisLogging.auto_rotate_confidence = ocrData.mathpix_log.auto_rotate_confidence;
                        userQuestionsAnalysisLogging.auto_rotate_degrees = ocrData.mathpix_log.auto_rotate_degrees;
                        userQuestionsAnalysisLogging.latex_confidence = ocrData.mathpix_log.latex_confidence;
                        userQuestionsAnalysisLogging.printed = ocrData.mathpix_log.is_printed;
                        userQuestionsAnalysisLogging.is_handwritten = ocrData.mathpix_log.is_handwritten;
                        userQuestionsAnalysisLogging.confidence = ocrData.mathpix_log.confidence;
                        userQuestionsAnalysisLogging.confidence_rate = ocrData.mathpix_log.confidence_rate;
                        userQuestionsAnalysisLogging.detected_alphabets = ocrData.mathpix_log.detected_alphabets_arr;
                    }
                    QuestionRedis.setUserAskedQuestionData(db.redis.write, qid, { ocr: JSON.stringify(ocrData) });

                    ocr = ocrData.ocr;
                    originalOcr = ocrData.original_ocr;
                    handwritten = ocrData.handwritten;
                    locale = ocrData.locale;
                    ocrType = ocrData.ocr_type;
                    // userQuestionsLogsMongoDb.meta_index = ocrData.raw_ocr;
                    filedToUpdate.difficulty = ocrData.isModified ? ocrData.isModified : 0;
                    if (ocrData.useSecondaryOcrServiceFlag) {
                        filedToUpdate.incorrect_ocr = 79;
                    }
                    preprocessMatchesArray = ocrData.preprocessMatchesArray;
                    if (imageAngle && imageAngle != '0') {
                        if (handwritten) {
                            is_skipped = QuestionHelper.updateHandwrittenIsSkippedValue(is_skipped, 7);
                        } else {
                            is_skipped = 5;
                        }
                    } else if (handwritten) {
                        is_skipped = QuestionHelper.updateHandwrittenIsSkippedValue(is_skipped, 6);
                    }

                    if (variantAttachment && ocrData.locale) {
                        variantAttachment.questionLocale = ocrData.locale;
                    }
                    // userQuestionsLogsMongoDb.isAbEligible = (ocrData.mathpixConfidence) ? ocrData.mathpixConfidence : 10;
                    // if (ocrData.original_image_ocr) {
                    //     userQuestionsLogsMongoDb.meta_index = ocrData.original_image_ocr;
                    // }
                    // let ocrText = ocr;
                    if (!questionImageAlreadyUploadedFlag) {
                        Utility.deleteImage(`${publicPath}/uploads/${fileName}`, fs);
                    }
                } else if (typeof questionText !== 'undefined' && questionText.length > 0) {
                    //  QUESTION TEXT -> register the pool for TEXT here
                    const viserOcrBatchHelper = new ViserOcrBatchHelper(qid, 'TEXT');
                    await viserOcrBatchHelper.poolTextQuestionsInBatchHash(db, config, Utility);
                    if (isQuestionOcrEdited || ocrExtractedFromImage) {
                        const flagrPromises = [];
                        flagrPromises.push(Utility.getFlagrResponseForAskV9(kinesisClient, studentId, telemetry, start));
                        flagrPromises.push(UtilityFlagr.callFlagr(xAuthToken, 'video-language-display', 'video-language-display.payload'));
                        const resolvedFlagrPromises = await Promise.all(flagrPromises);
                        variantAttachment = resolvedFlagrPromises[0];

                        if (_.isNull(variantAttachment)) {
                            variantAttachment = staticData.SEARCH_SERVICE_DEFAULT_VERSION;
                        }
                        if (!Object.keys(variantAttachment).length) {
                            variantAttachment = null;
                        }
                        videoLangDisplayAttachment = resolvedFlagrPromises[1];
                        const edited_ocr_logging = {
                            question_id: uploadedImageQuestionId,
                            edited_ocr_text: questionText,
                            feedback: req.body.image_ocr_feedback,
                        };
                        if (isQuestionOcrEdited) {
                            EditOcrFeedback.insertEditOcrLogs(db.mysql.write, edited_ocr_logging);
                        }
                    } else {
                        const attachmentData = await ExperimentHelper.getTydExperimentsAttachments({
                            studentId,
                            studentInfo: {
                                xAuthToken,
                                created_at: req.user.created_at,
                            },
                            kinesisClient,
                            db,
                            telemetry,
                            start,
                            versionCode,
                        });

                        ({
                            variantAttachment,
                            videoLangDisplayAttachment,
                            autoPlayVariantAttachment,
                            srpVideoLanguageHindiAttachment,
                            noFilterMatchesOnMatchPageAttachment,
                        } = attachmentData);

                        isTyd = true;
                        if (!variantAttachment) {
                            variantAttachment = staticData.search_service_tyd_versions_default_variant;
                        }
                        req.attachmentData = attachmentData;
                        if (variantAttachment && variantAttachment.checkIAS) {
                            const iasResp = await QuestionHelper.getIasResults(questionText, studentClass, xAuthToken, config);
                            iasMatchesArr = _.get(iasResp, 'hits.hits', null);
                            if (iasMatchesArr && iasMatchesArr.length) {
                                useIasFlag = true;
                                info = {
                                    version: 'ask_ias',
                                    query_ocr_text: questionText,
                                    isIntegral: 0,
                                };
                                stringDiffResp = Utility.stringDiffImplementWithKey(iasMatchesArr, questionText, fuzz, 'ocr_text', language, false);
                                cymathString = QuestionHelper.getCymathString(questionText);
                            }
                        }
                    }
                    if (locale !== 'en'
                        && locale !== 'es'
                        && locale !== 'gl'
                        && locale !== 'ca'
                        && locale !== 'cy'
                        && locale !== 'it'
                        && locale !== 'gd'
                        && locale !== 'sv'
                        && locale !== 'da'
                        && locale !== 'ro'
                        && locale !== 'fil'
                        && locale !== 'mt'
                        && locale !== 'pt-PT') {
                        const transLateApiResp = await Utility.translateApi2(questionText, translate2);
                        if (transLateApiResp.length > 0 && transLateApiResp[1].data !== undefined && transLateApiResp[1].data.translations !== undefined && transLateApiResp[1].data.translations[0].translatedText !== undefined) {
                            questionText = transLateApiResp[1].data.translations[0].translatedText;
                        }
                    }
                    ocr = questionText;
                    originalOcr = ocr;
                    ocrData = {
                        ocr: questionText, ocr_type: 1, handwritten, locale, ocr_origin: 'question_text',
                    };
                }

                // -------- mongo data insertion ------ //
                userQuestionsLogsMongoDb.ocr_type = ocrData.ocr_origin;
                userQuestionsLogsMongoDb.vision_ocr_android = google_vision_image_ocr;
                filedToUpdate.ocr_done = 1;
                filedToUpdate.ocr_text = ocrData.ocr;
                filedToUpdate.locale = locale;
                insertedQuestion.ocr_done = 1;
                insertedQuestion.ocr_text = ocr;
                insertedQuestion.original_ocr_text = originalOcr;
                insertedQuestion.locale = locale;
                insertedQuestion.is_skipped = is_skipped;
                const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
                stLangCode = ocrData.locale;
                if (!_.isEmpty(preprocessMatchesArray)) {
                    const question_id_obj = await QuestionHelper.getResponseForQuestionId(preprocessMatchesArray, db);
                    preprocessMatchedObject = {
                        id: question_id_obj[0].question_id,
                        subject: question_id_obj[0].subject,
                        ocr_text: question_id_obj[0].ocr_text,
                        chapter: 0,
                        is_answered: question_id_obj[0].is_answered,
                        is_text_answered: question_id_obj[0].is_text_answered,
                    };
                }
                const ocrLength = ocr.length;
                if (!QuestionHelper.isImageTextViableToSearch(ocrData, variantAttachment) && !isNonViableImageTextDataExtractionSuccess) {
                    // sending empty response if ocr length < 3
                    filedToUpdate.question = staticData.question_logging.question_v10_small_ocr;
                    Question.updateQuestionAliasedTable(filedToUpdate, qid, db.mysql.write);
                    // fire kafka event for updation
                    // kafka.publish(kafka.topics.askVvs, studentId, { ...filedToUpdate, uuid: qid, action: Data.ask_vvs.update_question });
                    newFieldToUpdate = { ...filedToUpdate, doubt_id };
                    delete newFieldToUpdate.difficulty;
                    delete newFieldToUpdate.question;
                    delete newFieldToUpdate.doubt;
                    delete newFieldToUpdate.wrong_image;
                    newFieldToUpdate.iteration = staticData.question_logging.question_v10_small_ocr;
                    newFieldToUpdate.ocr_service_type = filedToUpdate.is_trial;
                    delete newFieldToUpdate.is_trial;
                    newFieldToUpdate.is_blur = 0;
                    newFieldToUpdate.is_handwritten = 1;
                    const responseDataData = {
                        question_id: qid,
                        ocr_text: ocr,
                        question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                        question_locale: ocrData.locale,
                        matched_questions: [],
                        matched_count: 0,
                        handwritten: 1,
                        is_only_equation: false,
                        is_exact_match: false,
                        tab: staticData.topic_tab,
                        notification: [],
                        feedback,
                        is_p2p_available: p2pData.isMatchpageP2pEnabled,
                        p2p_thumbnail_images: locale === 'hi' ? p2pData.p2pAskerThumbnailsHi : p2pData.p2pAskerThumbnailsEn,
                    };
                    const responseData = {
                        data: responseDataData,
                        error: false,
                        schema: responseSchema,
                    };
                    if (typeof filedToUpdate.question_image === 'undefined') {
                        responseData.data.question_image = null;
                    }
                    responseData.data.cdn_video_base_url = config.cdn_video_url;
                    responseData.data.is_blur = false;
                    const metaData = {
                        code: 200,
                        success: true,
                        message: 'Success',
                    };
                    QuestionHelper.replaceComptaibleOcrTextForVideoViewApi(responseData.data);
                    responseData.data = await QuestionHelper.getLiveAndVipTabDetails(db, responseData.data, req.user, req.headers);
                    response.setMeta(metaData);
                    response.setData(responseData.data);
                    return next(response);
                }

                if (variantAttachment && variantAttachment.useComposerApi) {
                    useComposerApi = true;
                    searchFieldName = Utility.getFieldNameForTranslate(locale);
                }

                if (variantAttachment && variantAttachment.disableSSStringDiffHindiQuestionLocale && locale == 'hi') {
                    variantAttachment.isReorderSuggestions = false;
                }

                let localeDetected = null;
                if (Utility.isEnglishMathSymbolString(ocr)) {
                    localeDetected = 'en';
                }

                if (Utility.isStudentIdEligibleForRepeatQuestionsPersonalisation(studentId)) {
                    let userRecentlyAskedQuestions = await QuestionAskPersonalisationContainer.getUserRecentlyAskedQuestionsData(db, config, req.user.student_id);
                    if (userRecentlyAskedQuestions && userRecentlyAskedQuestions.length > 0) {
                        userRecentlyAskedQuestions = userRecentlyAskedQuestions.map((objString) => JSON.parse(objString));
                        let personalisationClass;
                        let personalisationTopic;
                        const hasSameQuestionAskedResponse = Utility.hasSameQuestionAskedRecently(userRecentlyAskedQuestions, ocr);
                        const isRepeatQuestionFlag = ocr.length > 3 ? hasSameQuestionAskedResponse > -1 : false;
                        if (isRepeatQuestionFlag) {
                            const questionClasses = [...new Set(userRecentlyAskedQuestions.map((item) => item.class))];
                            if (questionClasses.length == 1 && staticData.questionAskPersonalisation.juniorClasses.includes(questionClasses[0])) {
                                personalisationClass = questionClasses[0];
                            }
                            const repeatedQuestionData = userRecentlyAskedQuestions[hasSameQuestionAskedResponse];
                            const subjectDomain = repeatedQuestionData.subject;
                            const recentQuestiontopics = _.countBy(userRecentlyAskedQuestions.filter((x) => x.subject == subjectDomain), 'topic');
                            const mostOccuredTopic = _.maxBy(_.keys(recentQuestiontopics), (o) => recentQuestiontopics[o]);
                            personalisationTopic = mostOccuredTopic;
                            if (mostOccuredTopic) {
                                variantAttachment.queryConfig.questionTopics = [personalisationTopic];
                            }
                            if (personalisationClass) {
                                variantAttachment.queryConfig.studentClass = personalisationClass;
                            }
                            variantAttachment.locale = ocrData.locale;
                            variantAttachment.queryConfig.searchFieldName = Utility.getFieldNameForTranslate(ocrData.locale);
                        }
                    }
                }

                if (!useIasFlag) {
                    promises.push(QuestionHelper.handleElasticSearchWrapper({
                        db,
                        ocr,
                        elasticSearchInstance,
                        elasticSearchTestInstance,
                        kinesisClient,
                        elasticIndex: indexName,
                        stockWordList: null,
                        useStringDiff: true,
                        language,
                        locale: localeDetected,
                        fuzz,
                        UtilityModule: Utility,
                        studentId,
                        req,
                        ocrType,
                        isDiagramPresent,
                        orientation,
                        fileName,
                        variantAttachment,
                        config,
                        sqs,
                        region,
                        studentClass,
                        next,
                        useComposerApi,
                        searchFieldName,
                        questionLocale: ocrData.locale,
                        // languagePersonificationAttachment,
                        userProfile,
                        questionId: qid,
                        askV10SmAttachment,
                        duplicateQuestionMapByTag,
                        userQuestionsAnalysisLogging,
                        matchesArrayReorderingAttachment,
                        noFilterMatchesOnMatchPageAttachment,
                    }, config));
                    // promises.push(StudentCourseMapping.getStudentCourse(db.mysql.read, studentId));
                    if (checkBlurImages) {
                        promises.push(QuestionHelper.checkBlurImage(fileName, config, ocr));
                    }
                    const resolvedPromises = await Promise.all(promises);
                    const result = resolvedPromises[0];
                    // if (result instanceof Error) {
                    //     QuestionHelper.setResponseForSearchFailures(response);
                    //     return next(response);
                    // }
                    // const studentCourseDetails = resolvedPromises[1];
                    let query2log = '';
                    if (!_.isEmpty(result.elasticQuery)) {
                        if (typeof result.elasticQuery === 'object') {
                            query2log = JSON.stringify(result.elasticQuery);
                        } else {
                            query2log = result.elasticQuery;
                        }
                    }
                    userQuestionsAnalysisLogging.elastic_query = query2log;
                    userQuestionsAnalysisLogging.query_ocr_text = result.info.query_ocr_text;
                    userQuestionsAnalysisLogging.search_service_response_time = result.info.ssResponseTime || 0;
                    userQuestionsAnalysisLogging.videoLanguageSet = result.variantAttachment.userLanguages || result.variantAttachment.logUserLanguages;
                    userQuestionsAnalysisLogging.userLocation = result.variantAttachment.userLocation;
                    userQuestionsAnalysisLogging.userIP = result.variantAttachment.userIP;
                    if (!_.isEmpty(studentCourseDetails)) {
                        userQuestionsAnalysisLogging.school_board = studentCourseDetails[0].course;
                    }
                    if (!_.isNull(result.info.ssError)) {
                        userQuestionsAnalysisLogging.is_ss_error = 1;
                        userQuestionsAnalysisLogging.ss_error = result.info.ssError.toString();
                    } else {
                        userQuestionsAnalysisLogging.is_ss_error = 0;
                    }
                    userQuestionsAnalysisLogging.equation_ocr_text = result.equationOcrText || [];
                    userQuestionsAnalysisLogging.contains_equation = !_.isEmpty(result.equationOcrText) && result.equationOcrText.length ? 1 : 0;
                    // if (!_.isNull(languagePersonificationAttachment)) {
                    //     userQuestionsAnalysisLogging.languageAttachment = languagePersonificationAttachment.key;
                    // }
                    // if (result.languagePrioritySwaps.length > 0) {
                    //     userQuestionsAnalysisLogging.languagePrioritySwaps = result.languagePrioritySwaps;
                    //     userQuestionsAnalysisLogging.languagePriorityQidSwaps = result.languagePriorityQidSwaps;
                    //     if (languagePersonificationAttachment && languagePersonificationAttachment.is_active) {
                    //         userQuestionsAnalysisLogging.languagePrioritySwapType = `${userProfile.appLocale}_${userProfile.questionLocale}_swaps_v1`;
                    //         userQuestionsAnalysisLogging.languagePriorityOrder = result.languagePriorityOrder;
                    //     } else {
                    //         userQuestionsAnalysisLogging.languagePrioritySwapType = `${language}_swaps`;
                    //     }
                    // }
                    if (result.compatibleLanguageMatchesScore) {
                        userQuestionsAnalysisLogging.compatibleLanguageMatchesScore = result.compatibleLanguageMatchesScore;
                    }
                    if (checkBlurImages) {
                        if (ocrLength < 10) {
                            isBlur = resolvedPromises[1];
                        }

                        isImageBlur = resolvedPromises[1];
                    }
                    if (!result || !result.stringDiffResp || !result.info) {
                        return next({
                            message: 'Error in search question', status: 500, isPublic: true, error: true,
                        });
                    }
                    ({
                        stringDiffResp,
                        stringDiffRespNoFilter,
                        info,
                        isOnlyEquation,
                        cymathString,
                        cleanedOcr,
                        equationOcrText,
                    } = result);
                    if (isQuestionOcrEdited) {
                        cymathString = cymathString.replace(/`/g, '');
                    }
                    // userQuestionsLogsMongoDb.isAbEligible = new Date() - start;
                    userQuestionsLogsMongoDb.elastic_index = info.query_ocr_text;
                    // userQuestionsLogsMongoDb.meta_index = String(isBlur);
                }
            }
            promises = [];
            matchesArray = stringDiffResp[0];
            let noFilterMatchesArray = _.get(stringDiffRespNoFilter, '[0]', []);
            const noFilterMatchQid = _.get(stringDiffRespNoFilter, '[1]', []);
            const noFilterGroupQid = _.get(stringDiffRespNoFilter, '[2]', []);

            if (staticData.backPressMatchesConfig.activeVariantIds.includes(backpressMatchPageVariant) && backpressUserMatchesAttachment && backpressUserMatchesAttachment.is_active && backpressUserMatchesStrategyAttachment) {
                const backPressMatchResponse = await QuestionHelper.handleBackPressMatches({
                    db,
                    elasticSearchLtrInstance,
                    elasticSearchTestInstance,
                    ocr,
                    user_locale: locale,
                    ques_locale: ocrData.locale,
                    config: staticData.backPressMatchesConfig,
                    backpressUserMatchesStrategyAttachment,
                    fuzz,
                });
                var { backPressMatchQid, backPressGroupQid, backPressMatchArray } = backPressMatchResponse;
                userQuestionsAnalysisLogging.backPressSortingStrategy = backpressUserMatchesStrategyAttachment.sorting_type;
            }

            userQuestionsAnalysisLogging.backPressMatchQid = backPressMatchQid;
            userQuestionsAnalysisLogging.noFilterMatchQid = noFilterMatchQid;
            userQuestionsAnalysisLogging.should_display_no_filter_matches = _.get(noFilterMatchesOnMatchPageAttachment, 'enabled', false);

            if (variantAttachment && variantAttachment.numberBoostStrategy) {
                const reorderType = variantAttachment.numberBoostStrategy.type;
                matchesArray = QuestionHelper.getMatchesArrayReorderedByBoostingNumbers(ocr || filedToUpdate.ocr_text, matchesArray, reorderType);
            }

            // if(locale == 'en' && !_.isEmpty(matchesArray)){
            //     matchesArray = Utility.mapRecommendedScores(matchesArray);
            // }

            //       ---------  skip to matchesArray ------
            if (!_.isEmpty(matchesArrayLanguageConstraint)) {
                matchesArray = matchesArray.filter((elem) => matchesArrayLanguageConstraint.includes(elem._source.video_language));
            }

            let matchEmpty = false;
            if (matchesArray.length === 0) {
                matchEmpty = true;
            }

            if (!_.isEmpty(preprocessMatchedObject)) {
                const wrappedPreprocessMatchedObject = { ...matchesArray[0], _id: preprocessMatchedObject.id, _source: preprocessMatchedObject };
                matchesArray.unshift(wrappedPreprocessMatchedObject);
            }

            matchesArray = _.uniq(matchesArray, '_id');

            filedToUpdate.is_skipped = is_skipped;
            if (!isQuestionOcrEdited) {
                filedToUpdate.original_ocr_text = ocrData.original_ocr;
            } else {
                filedToUpdate.incorrect_ocr = 1;
            }

            filedToUpdate.question = info.version;
            userQuestionsAnalysisLogging.iteration_version = filedToUpdate.question;
            // if (variantAttachment) {
            //     Utility.addDeterministicSuffixToSsIteration(variantAttachment, isSearchServiceFlagrDeterministic);
            // }
            if (questionImageAlreadyUploadedFlag) {
                if (variantAttachment && variantAttachment.versionSuffix) {
                    filedToUpdate.question = `${filedToUpdate.question}_${variantAttachment.versionSuffix}`;
                }
                // filedToUpdate.question = `${filedToUpdate.question}_newFlow`;
                filedToUpdate.doubt = ques;
                if (req.headers.country && isUsRegion(req.headers.country)) {
                    filedToUpdate.doubt = 'APP_US';
                }
            }
            filedToUpdate.wrong_image = 0;
            filedToUpdate.is_trial = ocrType;
            userQuestionsLogsMongoDb.ocrType = ocrType;
            let matchesQuestionArray = stringDiffResp[1];
            // userQuestionsLogsMongoDb.qid_matches_array = matchesQuestionArray;

            let groupedQid = stringDiffResp[2];
            filedToUpdate.subject = stringDiffResp[3];
            filedToUpdate.chapter = stringDiffResp[4];
            await QuestionRedis.setUserAskedQuestionData(db.redis.write, qid, { chapter: stringDiffResp[4], subject: stringDiffResp[3] });
            userQuestionsAnalysisLogging.subject = stringDiffResp[3];
            userQuestionsAnalysisLogging.chapter = stringDiffResp[4];
            insertedQuestion.subject = stringDiffResp[3];
            insertedQuestion.chapter = stringDiffResp[4];

            if (variantAttachment && variantAttachment.removeDuplicates) {
                let duplicateQids = [];
                // removing duplicates if any
                [matchesArray, matchesQuestionArray, groupedQid, duplicateQids] = await QuestionHelper.detectDuplicateSolutions(matchesArray, matchesQuestionArray, groupedQid);
                userQuestionsAnalysisLogging.duplicate_qids = duplicateQids;
            }
            matchesArray = matchesArray.slice(0, limit);
            matchesQuestionArray = matchesQuestionArray.slice(0, limit);
            groupedQid = groupedQid.slice(0, limit);

            const computationDetails = await QuestionHelper.handleComputationalQuestionsWrapper({
                variantAttachment,
                cleanedOcr,
                equationOcrText,
                info,
                matchesArray,
                subject: stringDiffResp[3],
                mathsteps,
                qid,
                locale,
                isTyd,
                UtilityModule: Utility,
            });

            const computational = computationDetails[0];
            if (!_.isEmpty(computational) && computational.length) {
                filedToUpdate.is_text_answered = 1;
                filedToUpdate.ocr_text = `\`${ocrData.ocr}\``;
                filedToUpdate.subject = 'MATHS';
                insertComputationalQuestion = true;
            }

            let groupedMeta = [];
            let backPressGroupedMeta = [];
            let noFilterGroupedMeta = [];
            promises = [];
            promises.push(Utility.getEnglishGroupedMeta(db, matchesArray, groupedQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next));
            promises.push(Utility.getEnglishGroupedMeta(db, backPressMatchArray, backPressGroupQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next));
            if (noFilterMatchesArray.length) {
                promises.push(Utility.getEnglishGroupedMeta(db, noFilterMatchesArray, noFilterGroupQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next));
            }
            let resolvedPromises = await Promise.all(promises);
            groupedMeta = resolvedPromises[0];
            backPressGroupedMeta = resolvedPromises[1];
            noFilterGroupedMeta = _.get(resolvedPromises, '[2]', []);
            // -------- mongo data insertion ------ //
            if (info && info.version) {
                userQuestionsLogsMongoDb.iteration_name = info.version;
            } else {
                userQuestionsLogsMongoDb.iteration_name = staticData.current_ask_question_iteration;
            }
            // userQuestionsLogsMongoDb.request_version = 'v10';
            userQuestionsLogsMongoDb.question_image = fileName;
            userQuestionsLogsMongoDb.user_locale = stLangCode;
            userQuestionsLogsMongoDb.ocr = ocr;
            userQuestionsLogsMongoDb.subject = stringDiffResp[3];
            if (insertComputationalQuestion) {
                const computationQuestionId = qid;
                computational[0]._id = `COMPUTATIONAL:${computationQuestionId.toString()}`;
                const textSolutionData = computationDetails[1];
                textSolutionData.question_id = computationQuestionId;
                filedToUpdate.parent_id = computationQuestionId;
                await AnswerMysql.addTextSolution(db.mysql.write, textSolutionData);
            }
            // if(Utility.isStudentIdEligibleForRepeatQuestionsPersonalisation(studentId)){
            //     if(ocrData && ocrData.topic && ocrData.topic.length > 0){
            //         const thisQuestionPersonalisationData = {
            //             question_id : uploadedImageQuestionId,
            //             class : parseInt(req.user.student_class),
            //             ocr_text : ocr,
            //             subject  : stringDiffResp[3],
            //             topic : ocrData['topic'][0],
            //         };
            //         QuestionRedis.populateQuestionAskedPersonalisationData(db.redis.write,studentId,thisQuestionPersonalisationData);
            //     }
            // }
            // USE IT ONLY FOR LOGGING
            const relevanceScoreArr = [];
            for (let i = 0; i < matchesArray.length; i++) {
                matchesArray[i]._source.exact_match = false;
                const relevanceObject = { qid: matchesArray[i]._id, _score: matchesArray[i]._score, string_diff_score: matchesArray[i].partial_score };
                relevanceScoreArr.push(relevanceObject);
            }
            // if (checkExactTag && _.get(matchesArray, '[0]._source', null)) {
            //     matchesArray[0]._source.exact_match = true;
            // }
            userQuestionsLogsMongoDb.relevance_score = relevanceScoreArr;
            // const questionAskLog = new QuestionLog.QuestionLogModel(userQuestionsLogsMongoDb);
            const promises3 = [];
            promises3.push(QuestionRedis.setPreviousHistory(studentId, [{
                question_id: qid,
                ocr_text: ocr,
            }], db.redis.write));
            // promises3.push(questionAskLog.save());
            Promise.all(promises3).then(() => { }).catch(() => { }); // async
            userQuestionsLogsMongoDb.locale = locale;
            const event = { data: userQuestionsLogsMongoDb, type: 'mongoWrite' };
            // Utility.sendMessage(sqs, config.elasticsearch_sqs, event);
            kafka.publish(kafka.topics.userQuestionsMongoSnap, qid, userQuestionsLogsMongoDb, {});
            // - redis matches logging
            const redis_matches_data = [userQuestionsLogsMongoDb];

            if (QuestionHelper.shouldStoreQuestionMatchResponseInRedis(retry_counter)) {
                QuestionRedis.setUserAskedQuestionData(db.redis.write, qid, { matches: JSON.stringify(redis_matches_data) });
            }
            const checkComputationalExactMatch = insertComputationalQuestion && variantAttachment && variantAttachment.getComputeExactMatch;
            const isTopMatchExactMatch = QuestionHelper.checkTopMatchExactness({
                checkExactMatch,
                matchesArray,
                clientSource,
                locale,
                info,
                fuzz,
                variantAttachment,
                versionCode,
                userQuestionsAnalysisLogging,
                matchesArrayReorderingAttachment,
            });
            newFieldToUpdate = { ...filedToUpdate, doubt_id };
            if (isTopMatchExactMatch) {
                [matchesArray, newFieldToUpdate,
                    metadata, limit, isExactMatch] = QuestionHelper.handleExactMatch({
                    db,
                    matchesArray,
                    newFieldToUpdate,
                    qid,
                    studentId,
                    metadata,
                    limit,
                    isExactMatch,
                    versionCode,
                    variantAttachment,
                    duplicateQuestionMapByTag,
                    userQuestionsAnalysisLogging,
                    matchesArrayReorderingAttachment,
                });
            }
            promises = [];
            if (language !== 'english') {
                promises.push(QuestionContainer.getLocalisedQuestionMget(db, matchesArray, groupedMeta, language, next, groupedQid, elasticSearchInstance));
                promises.push(QuestionContainer.getLocalisedQuestionMget(db, backPressMatchArray, backPressGroupedMeta, language, next, backPressGroupQid, elasticSearchInstance));
                // ocr_text update
                if (noFilterMatchesArray) {
                    promises.push(QuestionContainer.getLocalisedQuestionMget(db, noFilterMatchesArray, noFilterGroupedMeta, language, next, noFilterGroupQid, elasticSearchInstance));
                }
                resolvedPromises = await Promise.all(promises);
                matchesArray = resolvedPromises[0];
                backPressMatchArray = resolvedPromises[1];
                noFilterMatchesArray = _.get(resolvedPromises, '[2]', noFilterMatchesArray);
            }

            let matchedQuestionsHtml;
            let groupedMatchedQuestionHtml;
            promises = [];
            if (language === 'english') {
                matchedQuestionsHtml = await QuestionContainer.getQuestionHtmlMget(db, matchesQuestionArray, next);
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                promises.push(QuestionContainer.getQuestionStatsWithMget(db, matchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, groupedMeta, studentId, next, req.headers['x-auth-token'], versionCode, region, videoLangDisplayAttachment, srpVideoLanguageHindiAttachment));

                matchedQuestionsHtml = await QuestionContainer.getQuestionHtmlMget(db, backPressMatchQid, next);
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                promises.push(QuestionContainer.getQuestionStatsWithMget(db, backPressMatchArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, backPressGroupedMeta, studentId, next, req.headers['x-auth-token'], versionCode, region, videoLangDisplayAttachment, srpVideoLanguageHindiAttachment));

                matchedQuestionsHtml = await QuestionContainer.getQuestionHtmlMget(db, noFilterMatchQid, next);
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                // ref is getting updated
                if (noFilterMatchesArray.length) {
                    promises.push(QuestionContainer.getQuestionStatsWithMget(db, noFilterMatchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, noFilterGroupedMeta, studentId, next, req.headers['x-auth-token'], versionCode, region, videoLangDisplayAttachment, srpVideoLanguageHindiAttachment));
                }

                resolvedPromises = await Promise.all(promises);
                matchesArray = resolvedPromises[0];
                backPressMatchArray = resolvedPromises[1];
                noFilterMatchesArray = _.get(resolvedPromises, '[2]', noFilterMatchesArray);
            }
            // removing user feedback since its not being used in client side (keeping its default value)
            // TODO: remove like share comment also

            // matchesArray = await QuestionContainer.getQuestionStatsWithMget(matchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, groupedMeta, db, studentId);
            // promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentMulti(matchesArray, studentId, db));
            promises = [];
            if (retry_counter && retry_counter >= 1 && !isMultipleImageSelected) {
                promises.push(Utility.fakePromise());
            } else {
                promises.push(Question.updateQuestionAliasedTable(filedToUpdate, qid, db.mysql.write));
                // fire kafka event for updation
                // kafka.publish(kafka.topics.askVvs, studentId, { ...filedToUpdate, uuid: qid, action: Data.ask_vvs.update_question });
                delete newFieldToUpdate.difficulty;
                delete newFieldToUpdate.question;
                delete newFieldToUpdate.doubt;
                delete newFieldToUpdate.wrong_image;
                newFieldToUpdate.iteration = filedToUpdate.question;
                newFieldToUpdate.ocr_service_type = filedToUpdate.is_trial;
                delete newFieldToUpdate.is_trial;
                newFieldToUpdate.is_handwritten = handwritten;
            }
            const computeResponse = '';
            if (metadata) {
                if (!Utility.isUsRegion(region)) {
                    Notification.questionCountNotifications(studentId, req.user.gcm_reg_id, config, null, db);
                }
                promises.push(QuestionContainer.getQuestionStatsWithMget(db, matchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, groupedMeta, studentId, next, req.headers['x-auth-token'], versionCode, region, videoLangDisplayAttachment, srpVideoLanguageHindiAttachment));
                const resolvedP = await Promise.all(promises);
                matchesArray = resolvedP[1];

                promises = [];
                promises.push(QuestionContainer.getLangCode(matchesArray, null));
                promises.push(QuestionContainer.getLangCode(backPressMatchArray, null));
                // mostly video_language is getting updated which is not being used
                // promises.push(QuestionContainer.getLangCode(noFilterMatchesArray, null));
                resolvedPromises = await Promise.all(promises);
                matchesArray = resolvedPromises[0];
                backPressMatchArray = resolvedPromises[1];
                // noFilterMatchesArray = resolvedPromises[2];
            } else {
                promises.push(QuestionContainer.getResourceType(db, matchesArray));
                const resolvedP = await Promise.all(promises);
                matchesArray = resolvedP[1];
            }

            if (matchesArrayReorderingAttachment && matchesArrayReorderingAttachment.reorderTextVideoDuplicateSolutions) {
                //TODO: REORDERING EXPERIMENT 2
                matchesArray = QuestionHelper.reorderTextVideoDuplicateSolutions(matchesArray, duplicateQuestionMapByTag, userQuestionsAnalysisLogging, matchesArrayReorderingAttachment);
            }

            if (computational && computational.length > 0) {
                matchesArray = [...computational, ...matchesArray];
            }
            if (computeResponse) {
                const computeResponseArr = [];
                computeResponseArr.push(Utility.generateDynamicResponse(computeResponse, qid, ocr));
                computeResponseArr[0].html.replace(/\r\n|\n|\r/g, '');
                matchesArray = [...computeResponseArr, ...matchesArray];
            }
            if (checkComputationalExactMatch && checkExactMatch && !isTopMatchExactMatch) {
                [matchesArray, newFieldToUpdate,
                    metadata, limit, isExactMatch] = QuestionHelper.handleExactMatch({
                    db,
                    matchesArray,
                    newFieldToUpdate,
                    qid,
                    studentId,
                    metadata,
                    limit,
                    isExactMatch,
                    versionCode,
                    variantAttachment,
                    duplicateQuestionMapByTag,
                    userQuestionsAnalysisLogging,
                });
            }
            if (matchesQuestionArray.length) {
                matchesArray = await QuestionHelper.removeDuplicateTextSolutions(db, matchesArray, matchesQuestionArray);
            }

            const nData = [];
            const d1 = moment(req.user.timestamp);
            const d2 = moment(new Date());
            const difference = d2.diff(d1, 'days');

            QuestionHelper.sendSnsMessage({
                type: 'user-questions',
                sns,
                uuid,
                qid,
                studentId,
                studentClass,
                subject,
                chapter,
                version: filedToUpdate.question,
                ques,
                locale,
                questionImage: filedToUpdate.question_image,
                ocrText: filedToUpdate.ocr_text,
                ocrDone: filedToUpdate.ocr_done,
                originalOcrText: filedToUpdate.original_ocr_text,
                wrongImage: filedToUpdate.wrong_image,
                isTrial: filedToUpdate.is_trial,
                difficulty: filedToUpdate.difficulty,
                UtilityModule: Utility,
                userQuestionSnsUrl,
                config,
            });

            const topicTabs = staticData.topic_tab;
            let facets = [];
            const advancedV3Flag = true;
            if (metadata) {
                QuestionRedis.setMatchesForAdvanceSearchById(db.redis.write, qid, {
                    matchesArray,
                    matchesType: isNonViableImageTextDataExtractionSuccess && askV10SmAttachment.iteration === 'viser_diagram' ? 'image' : 'text',
                    fileName: uploadedQuestionImageName,
                });
                if (versionCode && versionCode < 756) {
                    facets = await bl.getFacetsByVersionCode(xAuthToken, config, versionCode, UtilityFlagr, elasticSearchInstance, matchesArray, req.user.locale);
                    if (facets) {
                        for (let m = 0; m < facets.length; m++) {
                            facets[m].data = _.uniqBy(facets[m].data, 'display');
                        }
                    }
                }
                if (versionCode && facets && facets.length > 0 && !_.isEmpty(matchesArray) && versionCode < 756) {
                    if (versionCode > 723 && advancedV3Flag) {
                        answerBl.pushFacetCardV3(matchesArray, facets, 0);
                    } else if (versionCode > 659) {
                        answerBl.pushFacetCard(matchesArray, facets, 0);
                    }
                }
                if (versionCode && versionCode === 685 && !_.isEmpty(matchesArray) && !Utility.isUsRegion(region)) {
                    if ((typeof questionText === 'undefined' || questionText.length === 0) && matchesArray.length > 0) {
                        answerBl.pushBountyCard(matchesArray, req.body.source);
                    }
                    /*
                    Activity Stream Entry
                    */
                    db.redis.read.publish('activitystream_service', JSON.stringify({
                        actor_id: req.user.student_id,
                        actor_type: 'USER',
                        actor: { student_username: req.user.student_username, user_avatar: req.user.student_avatar },
                        verb: 'ASKED',
                        object: '',
                        object_id: qid,
                        object_type: 'QUESTION',
                        target_id: '',
                        target_type: '',
                        target: '',
                    }));
                    const responseData = {
                        data: {
                            question_id: qid,
                            tab: topicTabs,
                            platform_tabs: platformTabs,
                            ocr_text: cleanedOcr,
                            question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                            question_locale: ocrData.locale,
                            matched_questions: matchesArray,
                            matched_count: matchesArray.length,
                            is_subscribed: isSubscribed,
                            notification: nData,
                            handwritten,
                            feedback,
                            is_only_equation: isOnlyEquation,
                            is_p2p_available: p2pData.isMatchpageP2pEnabled,
                            p2p_thumbnail_images: locale === 'hi' ? p2pData.p2pAskerThumbnailsHi : p2pData.p2pAskerThumbnailsEn,
                        },
                        error: false,
                        schema: responseSchema,
                    };
                    if (typeof filedToUpdate.question_image === 'undefined') {
                        responseData.data.question_image = null;
                    }
                }

                if (difference > 4) {
                    // const introVideoId = Constant.cropToEquation();
                    const notificationData1 = staticData.cameraGuideNotificationData;
                    nData.push(notificationData1);
                }
            }

            const matchesAnswerArray = [];
            const matchesQidsArr = [];
            let katexRenderFlag = false;
            let optionsDisplayFlag = false;

            for (let index = 0; index < matchesArray.length; index++) {
                matchesAnswerArray.push(matchesArray[index].answer_id);
                if (!_.isEmpty(matchesArray[index]._id)) {
                    matchesQidsArr.push(matchesArray[index]._id);
                }
            }

            if (req.user.locale && req.user.locale === 'en' && variantAttachment && variantAttachment.showOptions) {
                optionsDisplayFlag = true;
                matchesArray = await QuestionContainer.getQuestionOptions(db, config, matchesQidsArr, matchesArray);
            }

            QuestionRedis.setUserAskedQuestionData(db.redis.write, qid, { m_qids: JSON.stringify(matchesQidsArr) });
            userQuestionsAnalysisLogging.matched_questions_arr = matchesQidsArr;
            userQuestionsAnalysisLogging.videos_watched = [];
            userQuestionsAnalysisLogging.is_null_popup_show = _.isEmpty(matchesQidsArr) ? 1 : 0;
            userQuestionsAnalysisLogging.timestamp = moment().unix();
            userQuestionsAnalysisLogging.version_code = versionCode;
            userQuestionsAnalysisLogging.check_exact_match = typeof req.body.checkExactMatch !== 'undefined' ? req.body.checkExactMatch : false;
            let katexOcrsResponse = [];

            // TODO : DISABLE KATEX
            if (req.user.locale && req.user.locale === 'en' && !optionsDisplayFlag) {
                katexRenderFlag = true;
            }

            if (matchesQidsArr && matchesQidsArr.length > 0 && katexRenderFlag) {
                katexOcrsResponse = await elasticSearchInstance.getkatexOcrsBulk(matchesQidsArr);
            }

            if (katexRenderFlag) {
                for (let k = 0; k < matchesQidsArr.length; k++) {
                    if (!_.isEmpty(matchesArray[k]._source)) {
                        if (katexOcrsResponse.docs[k].found && !Utility.isNotSupportedByKatex(katexOcrsResponse.docs[k]._source.ocr_text)) {
                            matchesArray[k]._source.katex_ocr_text = katexOcrsResponse.docs[k]._source.ocr_text;
                            matchesArray[k]._source.render_katex = true;
                        } else {
                            matchesArray[k]._source.render_katex = false;
                        }
                    }
                }
            }

            const allTypeResourceVersion = liveclassData.videoAlltypeHandlingVersionCode;

            promises = [];
            promises.push(QuestionHelper.updateVideoAndSubjectIcon(matchesArray, db, config, supportedMediaList, allTypeResourceVersion, versionCode, locale));
            promises.push(QuestionHelper.updateVideoAndSubjectIcon(backPressMatchArray, db, config, supportedMediaList, allTypeResourceVersion, versionCode, locale));
            // ocr_text update
            if (noFilterMatchesArray.length) {
                promises.push(QuestionHelper.updateVideoAndSubjectIcon(noFilterMatchesArray, db, config, supportedMediaList, allTypeResourceVersion, versionCode, locale));
            }
            resolvedPromises = await Promise.all(promises);
            await StudentRedis.delQaWidgetData(db.redis.write, studentId, 'QA_WIDGET_DATA');
            matchesArray = resolvedPromises[0];
            backPressMatchArray = resolvedPromises[1];
            noFilterMatchesArray = _.get(resolvedPromises, '[2]', noFilterMatchesArray);

            if (locale == 'en' && !_.isEmpty(matchesArray)) {
                matchesArray = Utility.mapRecommendedScores(matchesArray, locale, insertComputationalQuestion, variantAttachment);
            }

            for (let i = 0; i < matchesArray.length; i++) {
                matchesArray[i]._source.ref_color = '#8235D6';
                matchesArray[i]._source.subject_title_color = '#8235D6';
                matchesArray[i]._source.rating = `${(Math.random() * (5.0 - 4.5) + 4.5).toFixed(1)} ✭`;
                matchesArray[i]._source.rating_color = '#8235D6';
                matchesArray[i]._source.rating_background_color = '#9DD373';
            }

            if (Utility.isUsRegion(region)) {
                const t_indices = [];
                const t_promises = [];
                for (let i = 0; i < matchesArray.length; i++) {
                    if (!_.isEmpty(matchesArray[i]._source) && matchesArray[i]._source.ocr_text.length > 0) {
                        const question_ocr_text = matchesArray[i]._source.ocr_text;
                        // matchesArray[i]['question_thumbnail'] = 'https://dummyimage.png';
                        // matchesArray[i]['question_thumbnail_localized']= 'https://dummyimage.png';
                        if (Utility.checkHindiCharsSubstr(question_ocr_text)) {
                            t_indices.push(i);
                            t_promises.push(Utility.translateApi2(question_ocr_text, translate2));
                        }
                    }
                }

                const question_translate_promises = await Promise.all(t_promises);
                for (let j = 0; j < question_translate_promises.length; j++) {
                    const tApiResp = question_translate_promises[j];
                    if (tApiResp.length > 0 && tApiResp[1].data !== undefined && tApiResp[1].data.translations !== undefined && tApiResp[1].data.translations[0].translatedText !== undefined) {
                        matchesArray[t_indices[j]]._source.ocr_text = tApiResp[1].data.translations[0].translatedText;
                    }
                }
            }
            

            let responseDataData = {
                question_id: qid,
                ocr_text: cymathString,
                question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                question_locale: ocrData.locale,
                matched_questions: matchesArray,
                matched_count: matchesArray.length,
                handwritten,
                is_only_equation: isOnlyEquation,
                is_exact_match: isExactMatch,
                tab: [],
                notification: [],
                feedback,
                is_p2p_available: p2pData.isMatchpageP2pEnabled,
                p2p_thumbnail_images: locale === 'hi' ? p2pData.p2pAskerThumbnailsHi : p2pData.p2pAskerThumbnailsEn,
            };

            // if (googleTabDoubtnutResultsFilterFlag) {
            //     if (versionCode && versionCode <= 979) {
            //         responseDataData.ocr_text = QuestionHelper.getGoogleTabQueryOcrText(cymathString, versionCode);
            //     } else {
            //         responseDataData.tab_urls = {
            //             google: QuestionHelper.getSearchUrlForMPTabs(responseDataData.ocr_text, 'google'),
            //             youtube: QuestionHelper.getSearchUrlForMPTabs(responseDataData.ocr_text, 'youtube'),
            //         };
            //     }
            // }
            if (metadata) {
                responseDataData.tab = topicTabs;
                responseDataData.platform_tabs = platformTabs;
                responseDataData.is_subscribed = isSubscribed;
                responseDataData.notification = nData;
                responseDataData.feedback = feedback;
                if (versionCode >= 765) {
                    const autoPlayData = QuestionContainer.getAutoPlayVariant(autoPlayVariantAttachment);

                    if (!autoPlayData.autoPlayVariant) {
                        responseDataData.auto_play = false;
                    } else {
                        responseDataData.auto_play = true;
                        responseDataData.auto_play_initiation = autoPlayData.waitTime;
                        responseDataData.auto_play_duration = autoPlayData.duration;
                    }
                }

                if (!_.isNull(ocrRenderPriorityAttachment)) {
                    responseDataData.ocr_loading_order = ocrRenderPriorityAttachment.order;
                }
                if (Utility.isUsRegion(region)) {
                    responseDataData.auto_play = false;
                    responseDataData.notification = [];
                }

                if (versionCode && versionCode > 659) {
                    if (versionCode && versionCode > 723 && advancedV3Flag) {
                        if (facets && facets.length) {
                            responseDataData.facets_v2 = facets;
                        }
                        responseDataData.tab = [];
                        if (matchEmpty) {
                            responseDataData.feedback.is_show = 0;
                        } else {
                            responseDataData.feedback.is_show = 1;
                        }
                    } else if (facets && facets.length) {
                        responseDataData.facets = facets;
                    }
                }
            }

            if (Utility.isUsRegion(region)) {
                responseDataData.feedback.is_show = 0;
            }

            responseDataData = QuestionContainer.getLanguageHeadingText(responseDataData, req.user.locale);

            const responseData = {
                data: responseDataData,
                error: false,
                schema: responseSchema,
            };
            if (typeof filedToUpdate.question_image === 'undefined') {
                responseData.data.question_image = null;
            }
            // add widget to matchesArray

            // const data = {
            //     action: 'ASK_FROM_APP',
            //     data: insertedQuestion,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.question_ask_sns, data);
            responseData.data.cdn_video_base_url = config.cdn_video_url;
            responseData.data.is_blur = isBlur;
            responseData.data.is_image_blur = false;
            responseData.data.is_image_handwritten = !!handwritten;
            responseData.data.backPressMatchArray = !_.isEmpty(backPressMatchArray) ? backPressMatchArray : [matchesArray[0]];
            responseData.data.noFilterMatchArray = !_.isEmpty(noFilterMatchesArray) ? noFilterMatchesArray : [];
            responseData.data.back_press_variant = backpressMatchPageVariant;

            responseData.data = await QuestionHelper.getLiveAndVipTabDetails(db, responseData.data, req.user, req.headers);

            let d0Status = false;
            if (versionCode && versionCode >= 1010) {
                const d0UserManager = new D0UserManager(req);
                if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                    d0Status = true;
                    if (d0Status && parseInt(req.headers.d0_qa_count) < 4) {
                        responseData.data.d0_user_data = {
                            hide_bottom_nav: true,
                            back_press_dialog_variant: 1,
                            back_press_dialog_cta: req.user.locale === 'hi' ? 'दूसरे प्रश्न के साथ प्रयास करें' : 'Try another question',
                            back_press_dialog_cta_deeplink: 'doubtnutapp://camera',
                        };
                    }

                    if (d0Status && parseInt(req.headers.d0_qa_count) === 4) {
                        d0UserManager.rewardController();
                    }
                }
            }

            const metaData = {
                code: 200,
                success: true,
                message: 'Success',
            };
            QuestionHelper.replaceComptaibleOcrTextForVideoViewApi(responseData.data);
            if (d0Status) {
                metaData.increment_keys = {
                    d0_qa_count: 1,
                };
            }

            response.setMeta(metaData);
            response.setData(responseData.data);
            QuestionRedis.incQuestionAskedCount(db.redis.write, studentId);
            if (ocr && matchesArray.length) {
                QuestionHelper.sendUserNotifPostQA(config, matchesArray, req.user.student_id, req.user.gcm_reg_id);

                telemetry.addTelemetry(telemetry.eventNames.askSuccess, new Date() - start, { version: info.version });
            }
            // Gulf Countries doubtnut paywall question asked count increase,
            const { country } = await StudentHelper.getUserCountryAndCurrency(db, req.user.student_id);
            if (country !== 'IN') {
                const kafkaData = {
                    student_id: req.user.student_id,
                    date: moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD'),
                    type: 'increase_count',
                };
                kafka.publish(kafka.topics.doubtnutPaywallQuestionCount, 1, kafkaData);
            }
            next(response);
        } else {
            telemetry.addTelemetry(telemetry.eventNames.askFailure, new Date() - start, { msg: 'question_insert_failed' });
            next({
                message: 'Error in inserting question; Please check parameters', status: 500, isPublic: true, error: true,
            });
        }
    } catch (e) {
        next(e);
    }
}

module.exports = {
    ask,
};
