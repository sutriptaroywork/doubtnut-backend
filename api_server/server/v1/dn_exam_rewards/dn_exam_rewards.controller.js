/* eslint-disable eqeqeq */
/* eslint-disable prefer-const */
const base64 = require('base-64');
const moment = require('moment');
const _ = require('lodash');
const questionsHelper = require('../../helpers/question.helper');
const dnExamHelper = require('../../../modules/mysql/dn_exam_rewards');
const dnExamRewardsHelper = require('./dn_exam_rewards.helper');
const scholarshipHelper = require('../../v2/scholarship/scholarship.helper');

async function getSignedUrl(req, res, next) {
    try {
        const s3 = req.app.get('s3');
        let {
            examId, type, source, extension,
        } = req.query;

        extension = extension.toLowerCase();
        const { student_id: studentId } = req.user;
        let path;
        let resourceMime;
        let resourceUrl;
        const timestamp = moment().unix();
        if (type == 'video') {
            if (extension != 'mp4') {
                return res.status(400).json({ error: 'Unsupported Type. Upload only mp4.' });
            }
            path = `dn_exam_rewards/${examId}/testimonial/${studentId}_${timestamp}.mp4`;
            resourceMime = 'video/mp4';
            resourceUrl = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnutteststreamin-hosting-mobilehub-1961518253', path, 12000, resourceMime, 'private');
        } else if (type == 'image') {
            const supportedTypes = ['jpeg', 'png', 'jpg'];
            if (!supportedTypes.includes(extension)) {
                return res.status(400).json({ error: 'Unsupported Type. Upload only jpeg, png, or jpg.' });
            }
            path = `dn_exam_rewards/${examId}/${source}/${studentId}_${timestamp}.${extension}`;
            resourceMime = `${type}/${extension}`;
            resourceUrl = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnut-static', path, 12000, resourceMime, 'public-read');
        } else {
            return res.status(400).json({ error: 'Unsupported Type' });
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                resourceUrl,
                path,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function getClasses(req, res, next) {
    try {
        let {
            locale = 'en', studentClass,
        } = req.query;
        const db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const todayDate = moment().add(5, 'h').add(30, 'm').format();
        const classes = await dnExamHelper.getClassesFromExams(db.mysql.read, todayDate);
        let classesList = [];
        for (let i = 0; i < classes.length; i++) {
            const classString = classes[i];
            classesList.push(...classString.class.split(','));
        }

        classesList = [...new Set(classesList)];
        let flag = true;
        /* const examEntry = await dnExamHelper.getStudentExamAllData(db.mysql.read, studentId);
        if (examEntry.length) {
            studentClass = examEntry[0].class.split(',')[0];
        }
        */
        for (let i = 0; i < classesList.length; i++) {
            if (classesList[i] == studentClass) {
                flag = false;
            }
            if (classesList[i] == 13) {
                classesList[i] = locale == 'hi' ? { name: 'ड्रॉपर/रिपीट वर्ष', value: 13, is_selected: classesList[i] == studentClass } : { name: 'Dropper/Repeat year', value: 13, is_selected: classesList[i] == studentClass };
            } else {
                classesList[i] = locale == 'hi' ? { name: `कक्षा ${classesList[i]}वीं`, value: parseInt(classesList[i]), is_selected: classesList[i] == studentClass } : { name: `Class ${classesList[i]}`, value: parseInt(classesList[i]), is_selected: classesList[i] == studentClass };
            }
        }

        classesList.sort((a, b) => a.value - b.value);

        if (flag) {
            let start = 0;
            let end = classesList.length - 1;
            let mid = 0;

            while (start <= end) {
                mid = Math.floor((start + end) / 2);

                if (classesList[mid].value === studentClass) break;

                else if (classesList[mid].value < studentClass) { start = mid + 1; } else { end = mid - 1; }
            }
            if (classesList[mid].value < studentClass) {
                mid += 1;
            }
            if (mid >= classesList.length) {
                mid = classesList.length - 1;
            }
            classesList[mid].is_selected = true;
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: classesList,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function getExamsList(req, res, next) {
    try {
        const db = req.app.get('db');
        const { studentClass, locale } = req.query;
        const { student_id: studentId } = req.user;
        const promises = [];
        const todayDate = moment().add(5, 'h').add(30, 'm').format();
        promises.push(await dnExamHelper.getCompetitiveExams(db.mysql.read, studentClass, todayDate));
        promises.push(dnExamHelper.getBoardExams(db.mysql.read, studentClass, todayDate));
        promises.push(dnExamHelper.getStudentExams(db.mysql.read, studentId));
        let [compExamsList, boardExamsList, examList] = await Promise.all(promises);
        if (examList.length && examList[0].exam_list) {
            examList = examList[0].exam_list;
            examList = examList.slice(1, examList.length - 1);
            examList = examList.split(',');
            examList = examList.map((x) => parseInt(x));
        }
        const compExams = [];
        for (let i = 0; i < compExamsList.length; i++) {
            const item = { id: compExamsList[i].id };
            item.value = locale == 'hi' ? compExamsList[i].hindi_display_name : compExamsList[i].english_display_name;
            item.is_selected = false;
            if (examList.includes(compExamsList[i].id)) {
                item.is_selected = true;
            }
            compExams.push(item);
        }

        const boardExams = [];
        for (let i = 0; i < boardExamsList.length; i++) {
            const item = { id: boardExamsList[i].id };
            item.value = locale == 'hi' ? boardExamsList[i].hindi_display_name : boardExamsList[i].english_display_name;
            item.is_selected = false;
            if (examList.includes(boardExamsList[i].id)) {
                item.is_selected = true;
            }
            boardExams.push(item);
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: { submitText: locale == 'hi' ? 'सबमिट करें' : 'Submit', exams: {} },
        };
        if (boardExams.length) {
            responseData.data.exams.boardExams = { title: locale == 'hi' ? 'बोर्ड परीक्षा' : 'Board Exams', boardExamsList: boardExams, isSelected: true };
        }
        if (compExams.length) {
            responseData.data.exams.compExams = { title: locale == 'hi' ? 'प्रतियोगी परीक्षा' : 'Competitive Exams', compExamsList: compExams, isSelected: !boardExams.length };
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function postExamsList(req, res, next) {
    try {
        const db = req.app.get('db');
        let { examList, studentClass } = req.body;
        const { student_id: studentId } = req.user;
        let exam = await dnExamHelper.getStudentExams(db.mysql.read, studentId);

        if (exam.length && exam[0].exam_list) {
            exam = exam[0].exam_list;
            exam = exam.slice(1, exam.length - 1);
            exam = exam.split(',');
            exam = exam.map((x) => parseInt(x));
        }

        exam = exam.filter((x) => !_.isNaN(x));
        if (exam.length == 0 && examList == '[]') {
            return res.status(200).json({ errorMesage: 'Please select exam' });
        }

        const todayDate = moment().add(5, 'h').add(30, 'm').format();
        const promises = [];
        promises.push(await dnExamHelper.getCompetitiveExams(db.mysql.read, studentClass, todayDate));
        promises.push(dnExamHelper.getBoardExams(db.mysql.read, studentClass, todayDate));
        promises.push(dnExamHelper.getStudentExams(db.mysql.read, studentId));
        let [compExamsList, boardExamsList, data] = await Promise.all(promises);
        for (let i = 0; i < compExamsList.length; i++) {
            const index = exam.indexOf(compExamsList[i].id);
            if (index > -1) {
                exam.splice(index, 1);
            }
        }
        for (let i = 0; i < boardExamsList.length; i++) {
            const index = exam.indexOf(boardExamsList[i].id);
            if (index > -1) {
                exam.splice(index, 1);
            }
        }

        examList = examList.slice(1, examList.length);
        examList = examList.split(',');
        examList = examList.map((x) => (parseInt(x)));
        examList = [...exam, ...examList];
        examList = examList.filter((x) => !_.isNaN(x));

        examList = `[${examList.toString()}]`;

        if (!data.length) {
            data = { studentId };
            data.examList = examList;
            await dnExamHelper.createStudentData(db.mysql.write, data);
        } else {
            await dnExamHelper.setExamList(db.mysql.write, studentId, examList);
        }
        return res.status(200).json({ message: 'Success' });
    } catch (e) {
        next(e);
    }
}

async function getversionUpdate(req, res, next) {
    let { versionCode, locale } = req.query;
    if (+versionCode < 990 && +versionCode >= 963) {
        return res.status(200).json({
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                updateMessage: locale == 'hi' ? 'इनाम जीतने के लिए अभी ऐप अपडेट करें\nटॉपर परीक्षा इनाम प्रोग्राम का हिस्सा बनने के लिए अपना ऐप अभी अपडेट करें\nअभी अपडेट करें' : 'Update App to Earn Rewards\nTopper Exam Reward Program ka hissa banne ke liye Apna app abhi Update Karein\nUpdate now',
                branchLink: 'doubtnutapp://external_url?url=https://play.google.com/store/apps/details?id=com.doubtnutapp',
                cancelText: locale == 'hi' ? 'रद्द करना' : 'cancel',
                updateText: locale == 'hi' ? 'अपडेट करें' : 'Update',
            },
        });
    }
    return res.status(200).json({
        meta: {
            code: 200,
            message: 'success',
        },
    });
}

async function getHomepage(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let {
            versionCode, studentClass,
        } = req.query;

        let { locale, examId } = req.query;
        const { student_id: studentId } = req.user;
        if (locale !== 'hi') {
            locale = 'en';
        }
        if (!studentClass) {
            studentClass = req.user.student_class;
        }
        let examListold = await dnExamHelper.getStudentExams(db.mysql.read, studentId);
        if (examListold.length && examListold[0].exam_list) {
            examListold = examListold[0].exam_list;
            examListold = examListold.slice(1, examListold.length - 1);
            examListold = examListold.split(',');
            examListold = examListold.map((x) => parseInt(x));
            examListold = examListold.filter((x) => !_.isNaN(x));
        }
        const examList = [];
        for (let i = 0; i < examListold.length; i++) {
            const examData = await dnExamHelper.getExamData(db.mysql.read, examListold[i]);
            if (examData[0].class.includes(studentClass)) {
                examList.push(examListold[i]);
            }
        }
        let selectExam = false;
        if (!examId) {
            if (!examList.length) {
                selectExam = true;
                examId = await dnExamHelper.getDummyExamByClass(db.mysql.read, studentClass);
                if (examId.length) {
                    examId = examId[0].id;
                } else {
                    examId = 0;
                }
            } else {
                examId = examList[0];
            }
        }
        let examData = await dnExamHelper.getExamData(db.mysql.read, examId);
        if (examData.length) {
            examData = examData[0];
        }
        let carouselData = await dnExamHelper.getCarousels(db.mysql.read, examId, locale);
        const carouselPromises = [];
        for (let i = 0; i < carouselData.length; i++) {
            if (carouselData[i].carousel_name === 'change_exam') {
                carouselPromises.push(dnExamRewardsHelper.buildChangeExam(carouselData[i], db, examList, examId, locale, studentClass));
                carouselData.splice(i, 1, null);
            } else if (carouselData[i].carousel_name === 'prize_short_banner' || carouselData[i].carousel_name === 'prize_long_banner' || carouselData[i].carousel_name === 'long_banner') {
                carouselData[i] = dnExamRewardsHelper.buildPrizeShortBanner(carouselData[i]);
            } else if (carouselData[i].carousel_name === 'exam_info') {
                carouselData[i] = dnExamRewardsHelper.buildExamInfo(carouselData[i], examData, selectExam, locale);
            } else if (carouselData[i].carousel_name === 'whatsapp_telegram_share') {
                carouselData[i] = dnExamRewardsHelper.buildWhatsappShare(carouselData[i], +versionCode, locale);
            } else if (carouselData[i].carousel_name == 'all_results' || carouselData[i].carousel_name == 'vip_user_result') {
                carouselPromises.push(dnExamRewardsHelper.buildResult(carouselData[i], db, locale));
                carouselData.splice(i, 1, null);
            } else if (carouselData[i].carousel_name == 'video_text_testimonial') {
                carouselPromises.push(dnExamRewardsHelper.buildVideoTextTestimonial(carouselData[i], db, config, locale));
                carouselData.splice(i, 1, null);
            }
        }

        const promiseData = await Promise.all(carouselPromises);

        for (let i = 0; i < promiseData.length; i++) {
            carouselData.push(JSON.parse(JSON.stringify(promiseData[i])));
        }
        carouselData = carouselData.filter((x) => x != null);
        carouselData.sort((a, b) => a.priority - b.priority);

        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                carouselData,
                faq_bucket: examData.faq_bucket,
                title: locale == 'hi' ? 'टॉपर रिवॉर्ड प्रोग्राम' : 'TOPPER REWARD PROGRAM',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function getFAQs(req, res, next) {
    try {
        const db = req.app.get('db');
        let { bucket, locale = 'en' } = req.query;

        const faqData = await dnExamHelper.getFAQData(db.mysql.read, bucket, locale);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                faqData,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function viewMoreToppers(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const {
            carouselId, locale,
        } = req.query;

        const viewMoreData = await dnExamRewardsHelper.viewMoreResult(db, carouselId, locale, config);

        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                viewMoreData,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function redirect(req, res, next) {
    try {
        const xAuthToken = req.headers['x-auth-token'];
        const { student_class: studentClass } = req.user;
        const { locale, version_code: versionCode } = req.query;
        const auth = base64.encode(xAuthToken);
        const link = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://uat-app.doubtnut.com/DNER/homepage?token=${auth}?studentClass=${studentClass}?locale=${locale}?versionCode=${versionCode}`;
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                link,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getFormData(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const { examId } = req.query;
        let { versionCode } = req.query;
        let { locale } = req.query;
        if (!locale || locale != 'hi') {
            locale = 'en';
        }
        let studentData = dnExamRewardsHelper.getStudentEmptyData(studentId);
        let sData = await dnExamHelper.getStudentData(db.mysql.read, studentId, examId);
        if (sData.length) {
            studentData = JSON.parse(JSON.stringify(sData[0]));
        }
        let examData = await dnExamHelper.getExamData(db.mysql.read, examId);
        examData = JSON.parse(JSON.stringify(examData[0]));
        const todayDate = moment().add(5, 'h').add(30, 'm').format();

        if (examData.registration_start_date != null && todayDate < examData.registration_start_date) {
            return res.status(200).json({ message: 'Exam not available' });
        }
        if (examData.result_release_date == null) {
            examData.result_release_date = '3022-03-18T10:58:17.000Z';
        }
        if (examData.admit_card_is_active == 0 && !examData.admit_card_release_date) {
            examData.admit_card_release_date = examData.result_release_date;
        }
        if (examData.application_number_is_active == 0 && !examData.application_number_release_date) {
            examData.application_number_release_date = examData.admit_card_release_date;
        }
        let end = 1;
        if ((examData.application_number_release_date < todayDate && todayDate < examData.admit_card_release_date) || (examData.admit_card_release_date == null && examData.application_number_release_date < todayDate)) {
            end = 2;
        } else if ((examData.admit_card_release_date < todayDate && todayDate < examData.result_release_date) || (examData.result_release_date == null && examData.admit_card_release_date < todayDate)) {
            end = 3;
        } else if (examData.result_release_date < todayDate) {
            if ((studentData.marks_scored || studentData.percentage || studentData.percentile || studentData.grade || studentData.all_india_rank || studentData.district_rank || studentData.state_rank || (studentData.other_rank && studentData.other_rank_other_rank_comment)) || studentData.result_photo_url) {
                end = 5;
            } else {
                end = 4;
            }
        }
        let tabs = await dnExamRewardsHelper.getTabs(db, end, locale, studentData, examData, config, +versionCode);

        if ((studentData.admit_card_update_date && studentData.admit_card_update_date > examData.result_release_date) || (todayDate > examData.result_release_date && !studentData.admit_card_update_date)) {
            tabs = dnExamRewardsHelper.mergeTabs(tabs, 2, 3);
        }
        if ((studentData.application_number_update_date && studentData.application_number_update_date > examData.admit_card_release_date) || (todayDate > examData.admit_card_release_date && !studentData.application_number_update_date)) {
            tabs = dnExamRewardsHelper.mergeTabs(tabs, 1, 2);
        }
        if ((studentData.registration_update_date && studentData.registration_update_date > examData.application_number_release_date) || (todayDate > examData.application_number_release_date && !studentData.registration_update_date)) {
            tabs = dnExamRewardsHelper.mergeTabs(tabs, 0, 1);
        }

        tabs = tabs.filter((x) => x != null);
        let reward = null;
        if (studentData.video_testimonial_qid && studentData.result_verified) {
            reward = await dnExamRewardsHelper.generateResult(db, studentData, examData.id);
            if (reward.length) {
                reward = reward[0];
            }
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                tabs,
            },
        };
        if (studentData.video_testimonial_qid && reward) {
            responseData.data.successMessage = dnExamRewardsHelper.getTestimonialSuccess(examData.hindi_display_name, examData.english_display_name, locale, reward, studentData.result_verified);
            responseData.data.bannerImage = (studentData.address_line_1 || studentData.account_holder_name) ? `${config.cdn_url}${studentData.result_image}` : null;
            responseData.data.bannerText = locale == 'hi' ? 'अपने दोस्तों और परिवार के साथ शेयर करें' : 'Share with Friends and family’mily';
        }
        if (studentData.video_testimonial_qid && reward && (studentData.address_line_1 || studentData.account_holder_name)) {
            responseData.data = dnExamRewardsHelper.generateWhatsappMessages(responseData.data, versionCode, studentData, reward, examData.english_display_name, examData.hindi_display_name, config, studentData.banner_image, locale);
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function postFormData(req, res, next) {
    try {
        const db = req.app.get('db');
        const s3 = req.app.get('s3');
        const config = req.app.get('config');
        let {
            examId, locale = 'en', versionCode,
        } = req.body;

        const { student_id: studentId, student_class: studentClass } = req.user;

        const data = req.body;
        data.studentId = studentId;
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
        };

        let reward = null;
        let successMessage;
        const updateTime = moment().add(5, 'h').add(30, 'm')
            .format();
        let examData = await dnExamHelper.getExamData(db.mysql.read, examId);
        examData = JSON.parse(JSON.stringify(examData[0]));
        let studentData = await dnExamHelper.getStudentData(db.mysql.read, data.studentId, examId);
        if (studentData.length) {
            studentData = JSON.parse(JSON.stringify(studentData[0]));
        }
        const studentExamData = await dnExamHelper.getStudentExamData(db.mysql.read, studentId, examId);
        if (studentExamData.length == 0) {
            await dnExamHelper.createStudentExamData(db.mysql.write, studentId, examId);
        }

        // const studentEmptyData = dnExamRewardsHelper.getStudentEmptyData(studentId);
        const todayDate = moment().add(5, 'h').add(30, 'm').format();

        if (examData.result_release_date == null) {
            examData.result_release_date = '3022-03-18T10:58:17.000Z';
        }
        if (examData.admit_card_is_active == 0 && !examData.admit_card_release_date) {
            examData.admit_card_release_date = examData.result_release_date;
        }
        if (examData.application_number_is_active == 0 && !examData.application_number_release_date) {
            examData.application_number_release_date = examData.admit_card_release_date;
        }
        let end = 1;

        if ((examData.application_number_release_date < todayDate && todayDate < examData.admit_card_release_date) || (examData.admit_card_release_date == null && examData.application_number_release_date < todayDate)) {
            end = 2;
        } else if ((examData.admit_card_release_date < todayDate && todayDate < examData.result_release_date) || (examData.result_release_date == null && examData.admit_card_release_date < todayDate)) {
            end = 3;
        } else if (examData.result_release_date < todayDate) {
            if ((studentData.marks_scored || studentData.percentage || studentData.percentile || studentData.grade || studentData.all_india_rank || studentData.district_rank || studentData.state_rank || (studentData.other_rank && studentData.other_rank_other_rank_comment)) || studentData.result_photo_url) {
                end = 5;
            } else {
                end = 4;
            }
        }
        let tabs = await dnExamRewardsHelper.getTabs(db, end, locale, data, examData, config, +versionCode);
        if ((studentData.admit_card_update_date && studentData.admit_card_update_date > examData.result_release_date) || ((todayDate > examData.result_release_date) && !studentData.admit_card_update_date)) {
            tabs = dnExamRewardsHelper.mergeTabs(tabs, 2, 3);
        }
        if ((studentData.application_number_update_date && studentData.application_number_update_date > examData.admit_card_release_date) || ((todayDate > examData.admit_card_release_date) && !studentData.application_number_update_date)) {
            tabs = dnExamRewardsHelper.mergeTabs(tabs, 1, 2);
        }
        if ((studentData.registration_update_date && studentData.registration_update_date > examData.application_number_release_date) || ((todayDate > examData.application_number_release_date) && !studentData.registration_update_date)) {
            tabs = dnExamRewardsHelper.mergeTabs(tabs, 0, 1);
        }
        tabs = tabs.filter((x) => x != null);
        if (!data.student_name && !data.date_of_birth && !data.student_photo && !data.application_number && !data.application_photo_url && !data.admit_card_photo_url && !data.result_photo_url && !data.video_testimonial_qid && !data.text_testimonial && ((!data.shirt_size || !data.address_student_name || !data.mobile || !data.address_line_1 || !data.address_line_2 || !data.address_line_3 || !data.city || !data.state || !data.pincode) && (!data.account_holder_name && !data.account_number && !data.IFSC_code))) {
            return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए सारी जानकारी भरें' : 'Fill all information to proceed' });
        }

        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].form && tabs[i].form.form && dnExamRewardsHelper.postformActive(tabs[i].form.form)) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए सारी जानकारी भरें' : 'Fill all information to proceed' });
            }
        }
        if (data.student_name || data.student_photo || data.date_of_birth) {
            /*
            if (!data.date_of_birth) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए जन्म की तारीख भरें' : 'Enter Date of birth to proceed' });
            }
            if (!data.student_photo) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए फ़ोटो अपलोड करें' : 'Upload photo to proceed' });
            }
            */
            if (!moment(data.date_of_birth, 'YYYY-MM-DD').isValid()) {
                return res.status(400).json({ message: 'Date format is wrong.' });
            }
            if (!studentData.result_verified) {
                await dnExamHelper.setRegistrationFormData(db.mysql.write, studentId, examId, data.student_name, data.student_photo, data.date_of_birth);
                successMessage = dnExamRewardsHelper.getRegistrationSuccess(examData.hindi_display_name, examData.english_display_name, locale);
                if (!studentData.student_name && !studentData.student_photo && !studentData.date_of_birth) {
                    await dnExamHelper.setUpdateTime(db.mysql.write, studentId, examData.id, updateTime, null, null);
                }
            } else {
                return res.status(400).json({ message: 'Can\'t edit details anymore.' });
            }
        }
        if (data.application_number || data.application_photo_url) {
            /*
            if (!data.application_number) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए भरें आवेदन पत्र का नंबर' : 'Enter application number to proceed' });
            }
            if (!data.application_photo_url) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए अपना आवेदन पत्र अपलोड करें' : 'Upload application form to proceed' });
            }
            */
            if (!studentData.result_verified) {
                await dnExamHelper.setApplicationFormData(db.mysql.write, studentId, examId, data.application_number, data.application_photo_url);
                successMessage = dnExamRewardsHelper.getApplicationSuccess(examData.hindi_display_name, examData.english_display_name, locale);
                if (!studentData.application_number && !studentData.application_photo_url) {
                    await dnExamHelper.setUpdateTime(db.mysql.write, studentId, examData.id, studentData.registration_update_date, updateTime, null);
                }
            } else {
                return res.status(400).json({ message: 'Can\'t edit details anymore.' });
            }
        }
        if (data.admit_card_photo_url) {
            /*
            if (!data.admit_card_photo_url) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए अपना प्रवेश पत्र अपलोड करें' : 'Upload your Admit card to proceed' });
            }
            */
            if (!studentData.result_verified) {
                await dnExamHelper.setAdmitFormData(db.mysql.write, studentId, examId, data.admit_card_photo_url);
                successMessage = dnExamRewardsHelper.getAdmitSuccess(examData.hindi_display_name, examData.english_display_name, locale);
                if (!studentData.admit_card_photo_url) {
                    await dnExamHelper.setUpdateTime(db.mysql.write, studentId, examData.id, studentData.registration_update_date, studentData.application_number_update_date, updateTime);
                }
            } else {
                return res.status(400).json({ message: 'Can\'t edit details anymore.' });
            }
        }
        if ((data.marks_scored || data.percentage || data.percentile || data.grade || data.all_india_rank || data.district_rank || data.state_rank || (data.other_rank && data.other_rank_other_rank_comment)) || data.result_photo_url) {
            /*
            if (!(data.marks_scored || data.percentage || data.percentile || data.grade || data.all_india_rank || data.district_rank || data.state_rank || (data.other_rank && data.other_rank_other_rank_comment))) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए परिणाम की सारी जानकारी भरें' : 'Fill all result information to proceed' });
            }
            if (!data.result_photo_url) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए अपना रिजल्ट अपलोड करें' : 'Upload your Result to proceed' });
            }
            */
            if (!studentData.result_verified) {
                const timestamp = moment().unix();
                const filename = `dn_exam_rewards/${examData.english_display_name}/result_banner/${data.studentId}_${timestamp}.jpeg`;
                try {
                    await dnExamHelper.setResultFormData(db.mysql.write, studentId, examId, data);
                    await dnExamHelper.setUpdateTime(db.mysql.write, studentId, examData.id, studentData.registration_update_date, studentData.application_number_update_date, studentData.admit_card_update_date);
                    reward = await dnExamRewardsHelper.generateResult(db, data, examId);
                    if (reward.length) {
                        reward = reward[0];
                        await dnExamHelper.setResultImage(db.mysql.write, filename, data.studentId, examId);
                        dnExamRewardsHelper.generateTemplateImage(s3, config, filename, data, examData, reward);
                    }
                    successMessage = dnExamRewardsHelper.getResultSuccess(examData.hindi_display_name, examData.english_display_name, locale);
                } catch (e) {
                    console.log(e);
                    responseData.resultBannerError = 'Error generating banner';
                }
            } else if (!(data.shirt_size || data.mobile || data.address_line_1 || data.address_line_2 || data.address_line_3 || data.city || data.state || data.pincode || data.account_holder_name || data.account_number || data.IFSC_code)) {
                return res.status(400).json({ message: 'Can\'t edit details anymore.' });
            }
        }
        if ((data.text_testimonial || data.video_testimonial_qid) && !studentData.result_verified) {
            /*
            if (!data.video_testimonial_qid) {
                return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए अपना वीडियो अपलोड करें' : 'Upload your Video to proceed' });
            }
            */
            data.video_testimonial_qid = await dnExamRewardsHelper.addResource(db, data.video_testimonial_qid, studentClass);
            await dnExamHelper.setTestimonialFormData(db.mysql.write, studentId, examId, data.video_testimonial_qid, data.text_testimonial);
            successMessage = dnExamRewardsHelper.getTestimonialSuccess(examData.hindi_display_name, examData.english_display_name, locale, reward, studentData.result_verified);
        }
        if (studentData.video_testimonial_qid) {
            if (data.address_student_name || data.shirt_size || data.mobile || data.address_line_1 || data.address_line_2 || data.address_line_3 || data.city || data.state || data.pincode || data.account_holder_name || data.account_number || data.IFSC_code) {
                if ((!data.address_student_name || !data.shirt_size || !data.mobile || !data.address_line_1 || !data.address_line_2 || !data.address_line_3 || !data.city || !data.state || !data.pincode) && (!data.account_holder_name && !data.account_number && !data.IFSC_code)) {
                    return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए सारी जानकारी भरें' : 'Fill all information to proceed' });
                }
                if ((!data.shirt_size && !data.address_student_name && !data.mobile && !data.address_line_1 && !data.address_line_2 && !data.address_line_3 && !data.city && !data.state && !data.pincode) && (!data.account_holder_name || !data.account_number || !data.IFSC_code)) {
                    return res.status(200).json({ errormessage: locale == 'hi' ? 'आगे बढ़ने के लिए सारी जानकारी भरें' : 'Fill all information to proceed' });
                }
                await dnExamHelper.setPrizeFormData(db.mysql.write, data, studentId, examId);
            }
            reward = await dnExamRewardsHelper.generateResult(db, data, examId);
            if (reward.length) {
                reward = reward[0];
            }
            if (!successMessage) {
                successMessage = dnExamRewardsHelper.getTestimonialSuccess(examData.hindi_display_name, examData.english_display_name, locale, reward, studentData.result_verified);
            }
        }

        responseData.data = successMessage;
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function getSheetCourses(req, res, next) {
    try {
        const { locale } = req.query;
        const { student_class: studentClass, student_id: studentId } = req.user;
        const xAuthToken = req.headers['x-auth-token'];
        const db = req.app.get('db');
        const config = req.app.get('config');

        const courseData = await dnExamRewardsHelper.getCourseData(db, studentClass, config, 880, studentId, locale, xAuthToken);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: scholarshipHelper.getPopularCoursesWidget(courseData, [{}]),
        };

        if (locale == 'hi') {
            for (let i = 0; i < responseData.data.data.items.length; i++) {
                if (responseData.data.data.items[i].title == 'Subject') {
                    responseData.data.data.items[i].title = 'विषय';
                }
                if (responseData.data.data.items[i].title == 'Course') {
                    responseData.data.data.items[i].title = 'कोर्स';
                }
            }
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        return next(e);
    }
}

module.exports = {
    getSignedUrl,
    getHomepage,
    getFAQs,
    viewMoreToppers,
    redirect,
    getFormData,
    postFormData,
    getClasses,
    getExamsList,
    getSheetCourses,
    postExamsList,
    getversionUpdate,
};