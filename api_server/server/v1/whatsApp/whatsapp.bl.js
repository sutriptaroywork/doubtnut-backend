/* eslint-disable no-await-in-loop */
const fuzz = require('fuzzball');
const Jimp = require('jimp');
const image2base64 = require('image-to-base64');
const request = require('request');
const uuid = require('uuid/v4');

const Student = require('../../../modules/student');
const Utility = require('../../../modules/utility');
const LanguageContainer = require('../../../modules/containers/language');
const helper = require('../../helpers/question.helper');
const QuestionContainer = require('../../../modules/containers/question');
const Question = require('../../../modules/question');
const Constdata = require('../../../data/data');
const QuestionHelper = require('../../helpers/question.helper');

async function generateDeepLink(question_id, image_url, title, config, parent_id, student_id, webUrl, question_answered, question_text_answered) {
    // //console.log(post_id)
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(((resolve, reject) => {
        try {
            console.log('url ::: ', webUrl);
            console.log('question_id :::', question_id);
            let myJSONObject;
            if (webUrl != '' && webUrl != null) {
                console.log('1 \n  under if condition');
                myJSONObject = {
                    branch_key: config.branch_key,
                    channel: student_id,
                    feature: 'video',
                    campaign: 'WHA_VDO',
                    data: {
                        qid: question_id,
                        sid: `WHA_NT:${parent_id}:${student_id}`,
                        // "resource_type":"video", //checking for the resource type on app
                        page: 'DEEPLINK',
                        // "ref_student_id":"WHA:"+parent_id,
                        $og_title: title,
                        $og_description: title,
                        $og_image_url: image_url,
                        $ios_url: webUrl,
                        $desktop_url: webUrl,
                        $fallback_url: webUrl,
                    },
                };
                if (question_answered == 0 && question_text_answered == 1) {
                    myJSONObject.data.resource_type = 'text';
                } else {
                    myJSONObject.data.resource_type = 'video';
                }
            } else {
                console.log('2 \n  under else condition');
                myJSONObject = {
                    branch_key: config.branch_key,
                    channel: student_id,
                    feature: 'video',
                    campaign: 'WHA_VDO',
                    data: {
                        qid: question_id,
                        sid: `WHA_NT:${parent_id}:${student_id}`,
                        // "resource_type":"video",
                        page: 'DEEPLINK',
                        $og_description: title,
                        // "ref_student_id":"WHA:"+parent_id,
                        $og_title: title,
                        $og_image_url: image_url,
                    },
                };
                if (question_answered == 0 && question_text_answered == 1) {
                    myJSONObject.data.resource_type = 'text';
                } else {
                    myJSONObject.data.resource_type = 'video';
                }
            }
            console.log('myjsonobject', myJSONObject);
            request({
                url: 'https://api.branch.io/v1/url',
                method: 'POST',
                json: true, // <--Very important!!!
                body: myJSONObject,
            }, (error, response, body) => {
                if (error) {
                    // //console.log(error);//uncomment this
                } else {
                    // console.log(body);//comment this
                    return resolve(body);
                }
            });
        } catch (e) {
            // console.log(e)
            return reject(e);
        }
    }));
}

async function addPublicUserWhatsapp(db, phone, source) {
    try {
        const students = await Student.checkStudentExists(phone, db.mysql.read);
        if (!students.length) {
            console.log('not present in whatsapp_students or students');
            const studentUserName = Utility.generateUsername(1);
            const studentAdded = await Student.addUser({
                mobile: phone,
                is_web: 4,
                student_username: studentUserName,
                source,
                class1: '20',
            }, db.mysql.write);
            const params = {};
            params.mobile = phone;
            params.student_id = studentAdded.insertId;
            params.fingerprints = source;
            await Student.addWhaStudent(db.mysql.write, params);
            return { studentId: studentAdded.insertId };
        }
        const student = students[0];
        const studentId = student.student_id;
        console.log('----student id \n----->', studentId);
        console.log('--fingerprintsssss------->', student.fingerprints);
        const whaStudent = await Student.getWhaStudentInfo(db.mysql.read, studentId);
        console.log('whatsapp_students\n');
        if (whaStudent.length) {
            console.log('Student exists in whatsapp_students table');
            const { fingerprints } = whaStudent[0];
            if (!fingerprints) {
                const params = {
                    fingerprints: source,
                };
                console.log('Add fingerprint in whatsapp_students');
                await Student.updateWhaStudent(db.mysql.write, params, studentId);
            } else {
                const fingerprintArr = fingerprints.split(',');
                if (!fingerprintArr.includes(source)) {
                    fingerprintArr.push(source);
                    const params = {
                        fingerprints: fingerprintArr.join(),
                    };
                    console.log('Update the whatsapp_students');
                    await Student.updateWhaStudent(db.mysql.write, params, studentId);
                }
            }
        } else {
            console.log('adding new student');
            const params = {};
            params.mobile = phone;
            params.student_id = studentId;
            params.fingerprints = source;
            await Student.addWhaStudent(db.mysql.write, params);
        }

        if (!student.fingerprints) {
            console.log('sourceeee', source);
            await Student.updateSource(studentId, source, db.mysql.write);
        }
        return { studentId };
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function handleJimp(jimp, questionImage) {
    try {
        return await jimp.read(questionImage);
    } catch (e) {
        console.log(e);
        return false;
    }
}

function getOcrMeta(ocrData, isSkipped) {
    return {
        is_skipped: isSkipped,
        ocr_done: 1,
        ocr_text: ocrData.ocr,
        original_ocr_text: ocrData.ocr,
        locale: ocrData.locale,
        is_trial: ocrData.ocr_type,
    };
}

async function verticalImage(staticParams, jimpResponse, imageInfo) {
    if (!jimpResponse) {
        return;
    }
    if (jimpResponse.bitmap.width / jimpResponse.bitmap.height <= 0.5) {
        let ocrData;
        const iteration = await Utility.getFlagrResponse(staticParams.kinesisClient, 50);
        if (!iteration) {
            ocrData = await helper.handleOcrWhatsappVertical(imageInfo.fileName, staticParams.s3, staticParams.translate2, staticParams.config);
        } else {
            ocrData = await helper.handleOcrWhatsappVertical2(imageInfo.fileName, staticParams.s3, staticParams.translate2, staticParams.config, iteration);
        }
        const meta = ocrData.handwritten === 1 ? getOcrMeta(ocrData, 7) : getOcrMeta(ocrData, 5);
        return {
            ocrData,
            meta,
        };
    }
}

async function horizontalImage(questionImage, req, imageInfo, config, variantAttachment) {
    let questionImageBase64 = await image2base64(questionImage);
    questionImageBase64 = questionImageBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const ocrData = await helper.handleOcrGlobal({
        image: questionImageBase64, host: req.host, fileName: imageInfo.fileName, translate2: req.translate2, config, variantAttachment,
    });
    const meta = ocrData.handwritten === 1 ? getOcrMeta(ocrData, 6) : getOcrMeta(ocrData, 0);
    return {
        ocrData,
        meta,
    };
}

async function getStringDiffResponse(staticParams, ocrData, studentId, variantAttachment) {
    const languagesArray = await LanguageContainer.getList(staticParams.db);
    const indexName = staticParams.config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
    const languagesObj = Utility.getLanguageObject(languagesArray);
    const stLangCode = ocrData.locale;
    const config = req.app.get('config');
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }
    console.log(language);
    const stockWordList = await QuestionContainer.getStockWordList(staticParams.db);
    return helper.handleElasticSearchWrapper({
        ocr: ocrData.ocr, elasticSearchInstance: staticParams.elasticSearchInstance, elasticSearchTestInstance: staticParams.elasticSearchTestInstance, kinesisClient: staticParams.kinesisClient, elasticIndex: indexName, stockWordList, useStringDiff: true, language, fuzz, UtilityModule: Utility, studentId, ocrType: ocrData.ocr_type, variantAttachment,
    }, config);
}

function getWebUrl(question, sid, quesId, userLocale) {
    let webUrl;
    const sub = Utility.getSubjectLink(question.subject.toLowerCase());
    if (question.url_text && question.student_id != '21') {
        if (question.is_answered === 0 && question.is_text_answered === 1) {
            webUrl = `${Constdata.urlPrefixAmp}/question-answer${sub}/${question.url_text}-${question.question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${parseInt(sid).toString(13)}&qid=${parseInt(quesId).toString(13)}&source=WHA_NT`;
        } else {
            webUrl = `${Constdata.urlPrefixAmp}/question-answer${sub}/${question.url_text}-${question.question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${parseInt(sid).toString(13)}&qid=${parseInt(quesId).toString(13)}&source=WHA_NT`;
        }
    }
    return webUrl;
}

async function getDeeplinksFromMatchArray(staticParams, matchArray, locale, studentId, questionId) {
    let count = 0;
    const urlArray = [];
    for (let i = 0; i < matchArray.length; i++) {
        const question = await QuestionContainer.getByQuestionIdWithUrl(matchArray[i]._id, staticParams.db);
        if (!question.length) {
            continue;
        }
        count++;
        let questionID;
        question[0].url_text = question[0].url_text || Utility.ocrToUrl(question[0].ocr_text);
        if (question[0].matched_question == null) {
            questionID = question[0].question_id;
        } else {
            questionID = question[0].matched_question;
        }
        let { ocr_text: ocrText } = question[0];
        let userLocale = '';
        if (locale === 'hi' && question[0].subject !== 'BIOLOGY') {
            userLocale = '/hindi';
            if (question[0].hindi != null && question[0].hindi !== undefined) {
                ocrText = question[0].hindi;
            }
        }
        const webUrl = getWebUrl(question[0], studentId, questionId, userLocale);
        const thumbnail = `${staticParams.config.cdn_url}thumbnail_white/${questionID}.png`;
        const urlGenerated = await generateDeepLink(question[0].question_id, thumbnail, ocrText, staticParams.config, questionId, studentId, webUrl, question[0].is_answered, question[0].is_text_answered);
        const obj = {
            url: urlGenerated.url,
            solnType: !question[0].is_answered && question[0].is_text_answered ? 'text' : 'video',
        };
        urlArray.push(obj);
        if (count >= 5) {
            break;
        }
    }
    return urlArray;
}

async function getOcr(staticParams, imageInfo, variantAttachment) {
    const jimpResponse = await handleJimp(Jimp, imageInfo.path);
    const vertImageInfo = await verticalImage(staticParams, jimpResponse, imageInfo);
    if (vertImageInfo) {
        return vertImageInfo;
    }
    return horizontalImage(imageInfo.path, staticParams, imageInfo, staticParams.config, variantAttachment);
}

async function askWhatsapp(staticParams, obj, imageInfo) {
    try {
        // add the code for ek baar me ek sawal text
        const variantAttachment = await Utility.getFlagrResponse(staticParams.kinesisClient, obj.studentId);
        const { ocrData, meta } = await getOcr(staticParams, imageInfo, variantAttachment);
        const {
            stringDiffResp,
            info,
        } = await getStringDiffResponse(staticParams, ocrData, obj.studentId, variantAttachment);
        const filedToUpdate = {
            ...meta,
            question_image: imageInfo.fileName,
            original_ocr_text: info.query_ocr_text,
            question: info.version,
            wrong_image: info.isIntegral,
            subject: stringDiffResp[3],
        };
        await Question.updateQuestion(filedToUpdate, imageInfo.qid, staticParams.db.mysql.write);
        QuestionHelper.sendSnsMessage({
            type: 'user-questions',
            sns: staticParams.sns,
            uuid: uuid(),
            qid: imageInfo.qid,
            studentId: staticParams.studentId,
            studentClass: '20',
            subject: 'MATHS',
            chapter: 'DEFAULT',
            version: '',
            ques: 'WHATSAPP_NT',
            locale: 'en',
            questionImage: imageInfo.fileName,
            ocrText: filedToUpdate.ocr_text,
            ocrDone: filedToUpdate.ocr_done,
            originalOcrText: filedToUpdate.original_ocr_text,
            wrongImage: filedToUpdate.wrong_image,
            isTrial: filedToUpdate.is_trial,
            difficulty: filedToUpdate.difficulty,
            UtilityModule: Utility,
            userQuestionSnsUrl: Constdata.userQuestionSnsUrl,
        });
        const matchArray = stringDiffResp[0];
        const urlArray = await getDeeplinksFromMatchArray(staticParams, matchArray, filedToUpdate.locale, obj.studentId, imageInfo.qid);
        return {
            urlArray,
            questionIds: matchArray.slice(0, 50).map((x) => x._id),
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function askWhatsappText(staticParams, obj, text) {
    const variantAttachment = await Utility.getFlagrResponse(staticParams.kinesisClient, obj.studentId);
    const {
        stringDiffResp,
        info,
    } = await getStringDiffResponse(staticParams, { ocr: text, ocr_type: 0 }, obj.studentId, variantAttachment);
    const data = {
        student_id: obj.studentId,
        class: 20,
        book: 'MATHS',
        chapter: 'DEFAULT',
        doubt: 'WHATSAPP_NT',
        locale: 'en',
        ocr_text: info.query_ocr_text,
        original_ocr_text: info.query_ocr_text,
        question: info.version,
        wrong_image: info.isIntegral,
        subject: stringDiffResp[3],
    };
    const quesResp = await Question.addQuestion(data, staticParams.db.mysql.write);
    QuestionHelper.sendSnsMessage({
        type: 'user-questions',
        sns: staticParams.sns,
        uuid: uuid(),
        qid: quesResp.insertId,
        studentId: staticParams.studentId,
        studentClass: '20',
        subject: 'MATHS',
        chapter: 'DEFAULT',
        version: '',
        ques: 'WHATSAPP_NT',
        locale: 'en',
        ocrText: text,
        UtilityModule: Utility,
        userQuestionSnsUrl: Constdata.userQuestionSnsUrl,
    });
    const matchArray = stringDiffResp[0];
    const urlArray = await getDeeplinksFromMatchArray(staticParams, matchArray, 'en', obj.studentId, quesResp.insertId);
    return {
        urlArray,
        questionIds: matchArray.slice(0, 50).map((x) => x._id),
        questionId: quesResp.insertId,
    };
}

module.exports = { addPublicUserWhatsapp, askWhatsapp, askWhatsappText };
