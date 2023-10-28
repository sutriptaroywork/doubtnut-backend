const _ = require('lodash');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const Data = require('../../../data/data');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TeacherMysql = require('../../../modules/mysql/teacher');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CourseHelper = require('../../helpers/course');
const ClassContainer = require('../../../modules/containers/class');
const Utility = require('../../../modules/utility');
const questionsHelper = require('../../helpers/question.helper');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');

async function generateAssortmentVariantMapping(db, assortments) {
    /**
    Functionality - get price variants of given assortments
    param1 (assortments) - array of assortments
    returns - assorment price vaiant mapping
    author - Megha (primary), Saurabh Raj
    */
    let promise = [];
    for (let i = 0; i < assortments.length; i++) {
        promise.push(CourseContainerv2.getDefaultVariantFromAssortmentIdHome(db, assortments[i]));
    }
    const allPackages = await Promise.all(promise);
    const experimentPricing = [];
    const enabled = true;
    const assortmentPriceMapping = {};
    const assortmentList = [];
    promise = [];
    const userBatches = {};
    const promise2 = [];
    if (assortments && assortments.length) {
        for (let i = 0; i < assortments.length; i++) {
            promise2.push(CourseContainerv2.getLastestBatchByAssortment(db, assortments[i]));
        }
        const latestBatch = await Promise.all(promise2);
        for (let i = 0; i < latestBatch.length; i++) {
            if (latestBatch[i].length) {
                userBatches[latestBatch[i][0].assortment_id] = latestBatch[i][0].batch_id;
            }
        }
    }
    for (let i = 0; i < allPackages.length; i++) {
        if (allPackages[i].length) {
            allPackages[i] = allPackages[i].filter((item) => !item.flag_key);
            const experiementObj = experimentPricing.filter((item) => item.assortment_id === allPackages[i][0].assortment_id);
            if (experiementObj.length) {
                allPackages[i] = [...allPackages[i], ...experiementObj];
                allPackages[i] = _.orderBy(allPackages[i], 'duration_in_days');
            }
            if (userBatches[allPackages[i][0].assortment_id]) {
                const latestBatch = allPackages[i].filter((item) => item.batch_id === userBatches[allPackages[i][0].assortment_id]);
                allPackages[i] = latestBatch.length ? latestBatch : allPackages[i];
            }
            const len = allPackages[i].length;
            const priceObj = allPackages[i][len - 1];
            if (priceObj) {
                assortmentPriceMapping[parseInt(priceObj.assortment_id)] = {
                    package_variant: priceObj.variant_id,
                    base_price: priceObj.base_price,
                    display_price: priceObj.display_price,
                    duration: priceObj.duration_in_days,
                    monthly_price: allPackages[i][len - 1] ? Math.floor(allPackages[i][len - 1].display_price / Math.floor(allPackages[i][len - 1].duration_in_days / 30)) : 0,
                };
            }
            assortmentList.push(allPackages[i][0].assortment_id);
            if (allPackages[i].length > 1) {
                assortmentPriceMapping[parseInt(allPackages[i][0].assortment_id)].multiple = true;
                assortmentPriceMapping[parseInt(allPackages[i][0].assortment_id)].enabled = enabled;
            }
        } else {
            assortmentPriceMapping[parseInt(assortments[i])] = {};
        }
    }
    return assortmentPriceMapping;
}

function getPopularCourseWidget({
    result,
    locale,
    courseFeatures,
    assortmentPriceMapping,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const courseIdDetails = [
            {
                title: locale === 'hi' ? 'अपने टारगेट एग्जाम में 9०%+ पाएं!' : 'Score 90%+ in your target exam',
                image_url: '',
            },
            {
                title: result[i].liveclass_course_id ? `${locale === 'hi' ? 'कोर्स' : 'Course'} ID #${result[i].liveclass_course_id}` : '',
                image_url: '',
            },
        ];
        const number = Utility.getRandomInt(150, 500);
        if (assortmentPriceMapping[result[i].assortment_id]) {
            items.push({
                assortment_id: result[i].assortment_id,
                title: result[i].display_name,
                faculty_image: Data.fixedNKCImage,
                course_details: [...courseFeatures[i], ...courseIdDetails],
                price: assortmentPriceMapping[result[i].assortment_id] && assortmentPriceMapping[result[i].assortment_id].monthly_price ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
                strike_through_text: assortmentPriceMapping[result[i].assortment_id] && assortmentPriceMapping[result[i].assortment_id].base_price ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '',
                price_text_size: assortmentPriceMapping[result[i].assortment_id].monthly_price / 1000 > 0 ? '13' : '15',
                button_text: [1000358, 1000363].includes(result[i].assortment_id) ? 'Register FREE' : 'Register NOW',
                tag_data: [
                    {
                        title: Data.getCourseMediumByLocale(locale)[result[i].meta_info] || result[i].meta_info,
                        bg_color: '#ffffff',
                    },
                    {
                        title: locale === 'hi' ? 'Enroll Now' : 'Enroll Now',
                        bg_color: '#8064f4',
                    },
                ],
                enrolled_text: `${number} students enrolled in the last hour`,
            });
        }
    }
    return {
        type: 'widget_course_v3',
        data: {
            title: 'Recommended Courses',
            items,
        },
    };
}

async function getPopularCourseWidgetData({
    db, result, config, locale, assortmentPriceMapping,
}) {
    /**
    Functionality - get course widget
    param1 (result) - course details info
    param2 (assortmentPriceMapping) - array with price variant mapped to the course assortment
    author - Megha (primary - used for Courses for Extra Marks carousel on explore page, all courses tab), Saurabh Raj
    */
    const defaultCoursePrePurchaseDetails = await CourseContainerv2.getPrePurchaseCourseHighlights(db, 0, locale, 4);
    const promise = [];
    const courseFeatures = [];
    for (let i = 0; i < result.length; i++) {
        promise.push(CourseContainerv2.getPrePurchaseCourseHighlights(db, result[i].assortment_id, locale, 4));
    }
    const featuresData = await Promise.all(promise);
    for (let i = 0; i < featuresData.length; i++) {
        if (featuresData[i].length) {
            for (let j = 0; j < featuresData[i].length; j++) {
                featuresData[i][j].image_url = featuresData[i][j].image_url || `${config.cdn_url}engagement_framework/552884D3-56A5-2133-DA3A-708AB9F74DDE.webp`;
            }
            courseFeatures.push(featuresData[i]);
        } else {
            courseFeatures.push(defaultCoursePrePurchaseDetails);
        }
    }
    return getPopularCourseWidget({
        db, result, config, locale, assortmentPriceMapping, courseFeatures,
    });
}

async function videoResource(db, config, questionId) {
    /**
    Functionality - Get video resources
    param1 (questionId) - question id of the video
    returns - object containing array of video resources
    author - Saurabh Raj
    */
    const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, questionId);
    let videoResources;
    if (answerData.length) {
        videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, questionId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
    }
    return videoResources;
}

async function getDetails(req, res, next) {
    /**
    Functionality - Get Details for NKC web landing
    returns - widgets with announcement video, team details, testimonails, course details and callback
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');

        const widgets = [];
        const assortmentList = [1000358, 1000359, 1000360, 1000363];
        const [videoInfo, teacherDetails] = await Promise.all([AppConfigurationContainer.getConfigByKey(db, 'nkc_video'), TeacherMysql.getTearcherDetailsByCourseAssortment(db.mysql.read, assortmentList)]);
        let thumbnail;
        let questionId;
        if (!_.isEmpty(videoInfo)) {
            thumbnail = videoInfo[0].key_value.split('||')[0];
            questionId = videoInfo[0].key_value.split('||')[1];
        }
        const videoDetails = {
            type: 'video',
            items: [{
                thumbnail,
            }],
        };
        // const videoResources = await videoResource(db, config, questionId);
        const videoResources = [{
            resource: `${config.staticCDN}NKC_SIR_PROMO.mp4`,
            video_resource: 'NKC_SIR_PROMO.mp4',
            timeout: 4,
            drm_scheme: 'widevine',
            media_type: 'BLOB',
            drop_down_list: [],
            drm_license_url: '',
            offset: null,
        }];
        videoDetails.items[0].video_resources = videoResources;
        widgets.push(videoDetails);
        widgets.push({
            type: 'metrics',
            rating: '4.8 rating',
            registered_students: '8500+ students registered',
            selections: '2000+ IIT selections',
        });
        widgets.push({
            type: 'highlights',
            title: 'Highlights of the course',
            items: ["Free Crash Course, by India's Top Educator NKC Sir", 'A team of 15+ Years experienced Teachers', 'Many Under 100 rankers produced over the years', 'Daily Live Classes with DPP', 'Mock Tests, Tips & Tricks'],
        });
        const teacherItems = {
            type: 'team_details',
            title: 'Our Team',
            items: [],
        };
        const index = teacherDetails.findIndex((item) => item.faculty_id === 805);
        if (index !== -1) {
            [teacherDetails[0], teacherDetails[index]] = [teacherDetails[index], teacherDetails[0]];
        }
        const ratingArr = [4.9, 4.8, 4.9, 4.8, 4.8];
        for (let i = 0; i < teacherDetails.length; i++) {
            teacherItems.items.push({
                name: teacherDetails[i].name,
                image: teacherDetails[i].image_url,
                degree: teacherDetails[i].degree,
                experience: `${teacherDetails[i].experience} yrs Experience in ${teacherDetails[i].subjects}`,
                rating: ratingArr[i],
            });
        }
        widgets.push(teacherItems);
        const testimonial = Data.testimonialArray;
        const testimonialWidget = {
            type: 'testimonial',
            title: 'What our students say about us',
            items: [],
        };
        for (let i = 0; i < testimonial.length; i++) {
            testimonialWidget.items.push({
                image: testimonial[i].image,
                name: testimonial[i].name,
                text: testimonial[i].text,
            });
        }
        widgets.push(testimonialWidget);
        // let data = await CourseMysqlV2.getCourseDetailsFromAssortmentId(db.mysql.read, assortmentList);
        // data = data.filter((thing, index1, self) => index1 === self.findIndex((t) => (
        //     t.assortment_id === thing.assortment_id
        // )));
        // const assortmentPriceMapping = await generateAssortmentVariantMapping(db, assortmentList);
        // const widgetPopular = await getPopularCourseWidgetData({
        //     db, result: data, config, locale: 'en', assortmentPriceMapping,
        // });
        // for (let i = 0; i < widgetPopular.data.items.length; i++) {
        //     if (widgetPopular.data.items[i].assortment_id === 1000363) {
        //         widgetPopular.data.items[i].title = 'Build a strong foundation for JEE & NEET Preparation';
        //     } else {
        //         widgetPopular.data.items[i].course_details[4].title = 'Secure top rank in JEE Main & Advance';
        //     }
        // }
        // widgets.push(widgetPopular);
        widgets.push({
            type: 'bottom_sticky_button',
            button_cta: 'Register for FREE',
            assortment_id: '1000358',
        });
        const classes = await ClassContainer.getClassListNewOnBoardingForHome(db, 'english', 'IN');
        const callbackwidget = {
            type: 'callback_popup',
            title1: 'Register Now for Doubtnut',
            title2: 'Only limited spots available',
            button_cta: 'Submit Request',
            class_dropdown: [],
        };
        for (let i = 0; i < classes.length; i++) {
            if (classes[i].class > 8 && classes[i].class < 14) {
                callbackwidget.class_dropdown.push({
                    student_class: classes[i].class,
                    display_text: classes[i].class_display,
                });
            }
        }
        widgets.push(callbackwidget);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                heading1: 'Doubtnut Launches',
                heading2: 'Free JEE 2022 Crash Course',
                heading3: 'by NKC Sir',
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function setDetails(req, res, next) {
    /**
    Functionality - Set data in leads_web_landing_page table
    param1 (mobile)
    param2 (studentClass)
    param3 (assortmentId)
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const { mobile, assortment_id: assortmentId, student_class: studentClass } = req.body;
        const check = await CourseMysqlV2.checkNKCInterestedDetails(db.mysql.read, assortmentId, mobile, 'NKC', studentClass);
        let messageToSend = 'Already Requested';
        if (_.isEmpty(check)) {
            await CourseMysqlV2.setNKCInterestedDetails(db.mysql.write, assortmentId, mobile, 'NKC', studentClass);
            messageToSend = 'Request Accepted';
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                message: messageToSend,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getNKCSignedUrl(req, res, next) {
    /**
    Functionality - get the s3 signed url to upload the file
    param1 (studentId)
    param2 (mime_type) - the type of file
    return - signed_url, filePath
    author - Saurabh Raj
    */
    try {
        const s3 = req.app.get('s3');
        const config = req.app.get('config');
        const {
            mime_type: proofMime, student_id: studentId,
        } = req.query;

        const data = {};
        if (!_.includes(['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'], proofMime)) {
            return next({
                message: 'Thumbnail Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        let fileName = `${uuidv4()}.png`;
        if (proofMime.includes('pdf')) {
            fileName = fileName.replace('.png', '.pdf');
        }
        const prefix = `nkc/${studentId}/${moment().unix().toString()}/${fileName}`;
        data.filePath = `${config.cdn_url}${prefix}`;
        data.signed_url = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnut-static', prefix, 12000, proofMime, 'public-read');
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function setNKCOldStudentsData(req, res, next) {
    /**
    Functionality - Set old students proof data in nkc_old_students table
    param1 (student_id)
    param2 (file_path)
    param3 (mobile)
    param4 (email)
    param5 (name)
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const {
            student_id: studentId, file_path: filePath, mobile, email, name,
        } = req.body;

        const checkFileEntry = await CourseMysqlV2.checkNKCOldStudentProofDetails(db.mysql.read, studentId, mobile);
        let message = 'Successfully Updated';
        if (!_.isEmpty(checkFileEntry)) {
            await CourseMysqlV2.updateNKCOldStudentProofDetails(db.mysql.write, studentId, mobile, filePath);
        } else {
            await CourseMysqlV2.setNKCOldStudentProofDetails(db.mysql.write, studentId, mobile, filePath, email, name);
            message = 'Uploaded Successfully';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                message,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getDetails,
    setDetails,
    getNKCSignedUrl,
    setNKCOldStudentsData,
};
