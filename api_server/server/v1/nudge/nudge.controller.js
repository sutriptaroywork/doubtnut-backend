const _ = require('lodash');
const moment = require('moment');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const CourseMysqlv2 = require('../../../modules/mysql/coursev2');
const NudgeMysql = require('../../../modules/mysql/nudge');
const NudgeRedis = require('../../../modules/redis/nudge');
const NudgeHelper = require('../../helpers/nudge');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const CameraHelper = require('../../helpers/camera');
const CourseHelper = require('../../helpers/course');
const WidgetHelper = require('../../widgets/liveclass');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CourseContainer = require('../../../modules/containers/coursev2');
const liveclassData = require('../../../data/liveclass.data');
const altAppData = require('../../../data/alt-app');

async function get(req, res, next) {
    try {
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        const db = req.app.get('db');
        const config = req.app.get('config');
        const { id } = req.query;
        const nudge = isFreeApp ? [] : await NudgeMysql.getByID(db.mysql.read, id);
        const result = NudgeHelper.getWidget(nudge, config);
        const widgets = isFreeApp ? [] : [result];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Nudge',
            },
            data: { widgets },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function closeNudgeBanner(req, res, next) {
    try {
        const db = req.app.get('db');
        const { id, type } = req.query;
        const { student_id: studentID } = req.user;
        if (type === 'upgrade') {
            NudgeRedis.setUserSessionByAssortmentID(db.redis.write, studentID, id);
        } else {
            const nudgeData = await NudgeMysql.getByID(db.mysql.read, id);
            const duration = nudgeData.length ? nudgeData[0].duration : 1;
            NudgeRedis.setUserSessionByNudgeID(db.redis.write, studentID, id, duration || 1);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Nudge',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getNudgePopUp(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { id: queryId } = req.query;
        const { student_class: studentClass } = req.user;
        const { student_id: studentId } = req.user;
        const xAuthToken = req.headers['x-auth-token'];
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        const mappedLocale = (locale === 'hi') ? 'HINDI' : 'ENGLISH';
        const { version_code: versionCode } = req.headers;
        const id = queryId.split('||')[0];
        const coursePopupNudge = {
            trigger_events: 'pdf_lock_popup',
            resource_id: id,
        };
        const nudgeData = queryId.split('||').length === 1 ? await NudgeMysql.getByID(db.mysql.read, +id) : [coursePopupNudge];
        if (_.isEmpty(nudgeData)) {
            return next({
                err: {
                    status: 404,
                    message: 'Nudge Not found',
                },
            });
        }
        let data;
        let closebutton = true;
        let extraParams = null;
        // if condition is for getting course suggestion on nudge popup
        if (versionCode > 941 && (nudgeData[0].type == 'course_popup_auto_board' || nudgeData[0].type == 'course_popup_auto_exam')) {
            const checkForPersonalisation = await CourseMysqlv2.getCoursesClassCourseMapping(db.mysql.read, studentId);
            let ccmArray = checkForPersonalisation;
            if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length && studentClass > 8) {
                if (nudgeData[0].type == 'course_popup_auto_board') {
                    ccmArray = ccmArray.filter((x) => x.category == 'board');
                }
                if (nudgeData[0].type == 'course_popup_auto_exam') {
                    ccmArray = ccmArray.filter((x) => x.category == 'exam');
                }
                ccmArray = ccmArray.map((item) => liveclassData.examCategoryMapping[item.course]);
            }
            if (studentClass < 8) {
                ccmArray = ['CBSE Boards'];
            }
            data = await CourseContainerv2.getCoursesForHomepageByCategory(db, studentClass, locale);
            const dataAll = data;
            if (locale === 'en') {
                data = data.filter((item) => item.meta_info === 'ENGLISH');
            } else if (locale === 'hi') {
                data = data.filter((item) => item.meta_info === 'HINDI');
            }
            let assortmentArray = [];
            if (+studentClass < 14) {
                data = data.filter((item) => _.includes(ccmArray, item.category));
            }
            assortmentArray = data;
            const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
            const groupedByAss = _.groupBy(userActivePackages, 'assortment_id');
            assortmentArray = assortmentArray.filter((item) => _.isEmpty(groupedByAss[item.assortment_id]));
            assortmentArray = assortmentArray.filter((item) => item.meta_info == mappedLocale);

            if (_.isEmpty(assortmentArray)) {
                assortmentArray = await CourseMysql.getCourseByParams(db.mysql.read, studentClass, 'CBSE Boards', 'BOARDS/SCHOOL/TUITION', mappedLocale);
                assortmentArray = assortmentArray.filter((item) => _.isEmpty(groupedByAss[item.assortment_id]));
                if (_.isEmpty(assortmentArray)) {
                    assortmentArray = await CourseMysql.getCourseByParams(db.mysql.read, studentClass, '', 'SPOKEN ENGLISH', mappedLocale);
                    assortmentArray = assortmentArray.filter((item) => _.isEmpty(groupedByAss[item.assortment_id]));
                }
                if (_.isEmpty(assortmentArray)) {
                    assortmentArray = await CourseMysql.getCourseByParams(db.mysql.read, studentClass, '', 'ENGLISH GRAMMAR', mappedLocale);
                    assortmentArray = assortmentArray.filter((item) => _.isEmpty(groupedByAss[item.assortment_id]));
                }
                if (_.isEmpty(assortmentArray)) {
                    ccmArray = checkForPersonalisation.map((item) => liveclassData.examCategoryMapping[item.course]);
                    assortmentArray = dataAll.filter((item) => _.includes(ccmArray, item.category));
                }
            }

            // console.log('groupedByAss');
            // console.log(groupedByAss);
            // assortmentArray.sort((a, b) => b.priority - a.priority);
            const assortmentList = assortmentArray.map(((item) => item.assortment_id));
            const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
            for (let i = 0; i < assortmentArray.length; i++) {
                if (!_.isEmpty(assortmentPriceMapping[assortmentArray[i].assortment_id]) && assortmentPriceMapping[assortmentArray[i].assortment_id].monthly_price != 0) {
                    data = CameraHelper.generateExploreWidget(locale, assortmentArray[i], assortmentPriceMapping[assortmentArray[i].assortment_id], nudgeData);
                    data.data.button_deeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentArray[i].assortment_id].package_variant}`;
                    if (!_.isEmpty(nudgeData[0].coupon_id)) {
                        data.data.button_deeplink = `${data.data.button_deeplink}&coupon_code=${nudgeData[0].coupon_id}`;
                        data.data.course_details.deeplink = `${data.data.course_details.deeplink}||||${nudgeData[0].coupon_id}`;
                    }
                    extraParams = {
                        nudge_id: id,
                    };
                    closebutton = false;
                    break;
                }
            }
            if (_.isEmpty(data)) {
                return res.status(200).json({
                    meta: {
                        code: 200,
                        success: true,
                    },
                });
            }
        } else if (versionCode > 941 && nudgeData && nudgeData[0] && (nudgeData[0].trigger_events === 'prepurchase_course' || nudgeData[0].trigger_events === 'postpurchase_course' || nudgeData[0].trigger_events === 'prepurchase_course_back' || nudgeData[0].trigger_events === 'postpurchase_course_back' || nudgeData[0].trigger_events === 'pdf_lock_popup') && nudgeData[0].resource_id !== null) {
            const assortmentData = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, nudgeData[0].resource_id, studentClass);
            const assortmentList = [nudgeData[0].resource_id];
            const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
            if (nudgeData[0].trigger_events === 'pdf_lock_popup') {
                data = WidgetHelper.getLatestSoldCourseWidget({
                    carousel: {},
                    result: assortmentData,
                    locale,
                    videoResources: [],
                    assortmentPriceMapping,
                    courseStudentEnrolledCount: [],
                });
            } else {
                data = CameraHelper.generateExploreWidget(locale, assortmentData[0], assortmentPriceMapping[nudgeData[0].resource_id], nudgeData);
                data.data.button_deeplink = nudgeData[0].deeplink;
                extraParams = {
                    nudge_id: id,
                };
                closebutton = false;
            }
        } else {
            let { deeplink } = nudgeData[0];
            if (nudgeData[0].resource_id === -1) {
                const renewalPackages = await CourseMysqlV2.getRenewalDuePackages(db.mysql.read, studentId);
                deeplink = renewalPackages.length > 1 ? `doubtnutapp://course_select?page=renewal_widget||${nudgeData[0].coupon_id}` : `doubtnutapp://bundle_dialog?id=${renewalPackages[0].assortment_id}&source=POST_PURCHASE_RENEWAL||${nudgeData[0].coupon_id}`;
            }
            data = {
                type: 'widget_nudge_popup',
                data: {
                    widget_id: nudgeData.length ? nudgeData[0].id : 1,
                    nudge_type: 'popup',
                    title: nudgeData.length ? nudgeData[0].text : '',
                    title_color: '#de0000',
                    title_size: 25,
                    subtitle: nudgeData.length ? nudgeData[0].subtitle_text : '',
                    subtitle_color: '#000000',
                    subtitle_size: 20,
                    cta_text: nudgeData.length ? nudgeData[0].price_text : '',
                    cta_text_size: 18,
                    cta_text_color: '#eb532c',
                    deeplink,
                    is_banner: !nudgeData[0].text,
                    bg_image_url: nudgeData[0].display_image_rectangle || '',
                    bg_color: nudgeData[0].background_color || '',
                    close_image_url: `${config.cdn_url}engagement_framework/B8975444-0537-22E9-7F2B-97ECC3B48225.webp`,
                    image_url: nudgeData[0].display_image_square || '',
                    ratio: '1:1',
                },
            };
        }
        const widgets = [];
        widgets.push(data);
        if (queryId.split('||').length > 1) {
            widgets.unshift(WidgetHelper.getWidgetImageText({
                title: 'Apka free PDF trial katam hogya hai. Aur Download karne ke liye course kharidein!', image: `${config.cdn_url}engagement_framework/5907A77E-F6F3-D15E-EBB4-B55046A53E8B.webp`, color: '#d1e5fc', deeplink: '', source: 'nudge_popup',
            }));
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Nudge',
            },
            data: {
                close_image_url: closebutton ? `${config.cdn_url}engagement_framework/B8975444-0537-22E9-7F2B-97ECC3B48225.webp` : '',
                widgets,
                ...(extraParams !== null && { extra_params: extraParams }),
                bg_color: '#FFFFFF',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = { get, closeNudgeBanner, getNudgePopUp };
