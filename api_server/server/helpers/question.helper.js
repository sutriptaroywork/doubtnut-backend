/* eslint-disable func-names */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-buffer-constructor */
/* eslint-disable no-constant-condition */
/* eslint-disable vars-on-top */
/* eslint-disable block-scoped-var */
/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable no-var */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-undef */
/* eslint-disable no-dupe-keys */
/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-else-return */
const image2base64 = require('image-to-base64');
const moment = require('moment');
const request = require('request');
const axios = require('axios');
const _ = require('lodash');
const sharp = require('sharp');
const split = require('unicode-default-word-boundary').split;
const objectMapper = require('object-mapper');
const Utility = require('../../modules/utility');
const Data = require('../../data/data');
const logger = require('../../config/winston').winstonLogger;
const APIError = require('./APIError');
const QuestionContainer = require('../../modules/containers/question');
const QuestionRedis = require('../../modules/redis/question');
const VideoContainer = require('../../modules/containers/videoView');
const VideoView = require('../../modules/videoView');
const MongoQuestionAskUser = require('../../modules/mongo/questionAskUser');
const QuestionAskRetryLogging = require('../../modules/questionAskRetryLogging');
const HomepageQuestionsMaster = require('../../modules/homepageQuestionsMaster.js');
const HomepageQuestionsMasterContainer = require('../../modules/containers/homepageQuestionsMaster');
const HomeWidgetSubmissions = require('../../modules/HomeWidgetSubmissions');
const TopicBoosterModel = require('../../modules/mongo/topicBooster');
const StudentContainer = require('../../modules/containers/student');
const Question = require('../../modules/question');
const mysqlTopicContainer = require('../../modules/mysql/doubtfeed');
const DoubtFeedHelper = require('./doubtfeed.helper');
const LanguageDetect = require('languagedetect');
const Answer_Container_v13 = require('../v13/answer/answer.container');
const QuestionAskPersonalisationContainer = require('../../modules/containers/questionAskPersonalisation');
const fuzz = require('fuzzball');
const AnswerContainer = require('../../modules/containers/answer');
const StudentHelper = require('./student.helper');
const MailUtility = require('../../modules/Utility.mail');
const QuestionMysql = require('../../modules/mysql/question');
const ViserOcrBatchHelper = require('../helpers/question/ocr.viser.batch.helper');
const DuplicateQuestionMapByTag = require('../../modules/duplicateQuestionMap');

function getLocale(passedLocale, userLocale) {
    let locale = passedLocale;
    if (!locale) {
        locale = userLocale;
    }
    return locale;
}

function getMetadataValue(passedValue, defaultValue) {
    let metadata = defaultValue;
    if (passedValue === false || passedValue === 'false') {
        metadata = false;
    }
    return metadata;
}

function checkForDivisionLibrary(str) {
    if (str.includes('=') && str.includes('/')) {
        const strArray = str.split('=');
        const strNewArray = strArray[1].split('/');
        const result = parseFloat(strNewArray[0]) / parseFloat(strNewArray[1]);
        if (isNaN(result) || parseFloat(strNewArray[0]) != strNewArray[0] || parseFloat(strNewArray[1]) != strNewArray[1]) {
            return str;
        }
        return (`${strArray[0]}=${result}`).split(' ').join('');
    } if (str.includes('/')) {
        const strNewArray = str.split('/');
        const result = parseFloat(strNewArray[0]) / parseFloat(strNewArray[1]);
        if (isNaN(result)) {
            return str;
        }
        return result;
    }
    return str;
}
function checkForDivision(str) {
    if (str.includes('=')) { return str; }
    const strArray = str.split('/');
    if (strArray.length == 1) {
        return str;
    }
    const result = parseFloat(strArray[0]) / parseFloat(strArray[1]);
    if (isNaN(result)) {
        return str;
    }
    return result;
}
function _removeEntity(cleansedString, stockEntities) {
    let ocr = cleansedString;
    if (stockEntities) {
        for (let i = 0; i < stockEntities.length; i += 1) {
            const stockEntity = stockEntities[i].value;
            const pattern = `\\b${stockEntity}\\b`;
            const rx = new RegExp(pattern, 'gi');
            // const rx = new RegExp(stopPhrase, 'gi');
            ocr = ocr.replace(rx, '');
        }
    }
    return ocr.replace(/^\s+|\s+$/g, '');
}
function _removeStockEntityWrapper(cleanedOcr, stockEntity) {
    let ocr = cleanedOcr;
    ocr = _removeEntity(ocr, stockEntity.stopPhraseList);
    ocr = _removeEntity(ocr, stockEntity.stopWordList);
    return ocr;
}
function ocrModifier(data) {
    const { ocr, stockWordList } = data;
    return _removeStockEntityWrapper(ocr, stockWordList);
}

async function checkBlurImage(fileName, config, ocr) {
    const imageUrl = `${config.cdn_url}images/${fileName}`;
    const body = {
        image_url: imageUrl,
        ocr_text: ocr,
    };
    const options = {
        method: 'POST',
        uri: Data.BLUR_URL,
        body,
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 150,
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                resolve(null);
            } else if (body && body.meta && body.meta.code == 200 && body.data) {
                resolve(body.data.isBlur);
            } else {
                resolve(null);
            }
        });
    }));
}

/* Wrapper function to fetch possible set of video languages for a user */
function getVideoLanguageSet({userAppLocale, userLocation, userBoard, questionLocale}) {
    const videoLanguageSet = new Set(['en', 'hi-en']);
    if (userAppLocale && Data.LC.VIDEO_LANGUAGE_SET.includes(userAppLocale)) {
        videoLanguageSet.add(userAppLocale)
        videoLanguageSet.add(`${userAppLocale}-en`)
    }
    if (questionLocale && Data.LC.VIDEO_LANGUAGE_SET.includes(questionLocale)) {
        videoLanguageSet.add(questionLocale)
        videoLanguageSet.add(`${questionLocale}-en`)
    }
    if (userLocation) {
        const locationArray = Object.keys(Data.LC.USER_LOCATION_LANGUAGE_MAPPING);
        const lowerCaseLocationArray = locationArray.map(v => v.toLowerCase());
        const locationIndex = lowerCaseLocationArray.indexOf(userLocation.toLowerCase());
        if (locationIndex > -1) {
            const languagesToAdd = Data.LC.USER_LOCATION_LANGUAGE_MAPPING[locationArray[locationIndex]];
            languagesToAdd.forEach(language => {
                videoLanguageSet.add(language);
                videoLanguageSet.add(`${language}-en`);
            });
        }
    }
    if (userBoard) {
        if (userBoard === 'Other State Board') {
            Data.LC.VIDEO_LANGUAGE_SET.forEach((value) => {
                videoLanguageSet.add(value)
                videoLanguageSet.add(`${value}-en`);
            })
        } else {
            const boardsArray = Object.keys(Data.LC.USER_BOARD_LANGUAGE_MAPPING);
            const boardIndex = boardsArray.indexOf(userBoard);
            if (boardIndex > -1) {
                const languagesToAdd = Data.LC.USER_BOARD_LANGUAGE_MAPPING[boardsArray[boardIndex]];
                languagesToAdd.forEach(language => {
                    videoLanguageSet.add(language);
                    videoLanguageSet.add(`${language}-en`);
                });
            }
        }
    }
    videoLanguageSet.delete('en-en');
    return Array.from(videoLanguageSet);
}

/* Wrapper function to fetch ocr for multiple parallel calls for panel */
async function handleOcrForPanel(ocrObject, data, isEditedObj) {
    const { variantAttachment } = data;

    // Edited ocr cases
    if (isEditedObj && isEditedObj.isEdited && isEditedObj.isEdited === 'true') {
        return {
            ocr: isEditedObj.ocrText,
            ocr_type: isEditedObj.ocrType,
            locale: isEditedObj.locale,
        };
    }

    // Mathpix text Ocr cases
    if (variantAttachment && variantAttachment.useMathpixText) {
        if (!ocrObject.variantAttachmentMPText) {
            const varAttachment = await this.handleOcrGlobal(data);
            ocrObject.variantAttachmentMPText = varAttachment;
        }
        return ocrObject.variantAttachmentMPText;
    }

    // Viser Ocr cases
    if (variantAttachment && variantAttachment.useViserMathsOcr) {
        if (!ocrObject.variantAttachmentViser) {
            const varAttachment = await this.handleOcrGlobal(data);
            ocrObject.variantAttachmentViser = varAttachment;
        }
        return ocrObject.variantAttachmentViser;
    }

    // Non viser ocr cases
    else if (variantAttachment) {
        if (!ocrObject.variantAttachment) {
            let varAttachment = await this.handleOcrGlobal(data);
            ocrObject.variantAttachment = varAttachment;
        }
        return ocrObject.variantAttachment;
    }

    // if variantAttachment == null
    if (!ocrObject.variantAttachmentAbsent) {
        let varAttachment = await this.handleOcrGlobal(data);
        ocrObject.variantAttachmentAbsent = varAttachment;
    }
    return ocrObject.variantAttachmentAbsent;
}

function getViserResponseToMongoLog(userQuestionsLogsMongoDb, viser_resp) {
    try {
        if (typeof userQuestionsLogsMongoDb !== 'undefined') {
            userQuestionsLogsMongoDb.viser_resp = _.get(viser_resp, 'result.url', [{}])[0]
            delete userQuestionsLogsMongoDb.viser_resp['ZMSG'];
        }
    } catch (e) {
        console.error(e)
    }
}

async function handleViserOcrResponse(viser_resp, translate2, viser_confidence_threshold, userQuestionsLogsMongoDb) {
    let obj = {};
    getViserResponseToMongoLog(userQuestionsLogsMongoDb, viser_resp);
    if (_.get(viser_resp,'result.url[0]',null))  {
        let viser_ocr = preProcessViserOcr(viser_resp['result']['url'][0]['OCR']) || '';
        let viser_confidence = viser_resp['result']['url'][0]['Score'];
        if (viser_ocr != 'NONE' && viser_ocr.length > 0) {
            obj.diagram = viser_resp.result.url[0].Diagram;
            obj.diagram_score = viser_resp.result.url[0].Diagramscore;
            obj.orientation = viser_resp.result.url[0].Orientation;
            if (viser_confidence > viser_confidence_threshold) {
                obj.asciimath = viser_ocr;
                obj.rawOcr = viser_ocr;
                obj.latex_confidence = viser_confidence;
                obj.response_time = viser_resp.response_time;
                obj.diagram = viser_resp.result.url[0].Diagram;
                obj.diagram_score = viser_resp.result.url[0].Diagramscore;
                obj.orientation = viser_resp.result.url[0].Orientation;
                obj.printed = viser_resp.result.url[0].Printed;
                obj.printed_score = viser_resp.result.url[0].Printedscore;
                obj.viser_detect_locale = viser_resp.result.url[0].Language;
                let detectedQuestionLocale = Utility.checkQuestionOcrLanguages(viser_ocr).detectedLanguage;
                obj.locale = detectedQuestionLocale;
                if(!(['en', 'hi'].includes(detectedQuestionLocale))) {
                    const translatedOcrText = await Utility.viserMathsOcrTranslationHandler(viser_ocr, translate2);
                    obj.asciimath = translatedOcrText;
                }
                return [obj, true];
            }
        }
    }
    return [obj, false];
}


function converLatex2PlainTextForLangDetection(txt) {
    let textual_parts = [];
    let texts = txt.split("\"");
    let regex1 = /\b(x|ln|log|=|hat|tilde|det|lim|pi|rarr|\+|-|sqrt|phi|delta|sum_|cos|sin|tan|sec|cot|cosec|csc|e\^)\b.*/i;  //[maths ascii literals]
    let regex2 = /\b(e\^|f\(x\)|g\(x\)).*/i; // function expression not having breaks
    let regex3 = /^\(?[0-9]+.?\s?\)?\s?$/; // numbers (especially for question numbers)at start
    let regex4 = /^\(?[0-9]+.?\s?\)?\s+?$/; // numbers (especially for question numbers)at start
    let regex5 = /^\(?[a-zA-Z]+.?\s?\)?\s?$/;  // alphabets (especially for question numbers)at start
    let regex6 = /^\(?[a-zA-Z]+.?\s?\)?\s+?$/;  //alphabets (especially for question numbers)at start
    let regex7 = /\b(sin|cos|tan|cos|sec|csc|cosec)\d+.*/i; // trig func with args.
    let regex8 = /\b(NCERT|CBSE)\b.*/; // exam keywords not getting ignored in ocr service

    for (let i = 0; i < texts.length; i++) {
        if (texts[i].length > 0) {
            if (!(texts[i].match(regex1) ||
                texts[i].match(regex2) ||
                texts[i].match(regex3) ||
                texts[i].match(regex4) ||
                texts[i].match(regex5) ||
                texts[i].match(regex6) ||
                texts[i].match(regex7) ||
                texts[i].match(regex8))) {
                textual_parts.push(texts[i]);
            }
        }
    }
    return textual_parts.join(' ');
}

function getQuestionLanguageGlobalByNGram(text) {
    const lngDetector = new LanguageDetect();
    text = converLatex2PlainTextForLangDetection(text);
    let detected_languages = lngDetector.detect(text);
    if (detected_languages.length > 0 && text.trim().length > 5) {
        return (detected_languages[0][0]);
    } else {
        return 'NA';
    }
}

async function handleOrganicDiagramsOcr(data) {
    try{
        const {
            host, fileName, translate2, variantAttachment, config,
        } = data;
        variantAttachment.includeSmilesInOcr = true;
        const smilesRegex = new RegExp("\<smiles\>(.+?)\<\/smiles\>");
        latex = await Utility.mathpixOcr3Text(host, fileName, config, variantAttachment);
        if (latex && latex.asciimath_legacy && latex.text) {
            if(!smilesRegex.test(latex.text)) {
                return {
                    success : false,
                    data: {}
                }
            }
            ocr = latex.asciimath_legacy;
            mathpixConfidence = latex.latex_confidence
            response_time = latex.response_time || 0;
            const detectedQuestionLocale = Utility.checkQuestionOcrLanguages(ocr).detectedLanguage;
            locale = detectedQuestionLocale;
            if(!(['en', 'hi'].includes(detectedQuestionLocale))) {
                const translatedOcrText = await Utility.translateSmilesRegionalLangOcrParser(ocr, translate2);
                ocr = translatedOcrText;
            }
            rawOcr = ocr;
            const ocrData = {
                ocr,
                ocr_type: 11,
                original_ocr: rawOcr,
                raw_ocr: rawOcr,
                handwritten: 0,
                locale,
                ocr_origin: 'mathpix_smiles_ocr',
                variantAttachment,
                mathpixConfidence,
                mathpix_log: {},
                response_time: latex.response_time || 0,
            };
            return {
                success: true,
                data: ocrData,
            }
        }
        return {
            success: true,
            data: ocrData,
        }
    } catch (e){
        console.log(e);
        return {
            success : false,
            data: {}
        }
    }

}

function getLocaleFromDetectedLanguages(detected_alphabets) {
    let detected_alphabets_arr = [];
    let locale = 'en';
    if (detected_alphabets && typeof detected_alphabets === 'object') {
        Object.keys(detected_alphabets).forEach(key => {
            if (detected_alphabets[key]) {
                detected_alphabets_arr.push(key);
            }
        });
    }
    if (detected_alphabets_arr.length){
        const is_hindi_alphabets = detected_alphabets_arr.includes('hi');
        detected_alphabets_arr = detected_alphabets_arr.filter(e => e !== 'en' && e !== 'hi')
        if (detected_alphabets_arr.length) {
            locale = detected_alphabets_arr[0]
        } else if (is_hindi_alphabets) {
            locale = 'hi'
        }
    }
    return [locale, detected_alphabets_arr];
}

function isHandwrittenImage(latex) {
    let handwritten = 0;
    if (typeof latex !== 'undefined'
        && !_.isNull(latex)) {
        if ((typeof latex.detection_map !== 'undefined')
            && (typeof latex.detection_map.is_printed !== 'undefined')
            && (latex.detection_map.is_printed < 0.8)) {
            handwritten = 1;
        }
        if ((typeof latex.printed !== 'undefined')
            && (latex.printed === 0)) {
            handwritten = 1;
        }
    }

    return handwritten;
}

function getLatexObjFromVisionResp(visionApiResp, variantAttachment, isViserOcrLocaleValid, ocr_equation_portions) {
    const latex = {};
    if (_.get(visionApiResp, 'responses', null)) {
        latex.response_time = visionApiResp.response_time;
        visionApiResp = visionApiResp.responses;
        if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
            && visionApiResp[0].fullTextAnnotation !== null) {
            latex.asciimath = visionApiResp[0].textAnnotations[0].description;
            latex.locale = visionApiResp[0].textAnnotations[0].locale;
        }
    }
    if (variantAttachment && variantAttachment.appendViserOcrEquationToVisionOcr && latex && latex.asciimath && !isViserOcrLocaleValid) {
        latex.asciimath += ocr_equation_portions.join(' ');
    }
    return latex;
}

function getNullOcrResp({locale, variantAttachment}) {
    const ocr = '';
    return {
        ocr,
        original_ocr: ocr,
        ocr_type: 3,
        raw_ocr: ocr,
        handwritten: 0,
        locale,
        ocr_origin: 'null_ocr',
        variantAttachment,
        response_time: 0
    };
}

function getOcrResp({latex, ocrType, variantAttachment, config, fileName, imageProperties}) {
    const ocr = latex.asciimath;
    let locale = latex.locale;
    const handwritten = isHandwrittenImage(latex);
    const mathpixConfidence = latex.latex_confidence;
    const mathpixLogObj = {
        question_image: `${config.question_image_s3_prefix}images/${fileName}`,
        ...latex,
        ...imageProperties
    };
    let ocrOrigin = '';
    switch(ocrType) {
        case 0:
            ocrOrigin = 'img_mathpix'
            break;
        case 1:
            ocrOrigin = 'img_google_vision'
            break;
        case 2:
            ocrOrigin = 'img_gv_translate'
            ocrType = 1;
            break;
        case 4:
            ocrOrigin = 'mathpix_latex_translated'
            break;
        case 7:
            ocrOrigin = 'viser_ocr'
            locale = !_.isEmpty(latex.locale) ? latex.locale : (Utility.checkHindiCharsSubstr(ocr) ? 'hi' : 'en');
    }
    return {
        ocr,
        ocr_type: ocrType,
        original_ocr: latex.rawOcr && latex.rawOcr !== ocr ? latex.rawOcr : '',
        raw_ocr: latex.rawOcr ? latex.rawOcr : ocr,
        handwritten,
        locale,
        ocr_origin: ocrOrigin,
        variantAttachment,
        mathpixConfidence,
        mathpix_log: mathpixLogObj,
        response_time: latex.response_time || 0,
    }
}


function shouldUseViserOcrBatchApi(variantAttachment, questionAskApiRetryCounter, db) {
    if (questionAskApiRetryCounter && questionAskApiRetryCounter >=1) {
        return false;
    }
    if (typeof db === 'undefined') {
        return false;
    }
    return _.get(variantAttachment, 'useViserOcrBatchApi', true);
}

/* Wrapper function to get the OCR data from the image data
*/
async function handleOcrGlobal(data) {
    const {
        host, fileName, translate2, variantAttachment, config, next, qid, db, retryCounter, userQuestionsAnalysisLogging, userQuestionsLogsMongoDb
    } = data;
    let { image } = data;
    const { isb64ConversionRequired } = data;
    if (userQuestionsAnalysisLogging) {
        userQuestionsAnalysisLogging.ocrInitTimestamp = moment().unix();
    }
    let latex = []; let ocr = ''; let detected_alphabets_arr = []; let transLateApiResp = ''; let viserOcrFlag = false; let locale = 'en'; let isViserOcrLocaleValid = true;
    const imageProperties = {};
    let ocr_equation_portions = [];

    // VISER OCR FLOW STARTS HERE
    if (variantAttachment && variantAttachment.useViserMathsOcr) {
        let ocrReceived;
        const startTime = new Date().getTime();
        if (shouldUseViserOcrBatchApi(variantAttachment, retryCounter, db)) {
            const viserOcrBatchHelper = new ViserOcrBatchHelper(qid, fileName);
            ocrReceived = await viserOcrBatchHelper.getOcr(db, config, Utility, userQuestionsAnalysisLogging, 0);
        } else {
            ocrReceived = await Utility.callViserApi(`${config.question_image_s3_prefix}images/${fileName}`, qid, variantAttachment, false, null, db);
        }
        const endTime = new Date().getTime();
        if (userQuestionsAnalysisLogging) {
            userQuestionsAnalysisLogging.ocr_response_time_loop = endTime - startTime;
        }
        const viser_confidence_threshold = _.get(variantAttachment, 'viser_confidence_threshold', 0.7);
        let ocrResp = await this.handleViserOcrResponse(ocrReceived, translate2, viser_confidence_threshold, userQuestionsLogsMongoDb);
        latex = ocrResp[0];
        viserOcrFlag = ocrResp[1] ? true : false;
        if (latex && latex.diagram) {
            imageProperties.isDiagramPresent = true;
            imageProperties.orientation = latex.orientation;
        }
    }
    if (latex && latex.asciimath && variantAttachment && variantAttachment.checkVernacularLanguages) {
        ocr_equation_portions = this.extractEquationPortionFromOcrText(latex.asciimath, variantAttachment);
        isViserOcrLocaleValid = this.checkViserOcrValidity(latex);
    }

    if (viserOcrFlag && isViserOcrLocaleValid) {
        return this.getOcrResp({latex, ocrType:7, variantAttachment, config, fileName, imageProperties})
    }
    // VISER OCR FLOW ENDS HERE

    // MATHPIX v3/latex FLOW STARTS HERE
    if (_.get(variantAttachment, 'useMathpixText', false)) {
        latex = await Utility.mathpixOcr3(host, fileName, config);
        if (latex && latex.asciimath && isViserOcrLocaleValid) {
            [locale, detected_alphabets_arr] = this.getLocaleFromDetectedLanguages(latex.detected_alphabets);
            latex.detected_alphabets_arr = detected_alphabets_arr;
            latex.locale = locale;
            if (Data.NO_TRANSLATION_LANGUAGE_CODES.includes(locale)) {
                return this.getOcrResp({latex, ocrType:0, variantAttachment, config, fileName, imageProperties});
            }
            // translate using phrases
            transLateApiResp = await Utility.mathpixRegionalTranslateParser(ocr, translate2);
            ocr = Utility.getTranslatedTextFromRes(transLateApiResp);
            latex.asciimath = ocr;
            if (ocr && ocr.length) {
                return this.getOcrResp({latex, ocrType:4, variantAttachment, config, fileName, imageProperties});
            }
        }
    }
    // MATHPIX v3/latex FLOW ENDS HERE

    // VISION FLOW STARTS HERE
    if (_.get(variantAttachment, 'useVisionOcr', true)) {
        if (isb64ConversionRequired) {
            image = await Utility.getUrl2Base64String(config.question_image_s3_prefix, fileName);
        }
        const image1 = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        let visionApiResp = await Utility.httpVisionApi(image1, config);
        latex = this.getLatexObjFromVisionResp(visionApiResp, variantAttachment, isViserOcrLocaleValid, ocr_equation_portions);
        if (_.isEmpty(latex) || !latex.asciimath) {
            logger.error({ tag: 'ask', source: 'handleOcr', error: 'google-ocr-fail' });
            return this.getNullOcrResp({locale, variantAttachment})
        }
        if (Data.NO_TRANSLATION_LANGUAGE_CODES.includes(latex.locale)) {
            return this.getOcrResp({latex, ocrType: !isViserOcrLocaleValid ? 13 : 1, variantAttachment, config, fileName, imageProperties});
        }
        transLateApiResp = await Utility.translateApi2(latex.asciimath, translate2);
        ocr = Utility.getTranslatedTextFromRes(transLateApiResp);
        latex.rawOcr = latex.asciimath;
        latex.asciimath = ocr;
        if (ocr && ocr.length) {
            return this.getOcrResp({latex, ocrType: !isViserOcrLocaleValid ? 13 : 2, variantAttachment, config, fileName, imageProperties});
        }
    }
    // VISION FLOW ENDS HERE

    return this.getNullOcrResp({locale, variantAttachment});
}

async function handleRawOcrGlobal(data) {
    try {
        const {
            host, fileName, variantAttachment, config,
        } = data;
        const { image } = data;
        let locale = 'en';
        const latex = await Utility.mathpixOcr3(host, fileName, config);
        let handwritten = 0;
        let ocr = '';
        let ocrType;
        if (typeof latex !== 'undefined' && (typeof latex.detection_map !== 'undefined') && (typeof latex.detection_map.is_printed !== 'undefined') && (latex.detection_map.is_printed < 0.8)) {
            handwritten = 1;
        }
        if (typeof latex !== 'undefined' && (typeof latex.asciimath !== 'undefined') && (latex.asciimath.length > 0)) {
            ocr = latex.asciimath;
            ocrType = 0;
            if (Utility.checkHindiCharsSubstr(ocr)) {
                locale = 'hi';
            }
            return {
                ocr,
                ocr_type: ocrType,
                original_ocr: ocr,
                raw_ocr: ocr,
                handwritten,
                locale,
                ocr_origin: 'mathpix',
                variantAttachment,
            };
        } else {
            const image1 = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
            let visionApiResp = await Utility.httpVisionApi(image1, config);
            visionApiResp = visionApiResp.responses;
            if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined' && visionApiResp[0].fullTextAnnotation !== null) {
                ocr = visionApiResp[0].textAnnotations[0].description;
                locale = visionApiResp[0].textAnnotations[0].locale;
                ocrType = 1;
            }
            return {
                ocr,
                ocr_type: ocrType,
                original_ocr: ocr,
                raw_ocr: ocr,
                handwritten,
                locale,
                ocr_origin: 'vision',
                variantAttachment,
            };
        }
    } catch (e) {
        console.log(e);
    }
}

async function handleHybridOcrGlobal(data) {
    const {
        host, fileName, translate2, variantAttachment, config, next, studentId,
    } = data;
    let { image } = data;
    let promiseResolve;
    let promiseReject;
    let locale = 'en';
    let preprocessMatchesArray = [];
    const hybrid_ocr = {
        'non-english-ocr': '',
        'english-ocr': '',
    };

    try {
        if (config && variantAttachment && variantAttachment.imageServiceVersion) {
            console.log('image service!!!');
            let obj = null;
            obj = await handleImageServiceWrapper({
                config, variantAttachment, fileName,
            });

            if (obj && obj.meta && obj.meta.success && obj.data) {
                // if (obj.data.matches_array && !_.isEmpty(obj.data.matches_array)) {
                if (obj.data.matches_array) {
                    preprocessMatchesArray = obj.data.matches_array;
                } else {
                    obj.data.variantAttachment = variantAttachment;
                    return obj.data;
                }
            }
        }
        const imageUrl = `${config.cdn_url}images/${fileName}`;
        // do ocr2
        let latex = [];
        // try {
        if (variantAttachment && variantAttachment.isResizeImage) {
            latex = await Utility.mathpixOcr3(host, fileName, config, null, `${config.cdn_url}o-images/${fileName}`);
            if (latex && latex.error_info && latex.error_info.id && latex.error_info.id == 'image_download_error') {
                logger.error({ tag: 'ask', source: 'mathpixOcr3Resized', error: 'image_download_error' });
                latex = await Utility.mathpixOcr3(host, fileName, config);
            }
        } else {
            latex = await Utility.mathpixOcr3(host, fileName, config);
        }
        // } catch (err) {
        //     if (err.code === 'ETIMEDOUT') {
        //         console.log(err);
        //     }
        // }
        // check for handwritten
        let handwritten = 0; let ocr = ''; let rawOcr = ''; let ocrType = 0; let mathpixConfidence;
        if (typeof latex !== 'undefined'
            && (typeof latex.detection_map !== 'undefined')
            && (typeof latex.detection_map.is_printed !== 'undefined')
            && (latex.detection_map.is_printed < 0.8)) {
            console.log('handwritten');
            handwritten = 1;
        }
        // check if ocr2 is coming
        if (typeof latex !== 'undefined'
            && (typeof latex.asciimath !== 'undefined')
            && (latex.asciimath.length > 0)) {
            console.log('ocr2');
            ocr = latex.asciimath;
            rawOcr = ocr;
            ocrType = 0;
            mathpixConfidence = latex.latex_confidence;
            // promiseResolve({
            //     ocr,
            //     ocr_type: ocrType,
            //     original_ocr: ocr,
            //     raw_ocr: rawOcr,
            //     handwritten,
            //     locale,
            //     ocr_origin: 'img_mathpix',
            // });
            if (studentId && typeof (studentId) == 'number') {
                if (studentId % 2 !== 0) {
                    if (!Utility.checkHindiCharsSubstr(ocr)) {
                        hybrid_ocr['non-english-ocr'] = ocr;
                        hybrid_ocr['english-ocr'] = ocr;
                        return {
                            ocr: hybrid_ocr,
                            ocr_type: ocrType,
                            original_ocr: ocr,
                            raw_ocr: rawOcr,
                            handwritten,
                            locale,
                            ocr_origin: 'img_mathpix',
                            preprocessMatchesArray,
                            variantAttachment,
                            mathpixConfidence,
                        };
                    }
                } else {
                    const mathpix_formatted_response = await Utility.mathpixHindiTranslateParser(ocr, translate2);
                    ocrType = 4;
                    hybrid_ocr['non-english-ocr'] = ocr;
                    hybrid_ocr['english-ocr'] = mathpix_formatted_response.ocr_text;
                    return {
                        ocr: hybrid_ocr,
                        ocr_type: ocrType,
                        original_ocr: ocr,
                        raw_ocr: ocr,
                        handwritten,
                        locale: mathpix_formatted_response.locale,
                        ocr_origin: 'img_mathpix',
                        preprocessMatchesArray,
                        variantAttachment,
                        mathpixConfidence,
                    };
                }
            } else {
                return {
                    ocr,
                    ocr_type: ocrType,
                    original_ocr: ocr,
                    raw_ocr: rawOcr,
                    handwritten,
                    locale,
                    ocr_origin: 'img_mathpix',
                    preprocessMatchesArray,
                    variantAttachment,
                    mathpixConfidence,
                };
            }
        } else {
            logger.error({ tag: 'ask', source: 'handleOcr mathpix-fail', error: latex.error });
        }
        // do ocr1

        if (variantAttachment && variantAttachment.isResizeImage) {
            const resizedImage = await image2base64(`${config.cdn_url}o-images/${fileName}`);
            if (resizedImage) { image = resizedImage; }
        }
        const image1 = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        let visionApiResp = await Utility.httpVisionApi(image1, config);
        visionApiResp = visionApiResp.responses;
        if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
            && visionApiResp[0].fullTextAnnotation !== null) {
            ocr = visionApiResp[0].textAnnotations[0].description;
            locale = visionApiResp[0].textAnnotations[0].locale;
            ocrType = 2;
        } else {
            logger.error({ tag: 'ask', source: 'handleOcr', error: 'google-ocr-fail' });
            // tesseract ocr
            // const response = await Utility.tesseractOcr(imageUrl);
            // if (typeof response !== 'undefined'
            // && typeof response.meta !== 'undefined'
            // && response.meta.code == 200
            // && typeof response.data !== 'undefined') {
            // promiseResolve({
            //     ocr: response.data.ocr,
            //     ocr_type: 2,
            //     original_ocr: response.data.ocr,
            //     raw_ocr: response.data.ocr,
            //     handwritten: response.data.handwritten,
            //     locale: response.data.locale,
            //     ocr_origin: 'tesseract',
            // });
            return {
                ocr: '',
                ocr_type: 3,
                original_ocr: '',
                raw_ocr: '',
                handwritten,
                locale,
                ocr_origin: 'tesseract',
                variantAttachment,
            };
            // }
            // ocr = '';
        }
        rawOcr = ocr;
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
            if (ocr !== '') {
                hybrid_ocr['non-english-ocr'] = ocr;
                const transLateApiResp = await Utility.translateApi2(ocr, translate2);
                if (transLateApiResp.length > 0 && transLateApiResp[1].data !== undefined
                    && transLateApiResp[1].data.translations !== undefined
                    && transLateApiResp[1].data.translations[0].translatedText !== undefined) {
                    ocr = transLateApiResp[1].data.translations[0].translatedText;
                    hybrid_ocr['english-ocr'] = ocr;
                    // promiseResolve({
                    //     ocr,
                    //     ocr_type: 1,
                    //     original_ocr: ocr,
                    //     raw_ocr: rawOcr,
                    //     handwritten,
                    //     locale,
                    //     ocr_origin: 'img_gv_translate',
                    // });
                    return {
                        ocr: hybrid_ocr,
                        ocr_type: 1,
                        original_ocr: ocr,
                        raw_ocr: rawOcr,
                        handwritten,
                        locale,
                        ocr_origin: 'img_gv_translate',
                        preprocessMatchesArray,
                        variantAttachment,
                    };
                }
            } else {
                // promiseResolve({
                //     ocr,
                //     original_ocr: ocr,
                //     ocr_type: 1,
                //     raw_ocr: rawOcr,
                //     handwritten,
                //     locale,
                //     ocr_origin: 'null_ocr',
                // });
                return {
                    ocr,
                    original_ocr: ocr,
                    ocr_type: 1,
                    raw_ocr: rawOcr,
                    handwritten,
                    locale,
                    ocr_origin: 'null_ocr',
                    preprocessMatchesArray,
                    variantAttachment,
                };
            }
        } else {
            // promiseResolve({
            //     ocr,
            //     original_ocr: ocr,
            //     raw_ocr: rawOcr,
            //     ocr_type: 1,
            //     handwritten,
            //     locale,
            //     ocr_origin: 'img_google_vision',
            // });
            return {
                ocr,
                original_ocr: ocr,
                raw_ocr: rawOcr,
                ocr_type: 1,
                handwritten,
                locale,
                ocr_origin: 'img_google_vision',
                preprocessMatchesArray,
                variantAttachment,
            };
        }
    } catch (e) {
        console.log(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'ask', source: 'handleOcr', error: errorLog });
        // promiseReject({
        //     ocr: '',
        //     ocr_type: 1,
        //     handwritten: 0,
        //     locale,
        // });
        // return promise;
        const apiError = new APIError(e.message, e.status, e.isPublic);
        if (typeof next === 'undefined') {
            throw Error(e);
        }
        return next(apiError);
    }
}

async function handleElasticSearchGlobal(data) {
    let { ocr } = data;
    const {
        elasticSearchInstance,
        elasticIndex,
        stockWordList,
        useStringDiff,
        language,
        fuzz,
        UtilityModule,
        config,
        sqs,
    } = data;
    console.log('before modifier');
    console.log(ocr);
    console.log(ocr.length);
    if (!_.isEmpty(stockWordList)) {
        ocr = ocrModifier({ ocr, stockWordList });
    }
    // console.log('after ocr')
    // console.log(ocr)
    // console.log(ocr.length)
    if ((typeof useStringDiff !== 'undefined') && useStringDiff) {
        // console.log('using string diff')
        const matchesArray = await elasticSearchInstance.findByOcrUsingIndexNew(ocr, elasticIndex);
        // console.log('matchesArray')
        // console.log(matchesArray.hits);
        const stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, false);
        return stringDiffResp;
    }
    return elasticSearchInstance.findByOcrUsingIndexNew(ocr, elasticIndex);
}

async function handleComputationalQuestionsWrapper(data) {
    try {
        const {
            variantAttachment,
            cleanedOcr,
            equationOcrText,
            info,
            matchesArray,
            subject,
            mathsteps,
            qid,
            locale,
            isTyd,
            UtilityModule,
        } = data;
        const computationalOcr = getComputationalOcrToUse(variantAttachment, cleanedOcr, equationOcrText, info);
        const checkMathsteps = variantAttachment
                            && !variantAttachment.dontgetComputeQues
                            && ((!matchesArray) || (matchesArray.length == 0) || (matchesArray[0] && matchesArray[0].partial_score < 95))
                            && (!subject) || subject == 'MATHS'
                            && ifEquationLengthCheck(computationalOcr, info.query_ocr_text);
        let computationDetails = [];
        if (checkMathsteps) {
            computationDetails = await handleComputationalQuestions({
                mathsteps,
                cleanedOcr: computationalOcr,
                UtilityModule,
                qid,
                locale,
                isTyd,
            });
        }
        return computationDetails;
    } catch (e) {
        console.log(e);
        return [null, null];
    }
}

function frequencySort(arr = []) {
    let map = {};
    for (let i = 0; i < arr.length; i++) {
        map[arr[i]] = (map[arr[i]] || 0) + 1;
    };
    return arr.sort((a, b) => map[b] - map[a]);
};

async function handleImageServiceWrapper(data) {
    try {
        const {
            config,
            variantAttachment,
            fileName,
            next,
        } = data;
        variantAttachment.imageUrl = `${config.cdn_url}images/${fileName}`;
        obj = await callImagePreProcessService(variantAttachment);
        return obj;
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error(
            { tag: 'ask', source: 'handleImageServiceWrapper', error: errorLog },
        );
        // return {};
        const apiError = new APIError(e.message, e.status, e.isPublic);
        if (typeof next === 'undefined') {
            throw Error(e);
        }
        return next(apiError);
    }
}

function getCompatibleVideoLanguageMatchesScore(arr, valid_locales) {
    try {
        if (arr.length == 0) return 0;
        const total_count = arr.length;
        let valid_count = 0;
        for (let i=0; i < arr.length; i++) {
            if (valid_locales.includes(arr[i]._source.video_language)) {
                valid_count +=1;
            }
        }
        return Math.floor((valid_count/total_count)*100);
    } catch (e) {
        console.log(e);
        return 0;
    }
}

function formulateMatchesArray(matchesArray, diagramArray) {
    let response = _.get(matchesArray, 'hits.hits', 'notFound');
    let diagramResponse = _.get(diagramArray, 'hits.hits', 'notFound');
    if (response == 'notFound') {
        return false;
    }
    if (diagramResponse != 'notFound') {
        for (let index = diagramResponse.length-1 ; index >= 0; index--) {
            const element = diagramResponse[index];
            element._score = element._score * Data.VISER_DIAGRAM_SCORE_MULTIPLIER;
            matchesArray.hits.hits.unshift(element);
        }
        matchesArray.hits.hits.sort((a,b) => {
            return b._score - a._score;
        })
    }
    return matchesArray;
}

function formulateVariantAttachment(variantAttachment, UtilityModule, {useComposerApi, ocr, ocrType, locale, elasticHostName, elasticIndex, searchFieldName, userProfile, req }) {
    variantAttachment.ocrText = ocr;
    variantAttachment.ocrType = ocrType;
    variantAttachment.locale = locale;
    if (useComposerApi && variantAttachment.queryConfig) {
        if ((_.isEmpty(variantAttachment.elasticHostName)) && typeof elasticHostName != 'undefined') {
            variantAttachment.elasticHostName = elasticHostName;
        }
        if (typeof elasticIndex != 'undefined' && !variantAttachment.overrideIndex) {
            variantAttachment.elasticIndexName = elasticIndex;
        }
        variantAttachment.apiUrl = Data.searchServiceComposerApiUrl;
        variantAttachment.queryConfig.searchFieldName = searchFieldName;
    }
    if (userProfile && variantAttachment && !variantAttachment.disableLanguageFilter) {
        const [userLocation, ip] = UtilityModule.getStudentStateCode(req);
        const videoLanguageSet = getVideoLanguageSet({
            userAppLocale: userProfile.appLocale,
            userLocation: userLocation,
            userBoard: userProfile.schoolBoard,
            questionLocale: userProfile.questionLocale
        })
        variantAttachment.userLocation = userLocation;
        variantAttachment.userIP = ip;
        variantAttachment.userLanguages = videoLanguageSet;
        variantAttachment.noFilterForEnAppUsers && userProfile.appLocale && userProfile.appLocale === 'en' ? variantAttachment.userLanguages = [] : null;
    }

    if (variantAttachment && !_.isEmpty(variantAttachment.languageFilters)) {
        variantAttachment.userLanguages = variantAttachment.languageFilters;
    }
    return variantAttachment;
}

function shouldDisplayAllMatchesFromViserDiagram(variantAttachment, askV10SmAttachment) {
    const isImage2ImageMatchActive = (askV10SmAttachment && askV10SmAttachment.iteration == 'viser_diagram' && askV10SmAttachment.success);
    const displayViserDiagramOnPanel = variantAttachment && variantAttachment.version === 'v_viser_diagram_panel';

    return isImage2ImageMatchActive || displayViserDiagramOnPanel;
}

function getViserDiagramMatchesCountForDisplay(askV10SmAttachment, variantAttachment) {
    let matchesCount = 20;
    if (askV10SmAttachment && askV10SmAttachment.iteration == 'viser_diagram' && askV10SmAttachment.success) {
        matchesCount = _.get(askV10SmAttachment, 'results_size', 20);
    } else if (variantAttachment && variantAttachment.version === 'v_viser_diagram_panel') {
        matchesCount = variantAttachment.defaultSuggestionCount;
    }
    return matchesCount;
}

async function formulateMatches(db, config, elasticSearchTestInstance, {
    variantAttachment, questionId, isStaging, isDiagramPresent, orientation, fileName, askV10SmAttachment, helperRefrence,
}) {
    const matchesPromises = [];
    const getAllMatchesFromViserDiagram = shouldDisplayAllMatchesFromViserDiagram(variantAttachment, askV10SmAttachment);
    if (getAllMatchesFromViserDiagram) {
        const matchesCount = getViserDiagramMatchesCountForDisplay(askV10SmAttachment, variantAttachment);
        matchesPromises.push(helperRefrence.callViserDiagramMatcher(config, questionId, orientation, fileName, elasticSearchTestInstance, matchesCount));
    } else if (config && variantAttachment && variantAttachment.useViserSearch) {
        matchesPromises.push(callViserSearch(config, variantAttachment, questionId, elasticSearchTestInstance));
    } else {
        matchesPromises.push(helperRefrence.callSearchServiceForv3(config, variantAttachment, isStaging, db));
    }
    if (isDiagramPresent && config && variantAttachment && variantAttachment.useViserDiagramMatcher && !getAllMatchesFromViserDiagram) {
        matchesPromises.push(helperRefrence.callViserDiagramMatcher(config, questionId, orientation, fileName, elasticSearchTestInstance));
    }
    const resolvedMatchesPromises = await Promise.all(matchesPromises);
    return resolvedMatchesPromises;
}

function preFilterMatchesCheck(languageFilterAlreadyDisabled, variantAttachment, version_code) {
    return (languageFilterAlreadyDisabled || (_.get(variantAttachment, 'version', '') === 'v_viser_search_retry')) && version_code >= Data.mp_keys_changes_min_version_code;
}

function filterMatchesArray(matchesArray, userProfile, UtilityModule, req, isDiagramPresent, diagramArray) {
    let filterArray = [];
    let noFilterArray = [];
    const [userLocation, ip] = UtilityModule.getStudentStateCode(req);
    const videoLanguageSet = getVideoLanguageSet({
        userAppLocale: _.get(userProfile, 'appLocale', 'en'),
        userLocation: userLocation,
        userBoard: _.get(userProfile, 'schoolBoard', 'CBSE'),
        questionLocale: _.get(userProfile, 'questionLocale', 'en')
    })
    const diagramFlag = (isDiagramPresent && diagramArray.length) ? _.get(diagramArray, '[0]._id', 0): 0;

    let tempMatchesArray = _.get(matchesArray, 'hits.hits', []);
    for (let i = 0; i < tempMatchesArray.length; i++) {
        let language = _.get(tempMatchesArray[i], '_source.video_language', 'en');
        // diagram check
        if ((diagramFlag !== 0) && (_.get(tempMatchesArray[i], '_id', 0) === diagramArray[0]._id)) {
            filterArray.push(tempMatchesArray[i])
        }
        else {
            videoLanguageSet.includes(language) ? filterArray.push(tempMatchesArray[i]): noFilterArray.push(tempMatchesArray[i]);
        }
    }
    return [noFilterArray, filterArray];
}

function handleSynonymsInEquationParts(ocr_text) {
    let new_ocr = [];
    let ocr_text_parts = ocr_text.split('"');
    if (ocr_text_parts.length <= 1) {
        ocr_text_parts = ocr_text.split('`');
    }
    for (let index = 0; index < ocr_text_parts.length; index++) {
        if (index % 2 == 1) {
            let equation_part = ocr_text_parts[index];
            // replace synonyms
            equation_part = equation_part.replace(/times/g, 'xx')
                            .replace(/ln/g, 'log')
                            .replace(/csc/g, 'cosec')
                            .replace(/hat/g, 'tilde');
            new_ocr.push(equation_part);
        }
        else {
            new_ocr.push(ocr_text_parts[index]);
        }
    }
    new_ocr = new_ocr.join("'");
    return new_ocr;
}

function preprocessOcrForNoFilterMatches(ocr) {
    // replace synonyms for equation_parts
    ocr = handleSynonymsInEquationParts(ocr);
    ocr = ocr.toLowerCase();
    return ocr;
}

function checkIfPartialScoreOfFilterMatches(ocr, noFilterOcr, filterOcr, noFilterTopMatchSD, filterTopMatchSD, noFilterPartialRatio, filterPartialRatio) {
    const searchServiceWeightedSdCheck = (filterTopMatchSD < noFilterTopMatchSD) && (noFilterTopMatchSD - filterTopMatchSD > 15);
    const partialRatioCheck = ifSolutionLengthCheck(noFilterOcr, ocr) && ifSolutionLengthCheck(filterOcr, ocr) && (noFilterPartialRatio > filterPartialRatio) && (noFilterPartialRatio - filterPartialRatio > 15);

    return searchServiceWeightedSdCheck || partialRatioCheck;
}

function checkIfDigitsAreSame(ocr1, ocr2) {
    let equation_parts1 = extractEquationPortionFromOcrText(ocr1, {appendViserOcrEquationToVisionOcr: true});
    let equation_parts2 = extractEquationPortionFromOcrText(ocr2, {appendViserOcrEquationToVisionOcr: true});

    equation_parts2.forEach(element => {
        let isNum = /^\d+$/.test(element);
        if (isNum && !equation_parts1.includes(element)) {
            return false;
        }
    });
    return true;
}

function noFilterMatchesWidgetDisplayCheck(noFilterMatchesArray, matchesArray, ocr) {
    if (noFilterMatchesArray && noFilterMatchesArray.length > 0) {
        if (noFilterMatchesArray[0]._id === matchesArray[0]._id) {
            return false;
        }
        const noFilterTopMatchSD = _.get(noFilterMatchesArray, '[0]._source.search_service_sd_score', 0);
        const filterTopMatchSD = _.get(matchesArray, '[0]._source.search_service_sd_score', 0);

        let noFilterOcr = _.get(noFilterMatchesArray, '[0]._source.ocr_text', '');
        const areDigitsSame = checkIfDigitsAreSame(noFilterOcr, ocr);

        noFilterOcr = preprocessOcrForNoFilterMatches(noFilterOcr);
        const filterOcr = preprocessOcrForNoFilterMatches(_.get(matchesArray, '[0]._source.ocr_text', ''))
        
        const noFilterPartialRatio = fuzz.partial_ratio(noFilterOcr, ocr);
        const filterPartialRatio = fuzz.partial_ratio(filterOcr, ocr);

        const noFilterMatchedQueries = _.get(noFilterMatchesArray, '[0]._source.matchedQueries', []);
        const filterMatchedQueries = _.get(matchesArray, '[0]._source.matchedQueries', []);

        // const areDigitsSame = checkIfDigitsAreSame(noFilterOcr, filterOcr);

        // const exactEquationMatchTag = ((filterMatchedQueries && noFilterMatchedQueries && (filterMatchedQueries.includes('equation_match') && !noFilterMatchedQueries.includes('equation_match'))) ? false: true;
        const exactEquationMatchTag = !(filterMatchedQueries.includes('equation_match') && !noFilterMatchedQueries.includes('equation_match'));
        return checkIfPartialScoreOfFilterMatches(ocr, noFilterOcr, filterOcr, noFilterTopMatchSD, filterTopMatchSD, noFilterPartialRatio, filterPartialRatio) && exactEquationMatchTag && areDigitsSame;
    }
    return false;
}

async function handleElasticSearchWrapper(data, config, askV10SmData = {}) {
    try {
        let compatibleLanguageMatchesScore = 0;
        let videoLanguageSet = [];
        let { ocr, variantAttachment } = data;
        const helperRefrence =  this;
        const {
            db,
            elasticSearchInstance,
            elasticSearchTestInstance,
            elasticIndex,
            elasticHostName,
            searchFieldName,
            language,
            fuzz,
            UtilityModule,
            studentId,
            req,
            ocrType,
            isDiagramPresent,
            orientation,
            fileName,
            locale,
            isStaging,
            useComposerApi,
            region,
            questionLocale,
            userProfile,
            questionId,
            next,
            askV10SmAttachment,
            duplicateQuestionMapByTag,
            overrideStaging,
            userQuestionsAnalysisLogging,
            matchesArrayReorderingAttachment,
            noFilterMatchesOnMatchPageAttachment,
        } = data;

        let baseVersion = 'v0'; let appLocale = 'en';
        let stringDiffResp, matchesArray, diagramArray, responseTime, ssError, languagePriorityOrder, diagramResponseTime, diagramSSError;
        let languagePrioritySwaps = []; let languagePriorityQidSwaps = []; let languageFilterAlreadyDisabled;

        if (!_.isEmpty(userProfile) && userProfile.appLocale) {
            appLocale = userProfile.appLocale;
        }

        if (Utility.isUsRegion(region)){
            matchesArray = await elasticSearchTestInstance.findOcrByUsIndex(ocr);
        }
        if (!variantAttachment) {
            const ocrArray = ocr.split(' ');
            if (!_.isEmpty(elasticSearchTestInstance)) {
                matchesArray = await elasticSearchTestInstance.findByOcrUsingIndexNew(ocr, elasticIndex);
                if (ocrArray.length > Data.minimumElasticTokenLength) {
                    baseVersion = 'v0_1';
                }
            } else {
                if (ocrArray.length > Data.minimumElasticTokenLength) {
                    ocr = ocrArray.splice(0, Data.minimumElasticTokenLength).join(' ');
                    matchesArray = await elasticSearchInstance.findByOcrUsingIndexTruncateTokens(elasticIndex, ocr);
                    baseVersion = 'v0_1';
                } else {
                    matchesArray = await elasticSearchInstance.findByOcrUsingIndex(ocr, elasticIndex);
                }
            }
        } else {
            if(_.get(noFilterMatchesOnMatchPageAttachment, 'enabled', false)) {
                languageFilterAlreadyDisabled = _.get(variantAttachment, 'disableLanguageFilter', false) ? true: false;
                variantAttachment.disableLanguageFilter = true;
            }
            variantAttachment = formulateVariantAttachment(variantAttachment, UtilityModule, {
                useComposerApi, ocr, ocrType, locale, elasticHostName, elasticIndex, searchFieldName, userProfile, req,
            });
            const resolvedMatchesPromises = await formulateMatches(db, config, elasticSearchTestInstance, {
                variantAttachment, questionId, isStaging, isDiagramPresent, orientation, fileName, askV10SmAttachment, helperRefrence
            });
            [matchesArray, responseTime, ssError] = resolvedMatchesPromises[0];
            if (isDiagramPresent && config && variantAttachment.useViserDiagramMatcher && resolvedMatchesPromises[1]) {
                [diagramArray, diagramResponseTime, diagramSSError] = resolvedMatchesPromises[1];
            }
            if (!isStaging && typeof matchesArray.searchError !== 'undefined') {
                let originalSSError = ssError;
                [ matchesArray, responseTime, ssError] = await helperRefrence.callViserSearch(config, variantAttachment, questionId, elasticSearchTestInstance);
                ssError = originalSSError;
                baseVersion = 'v_viser_search_retry';
                variantAttachment.version = 'v_viser_search_retry';
            } else if ((isStaging || overrideStaging) && typeof matchesArray.searchError !== 'undefined') {
                // return empty array only for a specific iteration on panel
                return {
                    stringDiffResp: [],
                    stringDiffRespNoFilter: [[], [], []],
                    info: {},
                    isOnlyEquation: false,
                    cleanedOcr: ocr,
                    variantAttachment,
                    cymathString: ocr,
                };
            }
        }

        matchesArray = formulateMatchesArray(matchesArray, diagramArray);
        if (!matchesArray) {
            logger.error({ tag: 'ask', source: 'hits.hits', error: `ocr is: ${ocr}` });
            throw Error('hits.hits NOT_FOUND');
        }
        
        let noFilterMatches = [];
        let filterMatches = [];
        let stringDiffRespNoFilter = [[], [], []];
        if (preFilterMatchesCheck(languageFilterAlreadyDisabled, variantAttachment, _.get(req, 'headers.version_code', '10000'))) {
            filterMatches = _.get(matchesArray, 'hits.hits', []);
        }
        else {
            [noFilterMatches, filterMatches] = filterMatchesArray(matchesArray, userProfile, UtilityModule, req, isDiagramPresent, _.get(diagramArray, 'hits.hits', []));
            noFilterMatches = noFilterMatches.slice(0, _.get(noFilterMatchesOnMatchPageAttachment, 'suggestionCount', 0));
            stringDiffRespNoFilter = UtilityModule.stringDiffImplementForNoFilterMatches(noFilterMatches, ocr, 'ocr_text', studentId, fuzz)
        }
        stringDiffResp = (variantAttachment && (variantAttachment.isReorderSuggestions || variantAttachment.disableNodeStringDiff))
            ? UtilityModule.stringDiffImplementWithKey(filterMatches, ocr, fuzz, 'ocr_text', language, true, studentId)
            : UtilityModule.stringDiffImplementWithKey(filterMatches, ocr, fuzz, 'ocr_text', language, false, studentId);

        if (variantAttachment && variantAttachment.isSelectiveFilteringEnabled && userProfile && userProfile.questionLocale) {
            const OML_STATE = getOcrAndMatchesStateClassification(ocr, userProfile.questionLocale, matchesArray.hits.hits, videoLanguageSet);
            matchesArray.hits.hits = selectivelyFilterVideoLanguageArray(matchesArray.hits.hits, OML_STATE, videoLanguageSet);
        }
        if (variantAttachment && variantAttachment.userLanguages) {
            compatibleLanguageMatchesScore = getCompatibleVideoLanguageMatchesScore(matchesArray.hits.hits, variantAttachment.userLanguages);
        }
        if (matchesArrayReorderingAttachment && matchesArrayReorderingAttachment.southIndianStateLanguageReorder) {
            stringDiffResp = reorderMatchesArrayForSouthIndianStates(stringDiffResp, matchesArrayReorderingAttachment, userProfile, fuzz, req, userQuestionsAnalysisLogging);
        }
        if (variantAttachment && variantAttachment.videoLanguageReorderingEnabled) {
            // if (languagePersonificationAttachment && languagePersonificationAttachment.reorder) {
            const response = await reorderQuestionsByLanguagePrefrences(db, config, stringDiffResp, variantAttachment, variantAttachment.videoLanguageReorderBlueprint, userProfile, fuzz, ocr, questionLocale);
            stringDiffResp = response.stringDiffResp;
            languagePrioritySwaps = response.languagePrioritySwaps;
            languagePriorityQidSwaps = response.languagePriorityQidSwaps;
            languagePriorityOrder = response.languagePriorityOrder;
            // }
        }

        if (matchesArrayReorderingAttachment && matchesArrayReorderingAttachment.stateWiseLanguageRelevance) {
            stringDiffResp = stateWiseLanguageRelevanceDuplicatesReorder(stringDiffResp, matchesArrayReorderingAttachment, userProfile, req, duplicateQuestionMapByTag, userQuestionsAnalysisLogging);
        }
        const info = {
            version: (variantAttachment && variantAttachment.version) ? variantAttachment.version : baseVersion,
            query_ocr_text: (matchesArray && matchesArray.query_ocr_text) ? matchesArray.query_ocr_text : ocr,
            ssResponseTime: responseTime,
            ssError,
        };
        return {
            stringDiffResp,
            stringDiffRespNoFilter,
            info,
            variantAttachment,
            isOnlyEquation: checkIfEquationExists(ocr),
            cleanedOcr: getCleanedOcrText(ocr),
            cymathString: getCymathString(ocr),
            elasticQuery: matchesArray.elasticRequest,
            equationOcrText: matchesArray.equation_ocr_text,
            languagePrioritySwaps,
            languagePriorityQidSwaps,
            languagePriorityOrder,
            compatibleLanguageMatchesScore,
        };
    } catch (err) {
        console.error(err);
        let errorLog = err;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'ask', source: 'handleElasticSearchWrapper', error: errorLog });
        const apiError = new APIError(err.message, err.status, err.isPublic);
        if (typeof next === 'undefined') {
            throw Error(err);
        }
        return next(apiError);

    }
}

async function handleElasticSearchHybridOcrWrapper(data, config) {
    try {
        let { ocr } = data;
        let hybridOcrFlag = 0;
        if (typeof ocr === 'object') {
            if (ocr['non-english-ocr'] != ocr['english-ocr']) {
                hybridOcrFlag = 1;
            } else {
                console.log('normal flow exists');
            }
        }
        const { variantAttachment } = data;
        const baseVersion = 'v0';

        const {
            elasticSearchInstance,
            elasticSearchTestInstance,
            kinesisClient,
            elasticIndex,
            elasticHostName,
            searchFieldName,
            stockWordList,
            useStringDiff,
            language,
            fuzz,
            UtilityModule,
            studentId,
            ocrType,
            isStaging,
            useComposerApi,
            studentClass,
            flgrEnable,
            next,
            db,
        } = data;
        let matchesArray;

        variantAttachment.ocrText = ocr;
        variantAttachment.ocrType = ocrType;
        variantAttachment.studentClass = studentClass;
        if (useComposerApi && variantAttachment.queryConfig) {
            variantAttachment.elasticHostName = elasticHostName;
            variantAttachment.elasticIndexName = elasticIndex;
            variantAttachment.apiUrl = Data.searchServiceComposerApiUrl;
            variantAttachment.queryConfig.searchFieldName = searchFieldName;
        }

        if (hybridOcrFlag) {
            variantAttachment.ocrText = ocr['non-english-ocr'];
            matchesArrayNonEnglish = await callSearchServiceForv3(config, variantAttachment, isStaging);
            const response1 = _.get(matchesArrayNonEnglish, 'hits.hits', 'notFound');
            // console.log(response);
            if (response1 == 'notFound') {
                // return {};
                // const apiError = new APIError('hits.hits NOT_FOUND', 500, true);
                // if (typeof next === 'undefined') {
                //     throw Error(e);
                // }
                // return next(apiError);
                logger.error({ tag: 'ask', source: 'hits.hits', error: `ocr is: ${ocr}` });
                throw Error('hits.hits NOT_FOUND');
            }

            variantAttachment.ocrText = ocr['english-ocr'];
            matchesArrayEnglish = await callSearchServiceForv3(config, variantAttachment, isStaging, db);
            const response2 = _.get(matchesArrayEnglish, 'hits.hits', 'notFound');
            // console.log(response);
            if (response2 == 'notFound') {
                // return {};
                // const apiError = new APIError('hits.hits NOT_FOUND', 500, true);
                // if (typeof next === 'undefined') {
                //     throw Error(e);
                // }
                // return next(apiError);
                logger.error({ tag: 'ask', source: 'hits.hits', error: `ocr is: ${ocr}` });
                throw Error('hits.hits NOT_FOUND');
            }

            let stringDiffResp1;
            let stringDiffResp2;
            let stringDiffResp;

            stringDiffResp1 = UtilityModule.stringDiffImplementWithKeyAndScores(matchesArrayNonEnglish.hits.hits, ocr['non-english-ocr'], fuzz, 'ocr_text', language, true);
            stringDiffResp2 = UtilityModule.stringDiffImplementWithKeyAndScores(matchesArrayEnglish.hits.hits, ocr['english-ocr'], fuzz, 'ocr_text', language, true);

            stringDiffResp = [...stringDiffResp1, ...stringDiffResp2];
            stringDiffResp = _.orderBy(stringDiffResp, ['partial_score'], ['desc']);

            let version = baseVersion;
            if (variantAttachment && variantAttachment.version) {
                version = variantAttachment.version;
            } else if (variantAttachment && variantAttachment.searchImplVersion) {
                version = variantAttachment.searchImplVersion;
            }
            const searchedOcr = (matchesArray && matchesArray.query_ocr_text) ? matchesArray.query_ocr_text : ocr;
            const isIntegral = (matchesArray && matchesArray.isIntegral) ? 1 : 0;
            const elasticSSHost = (matchesArray && matchesArray.elasticSSHost) ? matchesArray.elasticSSHost : '';
            const info = {
                version,
                isIntegral,
                query_ocr_text: searchedOcr,
                elasticSSHost,
            };

            ocr = ocr['english-ocr'];
            const isOnlyEquation = checkIfEquationExists(ocr);
            const cleanedOcr = getCleanedOcrText(ocr);
            const cymathString = getCymathString(ocr);
            return {
                stringDiffResp,
                info,
                isOnlyEquation,
                cleanedOcr,
                cymathString,
                hybridOcrFlag,
            };
        } else {
            variantAttachment.ocrText = ocr['english-ocr'];
            matchesArray = await callSearchServiceForv3(config, variantAttachment, isStaging, db);
            const response = _.get(matchesArray, 'hits.hits', 'notFound');
            // console.log(response);
            if (response == 'notFound') {
                // return {};
                // const apiError = new APIError('hits.hits NOT_FOUND', 500, true);
                // if (typeof next === 'undefined') {
                //     throw Error(e);
                // }
                // return next(apiError);
                logger.error({ tag: 'ask', source: 'hits.hits', error: `ocr is: ${ocr}` });
                throw Error('hits.hits NOT_FOUND');
            }

            let stringDiffResp;
            if (variantAttachment && variantAttachment.isReorderSuggestions) {
                stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, true);
            } else {
                stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr, fuzz, 'ocr_text', language, false);
            }

            let version = baseVersion;
            if (variantAttachment && variantAttachment.version) {
                version = variantAttachment.version;
            } else if (variantAttachment && variantAttachment.searchImplVersion) {
                version = variantAttachment.searchImplVersion;
            }
            const searchedOcr = (matchesArray && matchesArray.query_ocr_text) ? matchesArray.query_ocr_text : ocr;
            const isIntegral = (matchesArray && matchesArray.isIntegral) ? 1 : 0;
            const elasticSSHost = (matchesArray && matchesArray.elasticSSHost) ? matchesArray.elasticSSHost : '';
            const info = {
                version,
                isIntegral,
                query_ocr_text: searchedOcr,
                elasticSSHost,
            };

            ocr = ocr['english-ocr'];

            const isOnlyEquation = checkIfEquationExists(ocr);
            const cleanedOcr = getCleanedOcrText(ocr);
            const cymathString = getCymathString(ocr);
            return {
                stringDiffResp,
                info,
                isOnlyEquation,
                cleanedOcr,
                cymathString,
                hybridOcrFlag,
            };
        }
    } catch (err) {
        console.error(err);
        let errorLog = err;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'ask', source: 'handleElasticSearchWrapper', error: errorLog });
        // return {};
        const apiError = new APIError(err.message, err.status, err.isPublic);
        if (typeof next === 'undefined') {
            throw Error(err);
        }
        return next(apiError);
    }
}

function handleSearchServiceResponse(data) {
    // Sample Search Service Response
    /*
        data = {
            "question": [
                {
                    "id": 1234,
                    "ocrText": "Hello World",
                    "subject": "MATHS"
                },
                {
                    "id": 567,
                    "ocrText": "How are you?",
                    "subject": "MATHS"
                },
                {
                    "id": 890,
                    "ocrText": "How you doin?",
                    "subject": "MATHS"
                },
            ],
            "extras": {
                'isIntegral': false,
                'queryOcrText': 'bla bla'
            },
            "debugInfo": {
                "elastic_host_name": "xyz.amazonaws.com",
                "elastic_request": {},
                "elastic_response": {
                    "took": 1,
                    "timed_out": false,
                    "_shards": {},
                    "hits": {
                        "total": 2331,
                        "max_score": 21.97837,
                        "hits": [
                            {
                                "_index": "question_bank_v1",
                                "_type": "repository",
                                "_id": 1234,
                                "_score": 21.97837,
                                "_source": {
                                    "ocr_text": "Hello World",
                                    "subject": "MATHS",
                                    "is_answered": 1,
                                    "is_text_answered": 0,
                                    "chapter": 0,
                                    "video_language": "hi-en"
                                }
                            },
                            {
                                "_index": "question_bank_v1",
                                "_type": "repository",
                                "_id": 567,
                                "_score": 21.97837,
                                "_source": {
                                    "ocr_text": "How are you?",
                                    "subject": "MATHS",
                                    "is_answered": 1,
                                    "is_text_answered": 0,
                                    "chapter": 0,
                                    "video_language": "en"
                                }
                            },
                            {
                                "_index": "question_bank_v1",
                                "_type": "repository",
                                "_id": 890,
                                "_score": 21.97837,
                                "_source": {
                                    "ocr_text": "How you doin?",
                                    "subject": "MATHS",
                                    "is_answered": 1,
                                    "is_text_answered": 0,
                                    "chapter": 0,
                                    "video_language": "hi"
                                }
                            }
                        ]
                    }
                }
            }
        }
    */
    let dest;
    let response_time = data.response_time || 0;
    if (data && data.question && data.extras) {
        const map = {
            took: 0,
            timed_out: false,
            _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
            },
            'extras.isIntegral': {
                key: 'isIntegral',
                transform(value) {
                    return value;
                },
                default() {
                    return false;
                },
            },
            'extras.queryOcrText': {
                key: 'query_ocr_text',
                transform(value) {
                    return value;
                },
                default: '',
            },
            'extras.equationOcr': {
                key: 'equation_ocr_text',
                transform(value) {
                    return value;
                },
                default: '',
            },
            'extras.elasticHostDefault': {
                key: 'elasticSSHost',
                transform(value) {
                    return value;
                },
                default: '',
            },
            'debugInfo.elastic_request': {
                key: 'elasticRequest',
                transform(value) {
                    return value;
                },
                default: '',
            },
            question: {
                key: 'hits',
                transform(questions) {
                    const obj = {
                        total: 0,
                        max_score: 0,
                        hits: [],
                    };
                    const videoLanguageObj = {};
                    const hindiOcrObj = {};
                    const elasticScoresObj = {};
                    const chapterObj = {};
                    const chapterAliasObj = {};
                    const options1Obj = {};
                    const options2Obj = {};
                    const options3Obj = {};
                    const options4Obj = {};
                    const packageLanguageObj = {};
                    const prettyTextObj = {};
                    const duplicatesObj = {};
                    const isAnsweredObj = {};
                    const isTextAnsweredObj = {};
                    const videoDurationObj = {};
                    const thumbnail = {};
                    // eslint-disable-next-line no-cond-assign
                    if (sourceArray = _.get(data, 'debugInfo.elastic_response.hits.hits', null)) {
                        sourceArray.forEach((element) => {
                            const questionId = element._id;
                            if (element._source.video_language) {
                                videoLanguageObj[questionId] = element._source.video_language;
                            } else {
                                videoLanguageObj[questionId] = 'hi-en';
                            }
                            if (element._source.ocr_text_hi) {
                                hindiOcrObj[questionId] = element._source.ocr_text_hi;
                            }
                            if ('is_answered' in element._source && 'is_text_answered' in element._source) {
                                isAnsweredObj[questionId] = element._source.is_answered;
                                isTextAnsweredObj[questionId] = element._source.is_text_answered;
                            }
                            if (element._score) {
                                elasticScoresObj[questionId] = element._score;
                            }
                            if (element._source.chapter) {
                                chapterObj[questionId] = element._source.chapter;
                            }
                            if (element._source.chapter_alias) {
                                chapterAliasObj[questionId] = element._source.chapter_alias;
                            }
                            if (element._source.option_1) {
                                options1Obj[questionId] = element._source.option_1;
                            }
                            if (element._source.option_2) {
                                options2Obj[questionId] = element._source.option_2;
                            }
                            if (element._source.option_3) {
                                options3Obj[questionId] = element._source.option_3;
                            }
                            if (element._source.option_4) {
                                options4Obj[questionId] = element._source.option_4;
                            }
                            if (element._source.package_language) {
                                packageLanguageObj[questionId] = element._source.package_language;
                            }
                            if (element._source.pretty_text) {
                                prettyTextObj[questionId] = element._source.pretty_text;
                            }
                            if (element._source.duplicateTag) {
                                duplicatesObj[questionId] = element._source.duplicateTag;
                            }
                            if (element._source.duration) {
                                videoDurationObj[questionId] = element._source.duration;
                            }
                            if (element._source.thumbnail) {
                                thumbnail[questionId] = element._source.thumbnail;
                            }
                        });
                    }
                    for (let index = 0; index < questions.length; index++) {
                        const question = questions[index];
                        const questionId = question.id;
                        const videoLanguage = videoLanguageObj[questionId];
                        const ocrTextHi = hindiOcrObj[questionId];
                        const elasticScore = elasticScoresObj[questionId];
                        const chapter = chapterObj[questionId];
                        const chapterAlias = chapterAliasObj[questionId];
                        const option_1 = options1Obj[questionId];
                        const option_2 = options2Obj[questionId];
                        const option_3 = options3Obj[questionId];
                        const option_4 = options4Obj[questionId];
                        const package_language = packageLanguageObj[questionId];
                        const pretty_text = prettyTextObj[questionId];
                        const duplicateTag = duplicatesObj[questionId];
                        const duration = videoDurationObj[questionId];
                        const isAnswered = isAnsweredObj[questionId];
                        const isTextAnswered = isTextAnsweredObj[questionId];
                        const questionThumbnail = thumbnail[questionId];
                        const searchServiceScore = question.score || 0;
                        const matchedQueries = _.get(question, 'matchedQueries', []);
                        const quesObj = {
                            _index: 'question_bank_v1',
                            _type: 'repository',
                            _id: questionId,
                            _score: elasticScore || 10,
                            _source: {
                                chapter,
                                chapter_alias: chapterAlias || chapter,
                                is_answered: isAnswered,
                                ocr_text: question.ocrText,
                                ocr_text_hi: ocrTextHi,
                                is_text_answered: isTextAnswered,
                                subject: question.subject,
                                video_language: videoLanguage,
                                thumbnail_language: 'english',
                                package_language,
                                pretty_text,
                                option_1, option_2, option_3, option_4,
                                duplicateTag,
                                duration,
                                search_service_sd_score: searchServiceScore,
                                thumbnail: questionThumbnail,
                                matchedQueries,
                            },
                        };
                        if (typeof question.elasticScore !== 'undefined') {
                            quesObj._score = question.elasticScore;
                        }
                        if (typeof question.stringDiffScore !== 'undefined') {
                            quesObj.partial_score = question.stringDiffScore;
                        }
                        obj.hits.push(quesObj);
                    }
                    return obj;
                },
                default() {
                    const obj = {
                        total: 0,
                        max_score: 0,
                        hits: [],
                    };
                    return obj;
                },
            },
        };
        dest = objectMapper(data, map);
    } else {
        dest = data;
    }
    return [dest, response_time, null];
}

async function handleViserSearchResponse(data, esClient, key) {
    // Sample Viser Search Response
    /*
    data = {
        "message": "SUCCESS",
        "result": {
            "OCR": {
                "MATCHES": [
                    [
                        {
                            "ID": 26522190,
                            "Match": "P and Q are points on opposite sides AD and BC of a parallelogram ABCD such that PQ passes through the point of intersection O of its diagonals AC and BD. Show that PQ is bisected at O.",
                            "Rank": 1,
                            "Score": 0.741
                        },
                        {
                            "ID": 213714315,
                            "Match": "The diagonals AC and BD of the parallelogram ABCD intersect each other at O . Any straight line passing through O intesects the sides AB and CD at the points P and Q respectively . Prove that OP = OQ.",
                            "Rank": 2,
                            "Score": 0.731
                        }
                    ],
                ],
                "Query_Strings": [
                    "The diagonals AC and BD of a parallelogram ABCD bisect each other at O.A line segment XY through O has its end-points on the opposite sides \"AB\" and CD.Is XY also bisected at \"O\""                ],
                "ZMSG": [
                    "Success",
                ]
            }
        },
        "status": 200
    }
    */
    // Sample Viser Diagram Matcher Response
    /*
    data = {
        "message": "SUCCESS",
            "result": {
                "url": {
                    "MATCHES": [
                        [
                            {
                                "ID": 614523485,
                                "Rank": 1,
                                "Score": 0.806
                            }
                        ]
                    ],
                    "Query_Image": [
                        "https://doubtnut-static.s3.ap-south-1.amazonaws.com/images/2021/10/30/uploads_10367093_1635592619.png"
                    ],
                    "ZMSG": [
                        "OK | DT: 0.19 | SGT: 0.43 | SPT: 0.00 |"
                    ]
                }
            },
            "status": 200
    }
    */
    let dest;
    let response_time = data.response_time || 0;
    let qidArr = [];
    let questionDetails = [];
    if (!key) {
        key = 'OCR';
    }
    if (esClient) {
        qidArr = data.result[key]['MATCHES'][0].map((x) => x.ID);
        questionDetails = await esClient.findDocumentsBulk(qidArr, 'question_bank_v1.1');
    }
    const map = {
        took: 0,
        timed_out: false,
        _shards: {
            total: 5,
            successful: 5,
            skipped: 0,
            failed: 0,
        },
    };
    map[`result.${key}.MATCHES[0]`] = {
        key: 'hits',
        transform(questions) {
            const obj = {
                total: 0,
                max_score: 0,
                hits: [],
            };
            for (let index = 0; index < questions.length; index++) {
                const question = questions[index];
                const questionId = question.ID;
                const score = question.Score;
                let quesObj;

                if (!_.isEmpty(questionDetails) && questionDetails.docs && questionDetails.docs[index] && questionDetails.docs[index]['found']) {
                    quesObj = {
                        _index: 'question_bank_v1',
                        _type: 'repository',
                        _id: questionId.toString(),
                        _score: score,
                        _source: {
                            is_answered: 1,
                            ocr_text: questionDetails.docs[index]['_source']['ocr_text'] || question.Match,
                            is_text_answered: 0,
                            thumbnail_language: 'english',
                            video_language: questionDetails.docs[index]['_source']['video_language'] || 'hi-en',
                            subject: questionDetails.docs[index]['_source']['subject'],
                            chapter_alias: questionDetails.docs[index]['_source']['chapter_alias'],
                            class: questionDetails.docs[index]['_source']['class'],
                        },
                    };
                } else {
                    quesObj = {
                        _index: 'question_bank_v1',
                        _type: 'repository',
                        _id: questionId.toString(),
                        _score: score,
                        _source: {
                            is_answered: 1,
                            ocr_text: question.Match,
                            is_text_answered: 0,
                            thumbnail_language: 'english',
                            video_language: 'hi-en',
                            subject: 'MATHS',
                            chapter_alias: 'DEFAULT',
                            class: '12',
                        },
                    };
                }
                obj.hits.push(quesObj);
            }
            return obj;
        },
        default() {
            const obj = {
                total: 0,
                max_score: 0,
                hits: [],
            };
            obj.hits.push({
                _index: 'question_bank_v1',
                _type: 'repository',
                _id: '26522190',
                _score: 0.741,
                _source: {
                    is_answered: 1,
                    ocr_text: "P and Q are points on opposite sides AD and BC of a parallelogram ABCD such that PQ passes through the point of intersection O of its diagonals AC and BD. Show that PQ is bisected at O.",
                    is_text_answered: 0,
                    thumbnail_language: 'english',
                    subject: 'MATHS',
                    chapter_alias: 'DEFAULT',
                }
            }, {
                _index: 'question_bank_v1',
                _type: 'repository',
                _id: '213714315',
                _score: 0.731,
                _source: {
                    is_answered: 1,
                    ocr_text: "The diagonals AC and BD of the parallelogram ABCD intersect each other at O . Any straight line passing through O intesects the sides AB and CD at the points P and Q respectively . Prove that OP = OQ.",
                    is_text_answered: 0,
                    thumbnail_language: 'english',
                    subject: 'MATHS',
                    chapter_alias: 'DEFAULT',
                }
            })
            return obj;
        },
    }
    dest = objectMapper(data, map);
    return [dest, response_time, null];
}

function handleIASResponse(resp) {
    // Sample IAS Service Response
    /*
    resp = {
        meta = {
            // some metadata info
        },
        data = {
            ias_facets: [],
            isVipUser: false,
            list: [
                {"title": "Videos", "tab_type": "video", list: [{}, {}, {}]},
                {"title": "NCERT", "tab_type": "ncert", list: [{}, {}, {}]},
                {"title": "Live Classes", "tab_type": "live_class", list: [{}, {}, {}]},
            ],
            tabs: [
                // array of tabs
            ]
        }
    }
    // resp > data > list > list contains array of solutions
    */
    let dest;
    if (resp && resp.data && resp.data.list) {
        const data = resp.data;
        const _reg = new RegExp('_');
        const map = {
            took: 0,
            timed_out: false,
            _shards: {
                total: 5,
                successful: 5,
                skipped: 0,
                failed: 0,
            },
            'list': {
                key: 'hits',
                transform(questions) {
                    const obj = {
                        total: 0,
                        max_score: 0,
                        hits: [],
                    };

                    for (let index = 0; index < questions.length; index++) {
                        const question = questions[index];
                        if (Data.validTabTypes.includes(question.tab_type)) {
                            const list = question.list;
                            for (let j = 0; j < list.length; j++) {
                                const element = list[j];
                                const quesObj = {
                                    _index: 'question_bank_v1',
                                    _type: 'repository',
                                    _id: _reg.test(element._id) ? element._id.split('_')[0] : element._id,
                                    _score: 10,
                                    _source: {
                                        chapter: 0,
                                        is_answered: 1,
                                        ocr_text: element._source.display,
                                        is_text_answered: 0,
                                        subject: element._source.subject,
                                        video_language: 'en',
                                        thumbnail_language: 'english',
                                        katex_ocr_text: element._source.display,
                                        render_katex: false,
                                        likes: 25607,
                                        share: 823,
                                        ref: "English",
                                        exact_match: false,
                                        partial_score: 100,
                                        resource_type: "video",
                                        question_thumbnail: 'https://dummyimage.png',
                                    },
                                };
                                obj.hits = obj.hits.concat(quesObj);
                            }
                        }
                    }
                    return obj;
                },
                default() {
                    const obj = {
                        total: 0,
                        max_score: 0,
                        hits: [],
                    };
                    return obj;
                },
            },
        };
        dest = objectMapper(data, map);
    }
    return dest;
}

function bumpHindiQues(stringDiffResp, fuzz) {
    const swapArray = [];
    const swapQidsArray = [];
    try {
        const threshold = Data.HINDI_BUMP_THRESHOLD;
        const ocrArray = stringDiffResp[0];
        for (let index = 1; index < ocrArray.length; index++) {
            const element = ocrArray[index]._source;
            const prevElement = ocrArray[index - 1]._source;
            if (element.video_language == 'hi' && (prevElement.video_language == 'en' || prevElement.video_language == 'hi-en')) {
                const score = Utility.compareBystringDiff(fuzz, element.ocr_text, prevElement.ocr_text);
                if (score >= threshold) {
                    swapArray.push([index, index - 1]);
                    swapQidsArray.push([ocrArray[index]['_id'], ocrArray[index - 1]['_id']]);
                    // elastic search matches, grouped qids, grouped Meta
                    const arrOfArrays = Utility.exchangeArrayIndices([stringDiffResp[0], stringDiffResp[1], stringDiffResp[2]], index, index - 1);
                    stringDiffResp[0] = arrOfArrays[0];
                    stringDiffResp[1] = arrOfArrays[1];
                    stringDiffResp[2] = arrOfArrays[2];
                }
            }
        }
        return {
            stringDiffResp,
            languagePrioritySwaps: swapArray,
            languagePriorityQidSwaps: swapQidsArray
        }
    } catch (e) {
        console.error('Error occured while bumping up Hindi question: ', e);
        return {
            stringDiffResp,
            languagePrioritySwaps: swapArray,
            languagePriorityQidSwaps: swapQidsArray
        };
    }
}


function bumpEnLangQues(stringDiffResp, variantAttachment) {
    const swapArray = [];
    const swapQidsArray = [];
    try {
        const threshold = variantAttachment.bumpEngLangThreshold;
        const ocrArray = stringDiffResp[0];
        for (let index = 1; index < ocrArray.length; index++) {
            const element = ocrArray[index]._source;
            const prevElement = ocrArray[index - 1]._source;
            if ((element.video_language === 'en' || element.video_language == 'hi-en') && (prevElement.video_language !== 'en' || prevElement.video_language !== 'hi-en') && element.video_language !== prevElement.video_language) {
                scoreCurrEle = ocrArray[index].partial_score;
                scorePrevEle = ocrArray[index - 1].partial_score;
                if (Math.abs(scorePrevEle - scoreCurrEle) <= threshold) {
                    swapArray.push([index, index - 1]);
                    swapQidsArray.push([ocrArray[index]['_id'], ocrArray[index - 1]['_id']]);
                    const arrOfArrays = Utility.exchangeArrayIndices([stringDiffResp[0], stringDiffResp[1], stringDiffResp[2]], index, index - 1);
                    [stringDiffResp[0], stringDiffResp[1], stringDiffResp[2]] = arrOfArrays
                }
            }
        }


    } catch (e) {
        console.error('Error occured while bumping up English question: ', e);
    } finally {
        return {
            stringDiffResp,
            languagePrioritySwaps: swapArray,
            languagePriorityQidSwaps: swapQidsArray
        }
    }
}

function checkSwappingThresoldComparison(score, thresholdComparisonOperator, threshold) {
    if (thresholdComparisonOperator == 'gt') {
        return (score >= threshold);
    } else if (thresholdComparisonOperator == 'lt') {
        return (score <= threshold);
    } else if (thresholdComparisonOperator == 'equals') {
        return (score == threshold);
    }
    return false;
}


function isSwapNeeded(pointers, order, fuzz, questionOcr, stringCompareStrategy, threshold, thresholdComparisonOperator) {
    let ocrTextP0 = pointers.p0.ocr_text; let ocrTextP1 = pointers.p1.ocr_text;
    let textSimilarityScore;
    if (stringCompareStrategy == 'ocr2q') {
        let s1 = Utility.compareBystringDiff(fuzz, questionOcr, ocrTextP0);
        let s2 = Utility.compareBystringDiff(fuzz, questionOcr, ocrTextP1);
        textSimilarityScore = Math.abs(s1 - s2);


    } else if (stringCompareStrategy == 'q2q') {
        textSimilarityScore = Utility.compareBystringDiff(fuzz, ocrTextP1, ocrTextP0);
    } else {
        textSimilarityScore = 0;
    }

    if(checkSwappingThresoldComparison(textSimilarityScore, thresholdComparisonOperator, threshold)){
        let orderIndexP0 = order.indexOf(pointers.p0.video_language);
        let orderIndexP1 = order.indexOf(pointers.p1.video_language);
        if (orderIndexP1 >= 0 && orderIndexP0 == -1) {
            return true;
        }

        if (orderIndexP0 >= 0 && orderIndexP1 >= 0 && orderIndexP1 < orderIndexP0) {
            return true;
        }
    }
    return false;
}

function swapArray(arr, i1, i2) {
    [arr[i1], arr[i2]] = [arr[i2], arr[i1]];
    return arr;
}

async function getLanguageRelevancyOrder(db, config, languageAttachment, userProfile) {
    try {
        const {
            appLocale,
            questionLocale,
            schoolBoard,
            studentId
        } = userProfile;
        let genre;
        let order;
        let historicalPrefrencesOrder;
        if (languageAttachment.useUserHistoryForReorder) {
            const questions = await QuestionAskPersonalisationContainer.getUserRecentlyVideosWatchedData(db, config, studentId);
            if (questions.length > 5) {
                historicalPrefrencesOrder = await reorderArrayUsingUserHistory(db, questions, languageAttachment);
            }
        }
        const stateLocale = Data.video_language_personification_obj.boards_lang_pref_mapping[schoolBoard] || 'hi';
        if(appLocale == 'en') {
            if(questionLocale == 'en') {
                if(!_.isEmpty(schoolBoard)){
                    if(stateLocale != 'hi') {
                        ({genre, order} = languageAttachment[appLocale]
                            .question_locale['en']['board']['state-board']);
                    }else{
                        ({genre, order} = languageAttachment[appLocale]
                            .question_locale['en']['board']['general-board']);
                    }
                } else {
                    ({ genre, order } = languageAttachment[appLocale]
                        .question_locale['en']['no-board']);
                }
            } else {
                if (!_.isEmpty(schoolBoard)) {
                    if (stateLocale != 'hi') {
                        ({ genre, order } = languageAttachment[appLocale]
                            .question_locale['non-en'].board['state-board']);
                    } else {
                        ({ genre, order } = languageAttachment[appLocale]
                            .question_locale['non-en'].board['general-board']);
                    }
                } else {
                    ({ genre, order } = languageAttachment[appLocale]
                        .question_locale['non-en']['no-board']);
                }
            }
        } else if (appLocale == 'hi') {
            order = languageAttachment['hi']['order'];
        } else {
            ({ genre, order } = languageAttachment['others']);
        }
        languageRelevancyOrder =  !_.isEmpty(genre) ? order.map((x)=>x.replace('xx', eval(genre))): order;
        if(!_.isEmpty(historicalPrefrencesOrder)){
            for(video_language of historicalPrefrencesOrder){
                const index = languageRelevancyOrder.indexOf(video_language);
                if(index > -1){
                    languageRelevancyOrder.splice(index,1);
                }
            }
            languageRelevancyOrder = [...historicalPrefrencesOrder, ...languageRelevancyOrder];
        }
        return languageRelevancyOrder;
    } catch (e) {
        console.log(e);
    }
}


async function reorderArrayUsingUserHistory(db, questions, languageAttachment) {
    try {
        const videoCounter = {};
        const avgVideoSucessKPI = {};
        if (_.isEmpty(languageAttachment.historicalDataReorderingStrategy)) {
            return [];
        }
        let completionRatioData = [];
        const promises = [];
        if(languageAttachment.historicalDataReorderingStrategy === 'AVG_VIDEO_COMPLETION'){
            for(let i = 0 ; i<questions.length; i++){
                promises.push(AnswerContainer.getByQuestionIdWithTextSolution(questions[i].question_id, db));
            }
            completionRatioData = await Promise.all(promises);
            for (let i = 0; i < questions.length; i++) {
                const duration = completionRatioData[i][0] && completionRatioData[i][0].duration ? completionRatioData[i][0].duration  : 30;
                const videoSuccessKPI = questions[i].engage_time / parseInt(duration);
                if (questions[i].video_locale in videoCounter) {
                    avgVideoSucessKPI[questions[i].video_locale] = (avgVideoSucessKPI[questions[i].video_locale] * videoCounter[questions[i].video_locale] + videoSuccessKPI) / (videoCounter[questions[i].video_locale] + 1);
                    videoCounter[questions[i].video_locale]++;
                } else {
                    avgVideoSucessKPI[questions[i].video_locale] = videoSuccessKPI;
                    videoCounter[questions[i].video_locale] = 1;
                }
            }
        }else if (languageAttachment.historicalDataReorderingStrategy === 'AVG_ENGAGE_TIME'){
            for (let i = 0; i < questions.length; i++) {
                const videoSuccessKPI =  questions[i].engage_time;
                if (questions[i].video_locale in videoCounter) {
                    avgVideoSucessKPI[questions[i].video_locale] = (avgVideoSucessKPI[questions[i].video_locale] * videoCounter[questions[i].video_locale] + videoSuccessKPI) / (videoCounter[questions[i].video_locale] + 1);
                    videoCounter[questions[i].video_locale]++;
                } else {
                    avgVideoSucessKPI[questions[i].video_locale] = videoSuccessKPI;
                    videoCounter[questions[i].video_locale] = 1;
                }
            }
        }
        const reorderedArray = Object.entries(avgVideoSucessKPI).sort((a, b) => b[1] - a[1]).map((j) => j[0]);
        return reorderedArray;
    } catch (e) {
        console.error(e);
        return [];
    }
}

function reorderMatchesArrayForSouthIndianStates(questionsMatchesGlobalObj, attachment, userProfile, fuzz, req, userQuestionsAnalysisLogging) {
    // TODO: REORDERING EXPERIMENT 4
    function isSwap(fuzz, matchedQuestionP1, matchedQuestionP0, stringMatchThreshold, bumpLanguage) {
        const textSimilarityScore = Utility.compareBystringDiff(fuzz, matchedQuestionP1._source.ocr_text, matchedQuestionP0._source.ocr_text);
        if (textSimilarityScore > stringMatchThreshold && matchedQuestionP1._source.video_language === bumpLanguage && matchedQuestionP0._source.video_language !== bumpLanguage) {
            return true;
        }
        return false;
    }
    try {
        const {
            0: elasticMatchesArr,
            1: groupedQidsArr,
            2: groupedMeta,
        } = questionsMatchesGlobalObj;
        const totalAppMatchesCount = 20 > elasticMatchesArr.length ? elasticMatchesArr.length : 20;
        const stringMatchThreshold = attachment.southIndianReorderingSdThreshold;
        const [userLocation, ip] = Utility.getStudentStateCode(req);
        const { schoolBoard } = userProfile;
        const is_south_indian_state = Data.southIndianStates.includes(userLocation) || Data.southIndianBoards.includes(schoolBoard);
        const bumpLanguage = is_south_indian_state ? 'en' : 'hi-en';
        for (let i = totalAppMatchesCount - 1; i > 0; i--) {
            if (isSwap(fuzz, elasticMatchesArr[i], elasticMatchesArr[i - 1], stringMatchThreshold, bumpLanguage)) {
                addSearchIterationSuccessLogsInElastic(userQuestionsAnalysisLogging, 'south_indian_language_reorder');
                swapArray(elasticMatchesArr, i, i - 1);
                swapArray(groupedQidsArr, i, i - 1);
                swapArray(groupedMeta, i, i - 1);
            }
        }
        return questionsMatchesGlobalObj;
    } catch (e) {
        console.error(e);
        return questionsMatchesGlobalObj;
    }
}

async function reorderQuestionsByLanguagePrefrences(
    db,
    config,
    questionsMatchesGlobalObj,
    variantAttachment,
    languageAttachment,
    userProfile,
    fuzz,
    questionOcr,
    questionLocale,
) {
    const totalAppMatchesCount = 20;
    let languageRelevancyOrder;
    const swapsArray = []; // LOG VARS
    const swapQidsArray = []; // LOG VARS
    try {
        let {
            0: elasticMatchesArr,
            1: groupedQidsArr,
            2: groupedMeta,
        } = questionsMatchesGlobalObj;
        languageRelevancyOrder = await getLanguageRelevancyOrder(db, config, languageAttachment, userProfile);
        const stringCompareStrategy = languageAttachment.stringCompareStrategy || 'q2q';
        const stringMatchThreshold = languageAttachment.stringComparisonThreshold || 90;
        const thresholdComparisonOperator = languageAttachment.thresholdComparisonOperator;
        const pointers = {};
        if(languageAttachment.isMultipleReorderingEnabled){
            for (let m=0; m < languageRelevancyOrder.length; m++){
                for (let i = totalAppMatchesCount - 1; i > 0; i--) {
                    if (questionLocale == 'hi') {
                        pointers.p0 = { index: i - 1, qid: elasticMatchesArr[i - 1]._id, ocr_text: elasticMatchesArr[i - 1]._source.ocr_text_hi, video_language: elasticMatchesArr[i - 1]._source.video_language };
                        pointers.p1 = { index: i, qid: elasticMatchesArr[i]._id, ocr_text: elasticMatchesArr[i]._source.ocr_text_hi, video_language: elasticMatchesArr[i]._source.video_language }
                    } else {
                        pointers.p0 = { index: i - 1, qid: elasticMatchesArr[i - 1]._id, ocr_text: elasticMatchesArr[i - 1]._source.ocr_text, video_language: elasticMatchesArr[i - 1]._source.video_language };
                        pointers.p1 = { index: i, qid: elasticMatchesArr[i]._id, ocr_text: elasticMatchesArr[i]._source.ocr_text, video_language: elasticMatchesArr[i]._source.video_language }
                    }
                    if (isSwapNeeded(pointers, languageRelevancyOrder, fuzz, questionOcr, stringCompareStrategy, stringMatchThreshold, thresholdComparisonOperator)) {
                        swapArray(elasticMatchesArr, pointers.p0.index, pointers.p1.index);
                        swapArray(groupedQidsArr, pointers.p0.index, pointers.p1.index);
                        swapArray(groupedMeta, pointers.p0.index, pointers.p1.index);
                        //< _____________________ LOGS ______________>
                        swapsArray.push([pointers.p1.index, pointers.p0.index]);
                        swapQidsArray.push([pointers.p1.qid, pointers.p0.qid]);
                    }
                }
            }
        }else{
            for (let i = totalAppMatchesCount - 1; i > 0; i--) {
                if (questionLocale == 'hi') {
                    pointers.p0 = { index: i - 1, qid: elasticMatchesArr[i - 1]._id, ocr_text: elasticMatchesArr[i - 1]._source.ocr_text_hi, video_language: elasticMatchesArr[i - 1]._source.video_language };
                    pointers.p1 = { index: i, qid: elasticMatchesArr[i]._id, ocr_text: elasticMatchesArr[i]._source.ocr_text_hi, video_language: elasticMatchesArr[i]._source.video_language }
                } else {
                    pointers.p0 = { index: i - 1, qid: elasticMatchesArr[i - 1]._id, ocr_text: elasticMatchesArr[i - 1]._source.ocr_text, video_language: elasticMatchesArr[i - 1]._source.video_language };
                    pointers.p1 = { index: i, qid: elasticMatchesArr[i]._id, ocr_text: elasticMatchesArr[i]._source.ocr_text, video_language: elasticMatchesArr[i]._source.video_language }
                }
                if (isSwapNeeded(pointers, languageRelevancyOrder, fuzz, questionOcr, stringCompareStrategy, stringMatchThreshold, thresholdComparisonOperator)) {
                    swapArray(elasticMatchesArr, pointers.p0.index, pointers.p1.index);
                    swapArray(groupedQidsArr, pointers.p0.index, pointers.p1.index);
                    swapArray(groupedMeta, pointers.p0.index, pointers.p1.index);
                    //< _____________________ LOGS ______________>
                    swapsArray.push([pointers.p1.index, pointers.p0.index]);
                    swapQidsArray.push([pointers.p1.qid, pointers.p0.qid]);
                }
            }
        }
    } catch (e) {
        console.error('Error occured while reordering question: ', e);
    } finally {
        return {
            stringDiffResp: questionsMatchesGlobalObj,
            languagePrioritySwaps: swapsArray,
            languagePriorityQidSwaps: swapQidsArray,
            languagePriorityOrder: languageRelevancyOrder,
        }
    }
}

function checkIfEquationExists(textString) {
    const check = /"/g.test(textString);
    if (!check) {
        return true;
    }
    return false;
}

function getCymathString(textString) {
    // console.log('textString');
    // console.log(textString);
    // console.log(textString.split('"'));
    textString = textString.replace(/\["|]/g, ' ');
    textString = textString.replace(/[,[]/g, ' ');
    // console.log(textString);
    // console.log(textString.split('"'));
    textString = textString.split('"');
    // textString = textString.reduce((accumulator, value, index) => {
    //     console.log(index);
    //     console.log(value);
    //     if (index % 2 !== 0) {
    //         value = `\`${value}\``;
    //     }
    //     accumulator += value;
    //     return accumulator;
    // });
    let stringToReturn = '';
    for (let i = 0; i < textString.length; i += 1) {
        let s = textString[i];
        if (i === 0 && textString.length === 1) {
            s = `\`${s}\``;
        }
        if (i % 2 !== 0) {
            // console.log('odd');
            // console.log(textString[i]);
            s = `\`${s}\``;
        }
        stringToReturn += s;
    }
    const checkMultipleBackTick = stringToReturn.split('`');
    if (checkMultipleBackTick.length > 3) {
        // multiple backticks
        // remove backticks
        stringToReturn = stringToReturn.replace(/`/g, '');
    }
    stringToReturn = stringToReturn.replace(/\s+/g, ' ').trim();
    return stringToReturn;
}

function getCleanedOcrText(rawText) {
    let formattedString = rawText.replace(/\["|]/g, ' ');
    formattedString = formattedString.replace(/[,[]/g, ' ');
    formattedString = formattedString.replace(/"/g, ' ');
    formattedString = formattedString.replace(/\s+/g, ' ');
    formattedString = formattedString.replace(/\s+/g, ' ').trim();
    return formattedString;
}

function getGoogleTabQueryOcrText(text, versionCode) {
    try {
        if (versionCode <= 979) {
            if (!text.split('`').length < 2) {
                return `${text} doubtnut.com`;
            }
        }
        return text;
    } catch (e) {
        console.log(e);
        return text;
    }
}

function getSearchUrlForMPTabs(text, type) {
    try {
        if (type == 'google') {
            return `https://www.google.com/search?q=${encodeURIComponent(`site:doubtnut.com ${text}`)}`;
        } else if (type == 'youtube') {
            return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${text} doubtnut`)}`;
        }
        return text;
    } catch (e) {
        console.log(e);
        return text;
    }
}

function getCleanedOcrText2(formattedString, isTyd = false) {
    formattedString = isTyd ? formattedString.replace(/(?<= |\(|\)|\d)\s*times\s*(?=\(|\)|\d)/g, '*') : formattedString.replace(/(?<= |\(|\)|\d)times(?=\(|\)|\d)/g, '*');
    formattedString = formattedString.replace(/\?/g, 'x');
    formattedString = formattedString.replace(/-:/g, '/');
    formattedString = formattedString.replace(/{/g, '(');
    formattedString = formattedString.replace(/}/g, ')');
    formattedString = formattedString.trim();
    formattedString = formattedString.replace(/xx/g, '*');
    if (formattedString.charAt(formattedString.length - 1) === '=') {
        formattedString = formattedString.slice(0, -1);
    }
    formattedString = formattedString.replace(/\s+/g, ' ').trim();
    return formattedString;
}

function getCleanedOcrText3(formattedString) {
    formattedString = formattedString.replace(' of ', ' * ');
    return formattedString;
}

function getCleanedOcrTextForYoutube(rawText) {
    let formattedString = getCleanedOcrText(rawText);
    formattedString = getCleanedOcrText2(formattedString);
    formattedString = formattedString.replace('-', ' ');
    formattedString = formattedString.substring(0, 100);
    return formattedString;
}

function getSimplifiedExpressionFromMathsteps(mathsteps, cleanedOcr) {
    let html = '';
    try {
        let lastNode = '';
        const expressionSteps = mathsteps.simplifyExpression(cleanedOcr);
        if (expressionSteps.length > 0) {
            // got the solution & create html
            for (let i = 0; i < expressionSteps.length; i += 1) {
                // console.log(expressionSteps[i]);
                const step = expressionSteps[i];
                if (/[a-zA-Z]{2,}/g.test(step.newNode.toString())) {
                    html = '';
                } else {
                    html = `${html + _.startCase(_.toLower(step.changeType.replace(/_/g, ' ')))}<br/><br/>\`${step.newNode.toString()}\`<br/><br/>`;
                    lastNode = step.newNode.toString();
                }
            }
        } else {
            const equationSteps = mathsteps.solveEquation(cleanedOcr);
            if (equationSteps.length > 0) {
                // got the solution & create html
                // return res.send(equationSteps)
                for (let i = 0; i < equationSteps.length; i += 1) {
                    // console.log(equationSteps[i]);
                    const step = equationSteps[i];
                    html = `${html + _.startCase(_.toLower(step.changeType.replace(/_/g, ' ')))}<br/><br/>\`${step.newEquation.ascii()}\`<br/><br/>`;
                    lastNode = step.newEquation.ascii();
                }
            }
        }
        const newNode = checkForDivisionLibrary(lastNode);
        if (newNode !== lastNode) {
            html = `${html}\n*${newNode}*`;
        }

        return html;
    } catch (e) {
        console.error(e);
        return html;
    }
}

async function handleComputationalQuestions(data) {
    try {
        let { cleanedOcr } = data;
        const {
            mathsteps,
            UtilityModule,
            qid,
            locale,
            isTyd,
        } = data;
        let html = '';
        const textSolutionData = {};
        const computationalMatchArr = [];
        cleanedOcr = getCleanedOcrText2(cleanedOcr, isTyd);
        cleanedOcr = cleanedOcr.replace(/%/g, '/100');

        html = getSimplifiedExpressionFromMathsteps(mathsteps, cleanedOcr);

        if (html.length > 0) {
            textSolutionData.question_id = qid;
            textSolutionData.type = 'COMPUTATIONAL';
            textSolutionData.page_no = 0;
            textSolutionData.sub_obj = 'O';
            textSolutionData.opt_1 = '';
            textSolutionData.opt_2 = '';
            textSolutionData.opt_3 = '';
            textSolutionData.opt_4 = '';
            textSolutionData.answer = '';
            textSolutionData.subtopic = '';
            textSolutionData.tag1 = '';
            textSolutionData.tag2 = '';
            textSolutionData.solutions = html;
            // await AnswerMysql.addTextSolution(db.mysql.write, textSolutionData);
            // computationalFieldToUpdate.ocr_done = 1;
            // computationalFieldToUpdate.ocr_text = ocr;
            // filedToUpdate.is_text_answered = 1;
            // computationalFieldToUpdate.question_image = 'test.png';
            // await Question.updateQuestion(computationalFieldToUpdate, qid, db.mysql.write)
            computationalMatchArr.push(UtilityModule.generateResponseForComputationalQuestion(html, qid, cleanedOcr, locale));
            // matchesArray = [...computationalMatchObject, ...matchesArray];
        }
        return [computationalMatchArr, textSolutionData];
    } catch (error) {
        console.error('Error while computing question: ', error);
        return [[], []];
    }
}

async function handleOcrWhatsappVertical2(fileName, s3, translate2, config, iteration) {
    iteration.imageUrl = `${config.cdn_url}images/${fileName}`;
    const res = await callImagePreProcessService(iteration);
    if (!(res && res.data)) { return null; }
    return res.data;
}

async function handleOcrWhatsappVertical(fileName, s3, translate2, config) {
    // Total : 739658
    // without vertical : 681095
    // English: 643010
    // SELECT * FROM `questions` where doubt like '%WHA%' and locale in ('en', 'es', 'gl', 'ca', 'cy', 'it','gd', 'sv', 'da' , 'ro', 'fil', 'mt', 'pt-PT')
    // check difference between Utility.visionApi(url) and Utility.httpVisionApi(url): should be url and base64 image difference
    const promises = [];
    const url = `https://d10lpgp6xz60nq.cloudfront.net/images/${fileName}`;
    let handwritten = 0;
    promises.push(Utility.rotateImage(url, '90', s3));
    promises.push(Utility.rotateImage(url, '270', s3));
    const resolvedPromises = await Promise.all(promises);
    console.log('rotate90:', resolvedPromises[0]);
    console.log('rotate270:', resolvedPromises[1]);
    const promises1 = [];
    promises1.push(Utility.mathpixOcr2('', resolvedPromises[0], config));
    promises1.push(Utility.mathpixOcr2('', resolvedPromises[1], config));
    const resolvedPromises1 = await Promise.all(promises1);
    // let ocr = await ocrTextVertical(resolvedPromises1)
    // console.log('ocrr' , ocr)
    // return ocr
    let locale = 'en';
    if ((typeof resolvedPromises1[0].asciimath !== 'undefined')
        && (resolvedPromises1[0].asciimath.length > 0)) {
        if ((typeof resolvedPromises1[0] !== 'undefined')
            && (typeof resolvedPromises1[0].detection_map !== 'undefined')
            && (typeof resolvedPromises1[0].detection_map.is_printed
                !== 'undefined')
            && (resolvedPromises1[0].detection_map.is_printed < 0.8)) {
            console.log('handwritten');
            handwritten = 1;
        }
        const hindiStat = checkHindiInString(resolvedPromises1[0].asciimath);
        console.log('hindiStat :::', hindiStat);
        if (hindiStat == 'Hindi') { locale = 'hi'; }
        return {
            ocr: resolvedPromises1[0].asciimath,
            original_ocr: resolvedPromises1[0].asciimath,
            ocr_type: 0,
            handwritten,
            locale,
            raw_ocr: resolvedPromises1[0].asciimath,
        };
    } if ((typeof resolvedPromises1[1].asciimath !== 'undefined')
        && (resolvedPromises1[1].asciimath.length > 0)) {
        if ((typeof resolvedPromises1[1] !== 'undefined')
            && (typeof resolvedPromises1[1].detection_map !== 'undefined')
            && (typeof resolvedPromises1[1].detection_map.is_printed
                !== 'undefined')
            && (resolvedPromises1[1].detection_map.is_printed < 0.8)) {
            console.log('handwritten');
            handwritten = 1;
        }
        const hindiStat = checkHindiInString(resolvedPromises1[1].asciimath);
        console.log('hindiStat :::', hindiStat);
        if (hindiStat == 'Hindi') { locale = 'hi'; }
        return {
            ocr: resolvedPromises1[1].asciimath,
            original_ocr: resolvedPromises1[1].asciimath,
            ocr_type: 0,
            handwritten,
            locale,
            raw_ocr: resolvedPromises1[1].asciimath,
        };
    }
    // let ocr  = await callVision(url , translate2)
    // // console.log('--=====------>>' , ocr)
    // return ocr

    let question_image_base64 = await image2base64(url);
    question_image_base64 = question_image_base64.replace(
        /^data:([A-Za-z-+/]+);base64,/, '',
    );
    return callVision1(question_image_base64, translate2, config);
}

async function callVision1(image1, translate2, config) {
    const handwritten = 0; let ocr = ''; const ocr_type = 1; let
        locale = 'en';
    let original_ocr; let
        raw_ocr;
    let visionApiResp = await Utility.httpVisionApi(image1, config);
    visionApiResp = visionApiResp.responses;
    if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
        && visionApiResp[0].fullTextAnnotation !== null) {
        ocr = visionApiResp[0].textAnnotations[0].description;
        original_ocr = ocr;
        locale = visionApiResp[0].textAnnotations[0].locale;
    } else {
        ocr = '';
    }
    console.log('locale locale locale :::', locale);
    if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale
        !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale
        !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale
        !== 'mt' && locale !== 'pt-PT') {
        if (ocr !== '') {
            raw_ocr = ocr;
            const hindiStat = checkHindiInString(ocr);
            console.log('hindiStat :::', hindiStat);
            if (hindiStat == 'Hindi') { locale = 'hi'; }

            const transLateApiResp = await Utility.translateApi2(ocr, translate2);
            if (transLateApiResp.length > 0 && transLateApiResp[1].data
                !== undefined && transLateApiResp[1].data.translations
                !== undefined
                && transLateApiResp[1].data.translations[0].translatedText
                !== undefined) {
                ocr = transLateApiResp[1].data.translations[0].translatedText;
                return {
                    ocr,
                    ocr_type: 1,
                    original_ocr: ocr,
                    raw_ocr: ocr,
                    handwritten,
                    locale,
                    ocr_origin: 'img_gv_translate',
                };
            }
        } else {
            return {
                ocr,
                original_ocr,
                ocr_type: 1,
                handwritten,
                locale,
                ocr_origin: 'null_ocr',
            };
        }
    } else {
        return {
            ocr,
            original_ocr,
            ocr_type: 1,
            handwritten,
            locale,
            ocr_origin: 'img_google_vision',
        };
    }
}

async function callVision(url, translate2) {
    let ocr = ''; let
        locale = 'en';
    const visionApiResp = await Utility.visionApi(url);
    if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
        && visionApiResp[0].fullTextAnnotation !== null) {
        ocr = visionApiResp[0].textAnnotations[0].description;
        locale = visionApiResp[0].textAnnotations[0].locale;
    }
    if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale
        !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale
        !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale
        !== 'mt' && locale !== 'pt-PT') {
        if (ocr !== '') {
            const hindiStat = checkHindiInString(ocr);
            console.log('hindiStat :::', hindiStat);
            if (hindiStat == 'Hindi') { locale = 'hi'; }

            const transLateApiResp = await Utility.translateApi2(ocr, translate2);
            if (transLateApiResp.length > 0 && transLateApiResp[1].data
                !== undefined && transLateApiResp[1].data.translations
                !== undefined
                && transLateApiResp[1].data.translations[0].translatedText
                !== undefined) {
                ocr = transLateApiResp[1].data.translations[0].translatedText;
            }
        }
    }
    return {
        ocr, ocr_type: 0, handwritten: 0, locale,
    };
}

async function handleJimp(Jimp, question_image) {
    return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            const response = await Jimp.read(question_image);
            resolve(response);
        } catch (e) {
            resolve(false);
        }
    }));
}

function checkHindiInString(questionString) {
    const numberOfHindiCharacters = 128;
    const unicodeShift = 0x0900;
    const hindiAlphabet = [];
    for (let i = 0; i < numberOfHindiCharacters; i++) {
        hindiAlphabet.push(`\\u0${(unicodeShift + i).toString(16)}`);
    }

    const regex = new RegExp(`(?:^|\\s)[${hindiAlphabet.join('')}]+?(?:\\s|$)`,
        'g');
    let matchRes = '';
    matchRes = questionString.match(regex);

    console.log('matchRes :::', matchRes);

    if (matchRes == '' || matchRes == null || matchRes == undefined) {
        return 'No Hindi';
    }
    return 'Hindi';
}

async function handleOcrForWhatsapp(
    student_id, isAbTestingActive, image, host, locale, handwritten, fileName,
    translate2, config,
) {
    let promiseResolve; let
        promiseReject;
    const isAbEligible = Utility.isEligibleForAbTesting(student_id);
    console.log('isAbeligible', isAbEligible);

    try {
        // eslint-disable-next-line vars-on-top
        var promise = new Promise(((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        }));

        let latex;
        if (isAbEligible) {
            latex = await Utility.mathpixOcr3(host, fileName, config);
        } else {
            latex = await Utility.mathpixOcr2(host, fileName, config);
        }
        // check for handwritten
        let handwritten = 0; let ocr = ''; const
            ocr_type = 0;
        let original_ocr;
        if (typeof latex !== 'undefined'
            && (typeof latex.detection_map !== 'undefined')
            && (typeof latex.detection_map.is_printed !== 'undefined')
            && (latex.detection_map.is_printed < 0.8)) {
            console.log('handwritten');
            handwritten = 1;
        }

        // check if ocr2 is coming
        if ((typeof latex.asciimath !== 'undefined')
            && (latex.asciimath.length > 0)) {
            ocr = latex.asciimath;
            original_ocr = ocr;

            const hindiStat = checkHindiInString(ocr);
            console.log('hindiStat :::', hindiStat);
            if (hindiStat == 'Hindi') { locale = 'hi'; }

            promiseResolve({
                ocr: handleSpecialCharacterReplacement(ocr, student_id),
                ocr_type: 0,
                original_ocr: handleSpecialCharacterReplacement(original_ocr,
                    student_id),
                handwritten,
                locale,
                ocr_origin: 'img_mathpix',
            });
            return promise;
        }
        // do ocr1

        const image1 = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        let visionApiResp = await Utility.httpVisionApi(image1, config);

        visionApiResp = visionApiResp.responses;
        if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
            && visionApiResp[0].fullTextAnnotation !== null) {
            ocr = visionApiResp[0].textAnnotations[0].description;
            original_ocr = ocr;
            locale = visionApiResp[0].textAnnotations[0].locale;
        } else {
            ocr = '';
        }
        console.log('locale locale locale :::', locale);
        if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale
            !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd'
            && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale
            !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
            if (ocr !== '') {
                const hindiStat = checkHindiInString(ocr);
                console.log('hindiStat :::', hindiStat);
                if (hindiStat == 'Hindi') { locale = 'hi'; }

                const transLateApiResp = await Utility.translateApi2(ocr, translate2);
                if (transLateApiResp.length > 0 && transLateApiResp[1].data
                    !== undefined && transLateApiResp[1].data.translations
                    !== undefined
                    && transLateApiResp[1].data.translations[0].translatedText
                    !== undefined) {
                    ocr = transLateApiResp[1].data.translations[0].translatedText;
                    promiseResolve({
                        ocr: handleSpecialCharacterReplacement(ocr, student_id),
                        ocr_type: 0,
                        original_ocr: handleSpecialCharacterReplacement(ocr, student_id),
                        handwritten,
                        locale,
                        ocr_origin: 'img_gv_translate',
                    });
                    return promise;
                }
            } else {
                promiseResolve({
                    ocr: handleSpecialCharacterReplacement(ocr, student_id),
                    original_ocr: handleSpecialCharacterReplacement(original_ocr,
                        student_id),
                    ocr_type: 0,
                    handwritten,
                    locale,
                    ocr_origin: 'null_ocr',
                });
                return promise;
            }
        } else {
            promiseResolve({
                ocr: handleSpecialCharacterReplacement(ocr, student_id),
                original_ocr: handleSpecialCharacterReplacement(original_ocr,
                    student_id),
                ocr_type: 0,
                handwritten,
                locale,
                ocr_origin: 'img_google_vision',
            });
            return promise;
        }
    } catch (e) {
        console.log(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error(
            { tag: 'ask', source: 'handleOcr', error: errorLog },
        );

        promiseResolve({
            ocr: '', ocr_type: 0, handwritten: 0, locale,
        });
        return promise;
    }
}

async function handleOcr(
    student_id, isAbTestingActive, image, host, locale, handwritten, fileName,
    translate2, config,
) {
    let promiseResolve; let
        promiseReject;
    const isAbEligible = Utility.isEligibleForAbTesting(student_id);

    try {
        var promise = new Promise(((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        }));

        if (0) {
            // console.log('i am eligible');
            const latex = await Utility.mathpixOcr2(host, fileName, config);
            let handwritten = 0; let ocr = ''; let
                ocr_type = 0;
            // check for handwritten
            if ((typeof latex !== 'undefined')
                && (typeof latex.detection_map !== 'undefined')
                && (typeof latex.detection_map.is_printed !== 'undefined')
                && (latex.detection_map.is_printed < 0.8)) {
                console.log('handwritten');
                handwritten = 1;
            }

            // check if ocr2 is coming
            // if (0) {
            if ((typeof latex.asciimath !== 'undefined')
                && (latex.asciimath.length > 0)) {
                console.log('LATEX -----   >>>  >>>  >>>  ');
                ocr = latex.asciimath;
                const trimmed_ocr = Utility.optionRemovalFromMathPixOcr(ocr);
                ocr_type = 1;
                // console.log("ocr2 new")
                promiseResolve({
                    ocr,
                    ocr_type,
                    handwritten,
                    locale,
                });
                return promise;
            }
            console.log('GOOGLE VISION >>>>  >>>> >>>>  >>>> ');
            // let image1 = image.replace(/^data:([A-Za-z-+/]+);base64,/, "");
            let visionApiResp = await Utility.httpVisionApi(filename, config);
            visionApiResp = visionApiResp.responses;
            if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
                && visionApiResp[0].fullTextAnnotation !== null) {
                ocr = visionApiResp[0].textAnnotations[0].description;
                console.log('google ocr_above');
                console.log(ocr);
                console.log('ocr is the below google onwe');
                ocr = Utility.optionRemovalFromGoogleOcr(ocr);
                locale = visionApiResp[0].textAnnotations[0].locale;
                ocr_type = 2;
            } else {
                ocr = '';
            }
            if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale
                !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd'
                && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale
                !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
                if (ocr !== '') {
                    const transLateApiResp = await Utility.translateApi2(ocr, translate2);
                    if (transLateApiResp.length > 0 && transLateApiResp[1].data
                        !== undefined && transLateApiResp[1].data.translations
                        !== undefined
                        && transLateApiResp[1].data.translations[0].translatedText
                        !== undefined) {
                        ocr = transLateApiResp[1].data.translations[0].translatedText;
                        ocr_type = 2;
                        // console.log("translate")
                        promiseResolve({
                            ocr,
                            ocr_type,
                            handwritten,
                            locale,
                        });
                        return promise;
                    }
                    // console.log("translate")
                    ocr_type = 2;
                    promiseResolve({
                        ocr,
                        ocr_type,
                        handwritten,
                        locale,
                    });
                    return promise;
                }
                // console.log("no ocr from vision")
            } else if (ocr.length > 0) {
                promiseResolve({
                    ocr,
                    ocr_type,
                    handwritten,
                    locale,
                });
                return promise;
            }
            if (ocr.length === 0) {
                // do ocr2 old
                const latex1 = await Utility.mathpixOcrAscii(host, fileName, config);
                if ((typeof latex1.asciimath !== 'undefined')
                    && (latex1.asciimath.length > 0)) {
                    ocr = latex1.asciimath;
                    ocr_type = 3;
                    promiseResolve({
                        ocr,
                        ocr_type,
                        handwritten,
                        locale,
                    });
                    return promise;
                }
                ocr = '';
                promiseResolve({
                    ocr,
                    ocr_type,
                    handwritten,
                    locale,
                });
                return promise;
            }
        } else {
            let latex;
            if (isAbEligible) {
                latex = await Utility.mathpixOcr3(host, fileName, config);
            } else {
                latex = await Utility.mathpixOcr2(host, fileName, config);
            }
            // check for handwritten
            let handwritten = 0; let ocr = ''; const
                ocr_type = 0;
            let original_ocr;
            if (typeof latex !== 'undefined'
                && (typeof latex.detection_map !== 'undefined')
                && (typeof latex.detection_map.is_printed !== 'undefined')
                && (latex.detection_map.is_printed < 0.8)) {
                console.log('handwritten');
                handwritten = 1;
            }

            // check if ocr2 is coming
            if ((typeof latex.asciimath !== 'undefined')
                && (latex.asciimath.length > 0)) {
                console.log('ocr2');
                ocr = latex.asciimath;
                original_ocr = ocr;
                promiseResolve({
                    ocr: handleSpecialCharacterReplacement(ocr, student_id),
                    ocr_type: 0,
                    original_ocr: handleSpecialCharacterReplacement(original_ocr,
                        student_id),
                    handwritten,
                    locale,
                    ocr_origin: 'img_mathpix',
                });
                return promise;
            }
            // do ocr1

            const image1 = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
            let visionApiResp = await Utility.httpVisionApi(image1, config);

            visionApiResp = visionApiResp.responses;
            if (typeof visionApiResp[0].fullTextAnnotation !== 'undefined'
                && visionApiResp[0].fullTextAnnotation !== null) {
                ocr = visionApiResp[0].textAnnotations[0].description;
                original_ocr = ocr;
                locale = visionApiResp[0].textAnnotations[0].locale;
            } else {
                ocr = '';
            }

            if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale
                !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd'
                && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale
                !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
                if (ocr !== '') {
                    const transLateApiResp = await Utility.translateApi2(ocr, translate2);
                    if (transLateApiResp.length > 0 && transLateApiResp[1].data
                        !== undefined && transLateApiResp[1].data.translations
                        !== undefined
                        && transLateApiResp[1].data.translations[0].translatedText
                        !== undefined) {
                        ocr = transLateApiResp[1].data.translations[0].translatedText;
                        promiseResolve({
                            ocr: handleSpecialCharacterReplacement(ocr, student_id),
                            ocr_type: 0,
                            original_ocr: handleSpecialCharacterReplacement(ocr,
                                student_id),
                            handwritten,
                            locale,
                            ocr_origin: 'img_gv_translate',
                        });
                        return promise;
                    }
                } else {
                    promiseResolve({
                        ocr: handleSpecialCharacterReplacement(ocr, student_id),
                        original_ocr: handleSpecialCharacterReplacement(original_ocr,
                            student_id),
                        ocr_type: 0,
                        handwritten,
                        locale,
                        ocr_origin: 'null_ocr',
                    });
                    return promise;
                }
            } else {
                promiseResolve({
                    ocr: handleSpecialCharacterReplacement(ocr, student_id),
                    original_ocr: handleSpecialCharacterReplacement(original_ocr,
                        student_id),
                    ocr_type: 0,
                    handwritten,
                    locale,
                    ocr_origin: 'img_google_vision',
                });
                return promise;
            }
        }
    } catch (e) {
        console.log(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error(
            { tag: 'ask', source: 'handleOcr', error: errorLog },
        );

        promiseResolve({
            ocr: '', ocr_type: 0, handwritten: 0, locale,
        });
        return promise;
    }
}

function handleElasticSearch(ocr_data, elasticSearchInstance) {
    const elastic_indexes = Data.hetro_elastic_indexes;
    return elasticSearchInstance.findByOcrUsingIndex(ocr_data.ocr,
        elastic_indexes[ocr_data.ocr_type]);
}

function getMetaForTabs(elasticSearchInstance, index, qidArr) {
    return elasticSearchInstance.getMetaForQuestionIds(qidArr, index);
}

function handleElasticSearchForHomoIter(
    ocr_data, elasticSearchInstance, elastic_index, flag,
) {
    if (flag) {
        return elasticSearchInstance.findByOcrUsingIndex3(ocr_data.ocr,
            elastic_index, ocr_data.ocr_type);
    }
    return elasticSearchInstance.findByOcrUsingIndex2(ocr_data.ocr,
        elastic_index, ocr_data.ocr_type);
}

function handleElasticSearchPCM(
    ocr_data, elasticSearchInstance, elastic_index,
) {
    return elasticSearchInstance.findByOcrUsingIndexNew(ocr_data.ocr,
        elastic_index);
}

function handleElasticSearchNew(ocr_data, elasticSearchInstance, student_id, phrase_modify_flag) {
    const elastic_index = [
        'question_bank',
        'question_bank',
        'question_bank',
        'question_bank'];

    if (!_.isEmpty(phrase_modify_flag) || phrase_modify_flag) {
        if (student_id % 2 != 0) {
            return elasticSearchInstance.findByOcrUsingIndexNew2WithoutPhrase(ocr_data.ocr,
                elastic_index[ocr_data.ocr_type]);
        }
        return elasticSearchInstance.findByOcrUsingIndexNewWithoutPhrase(ocr_data.ocr,
            elastic_index[ocr_data.ocr_type]);
    } else {
        if (student_id % 2 == 0) {
            return elasticSearchInstance.findByOcrUsingIndexNew2(ocr_data.ocr,
                elastic_index[ocr_data.ocr_type]);
        }
        return elasticSearchInstance.findByOcrUsingIndexNew(ocr_data.ocr,
            elastic_index[ocr_data.ocr_type]);
    }
}

function handleElasticSearcWithTextSolutions(
    ocr_data, elasticSearchInstance, elastic_index,
) {
    return elasticSearchInstance.findByOcrUsingIndexNew(ocr_data.ocr,
        elastic_index);
}

function handleSpecialCharacterReplacement(ocr, student_id) {
    // console.log('handle')
    // console.log(student_id)
    // if(Math.abs(student_id % 2) == 1){
    //   ocr = Utility.replaceSpecialSymbol2(ocr)
    // }
    return ocr;
}

function callImagePreProcessService(iterations) {
    let image_service_url = Data.IMAGE_SERVICE_API_OCR;
    if (iterations.getMatches) {
        image_service_url = Data.IMAGE_SERVICE_API_MATCH;
    }
    const options = {
        method: 'POST',
        uri: image_service_url,
        body: iterations,
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 3500,
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
                    resolve({});
                } else {
                    console.log(err);
                    reject(err);
                }
            } else {
                resolve(body);
            }
        });
    }));
}

async function isSearchServiceEligibleToServe(db, config) {
    try {
        // ERRORS MAY ARISE DUE TO
        //  1. number of requests benchmark ( last minute | last 5 minutes avg) > max ( benchmarked )
        //  2. number of errors [ number of rejected payloads %] ( in case benchmark is wrong and big queries come)
        //  3. % resolved for second last minute is less ( maybe search service is timing out to 30s which it does sometimes), so if % resolved is dropped massively
        const searchServiceTripFlag = await QuestionRedis.getSearchServiceTripFlag(db.redis.read, 'is_search_service_too_busy');
        const successThreshold = 0.85;
        const failureThreshold = 0.05;
        const maxLimit = 3500;
        const SearchServiceCbData = Data.search_service_cb;
        const {
            mail: mailConfig,
        } = SearchServiceCbData;
        if (searchServiceTripFlag) {
            return false;
        } else {
            const requestFrameDetailsLastMinuteHash = moment().subtract(1, 'minutes').format('MM/DD/YYYY/HH/mm');
            let requests = await QuestionRedis.getSearchServiceRequestsMetrics(db.redis.read, requestFrameDetailsLastMinuteHash);
            let {
                requests_sent, requests_resolved, requests_rejected,
            } = requests;
            if (requests_sent > maxLimit) {
                QuestionRedis.setSearchServiceTripFlag(db.redis.write, 'is_search_service_too_busy', true, 5 * 60);
                MailUtility.sendMailViaSendGrid(config, mailConfig.sender_email, mailConfig.client_email, mailConfig.subject.rq_max_limit, mailConfig.body.rq_max_limit + requests_sent);
                return false;
            }
            if ((requests_resolved / requests_sent) < successThreshold) {
                QuestionRedis.setSearchServiceTripFlag(db.redis.write, 'is_search_service_too_busy', true, 5 * 60);
                MailUtility.sendMailViaSendGrid(config, mailConfig.sender_email, mailConfig.client_email, mailConfig.subject.rq_resolve_threshold, mailConfig.body.rq_resolve_threshold + parseFloat((requests_resolved / requests_sent) * 100).toFixed(2));
                return false;
            }
            // const requestFrameDetailsLast5MinuteHash = moment().subtract(5, 'minutes').format('MM/DD/YYYY/HH/mm');
            // requests = await QuestionRedis.getSearchServiceRequestsMetrics(db.redis.read, requestFrameDetailsLast5MinuteHash);
            // ({
            //     requests_sent, requests_resolved, requests_rejected
            // } = requests);
            // if ((requests_resolved/requests_sent) < successThreshold) {
            //     // SET SWITCH IN REDIS FOR NEXT 5 MINS %
            //     QuestionRedis.setSearchServiceTripFlag(db.redis.write, 'is_search_service_too_busy', true, 5 * 60);
            //     return false;
            // }
            // // SAME SOME CRITERION
            // if ((requests_rejected/requests_sent) > failureThreshold) {
            //     // SET SWITCH IN REDIS FOR NEXT 5 MINS %
            //     QuestionRedis.setSearchServiceTripFlag(db.redis.write, 'is_search_service_too_busy', true, 5 * 60);
            //     return false;
            // }
            return true;
        }
    } catch (e) {
        console.log(e);
        return true;
    }
}

async function callSearchServiceForv3(config, iterations, isStaging, db) {
    let trackRequestsMetricsCounter;
    if (db && !isStaging) {
        trackRequestsMetricsCounter = true;
    }

    if (trackRequestsMetricsCounter && !await isSearchServiceEligibleToServe(db, config)) {
        iterations.isSearchServiceTooBusy = true;
        iterations.suggestionCount = 20
    }
    const requestFrameDetailsHash = moment().format('MM/DD/YYYY/HH/mm');
    if (trackRequestsMetricsCounter) {
        QuestionRedis.incSearchServiceRequestsCount(db.redis.write, requestFrameDetailsHash, 1);
    }
    let uri;
    if (isStaging) { uri = `${Data.SEARCH_SERVICE_API_STAGING}${iterations.apiUrl}`; }
    else {
        uri = `${config.search_service_url}${iterations.apiUrl}`;
    }
    if (iterations && iterations.ocrType && [4, 8, 9, 11].includes(iterations.ocrType)) {
        iterations.ocrType = 0;
    }
    if (iterations && iterations.ocrType === 13) {
        iterations.ocrType = 7;
    }
    iterations.debug = true;
    const default_timeout = 5000;
    let timeout = (iterations && iterations.ssTimeout) || default_timeout;
    const options = {
        method: 'POST',
        uri,
        body: iterations,
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
        timeout,
        time: true,
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                if (trackRequestsMetricsCounter) {
                    QuestionRedis.incSearchServiceRejectedCount(db.redis.write, requestFrameDetailsHash, 1);
                }
                logger.error({ tag: 'ask', source: 'searchServiceError', error: iterations });
                resolve([{
                    searchError: true,
                }, 5000, err.code]);
            } else if (resp.statusCode >= 400 && resp.statusCode < 599) {
                if (trackRequestsMetricsCounter) {
                    QuestionRedis.incSearchServiceRejectedCount(db.redis.write, requestFrameDetailsHash, 1);
                }
                logger.error({ tag: 'ask', source: 'searchServiceError', error: `Response Code: ${resp.statusCode}. Response message: ${iterations}` });
                resolve([{
                    searchError: true,
                }, 0, resp.statusCode]);
            } else {
                if (trackRequestsMetricsCounter) {
                    QuestionRedis.incSearchServiceResolvedCount(db.redis.write, requestFrameDetailsHash, 1);
                }
                body.response_time = resp.elapsedTime;
                resolve(handleSearchServiceResponse(body));
            }
        });
    }));
}

async function attachConditionalDefaultVariantProperties(attachment, studentInfo, db) {
    const {
        country,
    } = await StudentHelper.getUserCountryAndCurrency(db, studentInfo.student_id);
    switch (country) {
        case 'AE':
            attachment.languageFilters = Data.languageFilters[country];
            break;
        default:
            break;
    }
}

function callViserDiagramMatcher(config, questionId, orientation, fileName, esClient, matchesCount = 1) {
    const options = {
        method: 'POST',
        uri: Data.VISER_DIAGRAM_MATCHER_API,
        body: {
            url: [`${config.cdn_url}images/${fileName}`],
            url_angle: [orientation],
            top: matchesCount,
            question_id: questionId,
        },
        json: true,
        headers: {
            Authorization: config.VISER_DIAGRAM_MATCHER_AUTH_KEY,
            'Content-Type': 'application/json',
        },
        timeout: 5000,
        time: true,
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                logger.error({ tag: 'ask', source: 'viserDiagramMatcherError', error: options });
                resolve([{
                    searchError: true,
                }, 5000, err.code]);
            } else {
                body.response_time = resp.elapsedTime;
                const key = 'url';
                resolve(handleViserSearchResponse(body, esClient, key));
            }
        });
    }));
}

function callViserSearch(config, iterations, questionId, esClient) {
    const options = {
        method: 'POST',
        uri: Data.VISER_SEARCH_API,
        body: {
            'OCR': iterations.ocrText,
            'question_id': questionId
        },
        json: true,
        headers: {
            'Authorization': config.VISER_SEARCH_AUTH_KEY,
            'Content-Type': 'application/json',
        },
        timeout: 5000,
        time: true
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                logger.error({ tag: 'ask', source: 'viserSearchError', error: iterations });
                resolve([{
                    searchError: true,
                }, 5000, err.code]);
            } else {
                body.response_time = resp.elapsedTime;
                resolve(handleViserSearchResponse(body, esClient));
            }
        })
    }))
}

function handleImage(
    base64Image, fs, question_id, config, s3, publicPath, blobService, variantAttachment, clientFileName = null,
) {
    return new Promise((async (resolve, reject) => {
        // Do async job
        try {
            let extension = '.png'; let
                content_type;
            if (base64Image.indexOf('png') !== -1) {
                extension = '.png';
                content_type = 'image/png';
            } else if (base64Image.indexOf('jpg') !== -1
                || base64Image.indexOf('jpeg') !== -1) {
                extension = '.jpg';
                content_type = 'image/jpg';
            }
            base64Image = base64Image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
            const promises = [];
            let fileName = `upload_${question_id}_${moment().unix()}${extension}`;
            if (clientFileName !== null) {
                fileName = clientFileName;
            }
            const buf = new Buffer(base64Image, 'base64');
            promises.push(
                fs.writeFileAsync(`${publicPath}/uploads/${fileName}`, base64Image,
                    'base64'),
            );
            // console.log(fs.statSync(`${publicPath}/uploads/${fileName}`));
            // promises.push(Utility.uploadImageToBlob(blobService, fileName, buf));
            promises.push(
                Utility.uploadTos3(s3, config.aws_bucket, fileName, buf, content_type),
            );
            await Promise.all(promises);

            if (!(variantAttachment && variantAttachment.isResizeImage)) {
                return resolve(fileName);
            }
            const transform = sharp(`${publicPath}/uploads/${fileName}`);
            transform
                .metadata()
                .then(async (metadata) => {
                    const measurements = Utility.getDestWidthAndHeight(metadata);
                    if (!measurements) {
                        return resolve(fileName);
                    }
                    const { destWidth, destHeight } = measurements;
                    transform
                        .resize(destWidth, destHeight)
                        .toBuffer()
                        .then(async (buf2) => {
                            const promises2 = [];
                            promises2.push(Utility.uploadTos3(s3, 'doubtnut-static/o-images', fileName, buf2, content_type));
                            await Promise.all(promises2);
                            return resolve(fileName);
                        })
                        .catch(async (err) => resolve(fileName));
                })
                .catch(async (err) => resolve(fileName));
        } catch (e) {
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'handleImage', error: errorLog });
            console.log(e);
            return reject(e);
            // return reject(false);
        }
    }));
}

function getResponseForQuestionId(arr, db) {
    const question_id = arr[0].split('.')[0];
    return QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
}

function sendSqsMessage(data) {
    // const {
    //     type,
    //     sqs,
    //     uuid,
    //     qid,
    //     studentId,
    //     studentClass,
    //     subject,
    //     chapter,
    //     version,
    //     ques,
    //     locale,
    //     questionImage,
    //     ocrText,
    //     ocrDone,
    //     originalOcrText,
    //     matchedQuestion,
    //     wrongImage,
    //     isTrial,
    //     difficulty,
    //     UtilityModule,
    //     questionInitSqsUrl,
    //     userQuestionSqsUrl,
    //     matchedQuestionSqsUrl,
    // } = data;
    // const questionSqsData = {};
    // questionSqsData.uuid = uuid;
    // questionSqsData.question_id = qid;
    // questionSqsData.student_id = studentId;
    // questionSqsData.class = studentClass;
    // questionSqsData.subject = subject;
    // questionSqsData.book = subject;
    // questionSqsData.chapter = chapter;
    // questionSqsData.question = version;
    // questionSqsData.doubt = ques;
    // questionSqsData.locale = locale;
    // questionSqsData.asked_at = UtilityModule.getCurrentTimeInIST();
    // const matchedQuestionSqsData = {};
    // switch (type) {
    //     case 'question-init':
    //         UtilityModule.sendMessage(sqs, questionInitSqsUrl, questionSqsData);
    //         break;
    //     case 'user-questions':
    //         questionSqsData.question_image = questionImage;
    //         questionSqsData.ocr_text = ocrText;
    //         questionSqsData.ocr_done = ocrDone;
    //         questionSqsData.original_ocr_text = originalOcrText;
    //         questionSqsData.matched_question = (typeof matchedQuestion !== 'undefined') ? matchedQuestion : null;
    //         questionSqsData.wrong_image = wrongImage;
    //         questionSqsData.is_trial = isTrial;
    //         questionSqsData.difficulty = difficulty;
    //         UtilityModule.sendMessage(sqs, userQuestionSqsUrl, questionSqsData);
    //         break;
    //     case 'matched-question':
    //         matchedQuestionSqsData.question_id = qid;
    //         matchedQuestionSqsData.matched_at = questionSqsData.asked_at;
    //         UtilityModule.sendMessage(sqs, matchedQuestionSqsUrl, matchedQuestionSqsData);
    //         break;
    //     default:
    //         break;
    // }
}

function sendSnsMessage(data) {
    let {
        questionInitSnsUrl,
        userQuestionSnsUrl,
        matchedQuestionSnsUrl,
        communityQuestionSnsUrl,
    } = data;
    const {
        type,
        sns,
        uuid,
        qid,
        studentId,
        studentClass,
        subject,
        chapter,
        version,
        ques,
        locale,
        questionImage,
        ocrText,
        ocrDone,
        originalOcrText,
        matchedQuestion,
        wrongImage,
        isTrial,
        difficulty,
        UtilityModule,
        config,
    } = data;
    const questionSnsData = {};
    questionSnsData.uuid = uuid;
    questionSnsData.question_id = qid;
    questionSnsData.student_id = studentId;
    questionSnsData.class = studentClass;
    questionSnsData.subject = subject;
    questionSnsData.book = subject;
    questionSnsData.chapter = chapter;
    questionSnsData.question = version;
    questionSnsData.doubt = ques;
    questionSnsData.locale = locale;
    questionSnsData.asked_at = UtilityModule.getCurrentTimeInIST();
    if (typeof config !== 'undefined' && config.env === 'development') {
        questionInitSnsUrl = Data.testQuestionInitSnsUrl;
        userQuestionSnsUrl = Data.testUserQuestionSnsUrl;
        matchedQuestionSnsUrl = Data.testMatchedQuestionSnsUrl;
        communityQuestionSnsUrl = Data.testCommunityQuestionSnsUrl;
    }
    const matchedQuestionSnsData = {};
    switch (type) {
        case 'question-init':
            // UtilityModule.logEntry(sns, questionInitSnsUrl, questionSnsData);
            break;
        case 'user-questions':
            questionSnsData.question_image = questionImage;
            questionSnsData.ocr_text = ocrText;
            questionSnsData.ocr_done = ocrDone;
            questionSnsData.original_ocr_text = originalOcrText;
            questionSnsData.matched_question = (typeof matchedQuestion !== 'undefined') ? matchedQuestion : null;
            questionSnsData.wrong_image = wrongImage;
            questionSnsData.is_trial = isTrial;
            questionSnsData.difficulty = difficulty;
            // UtilityModule.logEntry(sns, userQuestionSnsUrl, questionSnsData);
            break;
        case 'matched-question':
            matchedQuestionSnsData.question_id = qid;
            matchedQuestionSnsData.matched_at = questionSnsData.asked_at;
            // UtilityModule.logEntry(sns, matchedQuestionSnsUrl, matchedQuestionSnsData);
            break;
        case 'community-question':
            matchedQuestionSnsData.question_id = qid;
            matchedQuestionSnsData.asked_at = questionSnsData.asked_at;
            // UtilityModule.logEntry(sns, communityQuestionSnsUrl, matchedQuestionSnsData);
            break;
        default:
            break;
    }
}

async function getStudentIdFromUdid(db, udid) {
    let stu_id = await VideoContainer.getStudentId(udid, db);
    if (stu_id.length === 0) {
        stu_id = await VideoView.setStudentId(udid, db.mysql.write);
        stu_id = stu_id.insertId;
    } else {
        stu_id = stu_id[0].student_id;
    }
    return stu_id;
}

function callPreProcessServiceForMetaData(ocr_text) {
    const image_service_url = Data.PREPROCESS_SERVICE_API_META_DATA;
    const options = {
        method: 'POST',
        uri: image_service_url,
        body: {
            ocrText: ocr_text,
        },
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(body);
            }
        });
    }));
}

async function handleWolframAlpha(ocr, config) {
    let computeResponse = '';
    try {
        const computeResult = await callWolframAlpha(ocr, config);
        const checkResult = computeResult && computeResult.queryresult && computeResult.queryresult.success && Array.isArray(computeResult.queryresult.pods);
        if (checkResult) {
            computeResult.queryresult.pods.forEach((pod) => {
                if (['Results', 'Result', 'Solutions'].includes(pod.title) && Array.isArray(pod.subpods)) {
                    pod.subpods.forEach((subpod) => {
                        // subpod.title === 'Possible intermediate steps' &&
                        if (subpod.plaintext) {
                            computeResponse += subpod.plaintext;
                            computeResponse += '<br>';
                        }
                    });
                }
            });
        }
        return computeResponse;
    } catch (error) {
        console.error(`Error fetching wolfram solution: ${error}`);
        return '';
    }
}

function callWolframAlpha(ocr_text, config) {
    let ocr = getCleanedOcrText(ocr_text);
    ocr = getCleanedOcrText2(ocr);
    ocr = encodeURIComponent(ocr);
    const options = {
        uri: `http://api.wolframalpha.com/v2/query?appid=${config.WOLFRAM_KEY}&input=${ocr}&podstate=Step-by-step%20solution&format=plaintext&output=json`,
    };
    return new Promise((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(JSON.parse(body));
        });
    });
}

async function callYoutubeVideoApi(videoResult, key) {
    return new Promise((resolve, reject) => {
        let url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=${key}`;
        videoResult.items.forEach((item) => {
            url = url.concat(`&id=${item.id.videoId}`);
        });

        request.get(url, async (err, header, body) => {
            if (err) {
                resolve(null);
            } else {
                const response = JSON.parse(body);
                if (response && Array.isArray(response.items)) {
                    resolve(response.items);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function timeFormat(PTTime) {
    if (PTTime == 'P0D' || PTTime == 'PT0S') {
        return '00:00';
    }
    const time = PTTime.substring(2);
    const timeArray = time.split('M');
    let mins = 0;
    let secs = 0;
    if (Array.isArray(timeArray) && timeArray.length == 2) {
        mins = timeArray[0];
        secs = timeArray[1].substring(0, timeArray[1].length - 1);
    }
    return `${mins}:${secs}`;
}

async function getRetryRequestProgressResponse(db, config, elasticSearchTestInstance, UtilityModule, fuzz, locale, question_id, question_image, student_id) {
    try {
        const query = {};
        let stringDiffResp;
        const elasticIndex = 'question_bank';
        const language = UtilityModule.getLanguageByUserLocale(Data.languageObject, locale);
        if (question_id && typeof question_id !== 'undefined') {
            query.qid = question_id;
        } else if (!_.isEmpty(question_image) && !_.isEmpty(student_id)) {
            query.question_image = question_image;
            query.student_id = student_id;
        } else {
            // query
            return {};
        }
        let result = await QuestionRedis.getUserAskedQuestionData(db.redis.read, question_id, 'matches');
        if (!_.isNull(result)) {
            const matches_qid_arr = [];
            result = JSON.parse(result);
            for (let i = 0; i < result[0].qid_matches_array.length; i++) {
                matches_qid_arr.push(result[0].qid_matches_array[i]);
            }
            const esResults = await elasticSearchTestInstance.findDocumentsBulk(matches_qid_arr);
            const matches_array = esResults.docs.filter((el) => el.found == true).map((elem) => ({
                ...elem, _index: 'question_bank_v1', _source: { ...elem._source, thumbnail_language: 'english' }, partial_score: 100,
            }));
            stringDiffResp = UtilityModule.stringDiffImplementWithKey(matches_array, result[0].ocr, fuzz, 'ocr_text', language, true, student_id);
            const retry_obj = {
                question_id,
                status: 'success',
                retry_counter: 1,
            };
            QuestionAskRetryLogging.insertRetryData(db.mysql.write, retry_obj);
            return {
                retry_request_progress_level: 'qid_matches_array',
                retry_request_progress_data: {
                    matches_arr: matches_array,

                    ocr_data: {
                        ocr: result[0].ocr,
                        original_ocr: result[0].ocr,
                        raw_ocr: result[0].ocr,
                        ocr_type: result[0].ocr_type == 'img_mathpix' ? 0 : 1,
                        ocr_origin: result[0].ocr_type,
                        locale: result[0].locale,
                    },
                    extras: {
                        info: {
                            version: 'vt_retry_rm',
                            isIntegral: 0,
                            query_ocr_text: result[0].ocr,
                            elasticSSHost: config.elastic.ELASTIC_HOST,
                        },
                        isOnlyEquation: checkIfEquationExists(result[0].ocr),
                        cleanedOcr: getCleanedOcrText(result[0].ocr),
                        cymathString: getCymathString(result[0].ocr),
                        stringDiffResp,
                    },
                },
            };
        } else {
            const ocr_data = await QuestionRedis.getUserAskedQuestionData(db.redis.read, question_id, 'ocr');
            if (!_.isNull(ocr_data)) {
                const ocr_data_response = JSON.parse(ocr_data);
                // no search service as it second retry  - all matches are from node side
                // const matchesArray = await elasticSearchTestInstance.findByOcrUsingIndexNew(ocr_data_response.ocr, elasticIndex);
                const questionLocale = ocr_data_response['locale'];
                // const matchesArray = await elasticSearchTestInstance.getElasticMatchesByOcr(ocr_data_response.ocr, elasticIndex, UtilityModule.getFieldNameForTranslate(questionLocale));
                const matchesArray = await callViserSearch(config,{
                    ocrText: ocr_data_response.ocr
                } ,question_id, elasticSearchTestInstance).then(x=> x[0]);
                const response = _.get(matchesArray, 'hits.hits', 'notFound');
                if (response !== 'notFound') {
                    stringDiffResp = UtilityModule.stringDiffImplementWithKey(matchesArray.hits.hits, ocr_data_response.ocr, fuzz, 'ocr_text', language, true, student_id);
                    const retry_obj = {
                        question_id,
                        status: 'success',
                        retry_counter: 2,
                    };
                    QuestionAskRetryLogging.insertRetryData(db.mysql.write, retry_obj);
                    return {
                        retry_request_progress_level: 'ocr_text',
                        retry_request_progress_data: {
                            matches_arr: stringDiffResp[0],
                            ocr_data: ocr_data_response,
                            question_locale: questionLocale,
                            extras: {
                                info: {
                                    version: 'v_viser_search_retry',
                                    isIntegral: 0,
                                    elasticQuery: matchesArray.elasticRequest,
                                    query_ocr_text: ocr_data_response.ocr,
                                    elasticSSHost: config.elastic.ELASTIC_HOST,
                                },
                                isOnlyEquation: checkIfEquationExists(ocr_data_response.ocr),
                                cleanedOcr: getCleanedOcrText(ocr_data_response.ocr),
                                cymathString: getCymathString(ocr_data_response.ocr),
                                stringDiffResp,
                            },
                        },
                    };
                } else {
                    const retry_obj = {
                        question_id,
                        status: 'fail',
                        retry_counter: 3,
                    };
                    QuestionAskRetryLogging.insertRetryData(db.mysql.write, retry_obj);
                    return {};
                }
            } else {
                const retry_obj = {
                    question_id,
                    status: 'fail',
                    retry_counter: 3,
                };
                QuestionAskRetryLogging.insertRetryData(db.mysql.write, retry_obj);
                return {};
            }
        }
    } catch (e) {
        console.log(e);
        const retry_obj = {
            question_id,
            status: 'fatal',
            retry_counter: 4,
        };
        QuestionAskRetryLogging.insertRetryData(db.mysql.write, retry_obj);
        return {};
    }
}

async function callYoutubeApi(ocr, UtilityRedis, config, db) {
    return new Promise((resolve, reject) => {
        ocr = getCleanedOcrTextForYoutube(ocr);
        const url = 'https://www.googleapis.com/youtube/v3/search?';
        const qs = {
            part: 'snippet',
            type: 'video',
            key: config.YOUTUBE_API_KEY,
            safeSearch: 'strict',
            maxResults: 10,
            q: ocr,
        };
        request.get({ url, qs }, async (err, header, body) => {
            if (err) {
                UtilityRedis.setValue(db.redis.write, 'youtube_flag', '0');
                resolve(null);
            } else {
                const result = JSON.parse(body);
                const indexesToExclude = [];
                if (result && Array.isArray(result.items)) {
                    for (let index = 0; index < result.items.length; index++) {
                        const item = result.items[index];
                        if (Data.EXCLUDED_YOUTUBE_CHANNELS.includes(item.snippet.channelId)) {
                            indexesToExclude.push(index);
                        } else if (Data.EXCLUDED_YOUTUBE_USERS.includes(item.snippet.channelTitle)) {
                            indexesToExclude.push(index);
                        }
                    }
                    for (let index = indexesToExclude.length - 1; index >= 0; index--) {
                        const indexToExclude = indexesToExclude[index];
                        result.items.splice(indexToExclude, 1);
                    }
                    result.items.splice(0, 5);
                    const responses = await callYoutubeVideoApi(result, qs.key);
                    result.items.forEach((item) => {
                        responses.forEach((response) => {
                            if (item.id.videoId == response.id) {
                                item.snippet.duration = timeFormat(response.contentDetails.duration);
                            }
                        });
                    });
                    resolve(result.items);
                } else {
                    resolve(null);
                }
            }
        });
    });
}


function shouldStoreQuestionMatchResponseInRedis(retry_counter) {
    if (typeof retry_counter === 'undefined') {
        //if no retry counter param mentioned
        return true;
    } else if (retry_counter && retry_counter < 1) {
        // if retry mentioned but not already retried
        return true;
    }
    else {
        return false;
    }
}

async function getTopicBooster(db, sId, sClass, qId, qData, config, version_code, st_lang_code, limit) {
    const widgetType = 'TOPIC_BOOSTER';
    let data = [];
    const chapterAlias = await HomepageQuestionsMaster.getClassChapter(db.mysql.read, qId);
    if (chapterAlias.length && chapterAlias[0].master_chapter_alias != null && chapterAlias[0].master_chapter_alias !== undefined) {
        const chapterAliasVal = chapterAlias[0].master_chapter_alias;
        // data = await HomepageQuestionsMaster.getPersonalisedQuestionDataNew(db.mysql.read, widgetType, sId, sClass, qData[0].subject, chapterAliasVal);
        let promises = [];
        promises.push(HomepageQuestionsMasterContainer.getCachedTopicBoosterCategoryWiseData(db, config, widgetType, sClass, chapterAliasVal));
        promises.push(HomeWidgetSubmissions.getAllUserSubmissionByWidgetType(db.mysql.read, sId, widgetType));
        let resolvedPromises = await Promise.all(promises);
        data = Utility.getFilteredDataForUserPersonalisation(resolvedPromises[0], resolvedPromises[1]);
        data = _.shuffle(data).slice(0, 3);
        if (data.length) {
            data = Utility.getQandAHomeWidgetsFormatter(data);
            for (let i = 0; i < data.length; i++) {
                data[i].widget_type = widgetType;
                data[i].submit_url_endpoint = 'v7/homepage/submit-widget-question-answer';
                if (version_code >= 706 && version_code < 709) {
                    data[i].image_url = `${config.staticCDN}images/topic-booster.webp`;
                } else if (version_code >= 709 && st_lang_code === 'hi') {
                    data[i].image_url = `${config.staticCDN}images/topic-booster-new-hindi.png`;
                } else if (version_code >= 709) {
                    data[i].image_url = `${config.staticCDN}images/topic-booster-new-english.png`;
                }
            }
        }
    } else {
        const dataForMongo = await HomepageQuestionsMaster.getClassChapterDetails(db.mysql.read, qId);
        const topicData = {
            qid: qId,
            subject: dataForMongo[0].subject,
            qclass: dataForMongo[0].class,
            stuclass: sClass,
            chapter: dataForMongo[0].chapter,
        };
        const topicBoosterModel = new TopicBoosterModel(topicData);
        topicBoosterModel.save();
    }
    return data;
}

async function removeDuplicateTextSolutions(db, matchesArray, matchesQuestionArray) {
    const sameTextQues = await QuestionContainer.getSameTextQuestions(db, matchesQuestionArray);
    const requiredSameTextQues = [];
    const textSolutionsIndex = [];
    const textSolutionsId = [];
    const indicesToRemove = [];
    for (let index = 0; index < matchesArray.length; index++) {
        const match = matchesArray[index];
        const resource_type = _.get(match, 'resource_type', null);
        if (resource_type == 'text') {
            textSolutionsIndex.push(index);
            textSolutionsId.push(match._id);
        }
    }
    if (textSolutionsIndex.length > 1) {
        sameTextQues.forEach(element => {
            if (textSolutionsId.includes(String(element.qid_1)) && textSolutionsId.includes(String(element.qid_2))) {
                requiredSameTextQues.push(element);
            }
        });
        if (requiredSameTextQues.length) {
            for (let index = 0; index < textSolutionsId.length - 1; index++) {
                const qid1 = textSolutionsId[index];
                if (indicesToRemove.includes(index)) {
                    continue;
                }
                for (let j = index + 1; j < textSolutionsId.length; j++) {
                    const qid2 = textSolutionsId[j];
                    for (let k = 0; k < requiredSameTextQues.length; k++) {
                        const element = requiredSameTextQues[k];
                        if ((qid1 == element.qid_1 && qid2 == element.qid_2) || (qid1 == element.qid_2 && qid2 == element.qid_1)) {
                            indicesToRemove.push(j);
                            break;
                        }
                    }
                }
            }
            for (let index = indicesToRemove.length - 1; index >= 0; index--) {
                const i = textSolutionsIndex[indicesToRemove[index]];
                matchesArray.splice(i, 1);
            }
        }
    }
    return matchesArray;
}

function getUniqueSolution(solutionObj1, solutionObj2) {
    if (solutionObj1.solution._id < solutionObj2.solution._id) {
        return {unique: solutionObj2, duplicate: solutionObj1};
    }
    return {unique: solutionObj1, duplicate: solutionObj2};
}

async function detectDuplicateSolutions(matchesArray, matchesQuestionArray, groupedQid) {
    let duplicateQids = [];
    try {
        let uuidGroupedObj = {};
        const indicesToDiscard = [];
        for (let index = 0; index < matchesArray.length; index++) {
            const match = matchesArray[index];
            const uuid = _.get(match, '_source.duplicateTag', null)
            const videoLanguage = _.get(match, '_source.video_language', null)
            if (uuid && videoLanguage) {
                if (uuidGroupedObj[uuid]) {
                    if (uuidGroupedObj[uuid][videoLanguage]) {
                        const chosenSolution = getUniqueSolution(uuidGroupedObj[uuid][videoLanguage], {solution: match, index})
                        uuidGroupedObj[uuid][videoLanguage] = chosenSolution.unique;
                        indicesToDiscard.push(chosenSolution.duplicate.index);
                    } else {
                        uuidGroupedObj[uuid][videoLanguage] = {solution: match, index};
                    }
                } else {
                    uuidGroupedObj[uuid] = {};
                    uuidGroupedObj[uuid][videoLanguage] = {solution: match, index};
                }
            }
        }

        indicesToDiscard.sort(function(a, b){return a-b});
        for(let index = indicesToDiscard.length-1; index >= 0; index--) {
            const indexToDiscard = indicesToDiscard[index];
            duplicateQids.push(matchesQuestionArray[indexToDiscard]);
            matchesArray.splice(indexToDiscard, 1);
            matchesQuestionArray.splice(indexToDiscard, 1);
            groupedQid.splice(indexToDiscard, 1);
        }
    } catch (error) {
        console.error(`Error while handling duplicates - ${error}`);
    } finally {
        return [matchesArray, matchesQuestionArray, groupedQid, duplicateQids];
    }
}

/**
 * @description checks if language priorities are even applicable here
 * @param {Object} languagePriorityObj
 * @param {Object} userProfile
 * @returns {Boolean}
 */
function isLanguagePriorityApplicable (languagePriorityObj, userProfile) {
    const {
        userLocation,
        schoolBoard,
    } = userProfile;
    if (
        (languagePriorityObj.schoolBoards &&
         languagePriorityObj.schoolBoards.includes(schoolBoard))
            ||
        (languagePriorityObj.userLocation &&
        languagePriorityObj.userLocation.includes(userLocation))
    ) {
        return true;
    }
    return false;
}

function isIterationWiseSwappingViable(attachment, tagObj, p0, pointer0, p1, pointer1, tagMeta) {
    //  CASE : VIDEO V/S TEXT REORDER EXPERIMENT
    const validExactMatchLanguages = ['en', 'hi-en'];
    // TODO: REORDERING EXPERIMENT 2 ATTACHMENT REPLACE
    if (_.get(attachment, 'reorderTextVideoDuplicateSolutions', null)) {
        if (validExactMatchLanguages.indexOf(_.get(tagObj, `video.video_language[${pointer0}]`, null)) === -1) {
            if ((_.get(tagObj, 'video.video_language' , []).indexOf('hi-en') !== -1) || (_.get(tagObj, 'video.video_language' , []).indexOf('en') !== -1)) {
                return false;
            }
        }
        return true;
    }

    // CASE :  EXACT MATCH VIDEO (if not hi-en, en | replace by its feasible duplicate counterpart)
    // TODO: REORDERING EXPERIMENT 1 ATTACHMENT REPLACE
    if (_.get(attachment, 'reorderToDesiredVideoLocaleForExactMatch', null)) {
        const desiredVideoDuration = Math.max(_.get(tagMeta, 'hi-en.video_duration.max.val', 0), _.get(tagMeta, 'en.video_duration.max.val', 0));
        if (!desiredVideoDuration) {
            return false;
        }
        if (_.get(tagObj, `${p0}.duration[${pointer0}]`, 0) !== desiredVideoDuration) {
            return false;
        }
    }
    return true;
}

function swapMatchesInDuplicateMap({
        attachment,
        matchesArr,
        groupedQidsArr,
        groupedMeta,
    }, duplicatesMap, p0, p1, orderingKey, restrictedTagsForReordering, userQuestionsAnalysisLogging, reorderCheckKey) {
    const {
        duplicateTagMapData,
        duplicateTagMapMeta,
    } = duplicatesMap;
    for (let tag in duplicateTagMapData) {
        const tagMeta =  duplicateTagMapMeta[tag];
        if (_.isEmpty(restrictedTagsForReordering) || (!_.isEmpty(restrictedTagsForReordering) && restrictedTagsForReordering.includes(tag))) {
            tag = duplicateTagMapData[tag][orderingKey];
            const maxSwaps = 1;
            let swapsExecs = 0;
            let p0IndexPointer = 0;
            let p1IndexPointer = 0;
            while ( swapsExecs < maxSwaps && p0 in tag  && p0IndexPointer <= tag[p0].position.length && p1 in tag && p1IndexPointer <= tag[p1].position.length) {
                if (tag[p0].position[p0IndexPointer] > tag[p1].position[p1IndexPointer]) {
                    if (isIterationWiseSwappingViable(attachment, tag, p0, p0IndexPointer, p1, p1IndexPointer, tagMeta)) {
                        if(matchesArr) {
                            swapArray(matchesArr, tag[p0].position[p0IndexPointer], tag[p1].position[p1IndexPointer]);
                        }
                        if (groupedQidsArr) {
                            swapArray(groupedQidsArr, tag[p0].position[p0IndexPointer], tag[p1].position[p1IndexPointer]);
                        }
                        if (groupedMeta) {
                            swapArray(groupedMeta, tag[p0].position[p0IndexPointer], tag[p1].position[p1IndexPointer]);
                        }
                        p0IndexPointer +=1;
                        p1IndexPointer +=1;
                        swapsExecs += 1;
                        addSearchIterationSuccessLogsInElastic(userQuestionsAnalysisLogging, reorderCheckKey);
                    } else {
                        p0IndexPointer +=1;
                    }
                } else {
                    p1IndexPointer +=1;
                }
            }
        }
    }
}

/**
  * @description executes the swapping of match elements on weights via variant attachment
  * @param {Object{Object[]}} matchesMetaDataArray
  * @param {Object[]} weights
  * @param {Object{Object}} duplicatesMap
  * @returns {Object{Object[]}} matchesMetaDataArray
  */
 function reorderMatchesArrayToDesiredVideoLanguageForExactMatch ({
    matchesArray,
    attachment,
},
duplicateQuestionMapByTag,
)  {
const desiredVideoLanguages = ['en', 'hi-en'];
const _dMap = {
    duplicateTagMapData: getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, 'data'),
    duplicateTagMapMeta: getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, 'meta'),
}
if (desiredVideoLanguages.indexOf(_.get(matchesArray, '[0]._source.video_language', null)) === -1 && _.get(matchesArray, '[0]._source.duplicateTag', null)) {
    swapMatchesInDuplicateMap({
        attachment,
        matchesArr: matchesArray,
    }, _dMap, 'en', _.get(matchesArray, '[0]._source.video_language', null), 'video_languages', [matchesArray[0]._source.duplicateTag]);

    swapMatchesInDuplicateMap({
        attachment,
        matchesArr: matchesArray,
    }, _dMap, 'hi-en', _.get(matchesArray, '[0]._source.video_language', null), 'video_languages',[matchesArray[0]._source.duplicateTag]);
}
}

/**
 * @description executes the swapping of match elements on weights via variant attachment
 * @param {Object{Object[]}} matchesMetaDataArray
 * @param {Object[]} weights
 * @param {Object{Object}} duplicatesMap
 * @returns {Object{Object[]}} matchesMetaDataArray
 */
function reorderMatchesArrayByLanguageWeights ({
        matchesArr,
        groupedQidsArr,
        groupedMeta
    },
    weights,
    {
        duplicateTagMapData,
        duplicateTagMapMeta,
    },
    userQuestionsAnalysisLogging) {
    for (let weight of weights) {
        const [p0, p1] = weight.split('>');
        swapMatchesInDuplicateMap({
            matchesArr,
            groupedQidsArr,
            groupedMeta
        }, {
            duplicateTagMapData,
            duplicateTagMapMeta,
        }, p0, p1, 'video_languages', [matchesArr[0]._source.duplicateTag], userQuestionsAnalysisLogging, 'state_wise_language_reorder');
    }
}


/**
 * @description reorder matches array by statewise priorities
 * @param {Object{Object[]}} stringDiffResp
 * @param {Object} variantAttachment
 * @param {Object} userProfile
 * @param {Object} req
 * @returns {Object{Object[]}} stringDiffResp
 */
function stateWiseLanguageRelevanceDuplicatesReorder(stringDiffResp, attachment, userProfile, req, duplicateQuestionMapByTag, userQuestionsAnalysisLogging) {
    // TODO: REORDERING EXPERIMENT 4
    const matchesArr = stringDiffResp[0];
    const groupedQidsArr = stringDiffResp[1];
    const groupedMeta = stringDiffResp[2];
    try {
        const _dMap = {
            duplicateTagMapData: getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArr, 'data'),
            duplicateTagMapMeta: getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArr, 'meta'),
        }
        const { schoolBoard } = userProfile;
        const [userLocation, ip] = Utility.getStudentStateCode(req);
        const languagePriorityWeightsByRegions = attachment.languagePriorityWeightsByRegions;
        for (let i=0; i < languagePriorityWeightsByRegions.length; i++) {
            const languagePriorityObj = languagePriorityWeightsByRegions[i];
            if (isLanguagePriorityApplicable(languagePriorityObj, {
                userLocation,
                schoolBoard,
            })){
                reorderMatchesArrayByLanguageWeights({
                    matchesArr,
                    groupedQidsArr,
                    groupedMeta,
                },
                languagePriorityObj.weights,
                _dMap,
                userQuestionsAnalysisLogging,
                );
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        stringDiffResp[0] = matchesArr;
        stringDiffResp[1] = groupedQidsArr;
        stringDiffResp[2] = groupedMeta;
        return stringDiffResp;
    }
}

function checkIasValidity(questionText) {
    if (questionText && questionText.length > 20) {
        return false;
    }
    const questionTextArr = questionText.split(' ');
    for (let index = 0; index < questionTextArr.length; index++) {
        const element = questionTextArr[index];
        if (Data.iasKeyWords.includes(element)) {
            return true;
        }
    }
    return false;
}

async function getIasResults(questionText, studentClass, xAuthToken, config) {
    try {
        if (!checkIasValidity(questionText)) {
            return null;
        }
        const body = {
            "class": studentClass,
            "text": questionText,
            "is_voice_search": false
        };
        const options = {
            method: 'POST',
            uri: `${config.microUrl}/api/search/matches`,
            body,
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': xAuthToken
            },
            timeout: 3000,
        };
        return new Promise(((resolve, reject) => {
            request(options, (err, resp, payload) => {
                if (err) {
                    console.log(err);
                    logger.error({ tag: 'ask', source: 'iasError', error: payload });
                    resolve(null)
                } else if (resp.statusCode >= 400 && resp.statusCode < 599) {
                    logger.error({ tag: 'ask', source: 'iasError', error: `Response Code: ${resp.statusCode}. Response message: ${payload}` });
                    resolve(null);
                } else {
                    resolve(handleIASResponse(payload));
                }
            });
        }));
    } catch (error) {
        console.error(`Error while querying ias from ask-service: ${error}`);
        resolve(null);
    }
}
async function getSignedUrlFromAwsSdk(s3, myBucket, fileName, signedUrlExpireSeconds, content_type) {
    return new Promise((resolve, reject) => {
        s3.getSignedUrl('putObject', {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: 'public-read',
            ContentType: content_type,
        }, (err, url) => {
            if (err) reject(err)
            else resolve(url)
        });
    })
}

async function getSignedUrlFromAwsSdkWithAcl(s3, myBucket, fileName, signedUrlExpireSeconds, content_type, acl = 'public-read') {
    return new Promise((resolve, reject) => {
        s3.getSignedUrl('putObject', {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: acl,
            ContentType: content_type,
        }, (err, url) => {
            if (err) reject(err)
            else resolve(url)
        });
    })
}

async function getSimilarQuestionsByOcr(db, elasticSearchInstance, ocr, question_id, elasticIndex) {
    // let cachedSimilarResponse = await QuestionRedis.getSimilarSuggestions(db.redis.read, question_id);
    // if(!_.isNull(cachedSimilarResponse)){
    //     return JSON.parse(cachedSimilarResponse);
    // }else{
    const locale = Utility.checkHindiCharsSubstr(ocr) ? 'hi' : 'en';
    const searchFieldName = Utility.getFieldNameForTranslate(locale);
    let esResp = await elasticSearchInstance.getElasticMatchesForSimilarByOcr(ocr, elasticIndex, searchFieldName);
    // QuestionRedis.setSimilarSuggestions(db.redis.read, question_id, esResp);
    return esResp;
    // }
}


const getMatchesArrayReorderedByBoostingNumbers = (questionOcr, matchesArray, reorderType) => {
    const question_text_nums_arr = questionOcr.match(/\d+/g);
    if (_.isNull(question_text_nums_arr)) return matchesArray;
    function reorderExactMatches(arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            let ocr_text = '';
            if (_.has(arr[i], '_source.ocr_text')) {
                ocr_text = arr[i]._source.ocr_text;
            }
            let ocr_text_nums_arr = ocr_text.match(/\d+/g) || [];
            if (_.isEqual(ocr_text_nums_arr, question_text_nums_arr)) {
                arr.unshift(arr.splice(i, 1)[0]);
            }
        }
        return arr;
    }
    function reoderPartialMatches(arr) {
        for (let i = 0; i < arr.length; i++) {
            let ocr_text = '';
            if (_.has(arr[i], '_source.ocr_text')) {
                ocr_text = arr[i]._source.ocr_text;
            }
            let ocr_text_nums_arr = ocr_text.match(/\d+/g) || [];
            let similar_numbers = ocr_text_nums_arr.filter((e) => question_text_nums_arr.includes(e));
            let partial_number_similarity_score = Math.floor((similar_numbers.length / question_text_nums_arr.length) * 100);
            arr[i]['partial_number_similarity_score'] = partial_number_similarity_score;
        }
        return _.orderBy(arr, 'partial_number_similarity_score', 'desc');
    }
    return reorderType == 'exact' ? reorderExactMatches(matchesArray) : (reorderType == 'partial') ? reoderPartialMatches(matchesArray) : matchesArray;
}

async function storeInUserRecentlyWatched(db, studentId, questionWithAnswer) {
    const obj = {
        subject: questionWithAnswer.subject,
        chapter: questionWithAnswer.chapter,
    };
    StudentContainer.redisSetUserTenRecenltyWatched(db, studentId, obj);
}

function getComputationalOcrToUse(variantAttachment, cleanedOcr, equationOcrText, info) {
    if (variantAttachment && variantAttachment.getComputeQues5) {
        let ocrString = ''
        if (equationOcrText && Array.isArray(equationOcrText) && equationOcrText.length == 1) {
            ocrString = getCleanedOcrText(equationOcrText[0]);
            return getCleanedOcrText3(ocrString);
        } else if (info && info.query_ocr_text) {
            ocrString = getCleanedOcrText(info.query_ocr_text);
            return getCleanedOcrText3(ocrString);
        }
    }
    else if (variantAttachment && variantAttachment.getComputeQues4 && equationOcrText && Array.isArray(equationOcrText) && equationOcrText.length == 1) {
        return getCleanedOcrText(equationOcrText[0]);
    } else if (variantAttachment && variantAttachment.getComputeQues3 && info && info.query_ocr_text) {
        return getCleanedOcrText(info.query_ocr_text);
    }
    return cleanedOcr;
}

function ifSolutionLengthCheck(topMatchOcr, queryOcrText) {
    let isTopMatchLengthCheck = false;
    if (topMatchOcr && queryOcrText) {
        let topMatchOcrLength = topMatchOcr.length;
        const minLength = Math.min(topMatchOcrLength, queryOcrText.length);
        const maxLength = Math.max(topMatchOcrLength, queryOcrText.length);
        if (minLength >= 0.65 * maxLength) {
            isTopMatchLengthCheck = true;
        }
    }
    return isTopMatchLengthCheck;
}

function ifExactMatchLengthThresholdCompatible(topMatchOcr, queryOcrText) {
    // NOT ABLE TO FIGURE THIS OUT CURRENTLY SO LETS LEAVE IT NOW
    let isTopMatchLengthCheck = true;
    // if (topMatchOcr && queryOcrText) {
    //     let topMatchOcrLength = topMatchOcr.length;
    //     const minLength = Math.min(topMatchOcrLength, queryOcrText.length);
    //     const maxLength = Math.max(topMatchOcrLength, queryOcrText.length);
    //     if (minLength >= 0.6 * maxLength) {
    //         isTopMatchLengthCheck = true;
    //     }
    // }
    return isTopMatchLengthCheck;
}



function ifEquationLengthCheck(equationOcr, queryOcrText) {
    let equationLengthCheck = false;
    if (equationOcr && queryOcrText) {
        const minLength = Utility.calculateStringLengthWithoutSymbols(equationOcr);
        const maxLength = Utility.calculateStringLengthWithoutSymbols(queryOcrText);
        if (minLength >= 0.65 * maxLength) {
            equationLengthCheck = true;
        }
    }
    return equationLengthCheck;
}

function getIndexOfQuestionWithMaxDuration(matchesArray, exactMatchDuplicateTagMap, locale) {
    try {
        const topMatchDuplicateTag = _.get(matchesArray[0], '_source.duplicateTag', null);
        if (!topMatchDuplicateTag) {
            throw new Error("NO DUPLICATE TAG")
        }
        if (locale === 'hi') {
            // ignoring this for now
            throw new Error("NOT HANDLING HI LOCALE");
        } else {
            if (_.get(exactMatchDuplicateTagMap, `${topMatchDuplicateTag}.hi-en.video_duration.max.val`, 0) >  _.get(exactMatchDuplicateTagMap, `${topMatchDuplicateTag}.en.video_duration.max.val`, 0)) {
                return _.get(exactMatchDuplicateTagMap, `${topMatchDuplicateTag}.hi-en.video_duration.max.position`, 0);
            } else {
                return _.get(exactMatchDuplicateTagMap, `${topMatchDuplicateTag}.en.video_duration.max.position`, 0);
            }
        }
    } catch (e) {
        console.log(e);
        return 0;
    }
}

function reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, duplicateQuestionMapByTag, userQuestionsAnalysisLogging) {
    // TODO: REORDERING EXPERIMENT 5
    try {
        let duplicateTagMap = getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, 'meta');
        const indexWithMaxDuration = getIndexOfQuestionWithMaxDuration(matchesArray, duplicateTagMap);
        if (indexWithMaxDuration != 0) {
            // addSearchIterationSuccessLogsInElastic(userQuestionsAnalysisLogging, 'exact_match_duration_reorder');
            swapArray(matchesArray, 0, indexWithMaxDuration);
        }
        return matchesArray;
    } catch (e) {
        console.error(e);
        logger.error({ tag: 'ask', source: 'handle Exact match, swap top match with max duration video', error: e });
        return matchesArray;
    }
}

function handleExactMatch({
    db, matchesArray, newFieldToUpdate,
    qid, studentId, metadata, limit, isExactMatch, variantAttachment, duplicateQuestionMapByTag, userQuestionsAnalysisLogging, versionCode, matchesArrayReorderingAttachment,
}) {
    metadata = Utility.isExactMatchFlowHandledViaBackend(versionCode) ? true : false;
    limit = Utility.isExactMatchFlowHandledViaBackend(versionCode) ? 20 : 1;
    isExactMatch = true;
    if (matchesArrayReorderingAttachment && matchesArrayReorderingAttachment.reorderExactMatchDuplicateByMaxVideoDuration) {
        matchesArray = reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, duplicateQuestionMapByTag, userQuestionsAnalysisLogging);
    }
    matchesArray = matchesArray.slice(0, limit);
    const insertExactMatch = {
        question_id: qid,
        student_id: studentId,
    };
    if (_.get(matchesArray, '[0]._id', null)) {
        insertExactMatch.video_watched = matchesArray[0]._id;
        matchesArray[0]._score = 10.0;
        matchesArray[0].question_thumbnail = 'test';
        matchesArray[0].is_locked = 0;
        if (_.get(matchesArray, '[0]._source', null)) {
            matchesArray[0]._source.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
            matchesArray[0]._source.views = 10000;
            matchesArray[0]._source.bg_color = _.sample(Data.colors);
            matchesArray[0]._source.isLiked = true;
        }
    }
    newFieldToUpdate.exact_match_id = matchesArray[0]._id;
    userQuestionsAnalysisLogging.is_exact_match = isExactMatch
    Question.insertExactMatch(db.mysql.write, insertExactMatch);
    if (Utility.isExactMatchFlowHandledViaBackend(versionCode) && _.get(matchesArray, '[0]._source', null)) {
        matchesArray[0]._source.is_exact_match = true;
    }
    return [matchesArray, newFieldToUpdate, metadata, limit, isExactMatch];
}

function preProcessViserOcr(ocr_text) {
    let ocr = ocr_text.replace(/<br>/g, '');
    return ocr.replace(/\s\s+/g, ' ');
}

async function setDoubtQuestionTopic(xAuthToken, db, config, studentId, studentClass, locale, mobile, gcmId, versionCode, ocrText, questionId) {
    // const questionTopic = await Utility.getQuestionTopic(ocrText);
    const questionTopic = 'NONE';
    if (questionTopic && questionTopic !== 'NONE' && questionTopic !== '' && questionTopic !== 'DEFAULT') {
        await setQuestionTopic(xAuthToken, db, config, studentId, studentClass, locale, mobile, gcmId, versionCode, questionTopic, questionId);
    }
}

async function setQuestionTopic(xAuthToken, db, config, studentId, studentClass, locale, mobile, gcmId, versionCode, questionTopic, questionId) {
    try {
        let topicList = await mysqlTopicContainer.getTopicDetails(db.mysql.read, studentId, questionTopic);
        if (topicList.length > 0) {
            topicList = topicList[0];
            const questionIdList = `${questionId},${topicList.qid_list}`;
            //await mysqlTopicContainer.updateQuestionId(db.mysql.write, topicList.id, questionIdList);
        } else {
            const checkTopicDataAvalability = await DoubtFeedHelper.checkDoubtFeedAvailable(db, xAuthToken, questionTopic, studentId, studentClass, locale);
            if (checkTopicDataAvalability) {
                const obj = {
                    sid: studentId,
                    qid_list: questionId,
                    topic: questionTopic,
                };
                // await mysqlTopicContainer.setTopicDetails(db.mysql.write, obj);
                DoubtFeedHelper.DoubtFeedSms(xAuthToken, mobile, locale, questionTopic);
                DoubtFeedHelper.doubtfeedGenerateNotif(locale, questionTopic, studentId, gcmId, versionCode);
            }
        }
    } catch (e) {
        console.log(e);
        throw Error(e);
    }
}

function checkTopMatchExactness(params){
    // TODO: REORDERING EXPERIMENT 1
    try{
        const {
            checkExactMatch,
            matchesArray,
            clientSource,
            locale,
            info,
            fuzz,
            variantAttachment,
            versionCode,
            userQuestionsAnalysisLogging,
            duplicateQuestionMapByTag,
            matchesArrayReorderingAttachment,

        } = params;

        if(matchesArrayReorderingAttachment && matchesArrayReorderingAttachment.reorderToDesiredVideoLocaleForExactMatch) {
            reorderMatchesArrayToDesiredVideoLanguageForExactMatch({
                attachment: matchesArrayReorderingAttachment,
                matchesArray,
            },duplicateQuestionMapByTag);
        }

        const casesCommon = checkExactMatch
            && matchesArray[0]
            && (clientSource === 'app' || Utility.isExactMatchFlowHandledViaBackend(versionCode))
            && ifSolutionLengthCheck(_.get(matchesArray, '[0]._source.ocr_text', null), info.query_ocr_text);

        const caseEng = locale == 'en'
            && matchesArray[0].partial_score
            && matchesArray[0].partial_score >= 95
            && (matchesArray[0]._source.video_language == 'hi-en' || matchesArray[0]._source.video_language == 'en');
        const caseHi = locale == 'hi'
            && variantAttachment && variantAttachment.isHindiExactMatchCheck
            && matchesArray[0]._source.video_language == 'hi'
            && Utility.compareBystringDiff(fuzz, _.get(matchesArray, '[0]._source.ocr_text_hi', null), info.query_ocr_text) >= 95

        if(userQuestionsAnalysisLogging && matchesArray[0] && matchesArray[0].partial_score) {
            if (locale == 'hi') {
                userQuestionsAnalysisLogging.partial_score = Utility.compareBystringDiff(fuzz, _.get(matchesArray, '[0]._source.ocr_text_hi', null), info.query_ocr_text);
            } else {
                userQuestionsAnalysisLogging.partial_score = matchesArray[0].partial_score;
            }
            userQuestionsAnalysisLogging.exact_match_common_cases = !!casesCommon;
            userQuestionsAnalysisLogging.exact_match_english_cases = !!caseEng;
            userQuestionsAnalysisLogging.exact_match_hindi_cases = !!caseHi;
        }
        return casesCommon && (caseEng || caseHi);
    } catch (e) {
        console.log(e);
        return false;
    }
}

async function getEsUser2UserQuestionMatches(esClient, config, question_properties){
    try {
        const {
            ocr,
            user_locale,
            ques_locale: question_locale
        } = question_properties;
        const esResults = await esClient.getSimilarUserQuestions(config, ocr, user_locale, question_locale);
        if (!_.isEmpty(esResults.hits.hits)) {
            return esResults.hits.hits.map(x => x._source.matched_question_id).slice(0, 10);
        }
        return  [];
    } catch (e) {
        console.log(e);
        return [];
    }
}

async function handleBackPressMatches(data) {
    let backPressMatchQid = [];
    let backPressGroupQid = [];
    let backPressMatchArray = [];
    const bulkPrettyTextTemplate = {
        "_index": "question_bank_pretty_text",
        "_type": "repository"
    };
    try {
        const {
            db,
            elasticSearchLtrInstance,
            elasticSearchTestInstance,
            ocr,
            user_locale,
            ques_locale,
            config,
            backpressUserMatchesStrategyAttachment,
            fuzz,
        } = data;

        const matchedQids = await getEsUser2UserQuestionMatches(elasticSearchLtrInstance, config, {
            ocr, user_locale, ques_locale
        });
        if (matchedQids.length) {
            backPressMatchQid = [matchedQids[0]];
            const qidDetailsRequiringCodes = ['SD_PRECEDENCE', 'SD_THRESHOLD_SS_PRECEDENCE'];
            const sorting_type = backpressUserMatchesStrategyAttachment.sorting_type;
            const qidDetailsFetchPromises = [];
            if (qidDetailsRequiringCodes.includes(sorting_type)) {
                qidDetailsFetchPromises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, backPressMatchQid[0]));
            }
            switch (sorting_type) {
                case "SORT_BY_OCCURENCE":
                    backPressMatchQid = _.uniq(frequencySort(matchedQids));
                    break;
                case "SD_PRECEDENCE":
                    const post_sort_top_match = _.uniq(frequencySort(matchedQids))[0];
                    qidDetailsFetchPromises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, post_sort_top_match));
                    [ pre_sort_top_match_question_details, post_sort_top_match_question_details ] = await Promise.all(qidDetailsFetchPromises);
                    [ pre_sort_top_match_ocr, post_sort_top_match_ocr ] = [ pre_sort_top_match_question_details[0].ocr_text, post_sort_top_match_question_details[0].ocr_text ]
                    if (Utility.compareBystringDiff(fuzz, post_sort_top_match_ocr, ocr) > Utility.compareBystringDiff(fuzz, pre_sort_top_match_ocr, ocr)) {
                        backPressMatchQid = [ post_sort_top_match ];
                    }
                    break;
                case "SD_THRESHOLD_SS_PRECEDENCE":
                    [ pre_sort_top_match_question_details ] = await Promise.all([
                        ...qidDetailsFetchPromises
                    ]);
                    [ pre_sort_top_match_ocr ] = [ pre_sort_top_match_question_details[0].ocr_text ];
                    if (Utility.compareBystringDiff(fuzz, pre_sort_top_match_ocr, ocr) >= backpressUserMatchesStrategyAttachment.string_diff_threshold) {
                        backPressMatchQid = matchedQids;
                    } else {
                        backPressMatchQid = [];
                    }
                    break;
                default:
                    backPressMatchQid = matchedQids;
            }
            backPressMatchQid = _.uniq(backPressMatchQid);
            backPressGroupQid = backPressMatchQid.map(x=>({ "_id": x, ...bulkPrettyTextTemplate}));
            backPressMatchArray = backPressMatchQid.length ? await elasticSearchTestInstance.findDocumentsBulk(backPressMatchQid, config.question_bank_index).then((x) => x['docs']) : [];
        }
    }
    catch (e) {
        console.error(e);
    }
    finally {
        return {
            backPressMatchQid,
            backPressGroupQid,
            backPressMatchArray
        }
    }

}

async function updateVideoAndSubjectIcon(matchesArray, db, config, supportedMediaList, allTypeResourceVersion, versionCode, locale) {
    try{
        if (_.isEmpty(matchesArray)) {
            return matchesArray;
        }
        const videoResourcePromise = [];
        matchesArray = matchesArray.map((obj) => {
            if (versionCode >= allTypeResourceVersion) {
                videoResourcePromise.push(Answer_Container_v13.getAnswerVideoResource(db, config, obj.answer_id, obj._id, supportedMediaList));
            }
            if (!_.isEmpty(obj._source) && obj._source.is_answered == 1 && !_.isEmpty(obj.answer_video)) {
                const answer_video_name = obj.answer_video.split('.')[0];
                const answer_video_data_obj = {
                    video_url: `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`,
                    cdn_base_url: config.cdn_video_url,
                    fallback_url: `${config.cdn_video_url}${obj.answer_video}`,
                    hls_timeout: 0,
                };
                const new_match_obj = { ...obj, ...answer_video_data_obj };
                return new_match_obj;
            }
            return obj;
        });
        if (videoResourcePromise.length > 0) {
            const videoResourceResults = await Promise.all(videoResourcePromise);
            for (let i = 0; i < matchesArray.length; i++) {
                if (videoResourceResults[i] != undefined && videoResourceResults[i].length > 0 && videoResourceResults[i][0] != undefined) {
                    matchesArray[i].video_resource = videoResourceResults[i][0];
                }
            }
        }

        const subjectIconList = await Question.getIconLink(db.mysql.read);

        matchesArray = matchesArray.map((obj) => {
            if (!_.isEmpty(obj._source)) {
                if (obj._source.subject){
                    const subjectIcon = subjectIconList.filter((y) => y.subject_name == obj._source.subject.toLowerCase() || y.subject_name_hi == obj._source.subject.toLowerCase());
                    if (subjectIcon.length > 0) {
                        obj._source.subject_title = locale === 'hi' ? subjectIcon[0].subject_name_hi : subjectIcon[0].subject_name;
                        obj._source.subject_icon_link = subjectIcon[0].icon_link;
                    }
                }
                obj._source.ocr_text = Utility.getEscapedBackslashesString(obj._source);
            }
            return obj;
        });
    } catch(e){
        console.error(e)
    } finally{
        return matchesArray;
    }
}

/**
 * Returns matches array with desired partial score property if not present alraedy
 * @param {Object} question_properties
 * @param {string} question_properties.ocr_text
 * @param {string} question_properties.locale
 * @param {Object[]} matches_array
 * @param {string} matches_array.ocr_text
 * @param {string} matches_array.partial_score
 */
function assignMatchesObjectPartialScoreProperty(question_properties, matches_array) {
    try {
        const {
            ocr_text,
            locale
        } = question_properties

        for (let i=0; i < matches_array.length; i++) {
            if (!('partial_score' in matches_array[i])) {
                const match_ocr_text = locale == 'hi' ?  matches_array[i]._source.ocr_text_hi : matches_array[i]._source.ocr_text;
                matches_array[i].partial_score = fuzz.partial_ratio(ocr_text, match_ocr_text);
            }
        }
        return matches_array;
    } catch (e) {
        console.log(e);
        return matches_array
    }
}


/**
 * Returns the most compitable solutions in most suitable languages
 * @param {Object[]} matches_array
 * @param {string} OML_state  [ ocr_text, matches_array & video languages ] combination
 * @param {string[]} valid_video_languages
 */
function selectivelyFilterVideoLanguageArray(matches_array, OML_state, valid_video_languages) {
    try {
        let reinstate_invalid_video_locale = true;
        for (let i=0; i < matches_array.length; i++) {
            let match_element = matches_array[i];
            if (OML_state =='CASE A') {
                if (!valid_video_languages.includes(match_element._source.video_language)) {
                    matches_array.splice(i, 1);
                    i-=1;
                }
            }
            if (OML_state == 'CASE B') {
                if (
                        !valid_video_languages.includes(match_element._source.video_language)
                    ) {
                        if (reinstate_invalid_video_locale) {
                            reinstate_invalid_video_locale = false;
                        } else {
                            matches_array.splice(i, 1);
                            i-=1;
                        }
                }
            }
            if (OML_state == 'CASE C') {
                if (
                        !valid_video_languages.includes(match_element._source.video_language)
                    &&
                    // 85 - was decided ( keeping 90 for now  as 95 - 90 can be considered gray for now due to string diff scoring done by us)
                        match_element.partial_score < 85
                    ) {
                        matches_array.splice(i, 1);
                        i-=1;
                }
            }
        }
        return matches_array;
    } catch (e) {
        console.log(e);
        return matches_array;
    }
}


/**
 * Returns the state of the search results on the basis of user properties
 * @param {string} ocr_text
 * @param {string} question_locale
 * @param {Object[]} matches_array
 * @param {string} matches_array.ocr_text
 * @param {string} matches_array.video_language
 * @param {number} matches_array.partial_score
 * @param {string[]} valid_video_languages
 */
function getOcrAndMatchesStateClassification (ocr_text, question_locale, matches, valid_video_languages) {
    // CASE A - exact match ( valid lang )
    // CASE B - exact match ( invalid lang)
    // CASE C - only similar match
    let OMLState;
    matches = assignMatchesObjectPartialScoreProperty({
        ocr_text,
        locale: question_locale
    },matches);

    for (let i=0; i < matches.length; i++) {
        if (
                matches[i].partial_score >= 95
            &&
                ifExactMatchLengthThresholdCompatible(
                    question_locale == 'hi' ? matches[i]._source.ocr_text_hi : matches[i]._source.ocr_text,
                    ocr_text,
                )
            ) {
                if (valid_video_languages.includes(matches[i]._source.video_language)) {
                    OMLState = 'CASE A'
                    return OMLState;
                } else {
                    OMLState = 'CASE B'
                }
        }
    }
    if (!OMLState) {
        OMLState = 'CASE C'
    }
    return OMLState;
}

async function getLiveAndVipTabDetails(db, responseDataData, reqUser, reqHeaders) {
    try {
        const { student_id: studentId, locale } = reqUser;
        const freeUser = await StudentHelper.getstudentSubscriptionDetailsLikeV13(db, studentId);

        let flagVariantsArr = [];
        if (!_.isNull(reqHeaders.flagr_variation_ids) && !_.isEmpty(reqHeaders.flagr_variation_ids)) {
            flagVariantsArr = reqHeaders.flagr_variation_ids.split(',');
        }
        responseDataData.live_tab_data = {
            tab_text: Data.match_page_live_tab_text(locale).old,
        };
        if (flagVariantsArr.includes('1498')) {
            responseDataData.live_tab_data.tab_text = Data.match_page_live_tab_text(locale).new_1;
        } else if (flagVariantsArr.includes('1499')) {
            responseDataData.live_tab_data.tab_text = Data.match_page_live_tab_text(locale).new_2;
        } else if (flagVariantsArr.includes('1500')) {
            responseDataData.live_tab_data.tab_text = Data.match_page_live_tab_text(locale).new_3;
        }
        const liveTabBottomText = responseDataData.live_tab_data.tab_text;
        responseDataData.bottom_text_data = {
            VIP: {
                title: Data.check_all_courses.title(locale),
                deeplink: Data.check_all_courses.deeplink,
            },
            [liveTabBottomText]: {
                title: Data.check_all_live_classes.title(locale),
                deeplink: Data.check_all_live_classes.deeplink_paid,
            },
        };
        if (freeUser) {
            responseDataData.bottom_text_data[liveTabBottomText].deeplink = Data.check_all_courses.deeplink;
            if (flagVariantsArr.includes('1452') || flagVariantsArr.includes('1498') || flagVariantsArr.includes('1499') || flagVariantsArr.includes('1500')) {
                responseDataData.bottom_text_data[liveTabBottomText].title = Data.check_free_classes.title(locale);
                responseDataData.bottom_text_data[liveTabBottomText].deeplink = Data.check_free_classes.deeplink;
            }
        } else {
            if (flagVariantsArr.includes('1452') || flagVariantsArr.includes('1498') || flagVariantsArr.includes('1499') || flagVariantsArr.includes('1500')) {
                if (reqHeaders.version_code > 966) {
                    responseDataData.bottom_text_data[liveTabBottomText].title = Data.check_free_classes.title(locale);
                    responseDataData.bottom_text_data[liveTabBottomText].deeplink = Data.check_free_classes.deeplink_paid;
                } else {
                    delete responseDataData.bottom_text_data[liveTabBottomText];
                }
            }
        }
        return responseDataData;
    } catch (err) {
        return responseDataData;
    }
}

/*
* add unmatched questions to question bank elastic index after it's answer is made
* @param {String} index_name
* @param {Integer} cluster_id
* @param {string} collection
* @param {Integer} question_id
* @param {String} new_question_id
* @param {String} video_language
*/
async function addQuestionToElasticIndex(db, elasticSearchTestInstance, translate2, index_name, cluster_id, collection,question_id, new_question_id, video_language){
    function preprocessOcr(ocr) {
        ocr = ocr.replace(/`/g, '');
        ocr = ocr.replace(/<[^>]*>/g, '');
        ocr = ocr.replace(/\s+/g,' ');
        return ocr;
    }
    let is_added_to_elastic_index = 0;
    try{
        const questionDetails = await Question.getByQuestionId(new_question_id, db.mysql.read);
        if (questionDetails.length){
            const {subject, chapter, student_id} = questionDetails[0];
            let ocr_text = questionDetails[0].ocr_text;
            const locale = Data.unmatched_student_id_package_mapping[student_id] || 'en';
            const studentClass = questionDetails[0].class;
            const target_locale = locale === 'hi' ? 'en' : 'hi';
            const promises = [];
            promises.push(Question.getChapterAliasFromChapterName(db.mysql.read, chapter, studentClass, subject))
            promises.push(Utility.getTranslatedText(translate2, ocr_text, target_locale));
            const resp = await Promise.all(promises);
            const chapter_alias_details = resp[0];
            let index_obj = {
                is_answered: 1,
                is_text_answered: 0,
                subject,
                chapter,
                student_id,
                class: studentClass,
                video_language,
                package_language: locale,
            };

            ocr_text = preprocessOcr(ocr_text);
            if (resp.length){
                resp[1] = preprocessOcr(resp[1]);
            }
            index_obj.ocr_text = resp.length && locale === 'en' ?  ocr_text : resp[1];
            index_obj.ocr_text_hi = resp.length && locale === 'en' ? resp[1] : ocr_text;

            index_obj.chapter_alias = chapter_alias_details.length && chapter_alias_details[0].chapter_alias ? chapter_alias_details[0].chapter_alias : chapter;
            index_obj.hindi_chapter_alias = chapter_alias_details.length && chapter_alias_details[0].hindi_chapter_alias ? chapter_alias_details[0].hindi_chapter_alias : chapter;
            await elasticSearchTestInstance.addToElasticIndex(index_name, new_question_id, index_obj);
            is_added_to_elastic_index = 1;
        } else {
            db.mongo.write.collection(collection).update({
                "$and": [
                    { cluster_id: cluster_id.toString() },
                    { question_id: parseInt(question_id) }
                ]
            }, {
                $set: {
                    _not_updated_on_mysql: 1
                },
            });
        }
    } catch(e){
        console.error(e)
    } finally {
        db.mongo.write.collection(collection).update({
            "$and": [
                { cluster_id: cluster_id.toString() },
                { question_id: parseInt(question_id) }
            ]
        }, {
            $set: {
                is_added_to_elastic_index: is_added_to_elastic_index
            },
        });
    }
}

/**
 * checks if there is vernacular languages present in the ocr and if present then extract the ocr from vision api
 * @param {Object} viser_resp
 * @returns {boolean}
 */
function checkViserOcrValidity(viser_resp) {
    const {
        detectedLanguage,
        languagesPresentInOcr,
    } = Utility.checkQuestionOcrLanguages(viser_resp.asciimath);
    for (language in languagesPresentInOcr){
        if(!(viser_resp.viser_detect_locale.includes(language)) && languagesPresentInOcr[language]>0 && language !=='en') {
            return false;
        }
    }
    return true;
}

/**
 * extract equations from ocr text
 * @param {String} ocr_text
 * @param {Object} variantAttachment
 * @returns {Array}
 */
function extractEquationPortionFromOcrText(ocr_text, variantAttachment) {
    let ocr_equation_portions = [];
    if (variantAttachment.appendViserOcrEquationToVisionOcr) {
        let ocr_text_parts = ocr_text.split('"');
        if (ocr_text_parts.length <= 1) {
            ocr_text_parts = ocr_text.split('`');
        }
        for (let index = 0; index < ocr_text_parts.length; index++) {
            if (index % 2 == 1) {
                ocr_equation_portions.push(`"${ocr_text_parts[index]}"`);
            }
        }
    }
    return ocr_equation_portions;
}

async function performOrganicChemistryDiagramFlow (variantAttachment, config, ocrData, fileName, questionImage, host, translate2, userQuestionsAnalysisLogging) {
    try {
        const isChemistryDiagramPresent = await Utility.checkChemistryDiagramInImage(`${config.cdn_url}images/${fileName}`);
        userQuestionsAnalysisLogging.is_chemistry_diagram_present = isChemistryDiagramPresent;
        let isChemistryDiagramOcrValid = false;
        if (isChemistryDiagramPresent) {
            let diagramOcrResponse = await this.handleOrganicDiagramsOcr({
                image: questionImage, host, fileName, translate2, variantAttachment, config,
            });
            if (diagramOcrResponse.success) {
                variantAttachment = Data.askV10SmChemistryDiagramConfig.variantAttachment;
                isChemistryDiagramOcrValid = true;
                ocrData = diagramOcrResponse.data;
                variantAttachment.isSmilesOcr = true;
                variantAttachment.searchServiceMetaConfig.stringDiffStrategy = variantAttachment.smilesIterationStringDiffStrategy || 'chemistry_diagram_weighted';
                if (variantAttachment.useQuestionIntentBoostSmilesIteration) {
                    variantAttachment.searchServiceMetaConfig.useEnDictToExtractIntent = true;
                }
            }
        }
        return {
            ocrData,
            variantAttachment,
            userQuestionsAnalysisLogging,
            diagramOcrResponseSuccess: isChemistryDiagramOcrValid,
        };
    } catch (e) {
        console.error(e)
        return {
            ocrData,
            variantAttachment,
            userQuestionsAnalysisLogging,
            diagramOcrResponseSuccess: false,
        }
    }
}

/**
 * @name isImageTextViableToSearch
 * @description check if the ocr is vv less to be handled via diagram matcher directly
 * @param {Object} ocrData // contains ocr extracted from services details ( success | fail)
 * @param {Object} variantAttachment
 * @returns {Boolean}
 */
function isImageTextViableToSearch(ocrData, variantAttachment) {
    let isViable = true;
    try {
        if (ocrData.ocr.trim().length <= 3 && _.get(variantAttachment, 'useVisionOcr', true)) {
            isViable =  false;
        }
    } catch (e) {
        console.log(e);
    } finally {
        return isViable;
    }
}

// function doesThumbnailExist(image_url) {
//     try {
//         return new Promise((resolve, reject) => {
//             axios.head(image_url).then((res)=>{
//                 if (res.status == 200) {
//                     resolve(true);
//                 } else {
//                     resolve(false);
//                 }
//             }).catch((e)=>{
//                 resolve(false);
//             })

//         });
//     } catch (e) {
//         return false;
//     }
// }

async function sendUserNotifPostQA(config, matchesArray, studentId, gcmId) {
    try {
        const nd = Data.post_qa_notif;
        let image;
        let question_id;
        const minIndex = 3;
        const maxIndex = 10;
        const pointer = Math.floor(Math.random() * (maxIndex - minIndex) + minIndex);
        const question = matchesArray[pointer];
        image = `${config.cdn_url}question-thumbnail/en_${question._id}.webp`;
        question_id = question._id;
        const notificationData = {
            event: 'video',
            title: nd.title,
            message: nd.message,
            image,
            firebase_eventtag: nd.tag,
            s_n_id: nd.tag,
            path: 'wait',
            data: {
                deeplink: `doubtnutapp://video?qid=${question_id}&page=POST_QA_NOTIFICATION`,
            },
        };
        Utility.sendFcm(studentId, gcmId, notificationData);
    } catch (e) {
        console.log(e);
    }
}

async function handleCacheMasterIterationData(db, fuzz, elasticSearchInstance, ocr, questionId, indexOfIterationsToDisplay, iterations, masterIterationCacheMongoCollection, indexName) {
    function getStringDiffResponseObj(response, mongoResponseLangFilter, matched_obj) {
        try {
            for ( let i = 0; i < response.length; i++) {
                let stringDiffResp = [];
                let query_ocr_text = '';
                if(!_.isEmpty(response[i])){
                    stringDiffResp = Utility.stringDiffImplementWithKey(response[i].docs, ocr, fuzz, 'ocr_text', 'en', true);
                    query_ocr_text = mongoResponseLangFilter[iterations[indexOfIterationsToDisplay[i]].key].query_ocr_text;
                }
                matched_obj.push({
                    stringDiffResp,
                    info: {
                        query_ocr_text,
                    }
                })
            }
        } catch(e) {
            console.error(e)
        }
    }
    let master_obj = [];
    let is_question_viewed = false;
    try {
        let matched_obj = [];
        const mongoResponse = await db.mongo.read.collection(masterIterationCacheMongoCollection).find({ question_id: parseInt(questionId)}).toArray();
        if (mongoResponse.length>0) {
            const mongoGlobalMatchesResponse = mongoResponse[0].locale_wise_matches;
            is_question_viewed = mongoResponse[0].is_question_viewed;
            let promises = [];
            for (let language in mongoGlobalMatchesResponse) {
                const mongoResponseLangFilter = mongoGlobalMatchesResponse[language];
                for (let i = 0; i < indexOfIterationsToDisplay.length; i++) {
                    if(_.get(mongoResponseLangFilter, iterations[indexOfIterationsToDisplay[i]].key, 0) && mongoResponseLangFilter[iterations[indexOfIterationsToDisplay[i]].key].matches.length > 0) {
                        promises.push(elasticSearchInstance.getByIds(indexName, mongoResponseLangFilter[iterations[indexOfIterationsToDisplay[i]].key].matches));
                    } else {
                        promises.push([]);
                    }
                }
                const response = await Promise.all(promises);
                getStringDiffResponseObj(response, mongoResponseLangFilter, matched_obj);
                master_obj.push({
                    [language]: matched_obj
                })
                matched_obj = []
                promises = [];
            }
        }

        return {
            master_obj,
            is_question_viewed
        };

    } catch(e) {
        console.error(e);
        return {
            master_obj,
            is_question_viewed
        };
    }
}

async function handleUncachedMasterIterationData(req, videoLanguageFilters, ocrDataResponse, keyArray, iter, indexOfIterationsToDisplay) {
    let master_obj = [];
    try {
        const master_obj = [];
        const {fileName, appLocale, languagePersonificationAttachment, schoolBoard, questionLocale, language,} = req.body;
        const studentClass = req.body.class;
        const db = req.app.get('db');
        let {ocrText, ocrType, locale} = req.body;
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesis');
        const translate2 = req.app.get('translate2');
        const config = req.app.get('config');
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const stockWordList = [];

        for (let j = 0; j < videoLanguageFilters.length; j++) {
            const videoLanguageFilter = videoLanguageFilters[j];
            let promises = []
            for (let i = 0; i < ocrDataResponse.length; i++) {
                ocrText = ocrDataResponse[i].ocr;
                ocrType = ocrDataResponse[i].ocr_type;
                locale = ocrDataResponse[i].locale;
                keyArray.push(iter[indexOfIterationsToDisplay[i]].key);
                iter[indexOfIterationsToDisplay[i]].attachment.ocrText = ocrText;
                iter[indexOfIterationsToDisplay[i]].attachment.ocrType = ocrType;
                Utility.addLanguageFiltersToAttachment(iter[indexOfIterationsToDisplay[i]].attachment, videoLanguageFilter);
                let searchFieldName;
                if (iter[indexOfIterationsToDisplay[i]].attachment.queryConfig && iter[indexOfIterationsToDisplay[i]].attachment.queryConfig.searchFieldName) {
                    searchFieldName = iter[indexOfIterationsToDisplay[i]].attachment.queryConfig.searchFieldName;
                }
                iter[indexOfIterationsToDisplay[i]].attachment.questionLocale = locale;
                promises.push(handleElasticSearchWrapper({
                    ocr: ocrText,
                    elasticSearchInstance,
                    elasticSearchTestInstance,
                    kinesisClient,
                    elasticIndex: indexName,
                    fileName,
                    stockWordList,
                    useStringDiff: true,
                    language,
                    locale,
                    fuzz,
                    UtilityModule: Utility,
                    studentId: '0',
                    studentClass,
                    ocrType,
                    db,
                    QuestionContainer,
                    translate2,
                    variantAttachment: iter[indexOfIterationsToDisplay[i]].attachment,
                    isStaging: true,
                    useComposerApi: iter[indexOfIterationsToDisplay[i]].attachment.useComposerApi,
                    searchFieldName,
                    questionLocale: locale,
                    languagePersonificationAttachment,
                    userProfile: {
                        appLocale,
                        schoolBoard,
                        questionLocale,
                    },
                    req,
                }, config));
            }

            const resolvedPromises = await Promise.all(promises);
            master_obj.push({
                [videoLanguageFilter]: resolvedPromises
            });
        }
        return master_obj;
    } catch (e) {
        console.error(e)
        return master_obj;
    }
}

async function getLocalisedQuestionMgetForPanel(db, elasticSearchInstance, language, next, masterIterationCacheQidArray) {
    let localisedQuestionMgetResolvedResponse = [];
    try {
        for (let locale = 0; locale < masterIterationCacheQidArray.length; locale++) {
            const resolvedPromises = masterIterationCacheQidArray[locale][Object.keys(masterIterationCacheQidArray[locale])[0]];
            let localisedQuestionMgetPromises = []
            if (resolvedPromises) {
                for (let i = 0; i < resolvedPromises.length; i++) {
                    const matchesArray = resolvedPromises[i].stringDiffResp[0];
                    const groupedQid = resolvedPromises[i].stringDiffResp[2];

                    if (matchesArray) {
                        localisedQuestionMgetPromises.push(QuestionContainer.getLocalisedQuestionMget(db, matchesArray, null, language, next, groupedQid, elasticSearchInstance));
                    } else {
                        localisedQuestionMgetPromises.push([]);
                    }
                }
            }
            const response = await Promise.all(localisedQuestionMgetPromises);
            localisedQuestionMgetResolvedResponse.push({
                [Object.keys(masterIterationCacheQidArray[locale])[0]]: {...response}
            })
        }
        return localisedQuestionMgetResolvedResponse;
    } catch (e) {
        console.error(e);
        return localisedQuestionMgetResolvedResponse;
    }
}

async function generateMasterIterationResponse(db, questionId, masterIterationCacheQidArray, localisedQuestionMgetResolvedResponse, keyArray, iter, indexOfIterationsToDisplay, isQuestionViewed, masterIterationDataCollection, showViserSearch) {
    async function getViewedQuestionExactMatches() {
        const mongoResponse = await db.mongo.read.collection(masterIterationDataCollection).find({"question_id": questionId.toString()}).toArray();
        const exactMatchQidData = mongoResponse.length ? mongoResponse[0].exact_match : {};
        return exactMatchQidData;
    }
    try {
        const data = []
        let exactMatchQids;
        if (isQuestionViewed) {
            exactMatchQids = await getViewedQuestionExactMatches();
        }
        for (let locale = 0; locale < masterIterationCacheQidArray.length; locale++) {
            let masterIterationData = {
                matches: [],
                query_ocr_text: '',
            };
            const masterIterationQidArray = {};
            const resolvedPromises = masterIterationCacheQidArray[locale][Object.keys(masterIterationCacheQidArray[locale])[0]];
            const questionMgetResponse = localisedQuestionMgetResolvedResponse[locale][Object.keys(localisedQuestionMgetResolvedResponse[locale])[0]];
            if (showViserSearch) {
                let viserSearchIterIndex;
                for (let i =0;i<indexOfIterationsToDisplay.length;i++) {
                    if (iter[indexOfIterationsToDisplay[i]].key === 'v_viser_search') {
                        viserSearchIterIndex = i;
                        break;
                    }
                }
                const values = {};
                values.matches = questionMgetResponse[viserSearchIterIndex];
                values.query_ocr_text = resolvedPromises[viserSearchIterIndex].info.query_ocr_text;
                data.push({
                    'v_viser_search': values
                })
                return data;
            }
            if (!showViserSearch && resolvedPromises) {
                for (let i = 0; i < resolvedPromises.length; i++) {
                    const values = {};
                    const obj = {};
                    const ocr_text = iter[indexOfIterationsToDisplay[i]].attachment.ocrText;
                    values.matches = questionMgetResponse[i];
                    values.query_ocr_text = resolvedPromises[i].info.query_ocr_text;
                    if (values.matches) {
                        values.matches.forEach((element) => {
                            element.language = element._source.video_language;
                        });
                    }
                    obj[keyArray[i]] = values;

                    Utility.generateMasterIterationData(keyArray[i], masterIterationData, questionMgetResponse[i], masterIterationQidArray, values.query_ocr_text);
                    masterIterationData.matches = assignMatchesObjectPartialScoreProperty({ocr_text,}, masterIterationData.matches);
                    masterIterationData.matches = _.orderBy(masterIterationData.matches, ['partial_score'], ['desc']);
                }
                if (isQuestionViewed) {
                    const exactMatchQidArray = exactMatchQids[Object.keys(masterIterationCacheQidArray[locale])[0]]
                    if (exactMatchQidArray) {
                        for (let i = 0; i < masterIterationData.matches.length; i++) {
                            if (masterIterationData.matches[i] && masterIterationData.matches[i]._source && exactMatchQidArray.includes(masterIterationData.matches[i]._id)) {
                                masterIterationData.matches[i]._source.is_exact_match = true;
                            }
                        }
                    }
                }
                data.push({
                    [Object.keys(masterIterationCacheQidArray[locale])[0]]: masterIterationData
                })
            }
        }
        return data;
    } catch (e) {
        console.error(e)
        return []
    }
}

function updateHandwrittenIsSkippedValue(is_skipped, column_value) {
    const is_diagram_present = is_skipped === 11;
    is_skipped = is_diagram_present ? 12 : column_value;
    return is_skipped;
}

async function replaceValidOcrTextsInMatches(db, matches) {
    try {
        const matched_qids = matches.map((x=>x._id));
        const response = await QuestionMysql.getQuestionsWithTextSolutionsV2(db.mysql.read, matched_qids);
        for (let i =0 ;i<response.length ;i ++) {
            const qidIndex = matched_qids.indexOf(response[i].question_id.toString());;
            matches[qidIndex]._source.question_text = response[i].ocr_text;
            matches[qidIndex]._source.opt_1 = _.isNull(response[i].opt_1) ? '' : response[i].opt_1;
            matches[qidIndex]._source.opt_2 = _.isNull(response[i].opt_2) ? '' : response[i].opt_2;
            matches[qidIndex]._source.opt_3 = _.isNull(response[i].opt_3) ? '' : response[i].opt_3;
            matches[qidIndex]._source.opt_4 = _.isNull(response[i].opt_4) ? '' : response[i].opt_4;
        }
        return matches;
    } catch (e) {
        console.error(e);
        return matches;
    }

}

async function updateQueryMongo(db, collectionName, findQuery, updateQuery) {
    db.mongo.write.collection(collectionName).updateOne(findQuery,updateQuery);
}

async function updateActionForDuplicateQuestionTagging(db, collectionName, isSkipped, duplicateQuestionIds, questionId) {
    let action = 'match';
    if (isSkipped) {
        action = 'skip';
    } else if (duplicateQuestionIds.length === 1 && duplicateQuestionIds[0].toString() === questionId.toString()) {
        action = 'no_match';
    }
    QuestionHelper.updateQueryMongo(db, collectionName, { question_id: questionId.toString() }, {
        $set: {
            updated_at: moment().format(),
            action,
        }
    });
}

async function getVideoLanguageMapping(db, qids) {
    try {
        const videoLanguageObj = {};
        const mysqlResponse = await QuestionMysql.getVideoPackageLanguage(db.mysql.read, qids);
        for (let i = 0; i < mysqlResponse.length; i++) {
            if (videoLanguageObj[mysqlResponse[i].video_language]) {
                videoLanguageObj[mysqlResponse[i].video_language].push(mysqlResponse[i].question_id);
            } else {
                videoLanguageObj[mysqlResponse[i].video_language] = [mysqlResponse[i].question_id];
            }
        }

        return videoLanguageObj;
    } catch (e) {
        console.error(e);
    }
}

async function updateQueryMongo(db, collectionName, findQuery, updateQuery) {
    db.mongo.write.collection(collectionName).updateOne(findQuery,updateQuery);
}

async function updateActionForDuplicateQuestionTagging(db, collectionName, isSkipped, duplicateQuestionIds, questionId) {
    let action = 'match';
    if (isSkipped) {
        action = 'skip';
    } else if (duplicateQuestionIds.length === 1 && duplicateQuestionIds[0].toString() === questionId.toString()) {
        action = 'no_match';
    }
    updateQueryMongo(db, collectionName, { question_id: questionId.toString() }, {
        $set: {
            updated_at: moment().format(),
            action,
        }
    });
}

async function updateTextSolutionForDuplicates(db, qids) {
    try {
        const response = await QuestionMysql.getQuestionsWithTextSolutions(db.mysql.read, qids);
        let solutionObj = {}; let qidsWithSolutionPresent = []; const promises = []; let qidsSolutionToBeUpdated = [];
        for(let i=0;i<qids.length;i++) {
            if (!_.isEmpty(response[i].solutions) && response[i].solutions !== 'N/A') {
                solutionObj = response[i];
            } else if ((_.isEmpty(response[i].solutions) || response[i].solutions === 'N/A') && !_.isEmpty(response[i].text_question_id)){
                promises.push(QuestionMysql.updateDuplicateQidsTextSolutions.bind(null, db.mysql.write, qids[i]));
            } else {
                promises.push(QuestionMysql.insertDuplicateQidsTextSolutions.bind(null, db.mysql.write, qids[i]))
            }
        }
        delete solutionObj.question_id;
        delete solutionObj.ocr_text;
        delete solutionObj.text_question_id;
        const m = await Promise.all(promises.map((cb) => cb(solutionObj)));
    } catch (e) {
        console.error(e)
    }
}

function attachRequestBodyForDuplicateQuestions(req, config, data, package_language, questionId) {
    req.body = {
        ocrText: _.get(data, '[0]._source.ocr_text', ''),
        displayOcrText: _.get(data, '[0]._source.question_text', ''),
        packageLanguage: package_language,
        requestType: 'duplicate_tagging',
        elasticIndexName: config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION,
        elasticHostName: Data.search_service_tyd_versions_default_variant.elasticHostName,
        locale: package_language,
        ocrType: 0,
        searchFieldName: 'ocr_text',
        questionId,
    };
}

/**
 * @description // solves 403 issue with parsing htmls in string field i video view api
 * @param responseData Object{} // questionOcrText ( user Qn)
 * @returns null
 */
function replaceComptaibleOcrTextForVideoViewApi(responseData) {
    const { ocr_text: ocrText } = responseData;
    responseData.ocr_text = Utility.stripHtmlTagsByOcrText(ocrText);
}


/**
 * @description reorder text and video duplicate solutions
 * @params matchesArray
 */
function reorderTextVideoDuplicateSolutions(matchesArray, duplicateQuestionMapByTag, userQuestionsAnalysisLogging, attachment) {
    try {
        // get duplicate Tag map with type of solution and index
        // let duplicateTagMap = getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, 'data');
        const _dMap = {
            duplicateTagMapData: getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, 'data'),
            duplicateTagMapMeta: getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, 'meta'),
        }
        // reorder the positions with same tags and having text solution at upper position
        swapMatchesInDuplicateMap({
            attachment,
            matchesArr: matchesArray,
            groupedQidsArr: [],
            groupedMeta: [],
        }, _dMap, 'video', 'text', 'resource_types', [matchesArray[0]._source.duplicateTag], userQuestionsAnalysisLogging, 'text_video_duplicate_reorder');
    } catch (e) {
        console.error(e);
    } finally {
        return matchesArray;
    }
}

/**
 * @description get user questions from elastic index logging
 * @param { Object } elasticSearchInstance
 * @param { Integer } studentId
 * @returns {Object[]} Array of Questions Asked BY User
 */
async function getStudentRecentlyAskedQuestions(elasticSearchInstance, questionFilters, size=10) {
    const indexName = 'user-questions';
    const esResponse = await elasticSearchInstance.getUserQuestionsByStudentId(indexName, size, questionFilters);
    let questions = [];
    return _.get(esResponse, 'hits.hits', []);
}

function getDuplicateQuestionMapByTag(duplicateQuestionMapByTag, matchesArray, type) {
    try {
        if (!duplicateQuestionMapByTag) {
            duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
        }
        let _duplicateQuestionMapByTag = duplicateQuestionMapByTag.getMap();
        if (_.isNull(_duplicateQuestionMapByTag)) {
            _duplicateQuestionMapByTag = duplicateQuestionMapByTag.buildMap(matchesArray);
            duplicateQuestionMapByTag.setMap(_duplicateQuestionMapByTag);
        }
        return _duplicateQuestionMapByTag[type];
    } catch (e) {
        console.log(e);
        return null;
    }

}

function addSearchIterationSuccessLogsInElastic(userQuestionsAnalysisLogging, key) {
    if (userQuestionsAnalysisLogging && typeof userQuestionsAnalysisLogging[key] === 'undefined') {
        userQuestionsAnalysisLogging[key] = true;
    }
}

// /**
//  * @description set valid response in case of search fails to user
//  * @param { Object {}} Response 
//  * @returns null
//  */
//  function setResponseForSearchFailures(response) {
//     try {
//         response.setMeta({
//             code : 200,
//             success: true,
//             message: "service is overloaded",
//         });

//         response.setData({
//             matched_questions: [],
//         });
//     } catch (e) {
//         console.log(e);
//     }
//  }

module.exports = {
    handleOcr,
    handleElasticSearch,
    handleElasticSearchNew,
    handleOcrWhatsappVertical,
    handleOcrWhatsappVertical2,
    handleImage,
    handleElasticSearcWithTextSolutions,
    handleElasticSearchForHomoIter,
    handleElasticSearchPCM,
    handleOcrForWhatsapp,
    handleElasticSearchWrapper,
    handleOcrGlobal,
    handleOcrForPanel,
    handleElasticSearchGlobal,
    ocrModifier,
    getCleanedOcrText,
    getIasResults,
    getStudentIdFromUdid,
    getComputationalOcrToUse,
    handleComputationalQuestions,
    callSearchServiceForv3,
    callViserSearch,
    checkBlurImage,
    getMetaForTabs,
    handleSearchServiceResponse,
    handleImageServiceWrapper,
    getResponseForQuestionId,
    sendSqsMessage,
    sendSnsMessage,
    bumpHindiQues,
    getCymathString,
    getLocaleFromDetectedLanguages,
    handleHybridOcrGlobal,
    handleElasticSearchHybridOcrWrapper,
    callPreProcessServiceForMetaData,
    callYoutubeApi,
    handleWolframAlpha,
    handleRawOcrGlobal,
    getRetryRequestProgressResponse,
    shouldStoreQuestionMatchResponseInRedis,
    getTopicBooster,
    removeDuplicateTextSolutions,
    detectDuplicateSolutions,
    getLocale,
    getMetadataValue,
    getSignedUrlFromAwsSdk,
    getSimilarQuestionsByOcr,
    getMatchesArrayReorderedByBoostingNumbers,
    storeInUserRecentlyWatched,
    ifSolutionLengthCheck,
    ifEquationLengthCheck,
    handleExactMatch,
    preProcessViserOcr,
    handleViserOcrResponse,
    setDoubtQuestionTopic,
    reorderQuestionsByLanguagePrefrences,
    handleComputationalQuestionsWrapper,
    checkTopMatchExactness,
    frequencySort,
    handleBackPressMatches,
    updateVideoAndSubjectIcon,
    reorderArrayUsingUserHistory,
    getOcrResp,
    getNullOcrResp,
    getLatexObjFromVisionResp,
    handleOrganicDiagramsOcr,
    getSignedUrlFromAwsSdkWithAcl,
    getLiveAndVipTabDetails,
    addQuestionToElasticIndex,
    getGoogleTabQueryOcrText,
    getSearchUrlForMPTabs,
    checkViserOcrValidity,
    extractEquationPortionFromOcrText,
    performOrganicChemistryDiagramFlow,
    isImageTextViableToSearch,
    callViserDiagramMatcher,
    shouldDisplayAllMatchesFromViserDiagram,
    getViserDiagramMatchesCountForDisplay,
    sendUserNotifPostQA,
    handleCacheMasterIterationData,
    handleUncachedMasterIterationData,
    getLocalisedQuestionMgetForPanel,
    generateMasterIterationResponse,
    attachConditionalDefaultVariantProperties,
    getSimplifiedExpressionFromMathsteps,
    updateHandwrittenIsSkippedValue,
    replaceValidOcrTextsInMatches,
    getVideoLanguageMapping,
    updateTextSolutionForDuplicates,
    attachRequestBodyForDuplicateQuestions,
    getStudentRecentlyAskedQuestions,
    updateQueryMongo,
    updateActionForDuplicateQuestionTagging,
    replaceComptaibleOcrTextForVideoViewApi,
    reorderTextVideoDuplicateSolutions,
    reorderMatchesArrayToDesiredVideoLanguageForExactMatch,
    reorderExactMatchDuplicateByMaxVideoDuration,
    stateWiseLanguageRelevanceDuplicatesReorder,
    reorderMatchesArrayForSouthIndianStates,
    noFilterMatchesWidgetDisplayCheck,
    preprocessOcrForNoFilterMatches,
};
