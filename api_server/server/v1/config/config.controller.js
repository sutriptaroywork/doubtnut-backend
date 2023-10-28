/* eslint-disable prefer-const */
/* eslint-disable no-useless-return */
/* eslint-disable no-restricted-globals */
const _ = require('lodash');

let db;
// eslint-disable-next-line no-unused-vars
let config;
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const configSql = require('../../../modules/config');
const Utility = require('../../../modules/utility');
const Question = require('../../../modules/question');
const Data = require('../../../data/data');
const QuestionHelper = require('../../helpers/question.helper');
const Student = require('../../../modules/student');
const StudentContainer = require('../../../modules/containers/student');
const UserPrpertiesContainer = require('../../../modules/containers/userProperties');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const CourseMysql = require('../../../modules/mysql/coursev2');
const NudgeHelper = require('../../helpers/nudge');
const CourseContainer = require('../../../modules/containers/coursev2');
const PackageContainer = require('../../../modules/containers/package');
const BranchContainer = require('../../../modules/containers/branch');
const AnswerRedis = require('../../../modules/redis/answer');
const StudentHelper = require('../../helpers/student.helper');
const StudentRedis = require('../../../modules/redis/student');
const freeLiveClassHelper = require('../../helpers/freeLiveClass');
const D0UserManager = require('../../helpers/d0User.helper');
const campaignHelper = require('../../helpers/campaign');
const logger = require('../../../config/winston').winstonLogger;
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const altAppData = require('../../../data/alt-app');

const utiliesResponseData = (code, success, message, data) => {
    const ResponseData = {
        meta: {
            code,
            success,
            message,
        },
        data,
    };
    return ResponseData;
};

async function getData(parameters) {
    let {
        studentID, showUserProperties, cameraTitle,
    } = parameters;
    const pms = [];
    pms.push(AppConfigurationContainer.getConfigByKey(db, 'camera'));
    if (studentID !== undefined) {
        pms.push(StudentContainer.getById(studentID, db));
        if (showUserProperties) {
            pms.push(UserPrpertiesContainer.getByStudentID(db, studentID));
        }
    }
    const resolvedPromises = await Promise.all(pms);

    let data = resolvedPromises[0];
    data = JSON.parse(data[0].key_value);
    data.new_question_ask = '0';
    data.force_update = false;
    let isEtoosEnabled = true;
    let userProperties = UserPrpertiesContainer.getDefault();
    if (studentID !== undefined) {
        const student = resolvedPromises[1];
        if (student.length > 0 && _.includes(['9', '10'], student[0].student_class)) {
            isEtoosEnabled = false;
        }
        if (showUserProperties) {
            if (resolvedPromises[2].length > 0) {
                userProperties = resolvedPromises[2][0].properties;
            }
            data.user_property = userProperties;
        }
        if (student[0].locale === 'hi') {
            cameraTitle = 'प्रश्न पूछें';
        }
    }
    data.is_etoos_enable = isEtoosEnabled;
    data.video_cdn_base_url = config.cdn_video_url;
    studentID = +(studentID);
    if (studentID % config.bounty_mod_factor === 0) {
        data.is_bounty_enable = true;
    }
    data.course_enabled_class = '11,12,13';
    data.live_class_enabled_class = '6,7,8,9,10,11,12,13,14';
    data.home_page_camera_title = cameraTitle;
    data.start_uxcam = '3';
    const [moengageData, lastTimeVideoWatch] = await Promise.all([
        db.mongo.read.collection('moengage_user_property').find({ student_id: studentID, data_for_date: moment().format('YYYY-MM-DD').toString() }, { projection: { _id: 0, student_id: 0, data_for_date: 0 } }).toArray(),
        AnswerRedis.getLiveclassExp(db.redis.read, 'last_video_watch_from_liveclass_notification', studentID), // using existing function to avoid duplicacy
    ]);

    data.moengage_user_property = moengageData.length ? moengageData[0] : { live_class_video_watched_in_3_days: false };
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    data.moengage_user_property.live_class_video_watched_in_3_days = !!((lastTimeVideoWatch && (currentTimeInSeconds - lastTimeVideoWatch) / (60 * 60 * 24) < 3));
    return data;
}

async function handleCampaign(parameters) {
    const {
        aaid, studentID, versionCode, isFreeApp,
    } = parameters;

    const data = {};
    let campaignData = '';
    let campaignDataId = '';
    if (!_.isEmpty(aaid) && aaid !== '00000000-0000-0000-0000-000000000000') {
        campaignData = await db.redis.read.hgetAsync('branch_data', `aaid_${aaid}`);
        if (campaignData) {
            campaignDataId = campaignData.split(':_:')[0].split(';;;')[0];
        }
    }

    let campaignDataStoredInStudent;
    if (studentID) {
        campaignDataStoredInStudent = await StudentRedis.getCampaignData(db.redis.read, studentID);
    }
    // campaign = 'UAC_InApp_Buy_Now_IBPS';
    let campaign = '';
    if (!campaignDataStoredInStudent || !campaignData || campaignDataStoredInStudent === campaignDataId) {
        campaign = campaignDataStoredInStudent || campaignDataId;
    } else {
        campaign = await campaignHelper.getCampaignWithHigherPriority(db, campaignDataId, campaignDataStoredInStudent);
    }
    // const  = campaignDataStoredInStudent || campaignData || '';

    // get deeplink
    //
    // 1-enable
    // 2-disable
    // 3-enable for 3% user

    const deeplink = await BranchContainer.getByCampaign(db, campaign);
    if (!_.isEmpty(deeplink)) {
        data.install_campaign_name = deeplink[0].campaign;
        data.campaign_landing_deeplink = ((campaign.includes('CEO_REFERRAL') && versionCode < 1012) || (isFreeApp)) ? '' : deeplink[0].deeplink;
        if (!isNaN(studentID) && !_.isNull(deeplink[0].uxcam_enable) && deeplink[0].uxcam_enable == 1 && (_.get(deeplink, '[0].uxcam_percentage', 0) > (studentID % 100))) {
            data.start_uxcam = '1';
        } else {
            data.start_uxcam = '2';
        }
    }
    return data;
}

async function getCountry(studentID) {
    let country = 'IN';
    const data = {};
    if (!isNaN(studentID)) {
        country = _.get(await StudentHelper.getUserCountryAndCurrency(db, studentID), 'country', '');
    }
    if (country === 'AE') {
        data.start_uxcam = '1';
    }
    return data;
}

async function onboard(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentClass = '12';
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        // eslint-disable-next-line prefer-const
        let { student_id: studentID, gaid: aaid } = req.query;
        const { version_code: versionCode } = req.headers;
        let showUserProperties = false;
        const cameraTitle = 'Ask Doubt';

        if (versionCode > 756) {
            showUserProperties = true;
        }
        const promises = [];
        promises.push(getData({
            studentID, studentClass, showUserProperties, cameraTitle,
        }));
        promises.push(handleCampaign({
            aaid, studentID, versionCode, isFreeApp,
        }));
        promises.push(getCountry(studentID));

        const resolvedPromises = await Promise.all(promises);

        let data = {};

        for (let i = 0; i < resolvedPromises.length; i++) {
            data = { ...data, ...resolvedPromises[i] };
        }

        const responseData = utiliesResponseData(200, true, 'SUCCESS', data);

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getQuestionDemo(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const region = req.headers.country || 'IN';
        const { student_class } = req.user;
        let data = await AppConfigurationContainer.getConfigByKeyAndClass(db, 'demo', student_class);
        if (req.user.locale === 'hi' && !Utility.isUsRegion(region)) {
            data = JSON.parse(data[0].key_hindi_value);
        } else {
            data = JSON.parse(data[0].key_value);
        }
        data.demo_ocr_image = buildStaticCdnUrl(data.demo_ocr_image);
        const responseData = utiliesResponseData(200, true, 'SUCCESS', data);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

function getLoginConfigMeta(req, res) {
    try {
        const { version_code } = req.headers;
        const social_login_obj = {
            login_method: 'SOCIAL',
        };
        const active_social_login_methods = [];
        if (version_code > 826) {
            active_social_login_methods.push('GMAIL');
            active_social_login_methods.push('FACEBOOK');
        }
        const is_social_login_active = !!active_social_login_methods.length;
        social_login_obj.acitve_methods = active_social_login_methods;
        social_login_obj.is_active = is_social_login_active;
        const data = [
            {
                ...social_login_obj,
            },
            {
                login_method: 'PHONE_NUMBER',
                acitve_methods: [
                    'FIREBASE',
                ],
                is_active: true,
            },
            {
                login_method: 'EMAIL',
                acitve_methods: [
                    'EMAIL_OTP',
                ],
                is_active: true,
            },
        ];
        const responseData = utiliesResponseData(200, true, 'SUCCESS', data);
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.log(error);
    }
}

async function getSignedUrl(req, res, next) {
    try {
        db = req.app.get('db');
        const s3 = req.app.get('s3');
        const sns = req.app.get('sns');
        const signedUrlExpireSeconds = 60 * 60;
        const { student_id } = req.user;
        const { student_class } = req.user;

        console.log('student');

        const timestamp = moment().unix();
        const fileName = `q_upload_${student_id}_${timestamp}.png`;
        const myBucket = 'dn-test-questionupload';
        const params = {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: 'public-read',
            ContentType: 'image/png',
        };
        s3.getSignedUrl('putObject', params, async (err, url) => {
            console.log('err ', err);
            console.log('url', url);

            if (_.isNull(err)) {
                const insertedQuestion = {};
                insertedQuestion.student_id = student_id;
                insertedQuestion.class = student_class;
                insertedQuestion.subject = '';
                insertedQuestion.book = 'DEFAULT';
                insertedQuestion.chapter = 'DEFAULT';
                insertedQuestion.question = 'about to only mathematics';
                insertedQuestion.doubt = 'about to only mathematics';
                insertedQuestion.locale = 'en';
                const insertedQuestionPromise = await Question.addQuestion(insertedQuestion, db.mysql.write);
                const qid = insertedQuestionPromise.insertId;
                const uuid = uuidv4();
                QuestionHelper.sendSnsMessage({
                    type: 'question-init',
                    sns,
                    uuid,
                    qid,
                    studentId: student_id,
                    studentClass: student_class,
                    subject: insertedQuestion.subject,
                    chapter: insertedQuestion.chapter,
                    version: insertedQuestion.question,
                    ques: insertedQuestion.question,
                    locale: insertedQuestion.locale,
                    UtilityModule: Utility,
                    questionInitSnsUrl: Data.questionInitSnsUrl,
                    config,
                });
                const data = {
                    url,
                    fileName,
                    question_id: qid,
                    polling: [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500],
                };
                const responseData = utiliesResponseData(200, true, 'SUCCESS', data);
                return res.status(responseData.meta.code).json(responseData);
            }
            const responseData = utiliesResponseData(500, false, 'Error in generating signed url', null);
            res.status(responseData.meta.code).json(responseData);
        });
    } catch (e) {
        next(e);
    }
}

async function getBottomSheetNavigationForIIT(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const data = { url: null, show_count: 0 };

        const responseData = utiliesResponseData(200, true, 'SUCCESS', data);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function submitBottomSheet(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const classVal = req.body.class_val;
        const obj = { student_class: classVal };
        const tempData = await Student.insertStudentClass(db.mysql.write, classVal, studentId);
        if (tempData.insertId != undefined && tempData.insertId != 0) {
            const updateData = await Student.updateStudentDetails(db.mysql.write, obj, studentId);
            if (updateData.changedRows != undefined && updateData.affectedRows == 1) {
                Student.updateStudentClass(db.mysql.write, tempData.insertId, studentId);
                Student.deleteUserInRedis(studentId, db.redis.write);
            }
        }
        const responseData = utiliesResponseData(200, true, 'SUCCESS', null);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

// insert studentId for r2v2
async function insertR2V2Student(deviceType, studentId) {
    if (deviceType === 'merchant') {
        const R2V2Student = await StudentContainer.checkR2V2Student(db, studentId);
        if (parseInt(R2V2Student) === 0) {
            CourseMysql.setR2V2StudentId(db.mysql.write, studentId);
        }
    }
    return;
}

async function handleInappIBPS(campaign, studentId) {
    if (campaign === 'UAC_InApp_Buy_Now_IBPS') {
        // check if trial is there or not
        const [trial1, trial2] = await Promise.allSettled([CourseMysql.getUserPackagesByAssortment(db.mysql.read, studentId, 465140), CourseMysql.getUserPackagesByAssortment(db.mysql.read, studentId, 495269)]);
        if (trial1.status === 'fulfilled') {
            if (trial1.value.length === 0) {
                // activate trial
                PackageContainer.createSubscriptionEntryForTrialV1(db, studentId, 465140, -1, 3);
            }
        } else {
            // logger.warn(`Trial could not be started for student ${studentId} for assorment 465140 due to ${trial1.reason}`);
        }
        if (trial2.status === 'fulfilled') {
            if (trial2.value.length === 0) {
                // activate trial
                PackageContainer.createSubscriptionEntryForTrialV1(db, studentId, 495269, -1, 3);
            }
        } else {
            // logger.warn(`Trial could not be started for student ${studentId} 495269 due to ${trial2.reason}`);
        }
    }
    return;
}

async function getOnboardingSettings(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            student_id: studentId, locale: studentLocale, timestamp, campaign,
        } = req.user;
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        let { student_class: studentClass } = req.body;
        const { version_code: versionCode, dn_device_type: deviceType } = req.headers;
        studentClass = studentClass || req.user.student_class;
        const { session_count: sessionCount, post_purchase_session_count: postPurchaseSessionCount } = req.query;
        // * Return success response if the version code is greater than or equal to 868
        let data = {};
        data.appDataCollect = 1;
        const studentData = await db.mongo.read.collection('student_app_data').findOne({ student_id: studentId }, { updated_at: 1 });
        insertR2V2Student(deviceType, studentId);
        handleInappIBPS(campaign, studentId);
        StudentRedis.incrementNewHomepageCount(db.redis.read, studentId);

        if (studentData) {
            const currentDate = moment();
            if (currentDate.diff(studentData.updated_at, 'days') < 7) {
                data.appDataCollect = 0;
            }
        }

        if (versionCode > 963) {
            data.default_onboarding_deeplink = await StudentHelper.getLandingDeeplink(db, studentId, timestamp);
        }
        if (versionCode > 912) {
            data.pre_purchase_calling_card_data = {
                title_problem_search: 'Course dhundhne mein ho rhi pareshani?',
                subtitle_problem_search: 'Humse Connect Karen Abhi!',
                title_problem_purchase: 'Course purchase mein aa rhi dikkat',
                subtitle_problem_purchase: 'Humse Connect Karen Abhi!',
                title_payment_failure: 'Payment mein ho rhi problem?',
                subtitle_payment_failure: 'Karo Connect or karo course apne naam!',
                number: '01247158250',
                flag_id: 367,
                variant_id: 1426,
                callback_deeplink: 'doubtnutapp://dialer?mobile=01247158250',
                chat_deeplink: 'doubtnutapp://chat_support',
                callback_btn_show: true,
                chat_btn_show: false,
            };
            // handle campaign redirection block
            // check if campaign flagr is enabled or not
            // if (!_.isEmpty(flagrResp.campaign_redirection) && flagrResp.campaign_redirection.enabled && !_.isEmpty(flagrResp.campaign_redirection.payload) && flagrResp.campaign_redirection.payload.enabled) {
            //     // check aaid exist in redis or not
            //     let campaign = await db.redis.read.hgetAsync(`branch:${moment().format('YYYY-MM-DD')}`, aaid);
            //     campaign = 'UAC_InApp_Buy_Now_Spoken_English';
            //     if (!_.isNull(campaign) && !_.isEmpty(flagrResp.campaign_redirection.payload.data[campaign])) {
            //         // get mapping
            //         data.first_page_deeplink = flagrResp.campaign_redirection.payload.data[campaign];
            //     }
            // }
            if (!_.isEmpty(req.headers.package_name) && req.headers.package_name === 'com.doubtnut.iit.jee.maths') {
                if (_.includes([11, 12, 13], +studentClass)) {
                    data.first_page_deeplink = 'doubtnutapp://course_details?id=1000359';
                }
                if (_.includes([9, 10], +studentClass)) {
                    data.first_page_deeplink = 'doubtnutapp://course_details?id=1000360';
                }
            }
        }
        if (versionCode >= 934) {
            data.hamburger_data = {
                whatsapp_text: 'WhatsApp 8400400400',
                whatsapp_icon_url: buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/whatsapp_topicon.webp'),
                whatsapp_deeplink: 'doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Hi',
            };
            data.profile_data = {
                whatsapp_text: 'WhatsApp \n 8400400400',
                whatsapp_icon_url: buildStaticCdnUrl('https://d10lpgp6xz60nq.cloudfront.net/images/whatsapp_topicon.webp'),
                whatsapp_deeplink: 'doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Hi',
            };
            if (versionCode >= 974) {
                data.profile_data.practice_english_text = 'English Seekho';
                data.profile_data.practice_english_icon_url = `${config.staticCDN}images/2021/12/24/06-39-47-814-AM_Frame%20501%403x.webp`;
                data.profile_data.practice_english_deeplink = 'doubtnutapp://practice_english';
            }
        }

        if (versionCode >= 1010) {
            data.journey_count = {};
            const d0UserManager = new D0UserManager(req);
            if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status()) {
                const questionAskedResponse = await Question.getOnlyQuestionAsked(db.mysql.read, studentId, 5, 0);
                if (questionAskedResponse) {
                    data.journey_count = {
                        d0_qa_count: questionAskedResponse.length,
                        camera_open_count: req.headers.camera_open_count ? req.headers.camera_open_count : 0,
                    };
                }
            }
            data.journey_count.shorts_viewed_count = req.headers.shorts_viewed_count ? req.headers.shorts_viewed_count : 0; // initially setting shorts viewed count to 0 for every user
        }

        if (versionCode >= 1008) {
            data.pre_purchase_calling_card_data = {
                title_problem_search: studentLocale === 'hi' ? 'कोर्स ढूंढने में मदद के लिए हमसे बात करें!' : 'Course dhundhne me madad ke lie hmse bat kare!',
                title_problem_purchase: studentLocale === 'hi' ? 'कोर्स खरीदने में मदद के लिए हमसे बात करें!' : 'Course kharidne me madad ke lie hmse bat kare!',
                title_payment_failure: studentLocale === 'hi' ? 'पेमेंट करने में हो रही प्रॉब्लम तो हमसे बात करें' : 'Payment karne me ho rhi problem to humse bat kare!',
                callback_deeplink: 'doubtnutapp://dialer?mobile=01247158250',
                chat_deeplink: 'doubtnutapp://dialer?mobile=01247158250',
                title_text_size: 14,
                title_text_color: '#ba2a08',
                action: studentLocale === 'hi' ? 'कॉल करें' : 'Call Now',
                action_text_size: 22,
                action_text_color: '#e95429',
                action_image_url: `${config.staticCDN}engagement_framework/4EF8EE6A-8090-DF5A-0DAF-F5E355CDBD08.webp`,
                image_url: `${config.staticCDN}engagement_framework/461FB905-BD72-2505-0686-5D376A5A28A0.webp`,
                background_color: '#ffffff',
            };
        }
        const meta = {};
        if (campaign && +versionCode >= 1000) {
            const deeplink = await BranchContainer.getByCampaign(db, campaign);
            if (_.get(deeplink, '[0].description', '').toLowerCase().includes('bnb_campaign_vijay')) {
                _.set(meta, 'analytics.events', [{
                    params: {
                        student_id: studentId,
                    },
                    platforms: ['moengage'],
                    name: 'bnb_campaign_user',
                }]);
            }
        }
        if (versionCode >= 868) {
            if (versionCode >= 872) {
                const [totalEngagementTime, userActivePackages] = await Promise.all([
                    freeLiveClassHelper.getLast30DaysEngagement(studentId),
                    CourseContainer.getUserActivePackages(db, studentId),
                ]);
                const packageType = userActivePackages.filter((e) => _.includes(['course', 'class', 'subject'], e.assortment_type));
                if (!userActivePackages.length && totalEngagementTime < 1200) {
                    data.default_online_class_tab_tag = 'free_classes';
                }
                data.live_class_data = {
                    show_my_courses_tab: (!!(packageType.length)),
                    show_free_classes: !packageType.length || isFreeApp,
                    show_timetable: ((!!(packageType.length)) && (!isFreeApp)),
                };
                if (packageType.length) {
                    data.live_class_data.vip_assortment_id = packageType[0].assortment_id;
                    data.live_class_data.show_course_selection = packageType.length > 1;
                    if (packageType[0].assortment_id === 138829) {
                        data.live_class_data.category_id = 'Kota Classes';
                    }
                }
                if (versionCode > 906 && versionCode <= 1010) {
                    data.popup_deeplink = await NudgeHelper.getPopUpDeeplink({
                        db,
                        locale: studentLocale,
                        studentClass,
                        event: 'homepage',
                        studentID: studentId,
                    });
                }
            }
            return next({ meta, data });
        }

        // * Return success response if the session count and post purchase session count is not equals 1
        if (!(+sessionCount === 1 || +postPurchaseSessionCount === 1)) {
            return next({ meta, data });
        }

        const [
            items,
            userActivePackages,
        ] = await Promise.all([
            CourseContainer.getOnboardingItems(db, studentLocale, 1),
            CourseMysql.getUserActivePackagesByClass(db.mysql.read, studentId, studentClass),
        ]);

        // * Sort items based on sorting_id
        items.sort((item1, item2) => {
            if (item1.sorting_id < item2.sorting_id) {
                return -1;
            }
            if (item1.sorting_id > item2.sorting_id) {
                return 1;
            }
            return 0;
        });

        const userActiveCourse = {};
        let shouldSendOnboardingSettings = false;

        // * Flag to check whether to send onboarding data to user based on user active packages
        if (userActivePackages.length) {
            const packageType = userActivePackages.filter((e) => e.assortment_type === 'course');
            if (packageType.length === 1) {
                userActiveCourse.assortmentId = packageType[0].assortment_id;
                const courseResourceMappingItems = await CourseMysql.getScheduleTypeWithAssortmentId(db.mysql.read, packageType[0].assortment_id);
                userActiveCourse.scheduleType = courseResourceMappingItems[0].schedule_type;
                userActiveCourse.scheduleTypeColumn = userActiveCourse.scheduleType === 'scheduled' ? 'non_recorded_position' : 'recorded_position';
                shouldSendOnboardingSettings = true;
            }
        }

        if (!shouldSendOnboardingSettings) {
            return next({ data: null });
        }

        const buttonTextObj = {
            hi: {
                next: 'अगला',
                last: 'फिरसे शुरू करें',
            },
            non_hi: {
                next: 'Next',
                last: 'Start again',
            },
        };

        const localeText = (studentLocale === 'hi') ? 'hi' : 'non_hi';

        const onboardingItems = items.map((item, index) => {
            const newItem = {
                id: item.id,
                title: item.title,
                description: item.description,
                audio_url: buildStaticCdnUrl(item.audio_url),
                radius: 0,
                position: item[userActiveCourse.scheduleTypeColumn],
                button_text: index === items.length - 1 ? buttonTextObj[localeText].last : buttonTextObj[localeText].next,
            };
            if (item.title === 'Click on My Courses' || item.title === 'माई कोर्सेज पर क्लिक करें') {
                newItem.deeplink = `doubtnutapp://course_details?id=${userActiveCourse.assortmentId}`;
            }
            return newItem;
        });

        data = {
            onboarding: onboardingItems,
        };
        next({ meta, data });
    } catch (err) {
        next({ err });
    }
}
function coralogixTest(req, res, next) {
    throw new Error('coralogix-stack-test');
}

module.exports = {
    onboard,
    getQuestionDemo,
    getSignedUrl,
    getBottomSheetNavigationForIIT,
    submitBottomSheet,
    getLoginConfigMeta,
    getOnboardingSettings,
    coralogixTest,
};
