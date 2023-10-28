const _ = require('lodash');

const CourseHelper = require('../../helpers/course');
const WidgetHelper = require('../../widgets/liveclass');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const Data = require('../../../data/data');
const logger = require('../../../config/winston').winstonLogger;
const Question = require('../../../modules/question');
const freeClassHelper = require('../../helpers/freeLiveClass');
const StudentHelper = require('../../helpers/student.helper');
const CourseMysqlv2 = require('../../../modules/mysql/coursev2');
const AnswerHelper = require('../../helpers/answer');
const Utility = require('../../../modules/utility');

async function getCarousels(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const xAuthToken = req.headers['x-auth-token'];
        let { student_class: studentClass } = req.user;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        let { version_code: versionCode } = req.headers;
        if (!versionCode) {
            versionCode = 602;
        }
        const featureIds = _.split(versionCode, ',');
        let flagVariants = [];
        flagVariants.push(Data.defaultFlagVariantsForHomepage);
        if (featureIds) {
            if (Array.isArray(featureIds)) {
                flagVariants = [...flagVariants, ...featureIds];
            } else {
                flagVariants.push(featureIds);
            }
        }
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const liveClassesCarousel = [];
        const vipCarousel = [];
        let isChapterDataEmpty = false;

        let liveClassNewFlow = false;
        let freeUser = false;

        if (versionCode > 912) {
            const { question_id: questionId } = req.params;

            if (versionCode > 958 && !_.isNull(req.headers.flagr_variation_ids) && !_.isEmpty(req.headers.flagr_variation_ids)) {
                const flagVariantsArr = req.headers.flagr_variation_ids.split(',');
                if (flagVariantsArr.includes('1452') || flagVariantsArr.includes('1498') || flagVariantsArr.includes('1499') || flagVariantsArr.includes('1500')) {
                    liveClassNewFlow = true;
                    if (flagVariantsArr.includes('1452')) {
                        freeUser = await StudentHelper.getstudentSubscriptionDetailsLikeV13(db, studentId);
                    }
                }
            }

            const questionDetails = await Question.getByNewQuestionId(questionId, db.mysql.read);
            if (questionDetails.length > 0 && !_.isEmpty(questionDetails[0].chapter)) {
                const { chapter, subject, ocr_text: ocr } = questionDetails[0];
                const detectedLang = Utility.checkQuestionOcrLanguages(ocr);

                let freeLiveClassData = {};
                try {
                    freeLiveClassData = await freeClassHelper.getFreeLiveClassDataFromElastic({
                        db,
                        locale: detectedLang.detectedLanguage,
                        classVal: studentClass,
                        chapter,
                        subject,
                        liveClassNewFlow,
                        mpvpNewFlow: false,
                        versionCode,
                        student_id: studentId,
                    });
                } catch (e) {
                    isChapterDataEmpty = true;
                }

                if (freeLiveClassData && Object.keys(freeLiveClassData).length === 0) {
                    isChapterDataEmpty = true;
                } else if (freeLiveClassData.widget_data.items.length === 0) {
                    isChapterDataEmpty = true;
                } else {
                    liveClassesCarousel.push(freeLiveClassData);
                }
            } else {
                isChapterDataEmpty = true;
            }
        }

        if (versionCode <= 912 || isChapterDataEmpty) {
            let ccmArray = [];
            const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
            if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
                ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
            }

            const ccmCourses = await CourseHelper.getCoursesFromCcmArray(db, ccmArray, studentClass, locale);
            const carousel = {};

            if (isChapterDataEmpty) {
                const liveClassDataPromises = [];
                liveClassDataPromises.push(CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'live', carousel));
                liveClassDataPromises.push(CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'recent', carousel));
                liveClassDataPromises.push(CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'upcoming', carousel));
                const [autoplayLiveData, recentData, upcomingData] = await Promise.all(liveClassDataPromises);
                const items = [];
                if (autoplayLiveData.length) {
                    for (let i = 0; i < autoplayLiveData.length; i++) {
                        const obj = WidgetHelper.createVideoDataObject(autoplayLiveData[i], { isVip: false }, locale, false, versionCode);
                        items.push({ type: 'live_class_carousel_card_2', data: obj });
                    }
                }

                if (recentData.length) {
                    for (let i = 0; i < recentData.length; i++) {
                        const obj = WidgetHelper.createVideoDataObject(recentData[i], { isVip: false }, locale, false, versionCode);
                        items.push({ type: 'live_class_carousel_card_2', data: obj });
                    }
                }

                if (upcomingData.length) {
                    for (let i = 0; i < upcomingData.length; i++) {
                        const obj = WidgetHelper.createVideoDataObject(upcomingData[i], { isVip: false }, locale, false, versionCode);
                        items.push({ type: 'live_class_carousel_card_2', data: obj });
                    }
                }

                const widget = {
                    title: 'Live Class',
                    is_title_bold: true,
                    items,
                    scroll_direction: 'vertical',

                };

                widget.items.forEach((x) => {
                    x.data.page = 'MATCH_PAGE_RELATED_CLASSES';
                });

                liveClassesCarousel.push({
                    widget_data: widget,
                    widget_type: 'widget_parent',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                });
            } else {
                let data = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'live', carousel);
                if (data.length) {
                    const widget = await WidgetHelper.homepageVideoWidgetWithAutoplay({
                        data, paymentCardState: { isVip: false }, db, config, title: 'Live Classes', studentLocale: locale, versionCode,
                    });

                    widget.items.forEach((x) => {
                        x.data.page = 'MATCH_PAGE_RELATED_CLASSES';
                    });

                    liveClassesCarousel.push({
                        widget_data: widget,
                        widget_type: 'widget_autoplay',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                    });
                }

                data = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'recent', carousel);
                if (data.length) {
                    const groupedData = _.groupBy(data, 'assortment_locale');
                    const widget = await WidgetHelper.homepageVideoWidgetWithTabs({
                        data: groupedData,
                        paymentCardState: { isVip: false },
                        title: locale === 'hi' ? 'रीसेंट लाइव कक्षाएं' : 'Recent Classes',
                        studentLocale: locale,
                        versionCode,
                    });

                    const arrayOfKeys = Object.keys(widget.items);
                    arrayOfKeys.forEach((x) => {
                        widget.items[x].forEach((y) => {
                            y.data.page = 'MATCH_PAGE_RELATED_CLASSES';
                        });
                    });

                    liveClassesCarousel.push({
                        widget_data: widget,
                        widget_type: 'widget_parent_tab',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                    });
                }

                data = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'upcoming', carousel);
                if (data.length) {
                    const widget = await WidgetHelper.homepageVideoWidgetWithoutTabs({
                        data,
                        paymentCardState: { isVip: false },
                        title: studentClass === 'hi' ? 'आगामी लाइव कक्षाएं' : 'Upcoming Live Classes',
                        studentLocale: locale,
                        versionCode,
                    });

                    widget.items.forEach((x) => {
                        x.data.page = 'MATCH_PAGE_RELATED_CLASSES';
                    });

                    liveClassesCarousel.push({
                        widget_data: widget,
                        widget_type: 'widget_parent',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                    });
                }
            }
        }

        const popularCourseItems = await CourseHelper.getPaidAssortmentsData({
            db,
            studentClass,
            config,
            versionCode,
            studentId,
            studentLocale: locale,
            xAuthToken,
            page: 'MATCH_PAGE',
            pznElasticSearchInstance,
        });
        const popularCourseWidget = {
            widget_type: 'widget_parent',
            widget_data: {
                title: global.t8[locale].t('Popular Courses'),
                link_text: '',
                deeplink: '',
                items: popularCourseItems && popularCourseItems.items ? popularCourseItems.items : [],
            },
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
        };
        vipCarousel.push(popularCourseWidget);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { live_classes: liveClassesCarousel, vip: vipCarousel },
        };

        if (liveClassNewFlow) {
            // const topWidgetObj = {
            //     widget_data: {
            //         title: locale === 'hi' ? Data.no_solution_pane.title.hi : Data.no_solution_pane.title.en,
            //         title_color: '#000000',
            //         subtitle: locale === 'hi' ? Data.no_solution_pane.subtitle.hi : Data.no_solution_pane.subtitle.en,
            //         subtitle_color: '#000000',
            //         cta: locale === 'hi' ? Data.no_solution_pane.cta_text.hi : Data.no_solution_pane.cta_text.en,
            //         deeplink: '',
            //         background_color: '#ffe0b2',
            //     },
            //     widget_type: 'widget_match_page',
            //     layout_config: {
            //         bg_color: '#ffffff',
            //         margin_top: 16,
            //         margin_right: 0,
            //         margin_bottom: 20,
            //         margin_left: 0,
            //     },
            // };
            const classesArr = [];
            // classesArr.push(topWidgetObj);
            classesArr.push(liveClassesCarousel[0]);
            responseData.data.live_classes_v2 = {
                classes: classesArr,
            };
            if (freeUser) {
                responseData.data.live_classes_v2.overflow_text = Data.check_free_classes.title(locale);
                responseData.data.live_classes_v2.overflow_text_deeplink = Data.check_free_classes.deeplink;
            }
            delete responseData.data.live_classes;
            // responseData.data.vip.unshift(topWidgetObj);
            responseData.data.vip[0].widget_data.title = Data.vip_live_tab_title(locale);
        }
        next({
            data: responseData.data,
        });
    } catch (e) {
        console.log(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        console.error(errorLog);
        logger.error({ tag: 'matchpage', source: 'getCarousels', error: errorLog });
        next({
            err: e,
        });
    }
}

async function getSRPLiveClassCarouselsData(db, questionId, studentClass, xAuthToken, studentId, versionCode, locale) {
    let isChapterDataEmpty = false;
    const questionDetails = await Question.getByNewQuestionId(questionId, db.mysql.read);
    if (_.isEmpty(questionDetails[0].locale)) {
        questionDetails[0].locale = 'en';
    }
    if (questionDetails.length > 0 && !_.isEmpty(questionDetails[0].chapter)) {
        const { chapter, subject, ocr_text: ocr } = questionDetails[0];
        const detectedLang = Utility.checkQuestionOcrLanguages(ocr);

        let freeLiveClassData = {};
        try {
            freeLiveClassData = await freeClassHelper.getFreeLiveClassDataFromElastic({
                db,
                locale: detectedLang.detectedLanguage,
                classVal: studentClass,
                chapter,
                subject,
                liveClassNewFlow: false,
                mpvpNewFlow: false,
                versionCode,
                student_id: studentId,
            });
        } catch (e) {
            isChapterDataEmpty = true;
        }

        if (freeLiveClassData && Object.keys(freeLiveClassData).length === 0) {
            isChapterDataEmpty = true;
        } else if (freeLiveClassData.widget_data.items.length === 0) {
            isChapterDataEmpty = true;
        } else {
            return freeLiveClassData;
        }
    } else {
        isChapterDataEmpty = true;
    }

    if (isChapterDataEmpty) {
        let ccmArray = [];
        const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
        if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
            ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
        }

        const ccmCourses = await CourseHelper.getCoursesFromCcmArray(db, ccmArray, studentClass, locale);
        const carousel = {};

        const liveClassDataPromises = [];
        liveClassDataPromises.push(CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'live', carousel));
        liveClassDataPromises.push(CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'recent', carousel));
        liveClassDataPromises.push(CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, locale, 'upcoming', carousel));
        const [autoplayLiveData, recentData, upcomingData] = await Promise.all(liveClassDataPromises);
        const items = [];
        if (autoplayLiveData.length) {
            for (let i = 0; i < autoplayLiveData.length; i++) {
                const obj = WidgetHelper.createVideoDataObject(autoplayLiveData[i], { isVip: false }, locale, false, versionCode);
                items.push({ type: 'live_class_carousel_card_2', data: obj });
            }
        }

        if (recentData.length) {
            for (let i = 0; i < recentData.length; i++) {
                const obj = WidgetHelper.createVideoDataObject(recentData[i], { isVip: false }, locale, false, versionCode);
                items.push({ type: 'live_class_carousel_card_2', data: obj });
            }
        }

        if (upcomingData.length) {
            for (let i = 0; i < upcomingData.length; i++) {
                const obj = WidgetHelper.createVideoDataObject(upcomingData[i], { isVip: false }, locale, false, versionCode);
                items.push({ type: 'live_class_carousel_card_2', data: obj });
            }
        }
        return items;
    }
}

async function getSRPCarousels(req, res, next) {
    try {
        let responseData;
        const config = req.app.get('config');
        const db = req.app.get('db');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const xAuthToken = req.headers['x-auth-token'];
        const versionCode = req.headers.version_code;
        let { student_class: studentClass } = req.user;
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        const { student_id: studentId } = req.user;
        const locale = req.user.locale ? req.user.locale : 'en';
        const LiveClassCarousels = [];
        const {
            cardwidth,
            margin_top,
            bgcolor,
            questionId,
        } = req.body;
        const classArr = [11, 12, 13];
        const allowedCcmIds = [10912, 11012, 11308, 11480, 11481, 10910, 11010, 11101, 11201, 11301, 10903, 11003, 11103, 11203, 11303, 11111, 11211, 11307, 11478, 11479];
        let mainFlow = true;

        if (classArr.includes(parseInt(studentClass))) {
            let showNkcData = false;
            let studentCcmData = await CourseMysqlv2.getCoursesClassCourseMappingWithCategory(db.mysql.read, studentId);
            studentCcmData = _.orderBy(studentCcmData, ['id'], ['asc']);
            studentCcmData.forEach((x) => {
                x.category = x.course;
            });
            const ccmIdList = studentCcmData.map((x) => x.id);
            if (ccmIdList.length > 0) {
                ccmIdList.forEach((x) => {
                    if (allowedCcmIds.includes(parseInt(x))) {
                        showNkcData = true;
                        return false;
                    }
                });
            } else {
                showNkcData = true;
            }
            if (showNkcData) {
                const supportedData = {
                    ccm_list: ccmIdList, student_ccm: studentCcmData, student_id: studentId, student_class: studentClass, locale, version_code: versionCode,
                };

                const nkcData = await AnswerHelper.makeNkcData(db, supportedData);
                if (nkcData && Object.keys(nkcData).length > 0) {
                    mainFlow = false;
                    return next({
                        data: { live_classes: [nkcData] },
                    });
                }
            }
        }

        if (mainFlow) {
            const data = await getSRPLiveClassCarouselsData(db, questionId, studentClass, xAuthToken, studentId, versionCode, locale);
            if (typeof data !== 'undefined' && data.widget_data) {
                data.widget_data.scroll_direction = 'horizontal';
            }
            LiveClassCarousels.push({
                widget_data: typeof data !== 'undefined' && data.widget_data ? data.widget_data : {},
                widget_type: 'widget_parent',
                layout_config: {
                    margin_top,
                    bg_color: bgcolor,
                },
            });
            const PopularCoursesCarousels = [];
            const popularCourseItems = await CourseHelper.getPaidAssortmentsData({
                db,
                studentClass,
                config,
                versionCode,
                studentId,
                studentLocale: locale,
                xAuthToken,
                page: 'MATCH_PAGE',
                pznElasticSearchInstance,
            });
            PopularCoursesCarousels.push({
                widget_type: 'widget_parent',
                widget_data: {
                    title: (locale === 'hi') ? 'लोकप्रिय कोर्सेस' : 'Popular Courses',
                    link_text: '',
                    deeplink: '',
                    items: popularCourseItems && popularCourseItems.items ? popularCourseItems.items : [],
                    layout_config: {
                        margin_top,
                        bg_color: bgcolor,
                    },
                },
            });
            return next({
                data: { live_classes: LiveClassCarousels, popular_courses: PopularCoursesCarousels },
            });
        }
    } catch (e) {
        console.error(e);
        logger.error({ tag: 'matchpage', source: 'getSRPLiveClassCarousels', error: e });
        next({
            meta: {
                code: 400,
                success: false,
                message: 'ERROR',
            },
            data: null,
        });
    }
}

module.exports = {
    getCarousels,
    getSRPCarousels,
};
