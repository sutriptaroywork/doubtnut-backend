/* eslint-disable no-shadow */
const _ = require('lodash');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const md5 = require('md5');

const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const HomepageContainer = require('../../../modules/containers/homepage');
const ChapterContainer = require('../../../modules/containers/chapter');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const QuestionContainer = require('../../../modules/containers/question');
const Utility = require('../../../modules/utility');
const RedisUtils = require('../../../modules/redis/utility.redis.js');
const RedisLibrary = require('../../../modules/redis/library');
const TestSeriesContainer = require('../../../modules/containers/testseries');
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions');
const personalizationMysql = require('../../../modules/mysql/personalization');
const Liveclass = require('../../helpers/liveclass');
const CourseHelper = require('../../helpers/course');
const NudgeHelper = require('../../helpers/nudge');
const StudentRedis = require('../../../modules/redis/student');
const NudgeMysql = require('../../../modules/mysql/nudge');
const CourseMysqlv2 = require('../../../modules/mysql/coursev2');
const BranchContainer = require('../../../modules/containers/branch');
const CourseContainer = require('../../../modules/containers/coursev2');
const config = require('../../../config/config');
const WidgetHelper = require('../../widgets/liveclass');
const HomepageWidgetHelper = require('../../widgets/homepage');
const TgHelper = require('../../helpers/target-group');
const SchedulerHelper = require('../../helpers/scheduler');
const IconsData = require('../../../data/icons.data');

const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const redisAnswer = require('../../../modules/redis/answer');
const courseV2Redis = require('../../../modules/redis/coursev2');
const HomepageRedis = require('../../../modules/redis/homepage');
const redisPackage = require('../../../modules/redis/package');
const doubtfeedMysql = require('../../../modules/mysql/doubtfeed');
const iconsMysql = require('../../../modules/mysql/icons');
const { autoScrollTime } = require('../../../data/data');
const CourseMysql = require('../../../modules/mysql/course');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const PackageRedis = require('../../../modules/redis/package');
const TeacherRedis = require('../../../modules/redis/teacher');
const StudentContainer = require('../../../modules/containers/student');
const IconsHelper = require('../../v1/icons/icons.helper');
const libraryHelper = require('../../v9/library/library.helper');
const libraryHelperV7 = require('../../v7/library/library.helper');
const LiveClassContainer = require('../../../modules/containers/liveclass');
const ClassCourseMappingMysql = require('../../../modules/mysql/classCourseMapping');
const inst = require('../../../modules/axiosInstances');
const Properties = require('../../../modules/mysql/property');
const iconHelper = require('../../helpers/icons');
const studentHelper = require('../../helpers/student.helper');
const PracticeEnglishHelper = require('../../v1/practiceEnglish/practiceEnglish.helper');
const HomepageMysql = require('../../../modules/mysql/homepage');
// const practiceEnglishUtils = require('../../v1/practiceEnglish/practiceEnglish.utils');
const CourseHelperV6 = require('../../v6/course/course.helper');

const altAppData = require('../../../data/alt-app');

const {
    srpNonSrpDetails,
    peopleWatchShouldWatchDetails,
    makeChannelData,
    makeVideoAddData,
    getPrevYearsData,
    getHindiTitles,
    makeHistoryData,
    getNcertModifiedData,
    profileDataMaker,
    homeBanner,
} = require('./tesla.utils');
const { getGamesDataForNudge } = require('../../v1/homepage/homeScreen.nudge.helper');
const Data = require('../../../data/data');
const ExamCornerCtrl = require('../../v1/exam_corner/examcorner.controller');
const scholarshipHelper = require('../../v1/scholarship/scholarship.helper');
const TestSeries = require('../../../modules/mysql/testseries');
const IconsRedis = require('../../../modules/redis/icons');
const StudentMysql = require('../../../modules/mysql/student');
const TeacherContainer = require('../../../modules/containers/teacher');
const LanguageTranslations = require('../../../modules/languageTranslations');

const StaticData = require('../../../data/data');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const freeClassHelper = require('../../helpers/freeLiveClass');
const dnExamRewardsHelper = require('../../v1/dn_exam_rewards/dn_exam_rewards.helper');
const HomepageDynamicHelper = require('./homepageDynamicHelper');
const referralFlowHelper = require('../../helpers/referralFlow');

// Static Constants  --------------------------------

// const base_url = `${config.cdn_url}q-thumbnail/`;
// const cdn_url = `${config.cdn_url}images/`;
const capsule_text = '';
const capsule_bg_color = '#ffffff';
const capsule_text_color = '#000000';
const capsule = [capsule_text, capsule_text_color, capsule_bg_color];
const duration_text_color = '#000000';
const duration_bg_color = '#ffffff';
const duration = [duration_text_color, duration_bg_color];
const button_text = '';
const button_text_color = '#000000';
const button_bg_color = '#f4e70c';
const button = [button_text, button_text_color, button_bg_color];
const base_colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
const color = Utility.generateColorArr(base_colors);
const language = 'english';

function activeMockTestFormatter(testdata, studentCurrentSubscriptionDetails, studentLocale) {
    if (testdata.length === 0) {
        return 0;
    }
    const groupedTestData = _.groupBy(testdata, 'course');
    const courses = _.keys(groupedTestData);
    const output = {
        widget_type: 'widget_parent',
        widget_data: {
            carousel_id: 99999,
            link_text: global.t8[studentLocale].t('See All'),
            deeplink: studentCurrentSubscriptionDetails.length ? 'doubtnutapp://library_tab?library_screen_selected_Tab=5&tag=mock_test' : 'doubtnutapp://library_tab?library_screen_selected_Tab=4&tag=mock_test',
            title: global.t8[studentLocale].t('Mock Test Series'),
            title_text_size: '16',
            background_color: '#eaf3f9',
            scroll_direction: 'vertical',
        },
    };
    const items = [];
    const courseItems = [];
    for (let i = 0; i < 2; i++) {
        const course = courses[i];
        const item = {
            course,
            total_tests: groupedTestData[course].length,
            image_url: null,
            category: null,
            course_id: groupedTestData[course][0].course_id,
        };
        for (let j = 0; j < groupedTestData[course].length; j++) {
            const test = groupedTestData[course][j];
            item.image_url = item.image_url ? item.image_url : test.image_url;
            item.category = item.category ? item.category : test.category;
            item.course_id = item.course_id ? item.course_id : test.course_id;
        }
        courseItems.push(item);
    }

    courseItems.forEach((item) => {
        const widgetItem = {
            type: 'widget_recommended_test',
            data: {
                title: item.course,
                image_url: item.image_url ? buildStaticCdnUrl(item.image_url) : 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/508F6038-9B62-BD55-E52D-0380CFCBEA84.webp',
                sub_title: `${item.total_tests} papers`,
                sub_title_icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6674B126-E006-859A-8978-26D7BBB7507A.webp',
                price: null,
                category: item.category,
                course: item.course,
                is_background_image: !item.image_url,
                btn_text: 'View papers',
                deeplink: `doubtnutapp://mock_test_list?course=${item.course}`,
                btn_deeplink: `doubtnutapp://mock_test_list?course=${item.course}`,
            },
            extra_params: {
                assortment_id: item.course_id,
            },
        };
        items.push(widgetItem);
    });
    output.widget_data.items = items;
    return output;
}
async function getMockTestWidget(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    try {
        const testSeriesData = await TestSeries.getActiveByAppModuleWithMatrixPaid(db.mysql.read, studentClass, ['TEST', 'TEST1'], studentId);
        const widget = activeMockTestFormatter(testSeriesData, studentCurrentSubscriptionDetails, studentLocale);
        widget.widget_data.id = `${carousel.carousel_id}`;
        return {
            ...widget,
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
        };
    } catch (error) {
        return undefined;
    }
}

async function getAttendanceWidget(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const rewardsWidget = {
        widget_data: {
            title: '',
            id: '1186',
        },
        widget_type: 'widget_attendance',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
    return rewardsWidget;
}

function getQtfsWidget(locale, img) {
    return {
        widget_type: 'widget_daily_practice',
        widget_data: {
            caraousel_id: 99999,
            title: global.t8[locale].t('DOUBTNUT PREMIER LEAGUE'),
            subtitle: global.t8[locale].t('DJ Sir ka aap ke liye challenge!'),
            bottom_text: global.t8[locale].t('Bano khiladiyon ka khiladi'),
            color_bottom_bg: '#ffece7',
            image_url: img,
            image_bg_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/7452F49D-9477-7A22-10FA-B49E873BD90F.webp',
            deeplink: 'doubtnutapp://daily_practice?type=quiztfs',
        },
    };
}
function testSeriesArrayResponseFormatter1(testdata, subscriptiondata) {
    const groupedSubData = _.groupBy(subscriptiondata, 'test_id');
    for (let i = testdata.length - 1; i >= 0; i--) {
        const test = testdata[i];
        testdata[i].can_attempt = false;
        testdata[i].can_attempt_prompt_message = '';
        testdata[i].test_subscription_id = '';
        testdata[i].in_progress = false;
        testdata[i].attempt_count = 0;
        testdata[i].last_grade = '';
        testdata[i].type = 'quiz';
        testdata[i].image_url = `${config.staticCDN}images/quiz_sample.jpeg`;
        testdata[i].button_text = 'Go To';
        testdata[i].button_text_color = '#000000';
        testdata[i].button_bg_color = '#ffffff';
        testdata[i].id = testdata[i].test_id.toString();
        if (groupedSubData[test.test_id]) {
            const subData = _.groupBy(groupedSubData[test.test_id], 'status');
            testdata[i].subscriptiondata = groupedSubData[test.test_id];
            if (subData.SUBSCRIBED) {
                testdata[i].can_attempt = true;
                testdata[i].test_subscription_id = subData.SUBSCRIBED[0].id;
            }
            if (subData.INPROGRESS) {
                testdata[i].in_progress = true;
                testdata[i].test_subscription_id = subData.INPROGRESS[0].id;
            }
            if (subData.COMPLETED) {
                testdata[i].attempt_count = subData.COMPLETED.length;
                testdata[i].test_subscription_id = subData.COMPLETED[0].id;
            }
        } else {
            testdata[i].can_attempt = true;
            testdata[i].subscriptiondata = [];
        }
    }
    return testdata;
}

async function getDailyQuizData(type, studentId, studentClass, limit, db) {
    // return new Promise((async (resolve, reject) => {
    try {
        const promise = [];
        promise.push(TestSeriesContainer.getDailyQuizData(type, studentClass, limit, db));
        promise.push(StudentTestsSubsriptions.get1StudentTestsSubsriptionsByStudentId(db.mysql.read, studentId));
        const data = await Promise.all(promise);
        const temp = testSeriesArrayResponseFormatter1(data[0], data[1]);
        return temp;
    } catch (e) {
        console.log(e);
        return e;
        // reject(e);
    }
}

// TODO: Need to think of a better approach for segregating the query for countries
/**
 *
 * @param {mysql:{read:{query}}} db query function of db readonly
 * @param {string} country
 * @param {number} studentId
 * @param {number} versionCode
 * @param {number[]} flagVariants
 */
function getQueryWithParamsForHomeCarouselsAsPerCountry({ mysql }, country, studentId, versionCode, flagVariants) {
    if (country && country.toLowerCase() === 'us') {
        const sql = `select id,class,type, locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id,
                    (select min(caraousel_order)) as caraousel_order from home_caraousels
                    where is_active = 1
                          and
                          min_version_code < ?
                          and
                          max_version_code >= ?
                          and
                          ccm_id in (
                                        select ccm_id  from (select * from student_course_mapping where student_id =?) as a
                                        inner join
                                        (select * from class_course_mapping where personalisation_active =1) as b
                                        on a.ccm_id = b.id
                                    )
                    group by type, data_type, title, scroll_type, scroll_size, data_limit, view_all,is_active,mapped_playlist_id
                    order by caraousel_order
                    asc`;
        const params = [versionCode, versionCode, studentId];
        return mysql.read.query(sql, params);
    }
    const sql = `select id,class,type, locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id,(select min(caraousel_order)) as caraousel_order
                  from home_caraousels
                    where is_active = 1
                        and
                            flagVariant in (?)
                        and
                            min_version_code < ?
                        and
                            max_version_code >= ?
                        and
                        ccm_id in (
                                        select ccm_id  from (select * from student_course_mapping where student_id = ?) as a
                                        inner join
                                        (select * from class_course_mapping where personalisation_active =1) as b
                                        on a.ccm_id = b.id
                                    )
                    group by type, data_type, title, scroll_type, scroll_size, data_limit, view_all,is_active,mapped_playlist_id
                    order by caraousel_order
                    asc`;
    const params = [flagVariants, versionCode, versionCode, studentId];
    return mysql.read.query(sql, params);
}

/**
 * It will return the query on home carousel via class
 * @param {mysql:{read:{query}}} db query function of db readonly
 * @param {number} versionCode
 * @param {string} studentClass
 */
async function getHomeCaraouselFromClass({ mysql }, versionCode, studentClass) {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
                from home_caraousels
                where is_active = 1
                    and
                    min_version_code < ?
                    and
                    max_version_code >= ?
                    and
                    (data_type in ('liveclass','nudge','library_video') or data_type='nudge' or type in ('LIVECLASS_V1', 'HOMEWORK', 'LIVECLASS_PAID', 'COURSES', 'PLAYLIST', 'CHANNELS', 'HISTORY', 'HOMEPAGE_GAMES_LIST', 'VIDEO_ADS', 'PREVIOUS_YEAR_SOLUTIONS', 'PENDING_PAYMENT', 'TOP_FREE_CLASSES', 'COURSES_V1', 'ETOOS_FACULTY_FREE_VIDEOS', 'ETOOS_FACULTY', 'MY_COURSES', 'DOUBTFEED', 'MY_SACHET', 'WIDGET_NUDGE','PROFILE_DETAILS', 'CALLING_CARD', 'BANNER', 'KHELO_JEETO', 'GOVT_BOOKS','VIDEO_GEN', 'EXAM_CORNER', 'TRENDING_EXAM', 'TRENDING_BOARD', 'LATEST_COURSES', 'LIVECLASS_GEN', 'DICTIONARY_BANNER','SENT_UP_PAPER_2020','CURRENT_AFFAIRS','SUBSCRIBED_TEACHERS','CCM_TEACHERS','LIBRARY_TRENDING','CTET_BANNER','SUBSCRIBED_TEACHERS_VIDEOS','STUDY_TIMER_BANNER','CATEGORY_ICONS', 'COURSE_TRIAL_TIMER','DNR_BANNER','CTET_CAROUSELS','DEFENCE_CAROUSELS','REVISION_CLASSES','TOP_TEACHERS_CLASSES','PREVIOUS_YEARS_PDF','PRACTICE_ENGLISH_BANNER','SAMPLE_PAPERS_PDF','RECOMMENDED_INTERNAL_TEACHERS','SUBSCRIBED_INTERNAL_TEACHERS','SUBSCRIBED_INTERNAL_TEACHERS_VIDEOS','PREVIOUS_YEARS_PDF_EXAM_WISE', 'JEE_MAINS_ADV', 'NKC_SIR_VIDEOS', 'AD_HOC_WIDGETS', 'AD_HOC_WIDGET_CHILD', 'PRACTICE_ENGLISH_WIDGET','SPOKEN_ENGLISH_CERTIFICATE','MOCK_TEST_WIDGET', 'REFERRAL_V2','REFEREE_NUDGE') or id = 1292)
                    and class = ? and package = 'default'`;
    const params = [versionCode, versionCode, studentClass];
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsByCampaignAndCcmid({ mysql }, flagVariants, versionCode, studentId, campaign, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
        from home_caraousels
        where is_active = 1
            and flagVariant in (?)
            and min_version_code < ?
            and max_version_code >= ?
            and (
                ccm_id in (
                            select ccm_id  from (select * from student_course_mapping where student_id = ?) as a
                            inner join
                            (select * from class_course_mapping where personalisation_active =1) as b
                            on a.ccm_id = b.id
                        )
            )
            and locale = ?
            and package = ?
            and campaign = ?
        group by type, data_type, title
        order by caraousel_order
        asc`;
    const params = [flagVariants, versionCode, versionCode, studentId, studentLocale, packageValue, campaign];
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsByCampaignAndCcmidWithoutPersonalization({ mysql }, flagVariants, versionCode, studentId, campaign, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
        from home_caraousels
        where is_active = 1
            and flagVariant in (?)
            and min_version_code < ?
            and max_version_code >= ?
            and (
                ccm_id in (
                        select ccm_id from student_course_mapping where student_id = ?
                        )
            )
            and locale = ?
            and package = ?
            and campaign = ?
        group by type, data_type, title
        order by caraousel_order
        asc`;
    const params = [flagVariants, versionCode, versionCode, studentId, studentLocale, packageValue, campaign];
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsByCampaignIdAndClass({ mysql }, flagVariants, versionCode, studentClass, campaign, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
        from home_caraousels
        where is_active = 1
            and flagVariant in (?)
            and min_version_code < ?
            and max_version_code >= ?
            and class = ?
            and locale = ?
            and package = ?
            and campaign = ?
        group by type, data_type, title
        order by caraousel_order
        asc`;
    const params = [flagVariants, versionCode, versionCode, studentClass, studentLocale, packageValue, campaign];
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsByCcmId({ mysql }, flagVariants, versionCode, studentId, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
        from home_caraousels
        where is_active = 1
            and flagVariant in (?)
            and min_version_code < ?
            and max_version_code >= ?
            and (
                ccm_id in (
                            select ccm_id  from (select * from student_course_mapping where student_id = ?) as a
                            inner join
                            (select * from class_course_mapping where personalisation_active =1) as b
                            on a.ccm_id = b.id
                        )
            )
            and locale = ?
            and package = ?
            and campaign is NULL
        group by type, data_type, title
        order by caraousel_order
        asc`;
    const params = [flagVariants, versionCode, versionCode, studentId, studentLocale, packageValue];
    console.log(sql, params);
    return mysql.read.query(sql, params);
}

async function getHomeCaraouselByClass({ mysql }, flagVariants, versionCode, studentClass, studentLocale, packageValue) {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
                from home_caraousels
                where is_active = 1
                    and flagVariant in (?)
                    and min_version_code < ?
                    and max_version_code >= ?
                    and class = ?
                    and locale = ?
                    and package = ?
                    and campaign is NULL
                    order by caraousel_order asc`;
    const params = [flagVariants, versionCode, versionCode, studentClass, studentLocale, packageValue];
    console.log(sql, params);
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsWithPersonalisation(country, studentId, versionCode, flagVariants, db, studentClass) {
    return Promise.all([
        getQueryWithParamsForHomeCarouselsAsPerCountry(db, country, studentId, versionCode, flagVariants),
        getHomeCaraouselFromClass(db, versionCode, studentClass),
    ]).then(([result1, result2]) => [...result1, ...result2]);
}

async function getTopFreeClasses(db, studentId, studentClass, studentLocale) {
    // * Fetch user recently watched video details and distinct subjects in top free classes table
    const [
        studentRecentlyWatchedVideos,
        distinctSubjectsETMapping,
    ] = await Promise.all([
        StudentRedis.getUserTenRecentlyWatchedDetails(db.redis.read, studentId),
        CourseContainer.getDistinctSubjectByLocaleClass(db, studentClass, studentLocale),
    ]);
    // * Return null if there are no subjects for particular class and locale in top free classes table
    if (!distinctSubjectsETMapping) return null;
    let studentWatchedSubjects = [];
    let allSubjects = [];
    const flag = !_.isNull(studentRecentlyWatchedVideos);
    if (flag) {
        const studentRecentlyWatchedVideosArr = JSON.parse(studentRecentlyWatchedVideos);
        studentWatchedSubjects = studentRecentlyWatchedVideosArr.reduce((acc, obj) => {
            const index = acc.indexOf(obj.subject);
            const index2 = distinctSubjectsETMapping.findIndex((item) => item.subject === obj.subject);
            if (index === -1 && index2 !== -1) {
                acc.push(obj.subject);
            }
            return acc;
        }, []);
        // * Union studentWatchedSubjects and distinctSubjectsETMapping, studentWatchedSubjects will be in the beginning
        allSubjects = _.union(studentWatchedSubjects, _.map(distinctSubjectsETMapping, 'subject'));
        allSubjects = allSubjects.map((item) => {
            const chapters = studentRecentlyWatchedVideosArr
                .filter((historyObj) => (historyObj.subject === item))
                .map((obj) => obj.chapter);
            return {
                subject: item,
                chapters,
            };
        });
    } else {
        allSubjects = _.map(distinctSubjectsETMapping, 'subject');
        allSubjects = allSubjects.map((item) => ({
            subject: item,
            chapters: [],
        }));
    }
    let widget;
    const widgetRedis = await HomepageRedis.getTopFreeClassesRecommended(db.redis.read, studentId, studentClass, studentLocale);
    if (!_.isNull(widgetRedis)) {
        widget = JSON.parse(widgetRedis);
    } else {
        widget = await WidgetHelper.generateTopFreeClasses({
            db, allSubjects, paymentCardState: { isVip: false }, title: global.t8[studentLocale].t('Most Popular Classes on Doubtnut'), studentLocale, studentClass,
        });
        // * Store widget for 5 mins in redis
        HomepageRedis.setTopFreeClassesRecommended(db.redis.write, studentId, studentClass, studentLocale, widget);
    }
    return widget;
}
function getRevisionClassGroupedData(data, studentClass, studentLocale, key) {
    const allSubjects = Data.classSubjectMapping[key];
    const finalObj = {};
    const groupedData = _.groupBy(data, 'subject');
    for (let i = 0; i < allSubjects.length; i++) {
        const subject = allSubjects[i];
        if (groupedData[subject]) {
            const reqData = groupedData[subject].slice(0, 10);
            if (studentLocale === 'hi') {
                finalObj[Data.subjectHindi[subject]] = reqData;
            } else if (allSubjects[i] === 'COMPUTER SCIENCE') {
                finalObj.COMPUTER = reqData;
            } else {
                finalObj[subject] = reqData;
            }
        }
    }
    return finalObj;
}

async function getRevisionClass(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) { // same as top free class
    const key = `${studentLocale}_${studentClass}`;
    const assortmentList = [];
    assortmentList.push(Data.assortmentIdLocaleClassMapiing[key]);
    const data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'revision_classes', assortmentList);
    if (data.length) {
        let heading = 'CBSE Term-1 Revision Classes';
        if (studentLocale === 'hi') {
            if (parseInt(studentClass) === 9 || parseInt(studentClass) === 11) {
                heading = 'वार्षिक परीक्षा के लिए रिवीज़न क्लासेस';
            } else if (parseInt(studentClass) === 10 || parseInt(studentClass) === 12) {
                heading = 'आपके लिए बोर्ड्स की रिवीज़न क्लासेस';
            } else {
                heading = 'आपके लिए रिवीज़न क्लासेस';
            }
        } else if (parseInt(studentClass) >= 9 && parseInt(studentClass) <= 12) {
            heading = 'CBSE Term 2 Free Classes';
        }
        const title = heading;
        const groupedData = getRevisionClassGroupedData(data, studentClass, studentLocale, key);// make grouped data based on tabs
        if (_.isEmpty(groupedData)) {
            return null;
        }
        const tabs = [];
        const enTitle = global.t8[studentLocale].t('ENGLISH');
        const hiTitle = global.t8[studentLocale].t('HINDI');
        for (const key in groupedData) {
            if (groupedData[key]) {
                tabs.push({
                    key,
                    title: key.includes('HINDI') ? key.replace('HINDI', hiTitle) : key.replace('ENGLISH', enTitle),
                    is_selected: false,
                });
            }
        }
        if (tabs.length) {
            tabs[0].is_selected = true;
        }

        const widget = await WidgetHelper.homepageVideoWidgetWithTabs({
            data: groupedData, paymentCardState: { isVip: false }, title, studentLocale, versionCode, tabs, pageValue: 'revision_class',
        });
        widget.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: widget,
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function makeDoubtfeedBanner(db, carousel, studentId, studentLocale, versionCode, flagVariants) {
    let playlistItem = {};
    if (versionCode >= 904 && flagVariants.includes('1169')) {
        const todaysLatestTopic = await doubtfeedMysql.getTodaysLatestDoubt(db.mysql.read, studentId);
        if (todaysLatestTopic.length === 0) {
            playlistItem = {
                widget_type: 'widget_doubt_feed_banner',
                widget_data: {
                    type: 'no_topic_generated',
                    id: carousel.carousel_id.toString(),
                    title: Data.doubtfeedBanner.homepage(studentLocale).beforeAsk,
                    subtitle: '',
                    cta_text: Data.doubtfeedBanner.button(studentLocale).ask,
                    deeplink: versionCode >= 921 ? 'doubtnutapp://doubt_feed_2' : 'doubtnutapp://doubt_feed',
                },
            };
            if (versionCode >= 921) {
                playlistItem.widget_data.title = Data.dailygoal.homepage(studentLocale).beforeAsk;
                playlistItem.widget_data.cta_text = Data.dailygoal.button(studentLocale).ask;
            }
        } else {
            const { id } = todaysLatestTopic[0];
            const { topic: topicName } = todaysLatestTopic[0];
            const taskDetails = await doubtfeedMysql.getLatestTopicTasks(db.mysql.read, id);
            if (taskDetails.length === 0) {
                playlistItem = {
                    widget_type: 'widget_doubt_feed_banner',
                    widget_data: {
                        type: 'no_task_generated',
                        id: carousel.carousel_id.toString(),
                        title: `${topicName} ${Data.doubtfeedBanner.homepage(studentLocale).beforeTask}`,
                        subtitle: '',
                        cta_text: Data.doubtfeedBanner.button(studentLocale).check,
                        deeplink: versionCode >= 921 ? 'doubtnutapp://doubt_feed_2' : 'doubtnutapp://doubt_feed',
                        topic: topicName,
                    },
                };
            } else {
                const totalTaskLength = taskDetails.length;
                const completedTaskLength = taskDetails.filter((x) => x.is_viewed).length;
                if (totalTaskLength !== completedTaskLength) {
                    playlistItem = {
                        widget_type: 'widget_doubt_feed_banner',
                        widget_data: {
                            type: 'all_task_not_completed',
                            id: carousel.carousel_id.toString(),
                            title: global.t8[studentLocale].t('{{random}} bachhon ne {{topicName}} ka goal kr lia complete. Aap kab kar rhe?', { random: Math.floor(Math.random() * (10000 - 5000 + 1) + 5000), topicName }),
                            subtitle: '',
                            cta_text: Data.doubtfeedBanner.button(studentLocale).resume,
                            deeplink: versionCode >= 921 ? 'doubtnutapp://doubt_feed_2' : 'doubtnutapp://doubt_feed',
                            topic: topicName,
                        },
                    };
                } else {
                    playlistItem = {
                        widget_type: 'widget_doubt_feed_banner',
                        widget_data: {
                            type: 'nudge_for_new_topic',
                            id: carousel.carousel_id.toString(),
                            title: Data.doubtfeedBanner.homepage(studentLocale).afterCompletion,
                            subtitle: '',
                            cta_text: Data.doubtfeedBanner.button(studentLocale).ask,
                            deeplink: versionCode >= 921 ? 'doubtnutapp://doubt_feed_2' : 'doubtnutapp://doubt_feed',
                            topic: topicName,
                        },
                    };
                }
            }
        }
    }
    return playlistItem;
}

async function kheloJeetoBanner(carousel, studentLocale, versionCode) {
    try {
        let item = {};
        if (versionCode >= 917) {
            item = {
                widget_data: {
                    id: `${carousel.carousel_id}`,
                    widget_id: carousel.carousel_id.toString(),
                    nudge_type: 'nudge',
                    title: '',
                    title_color: '#de0000',
                    title_size: 20,
                    subtitle: '',
                    subtitle_color: '#000000',
                    subtitle_size: 12,
                    cta_text: '',
                    cta_text_size: 18,
                    cta_text_color: '#eb532c',
                    deeplink: Data.kheloJeetoBanner.deeplink,
                    is_banner: true,
                    bg_image_url: Data.kheloJeetoBanner.gif_url,
                    bg_color: '',
                    close_image_url: null,
                    image_url: '',
                    ratio: '5:2',
                },
                widget_type: 'widget_nudge',
                layout_config: {
                    margin_top: 0,
                    bg_color: '#ffffff',
                },
            };
        }
        return item;
    } catch (e) {
        console.error(e);
        return {};
    }
}

async function getPersonalizationNCERTTab(carousel, addtabs, studentClass, studentId, db) {
    const temp_carousel = carousel;
    // console.log(`Adding tabs to the structure ${addtabs}`);

    // eslint-disable-next-line no-await-in-loop
    const personalisedTabs = await QuestionContainer.getPersonalizedTabs(studentClass, studentId, db, temp_carousel.mapped_playlist_id);

    if (personalisedTabs && personalisedTabs.length > 0) {
        // temp_carousel.title = 'personalisedTab.title';
        temp_carousel.is_tab_type = true;
        temp_carousel.widget_type = 'tab_list';
        temp_carousel.items = personalisedTabs.map((elem) => {
            const mappedObject = {
                title: elem.tabTitle,
                playlist: elem.tab_playlist_id,
                subtitle: '',
                show_whatsapp: false,
                show_video: false,
                view_type: elem.item_view_type,
                // image_url: buildStaticCdnUrl(elem.image_url),
                image_url: buildStaticCdnUrl(Utility.convertoWebP(elem.image_url)),
                card_width: carousel.scroll_size, // percentage of screen width
                deeplink: encodeURI(`doubtnutapp://playlist?playlist_id=${elem.tab_playlist_id}&playlist_title=${elem.tabTitle}&is_last=0`),
                aspect_ratio: '',
                id: elem.question_id,
            };
            return mappedObject;
        });

        // console.log(temp_carousel.items);
        // console.log("Data pushed in athe array after");

        temp_carousel.show_view_all = 1;
        // temp_carousel.deeplink = encodeURI(`doubtnutapp://playlist?playlist_id=${temp_carousel.mapped_playlist_id}&playlist_title=${carousel.title}&is_last=0`);
        // console.log('Data pushed in the array after');
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: temp_carousel,
            widget_type: 'tab_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getPersonalizationBooks(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (tabbed_home_carousel_flag) {
        // else if (addtabs == 1) {
        // console.log('Getting in to personalization of books flow');
        /* getting the list of books for CCM ID for the student */
        // eslint-disable-next-line no-await-in-loop
        const personalisationBooksSet = await QuestionContainer.getPersonalizedBooks(studentId, ccmArray, studentClass, studentLocale, db);
        // console.log(personalisationBooksSet);

        const temp_carousel = carousel;

        if (personalisationBooksSet && personalisationBooksSet.length > 0) {
            temp_carousel.title = 'PERSONALIZED BOOK FOR THE STUDENT';
            // eslint-disable-next-line no-loop-func
            temp_carousel.is_tab_type = true;
            temp_carousel.widget_type = 'horizontal_list';
            temp_carousel.items = personalisationBooksSet.map((elem) => {
                const mappedObject = {
                    title: elem.title,
                    subtitle: elem.description,
                    show_whatsapp: true,
                    show_video: true,
                    // image_url: buildStaticCdnUrl(elem.image_url),
                    image_url: buildStaticCdnUrl(Utility.convertoWebP(elem.image_url)),
                    card_width: carousel.scroll_size, // percentage of screen width
                    aspect_ratio: '',
                    deeplink: encodeURI(`doubtnutapp://playlist?playlist_id=${elem.book_playlist_id}&playlist_title=${elem.title}&is_last=${elem.is_last}`),
                    id: elem.id,
                };
                return mappedObject;
            });

            console.log('pushed book carousal data');
            temp_carousel.id = `${carousel.carousel_id}`;

            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: temp_carousel,
                widget_type: 'horizontal_list',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: temp_carousel.caraousel_order,
            };
        }
    }
}

async function getPersonalizationClass(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    // eslint-disable-next-line no-await-in-loop
    // console.log('Getting into the personlization of live classes');
    // eslint-disable-next-line no-await-in-loop
    const personalisationQuestionList = await QuestionContainer.getPersonalizedMicroConcepts(db, studentId, studentClass, studentLocale);
    // console.log(personalisationQuestionList);

    const temp_carousel = carousel;

    if (personalisationQuestionList && personalisationQuestionList.length > 0) {
        temp_carousel.title = 'LIVE CLASSES FOR YOU';
        // eslint-disable-next-line no-loop-func
        temp_carousel.is_tab_type = true;
        temp_carousel.widget_type = 'horizontal_list';
        temp_carousel.items = personalisationQuestionList.map((elem) => {
            const mappedObject = {
                title: elem.ocr_text,
                subtitle: elem.description,
                show_whatsapp: true,
                show_video: true,
                image_url: buildStaticCdnUrl(`${config.staticCDN}q-thumbnail/${elem.question_id}.webp`),
                card_width: carousel.scroll_size, // percentage of screen width
                aspect_ratio: '',
                deeplink: encodeURI(`doubtnutapp://video?qid=${elem.question_id}&page=HOME_FEED&playlist_id=${carousel.type}`),
                id: elem.question_id,
            };
            return mappedObject;
        });
        temp_carousel.id = `${carousel.carousel_id}`;

        // console.log('pushed book carousal data');
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: temp_carousel,
            widget_type: 'horizontal_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: temp_carousel.caraousel_order,
        };
    }
}

async function getPersonalizationChapter(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    // console.log('Getting in to personalization flow');
    /* eslint-disable no-await-in-loop */
    let localizedChapters;
    const personalisationSet = await ChapterContainer.getPersonalizedChapters(studentId, ccmArray, studentClass, studentLocale);
    if (personalisationSet && personalisationSet.list && personalisationSet.list.length > 0) {
        carousel.title = personalisationSet.title;
        if (studentLocale === 'hi') {
            const chapters = personalisationSet.list.map((a) => a.chapter);
            /* eslint-disable no-await-in-loop */
            localizedChapters = await personalizationMysql.getLocalizedChapters(chapters, db.mysql.read);
        }
        // eslint-disable-next-line no-loop-func
        carousel.items = personalisationSet.list.map((elem) => {
            if (studentLocale === 'hi') {
                elem.image_url = elem.image_url.replace('personalization_chapters', 'personalization_chapters/hindi');
                const a = _.find(localizedChapters, ['chapter_en', elem.chapter]);
                if (_.isObject(a)) {
                    elem.chapter = a.chapter_hi;
                }
            }
            const mappedObject = {
                title: elem.title,
                subtitle: elem.description,
                show_whatsapp: true,
                show_video: true,
                // image_url: buildStaticCdnUrl(elem.image_url),
                image_url: buildStaticCdnUrl(Utility.convertoWebP(elem.image_url)),
                card_width: carousel.scroll_size, // percentage of screen width
                aspect_ratio: '',
                deeplink: encodeURI(`doubtnutapp://personalize_chapter?chapterId=${elem.id}&chapter_title=${elem.chapter}`),
                id: elem.id,
            };
            return mappedObject;
        });
        carousel.id = `${carousel.carousel_id}`;

        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: carousel,
            widget_type: 'horizontal_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getAppBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    // console.log('Getting in to APP banner flow');
    if (carousel.scroll_size === '1x') {
        /* eslint-disable no-await-in-loop */
        carousel.items = await AppBannerContainer.getAppBanner1xDataNew(carousel.type, carousel.scroll_size, carousel.data_type, button, '', '', carousel.data_limit, studentClass, versionCode, db);
    } else if (carousel.scroll_size === '1.5x') {
        /* eslint-disable no-await-in-loop */
        carousel.data = await AppBannerContainer.getAppBanner15xData(carousel.type, carousel.scroll_size, carousel.data_type, button, '', '', carousel.data_limit, studentClass, db);
    } else if (carousel.scroll_size === '2.5x') {
        /* eslint-disable no-await-in-loop */
        carousel.items = await AppBannerContainer.getAppBanner25xData(carousel.type, carousel.scroll_size, carousel.data_type, button, '', '', carousel.data_limit, studentClass, db);
    }
    carousel.items = _.map(carousel.items, (item) => {
        item.deeplink = `doubtnutapp://${item.action_activity}?`;
        const action_data = JSON.parse(item.action_data);
        // eslint-disable-next-line guard-for-in
        for (const action in action_data) {
            if (item.title == 'leaderboard' && action == 'url') {
                const base64StudentId = Buffer.from(studentId.toString()).toString('base64');
                item.deeplink = `${item.deeplink}${action}=${action_data[action]}?student_id=${base64StudentId}&`;
            } else {
                item.deeplink = `${item.deeplink}${action}=${action_data[action]}&`;
            }
        }
        item.deeplink = encodeURI(item.deeplink);
        // item.image_url = buildStaticCdnUrl(item.image_url);
        item.image_url = buildStaticCdnUrl(Utility.convertoWebP(item.image_url));
        return item;
    });
    carousel.auto_scroll_time_in_sec = autoScrollTime;
    if (!carousel._id) {
        carousel._id = '';
    }
    carousel.id = `${carousel.carousel_id}`;
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_data: carousel,
        widget_type: 'carousel_list',
        layout_config: {
            margin_top: 16,
            margin_left: 0,
            margin_right: 0,
        },
        order: carousel.caraousel_order,
    };
}

async function getLibraryVideo(carousel, studentId, studentClass, db, base_url, homeCarouselsGroupedById, studentLocale) {
    // console.log('Getting in to library flow');
    let defaultCache = true;
    if (carousel.mapped_playlist_id === '465436') {
        defaultCache = false;
    }
    // const gradient = _.sample(color);
    const gradient = _.sample(color);
    /* eslint-disable no-await-in-loop */
    let libraryData = await QuestionContainer.getLibraryVideos(carousel.type, base_url, gradient, carousel.data_type, '', 'HOME_FEED', capsule, studentClass, studentId, carousel.mapped_playlist_id, language, carousel.data_limit, duration, db, defaultCache);
    libraryData = libraryData.map((libraryItem) => {
        // libraryItem.image_url = buildStaticCdnUrl(libraryItem.image_url);
        libraryItem.image_url = buildStaticCdnUrl(Utility.convertoWebP(libraryItem.image_url));

        return libraryItem;
    });
    // thumbnail experiment
    for (let i = 0; i < libraryData.length; i++) {
        if (['VIKRAM SINGH', 'VIPIN CHOUBISA', 'PARTH KHUNGAR'].includes(libraryData[i].expert_name) && libraryData[i].class) {
            let check = await HomepageRedis.getThumbnailExperiment(db.redis.read, libraryData[i].liveclass_course_detail_id, libraryData[i].class, libraryData[i].question_id);
            if (check !== null) {
                check = JSON.parse(check);
            }
            if (check && parseInt(check.active) === 1) {
                const imageTemp = `notif-thumb-custom-${libraryData[i].liveclass_course_detail_id}-${libraryData[i].class}-${libraryData[i].question_id}.webp`;
                libraryData[i].image_url = `${config.staticCDN}q-thumbnail/${imageTemp}`;
            }
        }
    }
    if (libraryData && libraryData.length > 0) {
        carousel.items = libraryData.map((elem) => {
            const mappedObject = {
                title: elem.question,
                subtitle: '',
                show_whatsapp: true,
                show_video: true,
                image_url: elem.image_url,
                card_width: carousel.scroll_size, // percentage of screen width
                deeplink: encodeURI(`doubtnutapp://video?qid=${elem.question_id}&page=HOME_FEED&playlist_id=${carousel.type}`),
                aspect_ratio: '',
                id: elem.question_id,
            };
            if (carousel.type == 'VIDEO_GEN') {
                mappedObject.deeplink = encodeURI(`doubtnutapp://video?qid=${elem.question_id}&page=LIBRARY&playlist_id=BOOKS_81`);
            } else if (carousel.type == 'LIVECLASS_GEN') {
                mappedObject.deeplink = encodeURI(`doubtnutapp://video?qid=${elem.question_id}&page=HOME_FEED&playlist_id=BOOKS_-55`);
            }
            return mappedObject;
        });
        carousel.show_view_all = 1;
        let mainTitle = homeCarouselsGroupedById[carousel.carousel_id][0].title;
        let carouselTitle = carousel.title;
        if (carousel.type === 'VIDEO_GEN' && studentLocale === 'hi') {
            const translatedData = await LanguageTranslations.getTranslatedDataForRow(db.mysql.read, 'home_carousel', carousel.carousel_id, 'title', 'hi');
            if (translatedData.length === 1) {
                carouselTitle = translatedData[0].translation;
                mainTitle = translatedData[0].translation;
            }
        }
        carousel.title = mainTitle;
        carousel.deeplink = encodeURI(`doubtnutapp://playlist?playlist_id=${carousel.mapped_playlist_id}&playlist_title=${carouselTitle}&is_last=1`);
        carousel.id = `${carousel.carousel_id}`;

        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: carousel,
            widget_type: 'horizontal_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getDailyQuiz(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    // console.log('Getting in to daily flow');
    /* eslint-disable no-await-in-loop */
    const quizData = await getDailyQuizData(carousel.type, studentId, studentClass, carousel.data_limit, db);
    if (Array.isArray(quizData) && quizData.length) {
        quizData[0]._id = carousel._id;
        quizData[0].id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: quizData[0],
            widget_type: 'daily_quiz',
            layout_config: {
                margin_top: 16,
                margin_left: 0,
                margin_right: 0,
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getCourses(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const widgetAttributes = {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_parent',
        layout_config: {
            margin_top: 0,
            margin_right: 0,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
    // * If flagVariant is 982 and class is not 14 then dont display old popular courses for home page as it will come on top of camera v1/course/widgets
    if (flagVariants.indexOf('982') >= 0 && +studentClass !== 14) {
        return;
    }
    let nonTrials = 0;
    for (let i = 0; i < studentCourseOrClassSubcriptionDetails.length; i++) {
        if (studentCourseOrClassSubcriptionDetails[i].amount != -1) {
            nonTrials++;
        }
    }
    if (!nonTrials) {
        let paidCourses = await CourseHelper.getPaidAssortmentsData({
            db,
            studentClass,
            config,
            versionCode,
            studentId,
            studentLocale,
            xAuthToken,
            page: 'HOMEPAGE',
            pznElasticSearchInstance,
        });
        paidCourses = paidCourses ? paidCourses.items : [];
        if (paidCourses.length) {
            let timerFlagrResp = { campaign_timer: { payload: { enabled: false } } };
            if (carousel.action_text) {
                timerFlagrResp = await CourseContainerv2.getFlagrResp(db, 'campaign_timer', studentId);
            }
            if (versionCode >= 1017 && carousel.action_text && _.get(timerFlagrResp, 'campaign_timer.payload.enabled', false)) {
                const data = carousel.action_text.split('||');
                const now = moment().add(5, 'hours').add(30, 'minutes');
                if (data.length > 1) {
                    if (moment(data[1]).diff(now) > 0) {
                        const timerWidget = CourseHelper.getTimerExtraMarks(data[0], data[1], config);
                        const finalWidget = {
                            widget_data: {
                                title: global.t8[studentLocale].t('Courses for Extra Marks'),
                                scroll_direction: 'vertical',
                                remove_padding: true,
                                rv_margin_top: 4,
                                items: [timerWidget,
                                    {
                                        widget_data: {
                                            items: paidCourses,
                                            id: `${carousel.carousel_id}`,
                                            is_et_reorder: true,
                                        },
                                        ...widgetAttributes,
                                    },
                                ],
                                id: `${carousel.carousel_id}`,
                                is_et_reorder: true,
                            },
                            ...widgetAttributes,
                        };
                        if (data.length > 2) {
                            for (let i = 0; i < finalWidget.widget_data.items[1].widget_data.items.length; i++) {
                                const assortmentId = finalWidget.widget_data.items[1].widget_data.items[i].data.id;
                                finalWidget.widget_data.items[1].widget_data.items[i].data.buy_deeplink = `doubtnutapp://vip?variant_id=${assortmentId}&coupon_code=${data[2]}`;
                                finalWidget.widget_data.items[1].widget_data.items[i].data.deeplink = `doubtnutapp://course_details?id=${assortmentId}||||${data[2]}`;
                            }
                        }
                        return finalWidget;
                    }
                }
            }
            const finalWidget = {
                widget_data: {
                    title: global.t8[studentLocale].t('Courses for Extra Marks'),
                    items: paidCourses,
                    id: `${carousel.carousel_id}`,
                    is_et_reorder: true,
                },
                ...widgetAttributes,
            };
            if (carousel.action_text && _.get(timerFlagrResp, 'campaign_timer.payload.enabled', false)) {
                const data = carousel.action_text.split('||');
                if (data.length > 2) {
                    for (let i = 0; i < finalWidget.widget_data.items.length; i++) {
                        const assortmentId = finalWidget.widget_data.items[i].data.id;
                        finalWidget.widget_data.items[i].data.buy_deeplink = `${finalWidget.widget_data.items[i].data.buy_deeplink}&coupon_code=${data[2]}`;
                        finalWidget.widget_data.items[i].data.deeplink = `doubtnutapp://course_details?id=${assortmentId}||||${data[2]}`;
                    }
                }
            }
            return finalWidget;
        }
    }
}

async function getCoursesV1(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const paidCourses = await CourseHelper.getPaidCoursesByClass(db, studentId);
    if (paidCourses.length) {
        const widgetData = await WidgetHelper.homepagePaidCoursesCarousel({
            db,
            data: paidCourses,
            xAuthToken,
            versionCode,
            studentLocale,
            studentId,
            page: 'HOMEPAGE',
        });
        widgetData.id = `${carousel.carousel_id}`;

        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: widgetData,
            widget_type: 'widget_parent',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getEtoosFaculty(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const assortmentList = JSON.parse(carousel.secondary_data);
    const { facultyGridData, category } = await CourseHelper.getEtoosFacultyByCCM(db, assortmentList, studentId, studentClass, studentCcmData);
    if (facultyGridData.length) {
        const widgetData = WidgetHelper.generateFacultyGridData({
            data: facultyGridData,
            carouselsData: { carousel_type: 'faculty_grid2', title: `${carousel.title} for ${category}` },
            config,
        });
        widgetData.data.id = `${carousel.carousel_id}`;

        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: widgetData.data,
            widget_type: 'faculty_grid2',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getEtoosFacultyFreeVideos(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const assortmentList = JSON.parse(carousel.secondary_data);
    const { demoVideos, tabs, category } = await CourseHelper.getDemoVideosForEtoosFacultyCourse(db, assortmentList, studentId, studentClass, studentCcmData);
    if (tabs.length) {
        const widgetData = await WidgetHelper.homepageVideoWidgetWithTabs({
            tabs,
            title: `${carousel.title} for ${category}`,
            versionCode,
            studentLocale,
            data: demoVideos,
            paymentCardState: { isVip: true },
        });
        widgetData.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: widgetData,
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getHomework(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const homeworkData = await CourseHelper.generateHomeworkListWidget(db, studentId, config, studentLocale);
    if (homeworkData.length) {
        homeworkData[0].data.bg_image = `${config.staticCDN}engagement_framework/43806D53-DDBA-AC40-237C-124CA6DA79E6.webp`;
        homeworkData[0].data.title = global.t8[studentLocale].t('My Homework');
        // homeworkData[0].data.status = '1 / 10 completed';
        homeworkData[0].data.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: homeworkData[0].data,
            widget_type: 'homework_horizontal_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}
async function getCurrentAffairsCarousels(carousel, studentId, studentClass, studentLocale, db, versionCode) {
    const currentAffairsData = await CourseMysql.getCurrentAffairsCarouselData(db.mysql.read);
    const title = global.t8[studentLocale].t('Current Affairs');
    if (!_.isEmpty(currentAffairsData)) {
        const widget = await WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: currentAffairsData, paymentCardState: { isVip: false }, db, config, title, studentLocale, versionCode, isLive: false,
        });
        widget.items = _.filter(widget.items, (item) => item.data && item.data.state !== 0);
        widget.id = `${carousel.carousel_id}`;
        return {
            widget_data: widget,
            widget_type: 'widget_autoplay', // 'widget_parent',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
    return {};
}

async function carouselOrderBasedOnCcmOrder(db, ccmArray) {
    let carouselToBeIncluded = false;
    if (ccmArray.includes(11518) || ccmArray.includes(11404) || ccmArray.includes(11401) || ccmArray.includes(11519) || ccmArray.includes(11402) || ccmArray.length === 0) {
        carouselToBeIncluded = true;
    }
    if (!carouselToBeIncluded) {
        return {};
    }
    const order = ['SSC', 'BANKING', 'RAILWAY'];
    const assortmentList = [23, 324961, 324960];
    // making the right order of tabs
    _.forEach(ccmArray, (id) => {
        const examName = Data.ccmIdExamNameMapping[id] ? Data.ccmIdExamNameMapping[id].type : null;
        if (order.includes(examName)) {
            const index = order.findIndex((x) => x === examName);
            const examToBeShifted = order[index];
            order.splice(index, 1);
            order.splice(0, 0, examToBeShifted);
        }
    });
    const assortmentData = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_boards', assortmentList);
    const groupedAssortmentData = _.groupBy(assortmentData, 'course_session');
    const finalObj = {};
    for (let i = 0; i < order.length; i++) {
        const examData = groupedAssortmentData[order[i]] ? groupedAssortmentData[order[i]] : null;
        finalObj[order[i]] = examData;
    }
    return finalObj;
}

function isJeeNeetCcmExist(ccmArray) {
    const jeeNeetCcm = [11102, 13360, 11101, 11108, 11107, 11103, 11202, 13370, 11201, 11208, 11207, 11203, 11301, 11303];

    for (const ccm of ccmArray) {
        if (jeeNeetCcm.includes(ccm)) {
            return true;
        }
    }
    return false;
}

function orderingTabsBasedOnLocale(studentLocale, tabs) {
    const finalTabs = [];
    if (studentLocale === 'hi') {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].key.split(' ').includes('HINDI')) {
                finalTabs.push(tabs[i]);
            }
        } for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].key.split(' ').includes('ENGLISH')) {
                finalTabs.push(tabs[i]);
            }
        }
    } else {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].key.split(' ').includes('ENGLISH')) {
                finalTabs.push(tabs[i]);
            }
        }
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].key.split(' ').includes('HINDI')) {
                finalTabs.push(tabs[i]);
            }
        }
    }
    return finalTabs;
}
async function getLiveClassV1(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    // revert later
    let replace = false;
    if (['9', '10', '11', '12', '13'].includes(studentClass.toString())) {
        replace = true;
    }
    if (carousel.data_type === 'live' && home_page_experiment === 'true') {
        let courses = iitNeetCourses.length ? [...ccmCourses, ...iitNeetCourses] : ccmCourses;
        // NKC packages added
        if (['10', '11', '12', '13'].includes(studentClass.toString()) && studentLocale === 'en') {
            courses = [...[{ assortment_id: 1000358 }, { assortment_id: 1000363 }], ...courses];
        }
        // eslint-disable-next-line prefer-const
        let [liveData, replayData] = await Promise.all([CourseHelper.getVideosDataByScheduleType(db, courses, studentClass, studentLocale, 'live', carousel), CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'replay', carousel)]);
        let schedulerFlagrResp = { simulated_live_classes: { payload: { enabled: false, design: 'vertical' } } };
        if (versionCode > 971) {
            schedulerFlagrResp = await CourseContainerv2.getFlagrResp(db, 'simulated_live_classes', studentId);
        }
        // console.log('schedulerFlagrResp');
        // console.log(schedulerFlagrResp);
        let playlistIdList = [];
        if (_.get(schedulerFlagrResp, 'simulated_live_classes.payload.enabled', false)) {
            playlistIdList = await SchedulerHelper.getPlaylists(db, ccmArray, studentClass, studentLocale);
            // console.log('playlistIdList');
            // console.log(playlistIdList);
            if (playlistIdList.length > 0) {
                const qidObject = {};
                const widget = {
                    id: carousel.carousel_id,
                    tracking_view_id: carousel.carousel_id,
                    widget_type: 'widget_autoplay',
                    widget_data: {},
                    layout_config: {
                        margin_top: 16,
                        margin_right: 0,
                        bg_color: '#ffffff',
                    },
                    order: carousel.caraousel_order,
                };
                // get qid list from redis
                for (let i = 0; i < playlistIdList.length; i++) {
                    const slotKey = SchedulerHelper.getSlotkey(playlistIdList[i]);
                    // console.log('slotKeYYYYYYYYYy');
                    // console.log(slotKey);
                    // get data from redis
                    const qidList = await RedisUtils.getSetMembers(db.redis.read, slotKey);
                    // qidList = [...qidList, ...[645185336, 647518832]];
                    // console.log('qidList');
                    // console.log(qidList);
                    if (qidList.length > 0) {
                        qidObject[slotKey] = qidList;
                    }
                }
                const widgetData = await SchedulerHelper.getSchedulerWidget(db, config, qidObject, schedulerFlagrResp.simulated_live_classes.payload.design, 'all', liveData, versionCode, 'home', studentId, replayData);
                // console.log(widgetData.items);
                if (typeof widgetData.tabs !== 'undefined' && widgetData.tabs.length > 0) {
                    widget.widget_data = widgetData;
                    widget.widget_data.id = `${carousel.carousel_id}`;
                    widget.widget_data.is_liveclass_carousel = true;
                    return widget;
                }
            }
        }
        if (liveData.length) {
            liveData = liveData.filter((thing, index, self) => index === self.findIndex((t) => (
                t.resource_reference === thing.resource_reference
            )));
            const facultyPriorityByClass = await CourseContainerv2.getFacultyPriorityByClassAndLocale(db, studentClass, studentLocale === 'hi' ? 'HINDI' : 'ENGLISH');
            const facultyCategory = {
                BOARDS: 0,
                'IIT JEE': 0,
                NEET: 0,
                NDA: 0,
            };
            const facultyPriority = {};
            for (let i = 0; i < facultyPriorityByClass.length; i++) {
                facultyPriority[facultyPriorityByClass[i].faculty_id] = facultyPriorityByClass[i].priority;
                facultyCategory[facultyPriorityByClass[i].category] = facultyPriorityByClass[i].category_order;
            }
            if (facultyPriorityByClass.length) {
                for (let i = 0; i < liveData.length; i++) {
                    liveData[i].faculty_priority = facultyPriority[liveData[i].faculty_id];
                    liveData[i].category_priority = liveData[i].category.includes('Board') ? facultyCategory.BOARDS : facultyCategory[liveData[i].category] || 100;
                }
                if (studentCcmData.length > 1) {
                    liveData = _.orderBy(liveData, ['category_priority', 'faculty_priority']);
                } else {
                    liveData = _.orderBy(liveData, 'faculty_priority');
                }
            }
            const widget = await WidgetHelper.homepageVideoWidgetWithAutoplay({
                data: liveData, paymentCardState: { isVip: false }, db, config, title: 'Live Classes', studentLocale, versionCode,
            });
            // revert later
            if (replace) {
                for (let i = 0; i < widget.items.length; i++) {
                    const oldId = liveData.filter((x) => x.resource_reference == widget.items[i].data.id);
                    if (!_.isEmpty(oldId)) {
                        let check = await HomepageRedis.getThumbnailExperiment(db.redis.read, oldId[0].old_detail_id, studentClass, widget.items[i].data.id);
                        if (check !== null) {
                            check = JSON.parse(check);
                        }
                        if (check && check.active == 1) {
                            widget.items[i].data.top_title = '';
                            widget.items[i].data.title1 = '';
                            widget.items[i].data.title2 = '';
                            widget.items[i].data.subject = '';
                            widget.items[i].data.image_url = '';
                            widget.items[i].data.color = '#00000000';
                            widget.items[i].data.bg_exam_tag = '';
                            widget.items[i].data.text_color_exam_tag = '';
                            widget.items[i].data.target_exam = '';
                            widget.items[i].data.image_bg_card = `${config.staticCDN}q-thumbnail/notif-thumb-custom-${oldId[0].old_detail_id}-${studentClass}-${widget.items[i].data.id}.webp`;
                        }
                    }
                }
            }
            widget.id = `${carousel.carousel_id}`;
            widget.is_liveclass_carousel = true;

            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: widget,
                widget_type: 'widget_autoplay', // 'widget_parent',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
            };
        }
    } else if (carousel.data_type === 'replay' && home_page_experiment === 'true') {
        const data = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'replay', carousel);
        if (data.length) {
            const widget = await WidgetHelper.homepageVideoWidgetWithAutoplay({
                data, paymentCardState: { isVip: false }, db, config, title: '24*7 Doubtnut Classes', studentLocale,
            });
            widget.id = `${carousel.carousel_id}`;
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: widget,
                widget_type: 'widget_autoplay', // 'widget_parent',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
            };
        }
    } else if (((carousel.data_type === 'past' && !isDropper) || (carousel.data_type === 'iit_neet_past' && iitNeetCourses.length)) && home_page_experiment === 'true') {
        const ccmTitle = '';
        const data = carousel.data_type === 'iit_neet_past' ? await CourseHelper.getVideosDataByScheduleType(db, iitNeetCourses, studentClass, studentLocale, 'iit_neet_past', carousel, ccmTitle) : await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'recent', carousel, ccmTitle);
        if (data.length) {
            // data = studentLocale === 'hi' ? data.reverse() : data;
            let title = global.t8[studentLocale].t('Daily Free Classes (Boards)');
            let groupedData = _.groupBy(data, 'course_session');
            if (parseInt(studentClass) === 14) {
                title = global.t8[studentLocale].t('Daily Free Classes');
                groupedData = await carouselOrderBasedOnCcmOrder(db, ccmArray);
                if (_.isEmpty(groupedData)) {
                    return null;
                }
            }

            let tabs = [];
            const enTitle = global.t8[studentLocale].t('English');
            const hiTitle = global.t8[studentLocale].t('Hindi');
            for (const key in groupedData) {
                if (groupedData[key]) {
                    tabs.push({
                        key,
                        title: key.includes('HINDI') ? key.replace('HINDI', hiTitle) : key.replace('ENGLISH', enTitle),
                        is_selected: false,
                    });
                }
            }
            if (parseInt(studentClass) !== 14) {
                tabs = studentLocale === 'hi' ? tabs.reverse() : tabs;
            }
            let isLiveClassCarousel = true;
            if (carousel.data_type === 'iit_neet_past') {
                title = global.t8[studentLocale].t('Today’s free {{ccmTitle}} Classes', { ccmTitle });
                isLiveClassCarousel = isJeeNeetCcmExist(ccmArray);
            }
            tabs = orderingTabsBasedOnLocale(studentLocale, tabs);
            if (tabs.length) {
                tabs[0].is_selected = true;
            }
            const widget = await WidgetHelper.homepageVideoWidgetWithTabs({
                data: groupedData, paymentCardState: { isVip: false }, title, studentLocale, versionCode, tabs,
            });
            widget.id = `${carousel.carousel_id}`;
            widget.is_liveclass_carousel = isLiveClassCarousel;
            // revert later
            if (replace && versionCode > 961) {
                for (const key in widget.items) {
                    if (key == '2021-22 ENGLISH' || key == '2021-22 HINDI') {
                        for (let i = 0; i < widget.items[key].length; i++) {
                            const oldId = data.filter((x) => x.resource_reference == widget.items[key][i].data.id && x.course_session == key);
                            if (!_.isEmpty(oldId)) {
                                let check = await HomepageRedis.getThumbnailExperiment(db.redis.read, oldId[0].old_detail_id, studentClass, widget.items[key][i].data.id);
                                if (check !== null) {
                                    check = JSON.parse(check);
                                }
                                if (check && check.active == 1) {
                                    widget.items[key][i].data.top_title = '';
                                    widget.items[key][i].data.title1 = '';
                                    widget.items[key][i].data.title2 = '';
                                    widget.items[key][i].data.subject = '';
                                    widget.items[key][i].data.image_url = '';
                                    widget.items[key][i].data.color = '#00000000';
                                    widget.items[key][i].data.bg_exam_tag = '';
                                    widget.items[key][i].data.text_color_exam_tag = '';
                                    widget.items[key][i].data.target_exam = '';
                                    widget.items[key][i].data.image_bg_card = `${config.staticCDN}q-thumbnail/notif-thumb-custom-${oldId[0].old_detail_id}-${studentClass}-${widget.items[key][i].data.id}.webp`;
                                    widget.items[key][i].data.image_bg_scale_type = 'FIT_XY';
                                }
                            }
                        }
                    }
                }
            }
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: widget,
                widget_type: 'widget_parent_tab',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
            };
        }
    } else if (home_page_experiment === 'true') {
        const data = await CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'upcoming', carousel);
        if (data.length) {
            const qIdsList = data.map((item) => item.resource_reference);
            const userMarkedInsterestedData = await CourseMysqlv2.getUserSubscribedqIds(db.mysql.read, studentId, qIdsList);
            const widget = await WidgetHelper.homepageVideoWidgetWithoutTabs({
                data, paymentCardState: { isVip: false }, title: global.t8[studentLocale].t('Upcoming Live Classes'), studentLocale, versionCode, userMarkedInsterestedData,
            });
            widget.id = `${carousel.carousel_id}`;
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: widget,
                widget_type: 'widget_parent',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
            };
        }
    }
}

async function getPlaylist(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (home_page_experiment === 'true' && versionCode > 838) {
        const srpNonSrpDataDetails = await srpNonSrpDetails(db, studentId, studentLocale);
        const peopleWatchShouldWatch = await peopleWatchShouldWatchDetails(db, studentId, studentLocale);

        let finalPlaylistData = [];
        if (srpNonSrpDataDetails.length != 0) {
            finalPlaylistData = srpNonSrpDataDetails;
        }
        if (peopleWatchShouldWatch.length != 0) {
            finalPlaylistData = [...finalPlaylistData, ...peopleWatchShouldWatch];
        }

        if (finalPlaylistData.length != 0) {
            const playlistItem = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: titleForNewCarousals,
                    displayed_item_count: finalPlaylistData.length > 2 ? 2 : finalPlaylistData.length,
                    scroll_direction: 'vertical',
                    items: finalPlaylistData,
                    is_vip: false,
                    show_more_button_text: Data.playListShowMore(studentLocale),
                    id: carousel.carousel_id.toString(),
                },
                widget_type: 'widget_collapsed',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
            };

            return playlistItem;
        }
    }
}

async function getChannels(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals) {
    if (home_page_experiment === 'true' && versionCode > 846) {
        const channelData = await makeChannelData(db, studentId, studentClass, studentLocale, versionCode);
        if (channelData.length > 0) {
            const channelItem = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: titleForNewCarousals,
                    is_title_bold: true,
                    items: channelData,
                    id: carousel.carousel_id.toString(),
                },
                widget_type: 'widget_parent',
            };
            return channelItem;
        }
    }
}

async function getHistory(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals) {
    if (home_page_experiment === 'true' && versionCode > 846) {
        let historyData = await redisAnswer.getHistoryData(db.redis.read, studentId);
        if (!_.isNull(historyData)) {
            historyData = JSON.parse(historyData);
            historyData = await makeHistoryData(db, config.staticCDN, historyData);
            const historyResponse = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    videos: historyData,
                    id: carousel.carousel_id.toString(),
                },
                widget_type: 'you_were_watching',
            };
            return historyResponse;
        }
    }
}

async function getHomepageGamesList(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals) {
    if (home_page_experiment === 'true' && versionCode > 846) {
        const gameData = await getGamesDataForNudge(db, '', studentLocale);
        if (gameData.length > 0) {
            gameData.forEach((x) => {
                x.data.card_width = '3.5';
            });
            const gameResponse = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: titleForNewCarousals,
                    is_title_bold: true,
                    items: gameData,
                    id: carousel.carousel_id.toString(),
                },
                widget_type: 'widget_parent',
            };
            return gameResponse;
        }
    }
}

async function getVideoAds(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, registeredDate) {
    if (home_page_experiment === 'true' && versionCode > 846) {
        const videoAdData = await makeVideoAddData(db, studentId, studentLocale, studentClass, xAuthToken, registeredDate, flagVariants, versionCode);
        if (videoAdData && videoAdData.videoAdsList.length > 0) {
            const videoAdsResponse = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: titleForNewCarousals,
                    full_width_cards: true,
                    items: videoAdData.videoAdsList,
                    default_mute: true,
                    auto_play: true,
                    id: carousel.carousel_id.toString(),
                },
                widget_type: 'widget_autoplay',
            };
            return videoAdsResponse;
        }
    }
}

async function getPrevYearSolutions(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    if (home_page_experiment === 'true' && versionCode > 848) {
        if (prevYearsArr.length > 0) {
            const previousYearSolutionsResponse = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: titleForNewCarousals,
                    card_groups: prevYearsArr,
                    id: carousel.carousel_id.toString(),
                },
                widget_type: 'image_card_group',
            };
            return previousYearSolutionsResponse;
        }
    }
}

async function getPendingPayment(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    if (home_page_experiment === 'true' && versionCode > 862) {
        let packageDetail = await courseV2Redis.getpaymentPendingDetails(db.redis.read, studentId);
        if (packageDetail !== null) {
            packageDetail = JSON.parse(packageDetail);
            const paymentPendingInfo = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    id: `${carousel.carousel_id}`,
                    title: (studentLocale !== 'hi') ? 'Course kharidna abhi baki hai' : 'कोर्स खरीदना है अभी बाकी',
                    subtitle: packageDetail.subtitle,
                    price: `₹ ${packageDetail.price}`,
                    crossed_price: `₹ ${packageDetail.crossed_price}`,
                    image_url: buildStaticCdnUrl(packageDetail.image_url),
                    cta_button_text: (studentLocale !== 'hi') ? 'Payment complete kare' : 'पेमेंट कम्पलीट करें',
                    coupon: null,
                    deeplink: (packageDetail.couponCode) ? `doubtnutapp://vip?variant_id=${packageDetail.variantId}&coupon_code=${packageDetail.couponCode}` : `doubtnutapp://vip?variant_id=${packageDetail.variantId}`,
                },
                widget_type: 'pending_payment',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
                extra_params: {
                    student_id: studentId,
                    assortment_id: packageDetail.assortmentId,
                    promo_text: packageDetail.couponCode,
                    page: 'HOMEPAGE',
                },
            };
            return paymentPendingInfo;
        }
    }
}

async function getTopFreeClassesCarousel(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    if (versionCode > 866) {
        // console.log('Getting into top free classes');
        const widget = await getTopFreeClasses(db, studentId, studentClass, studentLocale);
        // * Do not push widget if it is null
        if (!widget) return;
        widget.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: widget,
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getMyCourses(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    const widgetAttributes = {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_parent',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
    // * If flagVariant is 982 and class is not 14 then dont display old popular courses for home page as it will come on top of camera v1/course/widgets
    if (flagVariants.indexOf('982') >= 0 && +studentClass !== 14) {
        return;
    }
    if (studentCourseOrClassSubcriptionDetails.length) {
        const widget = await CourseHelper.getUserCoursesCarousel({
            db,
            studentId,
            studentClass,
            studentLocale,
            studentCourseOrClassSubcriptionDetails,
            xAuthToken,
            versionCode,
            config,
            setWidth: true,
            coursePage: 'MY_COURSES',
        });
        if (!widget.length) {
            return;
        }
        const title = global.t8[studentLocale].t('My Courses');
        let myCourseCarousel;
        if (versionCode >= 893) {
            myCourseCarousel = {
                widget_data: {
                    id: `${carousel.carousel_id}`,
                    title,
                    items: widget.filter(Boolean),
                    background_color: '#fafafa',
                },
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_type: 'widget_my_courses',
                order: carousel.caraousel_order,
                extra_params: {
                    be_source: 'HOMEPAGE',
                    widget_type: 'widget_my_courses',
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                },
            };
        } else {
            myCourseCarousel = {
                widget_data: {
                    title,
                    items: widget,
                    id: `${carousel.carousel_id}`,
                },
                ...widgetAttributes,
            };
        }
        return myCourseCarousel;
    }
}

async function getDoubtFeed(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    const finalBannerData = await makeDoubtfeedBanner(db, carousel, studentId, studentLocale, versionCode, flagVariants);
    if ('widget_type' in finalBannerData) {
        finalBannerData.widget_data.id = `${carousel.carousel_id}`;
        return {
            ...finalBannerData,
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
        };
    }
}

async function getKheloJeeto(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    const bannerData = await kheloJeetoBanner(carousel, studentLocale, versionCode);
    if ('widget_type' in bannerData) {
        bannerData.widget_data.id = `${carousel.carousel_id}`;
        return {
            ...bannerData,
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
        };
    }
}

async function getGovBooks(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr) {
    const tempCarousel = carousel;

    // eslint-disable-next-line no-await-in-loop
    const personalisedTabs = await QuestionContainer.getPersonalizedTabs(studentClass, studentId, db, tempCarousel.mapped_playlist_id);

    if (personalisedTabs && personalisedTabs.length > 0) {
        tempCarousel.widget_type = 'horizontal_list';
        tempCarousel.items = personalisedTabs.map((elem) => {
            const subject = elem.subject ? elem.subject : '';
            const descriptionArr = (elem.description).split('_');
            const questionStudentId = descriptionArr[descriptionArr.length - 1];
            return {
                title: elem.tabTitle,
                subtitle: '',
                show_whatsapp: false,
                show_video: false,
                // image_url: buildStaticCdnUrl(elem.image_url),
                image_url: buildStaticCdnUrl(Utility.convertoWebP(elem.image_url)),
                card_width: carousel.scroll_size, // percentage of screen width
                deeplink: encodeURI(`doubtnutapp://playlist?playlist_id=${elem.tab_playlist_id}&playlist_title=${elem.tabTitle}&is_last=0&package_details_id=LIBRARY_NEW_BOOK_${questionStudentId}_${studentClass}_${subject}`),
                aspect_ratio: '',
                id: elem.question_id,
            };
        });
        tempCarousel.show_view_all = 0;
        tempCarousel.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: tempCarousel,
            widget_type: 'horizontal_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getMySatchet(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails) {
    const widgetAttributes = {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_my_sachet',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
    const studentChapterPDFSachets = studentCurrentSubscriptionDetails.filter((item) => (item.assortment_type === 'chapter' || item.assortment_type === 'resource_video' || item.assortment_type === 'resource_pdf'));
    if (!studentChapterPDFSachets.length) return;
    let widgetData = await courseV2Redis.getUserSachetWidgetDetails(db.redis.read, studentId);
    if (!_.isNull(widgetData)) {
        widgetData = JSON.parse(widgetData);
    } else {
        widgetData = await CourseHelper.getUserChapterPDFSachetsCarousel({
            db,
            config,
            studentId,
            studentLocale,
            studentChapterPDFSachets,
        });
        courseV2Redis.setUserSachetWidgetDetails(db.redis.write, studentId, widgetData);
    }
    widgetAttributes.widget_data = widgetData;
    widgetAttributes.widget_data.id = `${carousel.carousel_id}`;
    return widgetAttributes;
}

async function getNudgeByTG(db, studentId, studentClass, studentLocale, nudges) {
    if (nudges.length) {
        let i = 0;
        while (i < nudges.length) {
            let tgCheck = true;
            if (nudges[i].target_group) {
                tgCheck = await TgHelper.targetGroupCheck({
                    db, studentId, tgID: nudges[i].target_group, studentClass, locale: studentLocale,
                });
            }
            if (tgCheck === false) {
                nudges.splice(i, 1);
                --i;
            }
            ++i;
        }
    }
    return nudges;
}

async function getWidgetNudge(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper) {
    // let nudges = await NudgeMysql.getByTypeAndEvent(db.mysql.read, ['widget_nudge'], 'homepage', studentClass);
    let nudges = await CourseContainer.getByTypeAndEvent(db, 'widget_nudge', 'homepage', studentClass);
    if (nudges.length) {
        const checkLastShownTime = await NudgeHelper.checkEligiblityForRenewalNudge({
            db,
            studentID: studentId,
            assortmentID: nudges[0].id,
        });
        if (checkLastShownTime) {
            nudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, nudges);
            if (nudges.length) {
                let rewardDeeplink;
                if (nudges[0].coupon_id === 'REWARD') {
                    if (isDropper) return;
                    if (studentLocale === 'hi' && (nudges[0].id === 149 || nudges[0].id === 147)) {
                        nudges[0] = nudges[1] || nudges[0];
                    } else if (studentLocale !== 'hi' && (nudges[0].id === 148 || nudges[0].id === 150)) {
                        nudges[0] = nudges[1] || nudges[0];
                    }
                    rewardDeeplink = await CourseHelper.getRewardBannerDeeplink(db, studentId);
                    if (_.isNull(rewardDeeplink)) return;
                }
                nudges[0].is_banner = !nudges[0].text;
                const nudgeWidget = WidgetHelper.getRenewalNudgesWidget({
                    config,
                    result: nudges,
                    locale: studentLocale,
                    nudgeType: 'nudge',
                    assortmentID: nudges[0].id,
                    rewardDeeplink,
                });
                if (nudgeWidget.data.deeplink.includes('scholarship')) {
                    const type = nudges[0].deeplink.replace('doubtnutapp://course_details?id=scholarship_test_', '');
                    const scholarshipLandingDeeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentId);
                    nudgeWidget.data.deeplink = scholarshipLandingDeeplink;
                }
                nudgeWidget.data.id = `${carousel.carousel_id}`;
                return {
                    id: carousel.carousel_id,
                    tracking_view_id: carousel.carousel_id,
                    widget_data: nudgeWidget.data,
                    widget_type: 'widget_nudge',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    order: carousel.caraousel_order,
                };
            }
        }
    }
}

async function getProfileDetails(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper) {
    const profileData = await profileDataMaker(db, config, studentId, studentClass, isDropper, studentLocale, versionCode);
    if ('widget_type' in profileData) {
        profileData.order = carousel.caraousel_order;
        profileData.widget_data.id = `${carousel.carousel_id}`;
        return {
            ...profileData,
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
        };
    }
}

async function getCallingCard(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper) {
    if (versionCode >= 1008) {
        const widgeInfo = await CourseHelper.getCallingCardWidgetV2(db, studentId, studentLocale, config);
        if (!_.isEmpty(widgeInfo)) {
            return {
                ...widgeInfo,
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
            };
        }
    }
    if (versionCode > 912) {
        const widgeInfo = await CourseHelper.getCallingCardWidget(db, studentId, carousel.caraousel_order);
        if (!_.isEmpty(widgeInfo)) {
            return {
                ...widgeInfo,
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
            };
        }
    }
}

async function getBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign) {
    if (carousel.data_type === 'short_banner' && versionCode >= 917) {
        const bannerData = await homeBanner(db, versionCode, flagVariants, studentId, studentClass, studentLocale, 'short_banner', registeredDate, studentCourseOrClassSubcriptionDetails.length, campaign);
        if ('widget_type' in bannerData) {
            bannerData.widget_data.id = `${carousel.carousel_id}`;
            return {
                ...bannerData,
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
            };
        }
    } else if (carousel.data_type === 'long_banner' && versionCode >= 917) {
        const bannerData = await homeBanner(db, versionCode, flagVariants, studentId, studentClass, studentLocale, 'long_banner', registeredDate, studentCourseOrClassSubcriptionDetails.length, campaign);
        if ('widget_type' in bannerData) {
            bannerData.widget_data.id = `${carousel.carousel_id}`;
            return {
                ...bannerData,
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
            };
        }
    }
}

async function getLatestCourses(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (!studentCurrentSubscriptionDetails.length) {
        const data = await CourseContainer.getLatestLauncedCourses(db, studentClass, studentLocale, studentId);
        const assortmentList = [];
        data.map((item) => assortmentList.push(item.assortment_id));
        if (data.length) {
            const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId);
            const promise = [];
            for (let i = 0; i < data.length; i++) {
                promise.push(CourseHelper.generateAssortmentObject({
                    data: data[i], config, paymentCardState: { isVip: false }, assortmentPriceMapping, db, setWidth: true, versionCode, assortmentFlagrResponse: {}, locale: studentLocale, category: null, page: 'HOMEPAGE', studentId,
                }));
            }
            const items = await Promise.all(promise);
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    id: `${carousel.carousel_id}`,
                    items,
                    title: global.t8[studentLocale].t('Popular Courses'),
                    is_et_reorder: true,
                },
                widget_type: 'widget_parent',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
            };
        }
    }
}

async function getDictionaryBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (flagVariants.includes('1365')) {
        const obj = {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_type: 'banner_image',
            widget_data: {
                id: `${carousel.carousel_id}`,
                _id: carousel.carousel_id,
                image_url: `${config.staticCDN}dictionary/dictionary-banner.webp`,
                deeplink: 'doubtnutapp://dictionary',
                card_ratio: '4:1',
                card_width: '1.0',
            },
            order: carousel.caraousel_order,
        };
        return obj;
    }
}

async function getCtetBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const obj = {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'banner_image',
        widget_data: {
            id: `${carousel.carousel_id}`,
            _id: carousel.carousel_id,
            image_url: `${config.staticCDN}images/ctet-sample-paper-solution.webp`,
            deeplink: 'doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_open/ctet-sample-paper-sample-paper-2021-doubtnut-english-medium.pdf',
            card_ratio: '4:2',
            card_width: '1.0',
        },
        order: carousel.caraousel_order,
    };
    return obj;
}

async function getWhatsapp(carousel) {
    // console.log('Getting in to whatsapp flow');
    carousel.id = `${carousel.carousel_id}`;
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_data: carousel,
        widget_type: carousel.widget_type,
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
}

async function getStudyTimerBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'banner_image',
        widget_data: {
            id: `${carousel.carousel_id}`,
            _id: carousel.carousel_id,
            image_url: `${config.staticCDN}engagement_framework/F9CD75B7-187B-92F3-6C0D-7FB9285025E4.webp`,
            deeplink: 'doubtnutapp://study_timer',
            card_ratio: '4:1',
            card_width: '1.0',
        },
        order: carousel.caraousel_order,
    };
}

async function getPracticeEnglishBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const sql = 'select value as banner_image from dn_property where bucket = "quiztfs" and name = "entry_banner"';
    const banner = await db.mysql.read.query(sql);

    const staticS3 = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/';

    let bannerImage = `${config.staticCDN}images/2022/01/28/11-21-47-574-AM_Quiz%20War%20Banner%202_3.webp`;
    if (_.get(banner[0], 'banner_image', null)) {
        bannerImage = banner[0].banner_image.replace(staticS3, config.staticCDN);
    }

    const bannerDeeplink = 'doubtnutapp://practice_english';
    // if (versionCode >= 977) {
    //     bannerDeeplink = 'doubtnutapp://daily_practice?type=english_quiz';
    // }
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        type: 'promo_list',
        data: {
            id: `${carousel.carousel_id}`,
            items: [
                {
                    id: carousel.carousel_id,
                    image_url: bannerImage,
                    deeplink: bannerDeeplink,
                },
            ],
            margin: true,
            ratio: '16:9',
        },
        extra_params: {
            id: 'english_home_banner',
        },
    };
}

async function getPracticeEnglishWidget(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const sessionId = uuidv4();
    const questionsList = await PracticeEnglishHelper.getQuestionsListWidget(db, studentId, studentLocale, versionCode);

    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_practice_english',
        widget_data: {
            id: `${carousel.carousel_id}`,
            session_id: sessionId,
            submit_button_text: 'Submit',
            ...questionsList,
        },
        order: carousel.caraousel_order,
    };
}

async function getSpokenEnglishCertificateBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const sql = 'select * from course_certificates where course_id = 69 and student_id = ? and is_deleted = 0 order by id desc';
    const spokenEnglishCertificate = await db.mysql.read.query(sql, [studentId]);

    if (_.get(spokenEnglishCertificate[0], 'certificate', null)) {
        const certificateUrl = spokenEnglishCertificate[0].certificate;

        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_type: 'banner_image',
            widget_data: {
                id: `${carousel.carousel_id}`,
                _id: carousel.carousel_id,
                image_url: `${config.staticCDN}images/2022/01/14/10-40-38-426-AM_spoken_eng_certificate_ready.webp`,
                deeplink: `doubtnutapp://pdf_viewer?pdf_url=${certificateUrl}`,
                card_ratio: '16:9',
                card_width: '1.0',
            },
            order: carousel.caraousel_order,
        };
    }
    return undefined;
}

async function getTeachingCarousel(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (home_page_experiment === 'true') {
        let widget = null;
        const assortmentList = [344177];
        const data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_boards', assortmentList);
        if (ccmArray.includes(11403) || ccmArray.length === 0) {
            if (!_.isEmpty(data)) {
                widget = await WidgetHelper.homepageVideoWidgetWithoutTabs({
                    data, paymentCardState: { isVip: false }, title: global.t8[studentLocale].t('Daily Free Classes (Teaching)'), studentLocale, versionCode,
                });
                widget.id = `${carousel.carousel_id}`;
                widget.is_liveclass_carousel = true;
                return {
                    id: carousel.carousel_id,
                    tracking_view_id: carousel.carousel_id,
                    widget_data: widget,
                    widget_type: 'widget_parent',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    order: carousel.caraousel_order,
                };
            }
        }
        return null;
    }
}

async function getDefenceCarousel(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (home_page_experiment === 'true') {
        let widget = null;
        const assortmentList = [31];
        const data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_boards', assortmentList);
        if (ccmArray.includes(11405) || ccmArray.includes(11517) || ccmArray.length === 0) {
            if (!_.isEmpty(data)) {
                widget = await WidgetHelper.homepageVideoWidgetWithoutTabs({
                    data, paymentCardState: { isVip: false }, title: global.t8[studentLocale].t('Daily Free Classes (Defence)'), studentLocale, versionCode,
                });
                widget.id = `${carousel.carousel_id}`;
                widget.is_liveclass_carousel = true;
                return {
                    id: carousel.carousel_id,
                    tracking_view_id: carousel.carousel_id,
                    widget_data: widget,
                    widget_type: 'widget_parent',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    order: carousel.caraousel_order,
                };
            }
        }
        return null;
    }
}
async function getCourseTrialTimerBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (versionCode >= 893 && studentCurrentSubscriptionDetails.length) {
        const trialActiveArray = [];
        // const assortmentArr = carousel.secondary_data.split(',');
        for (let i = 0; i < studentCurrentSubscriptionDetails.length; i++) {
            if (studentCurrentSubscriptionDetails[i].amount == '-1') {
                trialActiveArray.push(studentCurrentSubscriptionDetails[i]);
            }
        }
        if (trialActiveArray.length) {
            const now = moment().add(5, 'hours').add(30, 'minutes');
            const trialEnd = moment(trialActiveArray[0].end_date);
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_type: 'widget_coupon_banner',
                widget_data: {
                    id: `${carousel.carousel_id}`,
                    title: global.t8[studentLocale].t('Watch Free Trial'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/coupon_timer_bg.webp',
                    subtitle: '',
                    description: global.t8[studentLocale].t('Get Admission Now'),
                    heading: 'Expires In',
                    time: `${moment(trialEnd).diff(now)}`,
                    deeplink: `doubtnutapp://course_details?id=${trialActiveArray[0].assortment_id}`,
                    text_color: '#000000',
                },
                order: carousel.caraousel_order,
            };
        }
    }
}

// async function getDoubtNutRupyaBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
//     return {
//         widget_type: 'widget_dnr_home',
//         widget_data: {
//             title_line_1: studentLocale === 'hi' ? '<p>गिफ्ट वाउचर, कूपन और कई अन्य पुरस्कारों को रिडीम करने के लिए <b>डाउटनट रूपया</b> कमाएं</p>' : '<p>Earn <b>Doubtnut Rupya</b> to redeem gift vouchers, coupons and many more rewards</p>',
//             title_color: '#808080',
//             cta: studentLocale === 'hi' ? 'अभी चेक करें' : 'Check Now',
//             cta_color: '#EB532C',
//             coin_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/50CBE042-BFD6-6E22-24DB-8361DB1C99F8.webp',
//             deeplink: 'doubtnutapp://dnr/home',
//             background_color: '#FFEED8',
//         },
//         layout_config: {
//             margin_top: 15,
//             margin_bottom: 0,
//             margin_left: 15,
//             margin_right: 15,
//         },
//         order: carousel.caraousel_order,
//     };
// }

async function getDNRWidget(xAuthToken, versionCode, timeout = 2000) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            // 'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ODE2OTIyMTQsImlhdCI6MTYzNjcxOTk4OSwiZXhwIjoxNjk5NzkxOTg5fQ.eH5IkQVOIF6rkA_9vKCX4aMjukMA5FaYWpSSDGczZ-U',
            'x-auth-token': xAuthToken,
            version_code: versionCode,
        };

        console.log(`${config.microUrl}/api/dnr/homepage-widget`);

        const { data } = await inst.configMicroInst({
            method: 'GET',
            url: `${config.microUrl}/api/dnr/homepage-widget`,
            timeout,
            headers,
        });
        console.log('data ', data);
        return data;
    } catch (e) {
        console.error(e);
        throw (e);
    }
}

async function getDNRDailyStreakWidget(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    try {
        let data = await StudentRedis.getDNRHomeWidget(db.redis.read, studentId);
        console.log(data, ' Data');

        if (_.isNull(data)) {
            console.log('null data');
            const apiResponse = await getDNRWidget(xAuthToken, versionCode);
            console.log('apiResponse => ', apiResponse);
            data = apiResponse.data;
            StudentRedis.setDNRHomeWidget(db.redis.write, studentId, data);
        } else {
            data = JSON.parse(data);
        }

        if (!data.is_widget_available) {
            return null;
        }

        return {
            ...data.widget,
            order: carousel.caraousel_order,
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function getGeneralFlow(carousel, homeCarouselsGroupedById) {
    // console.log('Getting in to geenral flow');
    if (carousel.scroll_type === 'Horizontal') {
        carousel.widget_type = 'horizontal_list';
    } else if (carousel.scroll_type === 'Vertical') {
        carousel.widget_type = 'vertical_list_2';
    } else {
        carousel.widget_type = carousel.scroll_type;
    }

    const mappedCarousel = {
        title: homeCarouselsGroupedById[carousel.carousel_id][0].title,
        id: `${carousel.carousel_id}`,
        _id: carousel._id,
        show_view_all: (carousel.deeplink) ? 1 : 0,
        caraousel_id: carousel.carousel_id,
        items: (carousel.items) ? carousel.items : null,
        deeplink: (carousel.deeplink) ? carousel.deeplink : null,
        sharing_message: carousel.sharing_message,
    };

    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_data: mappedCarousel,
        widget_type: carousel.widget_type,
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
}
async function getQuiztfsImage(db) {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT value from dn_property where bucket = \'quiztfs\' and name = \'home_widget_image\' ';
            const sqlData = await db.mysql.read.query(sql);
            if (sqlData.length) resolve(sqlData[0].value);
            resolve('https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2149B6FC-A79A-7268-DF7D-E1AEC26F7396.webp');
        } catch (e) {
            reject(e);
        }
    });
}
async function getMyCoursesIcon(db, studentId, userAssortment, locale, config) {
    let deeplink;
    if (userAssortment) {
        deeplink = +userAssortment === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${userAssortment}`;
    }

    const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
    const packageType = userActivePackages.filter((e) => e.assortment_type === 'course' && e.assortment_id !== 138829);
    const etoosAssortment = userActivePackages.filter((e) => e.assortment_id === 138829);
    if (!packageType.length) {
        return null;
    }
    if (!deeplink) {
        deeplink = ((packageType.length > 1) || (etoosAssortment.length && packageType.length)) ? 'doubtnutapp://course_select' : `doubtnutapp://course_details?id=${packageType[packageType.length - 1].assortment_id}`;
    }
    return {
        icon_id: 339,
        icon: `${config.staticCDN}engagement_framework/35454CD4-CD82-99C2-3053-733F809BE9ED.webp`,
        title_one: global.t8[locale].t('My Courses'),
        title_one_text_size: '10',
        title_one_text_color: '#250440',
        deeplink,
    };
}
async function getFavoriteCategories(db, studentId, locale, studentClass, iconsList, versionCode) {
    let iconCounts = await StudentRedis.getFavoriteCategories(db.redis.read, studentId);
    if (_.isNull(iconCounts)) {
        iconCounts = {};
    } else {
        iconCounts = JSON.parse(iconCounts);
    }
    Object.keys(iconCounts).forEach((item) => {
        if (!iconsList.map(Number).includes(Number(item))) {
            delete iconCounts[item];
        }
    });

    let data = [];
    if (Object.keys(iconCounts).length > 0) {
        data = await iconsMysql.getCategoryIconsForHomepage(db.mysql.read, Object.keys(iconCounts), studentClass, versionCode);
    }
    let studentCcmIds = await StudentRedis.getStudentCcmIds(db.redis.read, studentId);
    studentCcmIds = JSON.parse(studentCcmIds);
    if (_.isNull(studentCcmIds)) {
        // if not available  in redis getting from mysql and caching in redis
        studentCcmIds = await StudentMysql.getCcmIdbyStudentId(db.mysql.read, studentId);
        studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
        // adding the data to student redis cache
        StudentRedis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
    }
    if (data.length < 3) {
        iconCounts = {};

        for (let i = 0; i < studentCcmIds.length; i++) {
            let temp = await IconsRedis.getFavoriteIconsByCCMid(db.redis.read, studentCcmIds[i], locale);
            if (!_.isNull(temp)) {
                temp = JSON.parse(temp);
                Object.keys(temp).forEach((x) => { iconCounts[x] = iconCounts[x] ? temp[x] : iconCounts[x] + temp[x]; });
            }
        }
        // making sure icons are part of possible icons in caraousel for this class
        Object.keys(iconCounts).forEach((item) => {
            if (!iconsList.map(Number).includes(Number(item))) {
                delete iconCounts[item];
            }
        });
        // get icons from table
        if (Object.keys(iconCounts).length > 0) {
            data = await iconsMysql.getCategoryIconsForHomepage(db.mysql.read, Object.keys(iconCounts), studentClass, versionCode);
        }
    }
    // filtering icons which are allowed in specific ccm_ids only
    data = data.filter((item) => studentCcmIds.some((a) => !item.ccmid_list || item.ccmid_list.split(',').map(Number).includes(a)));
    // default icon list
    if (Object.keys(iconCounts).length === 0 || data.length === 0) {
        const defaultIcons = [2, 3, 4, 331, 332];
        data = await iconsMysql.getCategoryIconsForHomepage(db.mysql.read, defaultIcons, null, versionCode);
        data.sort((a, b) => defaultIcons.map(Number).indexOf(a.id) - defaultIcons.map(Number).indexOf(b.id));
        return data;
    }
    const result = Object.keys(iconCounts);
    result.sort((a, b) => iconCounts[a] - iconCounts[b]);
    result.reverse();
    // sorting based on count
    data.sort((a, b) => result.map(Number).indexOf(a.id) - result.map(Number).indexOf(b.id));
    return data;
}

async function getAllCategoryWidgets(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, userAssortment, packageName) {
    if (+versionCode < 955) {
        return;
    }

    let studentCcmIds = await StudentContainer.getStudentCcmIds(db, studentId);
    if (!studentCcmIds.length) {
        studentCcmIds = IconsData.defaultCcmIds[studentClass];
    }
    if ((carousel.ccmid_list && carousel.ccmid_list.trim() && !studentCcmIds.some((item) => carousel.ccmid_list.split(',').map(Number).includes(item))) || !showHomepageCategories) {
        return;
    }
    const isFreeApp = packageName === altAppData.freeAppPackageName;

    const ncertTitles = Data.ncertNewFlowTitleArr;
    const countHomepageVisit = await StudentRedis.getNewHomepageCount(db.redis.read, studentId);
    let data;
    const iconsList = carousel.icons_list ? carousel.icons_list.split(',').map(Number) : [];// allowed icons for favorite carousel and icons list for category carousel
    if ((carousel.type === 'AD_HOC_WIDGETS_AM')
        || (carousel.data_type === 'favorite_category_icons' && Number(countHomepageVisit) >= Number(showFavoriteCount)) && forceShowAllCategories === 'false') {
        if (+versionCode >= 970) {
            const widgetDetails = await IconsHelper.getFavoriteIcons(db, carousel, userAssortment, studentId, studentLocale, studentClass, iconsList, versionCode, config, xAuthToken, isFreeApp);
            const ncertIndex = widgetDetails.data.items.findIndex((x) => ncertTitles.includes(x.title_one));
            if (studentClass != 14 && ncertIndex > -1) {
                widgetDetails.data.items = await iconHelper.ncertTopIconDeeplinkCategorisedHomepage(db, widgetDetails.data.items, studentClass, studentId, 'new_flow');
            }
            widgetDetails.data.id = `${carousel.carousel_id}`;
            return {
                ...widgetDetails,
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
            };
        }
        data = await getFavoriteCategories(db, studentId, studentLocale, studentClass, iconsList, versionCode);
        const ncertIndex = data.findIndex((x) => ncertTitles.includes(x.title_one));
        if (studentClass != 14 && ncertIndex > -1) {
            data = await iconHelper.ncertTopIconDeeplinkCategorisedHomepage(db, data, studentClass, studentId, 'old');
        }
        data.forEach((item) => {
            if ((Data.ncertIconsTitles.includes(item.title) || ncertTitles.includes(item.title)) && item.deeplink && !item.deeplink.includes('NCERT_NEW_FLOW')) {
                item.deeplink = `${item.deeplink}&page=NCERT_NEW_FLOW`;
            }
        });
        if (data.length) {
            const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
            const ceoIcon = await IconsHelper.getDnCeoIcon(db, studentId, versionCode);
            if (userActivePackages.length >= 1) {
                if (carousel.sharing_message.includes('Prepar') || carousel.title.includes('Prepar') || carousel.title === 'Favourite Categories For You') {
                    const myCoursesIcon = await getMyCoursesIcon(db, studentId, userAssortment, studentLocale, config);
                    return HomepageWidgetHelper.getCategoryIconsWidget({
                        studentLocale,
                        data,
                        carousel,
                        myCoursesIcon,
                        ceoIcon,
                    });
                }
            } else {
                return HomepageWidgetHelper.getCategoryIconsWidget({
                    studentLocale,
                    data,
                    carousel,
                    ceoIcon,
                });
            }
        }
    } else if (carousel.data_type === 'favorite_category_icons' || (carousel.data_type !== 'favorite_category_icons' && forceShowAllCategories === 'false' && Number(countHomepageVisit) >= Number(showFavoriteCount))) {

    } else {
        const widgetDetails = await IconsHelper.getCategory(db, carousel, studentId, studentCcmIds, studentLocale, versionCode, userAssortment, config, xAuthToken);
        const ncertIndex = widgetDetails.data.items.findIndex((x) => ncertTitles.includes(x.title_one));
        if (versionCode >= 870 && studentClass != 14 && ncertIndex > -1) {
            widgetDetails.data.items = await iconHelper.ncertTopIconDeeplinkCategorisedHomepage(db, widgetDetails.data.items, studentClass, studentId, 'new_flow');
        }
        widgetDetails.data.id = `${carousel.carousel_id}`;
        return {
            ...widgetDetails,
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
        };
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getSubscribedTeachers(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (versionCode > 950) {
        let subscribedTeachersIds = await StudentContainer.getSubscribedTeachersData(db, studentId);
        subscribedTeachersIds = subscribedTeachersIds.filter((thing, index, self) => index === self.findIndex((t) => (
            t.teacher_id === thing.teacher_id
        )));
        const promises = [];
        for (let i = 0; i < subscribedTeachersIds.length; i++) {
            promises.push(StudentContainer.getTeacherData(db, subscribedTeachersIds[i].teacher_id));
        }
        const setteledPromise = await Promise.allSettled(promises);
        let subscribedTeachersDataTemp = setteledPromise.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        subscribedTeachersDataTemp = subscribedTeachersDataTemp.filter((value) => !_.isEmpty(value) && !_.isNull(value));
        subscribedTeachersDataTemp = _.flatten(subscribedTeachersDataTemp);
        if (!_.isEmpty(subscribedTeachersDataTemp)) {
            subscribedTeachersDataTemp = subscribedTeachersDataTemp.filter((thing, index, self) => index === self.findIndex((t) => (
                t.teacher_id === thing.teacher_id
            )));
            const groupByTeacherId = _.groupBy(subscribedTeachersDataTemp, 'teacher_id');
            const locale = global.t8[studentLocale].t('English Medium', { ns: 'exception' });
            const subscribedTeachersData = [];
            for (const key in groupByTeacherId) {
                if ({}.hasOwnProperty.call(groupByTeacherId, key)) {
                    let exam = [];
                    let subject = [];
                    for (let i = 0; i < groupByTeacherId[key].length; i++) {
                        if (groupByTeacherId[key][i].exam !== null && !_.includes(['6', '7', '8', '14'], studentClass)) {
                            const temp1 = groupByTeacherId[key][i].exam.split(',');
                            exam.push(temp1);
                        }
                        if (groupByTeacherId[key][i].board !== null && !_.includes(['6', '7', '8', '14'], studentClass)) {
                            const temp2 = groupByTeacherId[key][i].board.split(',');
                            exam.push(temp2);
                        }
                        if (groupByTeacherId[key][i].subjects !== null) {
                            const temp3 = groupByTeacherId[key][i].subjects.split(',');
                            subject.push(temp3);
                        }
                    }
                    subject = subject.flat();
                    subject = [...new Set(subject)];
                    subject = subject.splice(0, 3);
                    subject = subject.join(',');
                    groupByTeacherId[key][0].subject = subject;
                    if (_.includes(['6', '7', '8', '14'], studentClass)) {
                        groupByTeacherId[key][0].exam = locale;
                    } else {
                        exam = exam.flat();
                        exam = [...new Set(exam)];
                        let examNew = [];
                        for (let i = 0; i < exam.length; i++) {
                            const index = studentCcmData.findIndex((item) => item.id == exam[i]);
                            if (index !== -1) {
                                examNew.push(studentCcmData[index].course);
                            }
                        }
                        examNew = examNew.splice(0, 3);
                        if (!_.isEmpty(examNew)) {
                            groupByTeacherId[key][0].exam = examNew.join(',');
                        } else {
                            groupByTeacherId[key][0].exam = locale;
                        }
                    }
                    subscribedTeachersData.push(groupByTeacherId[key][0]);
                }
            }
            let item = [];
            for (let i = 0; i < subscribedTeachersData.length; i++) {
                let userName;
                if (subscribedTeachersData[i].fname !== null && subscribedTeachersData[i].lname !== null) {
                    userName = `${subscribedTeachersData[i].fname} ${subscribedTeachersData[i].lname}`;
                } else {
                    userName = `${subscribedTeachersData[i].fname}`;
                }
                let [viewsTotal, newVidCount] = await Promise.all([TeacherRedis.getTotalViews(db.redis.read, subscribedTeachersData[i].teacher_id), TeacherRedis.getNewVidCount(db.redis.read, subscribedTeachersData[i].teacher_id)]);
                if (!_.isNull(viewsTotal)) {
                    viewsTotal = JSON.parse(viewsTotal);
                }
                if (!_.isNull(newVidCount)) {
                    newVidCount = JSON.parse(newVidCount);
                }
                const bgArr = Data.teacherChannelVideoBackgroundArr;
                const bgArrCircle = Data.teacherChannelVideoBackgroundArrCircle;
                const last = parseInt(subscribedTeachersData[i].teacher_id.toString().slice(-3));
                // const hours = parseInt(42 + last / 10);
                const years = parseInt(5 + last / 100);
                item.push({
                    id: subscribedTeachersData[i].teacher_id,
                    name: userName,
                    image_url: subscribedTeachersData[i].img_url ? buildStaticCdnUrl(Utility.convertoWebP(subscribedTeachersData[i].img_url)) : Data.teacherDefaultImage,
                    deeplink: `doubtnutapp://teacher_channel?teacher_id=${subscribedTeachersData[i].teacher_id}&type=external`,
                    background_color: bgArr[i % 5],
                    tag: subscribedTeachersData[i].exam ? subscribedTeachersData[i].exam : '',
                    subjects: subscribedTeachersData[i].subjects ? subscribedTeachersData[i].subjects : '',
                    experience: subscribedTeachersData[i].year_of_experience ? `${subscribedTeachersData[i].year_of_experience} year Experience` : `${years} year Experience`,
                    views_count: viewsTotal ? `${viewsTotal} Views` : '0 Views',
                    circle_background_color: bgArrCircle[i % 4],
                    button_text: 'View Now',
                    button_deeplink: `doubtnutapp://teacher_channel?teacher_id=${subscribedTeachersData[i].teacher_id}&type=external`,
                    new_videos: newVidCount ? `${newVidCount} New Video Added` : '',
                    // TODO :- add logic for this later
                    friend_names: [],
                    friend_image: [],
                    card_width: '2.2',
                    card_ratio: '5:4',
                    channel_image: null,
                    type: 'external',
                });
            }
            item = shuffleArray(item);
            const data = {
                title: global.t8[studentLocale].t('Aapke Subscribed Teacher Channels'),
                items: item,
            };
            if (data.items.length === 0) {
                return [];
            }
            data.id = `${carousel.carousel_id}`;

            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_type: 'subscribed_teacher_channels',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
                widget_data: data,
            };
        }
    }
    return [];
}

async function getCcmTeachers(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (versionCode > 950) {
        let teacherByCCM = [];
        let subscribedTeachersIds = await StudentContainer.getSubscribedTeachersData(db, studentId);
        subscribedTeachersIds = subscribedTeachersIds.filter((thing, index, self) => index === self.findIndex((t) => (
            t.teacher_id === thing.teacher_id
        )));
        const promises = [];
        for (let i = 0; i < subscribedTeachersIds.length; i++) {
            promises.push(StudentContainer.getTeacherData(db, subscribedTeachersIds[i].teacher_id));
        }
        const setteledPromise = await Promise.allSettled(promises);
        let subscribedTeachersData = setteledPromise.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        subscribedTeachersData = subscribedTeachersData.filter((value) => !_.isEmpty(value) && !_.isNull(value));
        subscribedTeachersData = _.flatten(subscribedTeachersData);
        const subscribedTeachers = [];
        if (studentClass == '12' && isDropper) {
            studentClass = '13';
        }
        subscribedTeachersData.forEach((item) => subscribedTeachers.push(item.teacher_id));
        const locale = global.t8[studentLocale].t('English Medium', { ns: 'exception' });
        if (_.includes(['6', '7', '8', '14'], studentClass)) {
            const teacherByLocale = await TeacherContainer.getTeacherByClassLocale(db, studentClass, studentLocale);
            const groupTeacherByLocale = _.groupBy(teacherByLocale, 'teacher_id');
            for (const key in groupTeacherByLocale) {
                if ({}.hasOwnProperty.call(groupTeacherByLocale, key)) {
                    let subject = [];
                    for (let i = 0; i < groupTeacherByLocale[key].length; i++) {
                        if (groupTeacherByLocale[key][i].subjects !== null) {
                            const temp = groupTeacherByLocale[key][i].subjects.split(',');
                            subject.push(temp);
                        }
                    }
                    subject = subject.flat();
                    subject = [...new Set(subject)];
                    subject = subject.splice(0, 3);
                    subject = subject.join(',');
                    groupTeacherByLocale[key][0].subject = subject;
                    groupTeacherByLocale[key][0].exam = locale;
                    teacherByCCM.push(groupTeacherByLocale[key][0]);
                }
            }
        } else {
            const ccmIdArrayExam = [];
            const ccmIdArrayBoard = [];
            const studentCcmDataExam = studentCcmData.filter((item) => item.ccm_category === 'exam' || item.ccm_category === 'other-exam');
            const studentCcmDataBoard = studentCcmData.filter((item) => item.ccm_category === 'board' || item.ccm_category === 'other-board');
            studentCcmDataExam.forEach((item) => ccmIdArrayExam.push(item.id));
            studentCcmDataBoard.forEach((item) => ccmIdArrayBoard.push(item.id));
            const workerTeacherByCCMExam = [];
            const workerTeacherByCCMBoard = [];
            for (let i = 0; i < ccmIdArrayExam.length; i++) {
                workerTeacherByCCMExam.push(TeacherContainer.getTeacherByCCMExam(db, ccmIdArrayExam[i], studentClass));
            }
            for (let i = 0; i < ccmIdArrayBoard.length; i++) {
                workerTeacherByCCMBoard.push(TeacherContainer.getTeacherByCCMBoard(db, ccmIdArrayBoard[i], studentClass));
            }
            let teacherByCCMBoard = await Promise.all(workerTeacherByCCMBoard);
            let teacherByCCMExam = await Promise.all(workerTeacherByCCMExam);
            teacherByCCMBoard = teacherByCCMBoard.flat(1);
            teacherByCCMExam = teacherByCCMExam.flat(1);
            teacherByCCMBoard = teacherByCCMBoard.filter((item) => item !== null || item !== undefined);
            teacherByCCMExam = teacherByCCMExam.filter((item) => item !== null || item !== undefined);
            teacherByCCMBoard = teacherByCCMBoard.concat(teacherByCCMExam);
            const groupTeacherByCCMBoard = _.groupBy(teacherByCCMBoard, 'teacher_id');
            const finalTeacherByCCMBoard = [];
            for (const key in groupTeacherByCCMBoard) {
                if ({}.hasOwnProperty.call(groupTeacherByCCMBoard, key)) {
                    let exam = [];
                    let subject = [];
                    for (let i = 0; i < groupTeacherByCCMBoard[key].length; i++) {
                        if (groupTeacherByCCMBoard[key][i].board && groupTeacherByCCMBoard[key][i].board !== null) {
                            const temp1 = groupTeacherByCCMBoard[key][i].board.split(',');
                            exam.push(temp1);
                        }
                        if (groupTeacherByCCMBoard[key][i].exam && groupTeacherByCCMBoard[key][i].exam !== null) {
                            const temp2 = groupTeacherByCCMBoard[key][i].exam.split(',');
                            exam.push(temp2);
                        }
                        if (groupTeacherByCCMBoard[key][i].subjects !== null) {
                            const temp3 = groupTeacherByCCMBoard[key][i].subjects.split(',');
                            subject.push(temp3);
                        }
                    }
                    exam = exam.flat();
                    exam = [...new Set(exam)];
                    subject = subject.flat();
                    subject = [...new Set(subject)];
                    subject = subject.splice(0, 3);
                    subject = subject.join(',');
                    groupTeacherByCCMBoard[key][0].subject = subject;
                    let examNew = [];
                    for (let i = 0; i < exam.length; i++) {
                        const index = studentCcmData.findIndex((item) => item.id == exam[i]);
                        if (index !== -1) {
                            examNew.push(studentCcmData[index].course);
                        }
                    }
                    examNew = examNew.splice(0, 3);
                    if (!_.isEmpty(examNew)) {
                        groupTeacherByCCMBoard[key][0].exam = examNew.join(', ');
                    } else {
                        groupTeacherByCCMBoard[key][0].exam = locale;
                    }
                    finalTeacherByCCMBoard.push(groupTeacherByCCMBoard[key][0]);
                }
            }
            teacherByCCM = finalTeacherByCCMBoard;
        }
        teacherByCCM = teacherByCCM.filter((item) => !subscribedTeachers.includes(item.teacher_id));
        teacherByCCM = teacherByCCM.filter((thing, index, self) => index === self.findIndex((t) => (
            t.teacher_id === thing.teacher_id
        )));
        const subsTotal = await CourseHelper.getTeacherSubscription({ db, teacherList: teacherByCCM, isInternal: false });
        let item = [];
        for (let i = 0; i < teacherByCCM.length; i++) {
            let userName;
            if (teacherByCCM[i].fname !== null && teacherByCCM[i].lname !== null) {
                userName = `${teacherByCCM[i].fname} ${teacherByCCM[i].lname}`;
            } else {
                userName = `${teacherByCCM[i].fname}`;
            }
            const last = parseInt(teacherByCCM[i].teacher_id.toString().slice(-3));
            const hours = parseInt(42 + last / 10);
            const years = parseInt(5 + last / 100);
            const bgArr = Data.teacherChannelVideoBackgroundArr;
            item.push({
                id: teacherByCCM[i].teacher_id,
                name: userName,
                image_url: teacherByCCM[i].img_url ? buildStaticCdnUrl(Utility.convertoWebP(teacherByCCM[i].img_url)) : Data.teacherDefaultImage,
                subscriber: !_.isNull(subsTotal) && !_.isEmpty(subsTotal) && subsTotal ? `${subsTotal[i]}` : '0',
                hours_taught: `${hours}Hr`,
                experience: teacherByCCM[i].year_of_experience ? `${teacherByCCM[i].year_of_experience} Years` : `${years} Years`,
                button_text: 'Subscribe',
                deeplink: `doubtnutapp://teacher_channel?teacher_id=${teacherByCCM[i].teacher_id}&type=external`,
                background_color: bgArr[i % 5],
                tag: teacherByCCM[i].exam ? teacherByCCM[i].exam : '',
                subjects: teacherByCCM[i].subject ? teacherByCCM[i].subject : '',
                card_width: '2.0',
                card_ratio: '16:19',
                type: 'external',
            });
        }
        item = shuffleArray(item);
        const data = {
            title: global.t8[studentLocale].t('Aapke Liye Recommended India ke Best Teachers'),
            items: item,
        };
        if (data.items.length === 0) {
            return [];
        }
        data.id = `${carousel.carousel_id}`;

        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_type: 'teacher_channel_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
            widget_data: data,
        };
    }
    return [];
}

async function getLibraryTrending(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation) {
    if (versionCode >= 959) {
        const redisKey = `HOME_LIBRARY_${studentClass}_${studentId}_${versionCode}_${checkForPersonalisation.map((e) => e.ccm_id).join('_')}_${studentLocale}`;
        const redisData = await RedisLibrary.getByKey(redisKey, db.redis.read);
        if (!_.isEmpty(redisData)) {
            return JSON.parse(redisData);
        }
        const widgetData = await libraryHelper.createTrendingWithCcmIDWidget({
            studentClass, ccmIdData: checkForPersonalisation, order: carousel.caraousel_order, id: 1, db, locale: studentLocale, source: 'HOMEPAGE_WIDGET', studentId, config,
        });
        if (!_.isEmpty(widgetData)) {
            widgetData.widget_data.id = `${carousel.carousel_id}`;
            const returnData = {
                ...widgetData,
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
            }
            RedisLibrary.setAllCache(redisKey, returnData, db.redis.write);
            return returnData;
        }
    }
    return undefined;
}

async function getSubscribedTeachersVideos(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (versionCode > 950) {
        let subscribedTeachersIds = await StudentContainer.getSubscribedTeachersData(db, studentId);
        subscribedTeachersIds = subscribedTeachersIds.filter((thing, index, self) => index === self.findIndex((t) => (
            t.teacher_id === thing.teacher_id
        )));
        const promises = [];
        for (let i = 0; i < subscribedTeachersIds.length; i++) {
            promises.push(StudentContainer.getTeacherData(db, subscribedTeachersIds[i].teacher_id));
        }
        const setteledPromise = await Promise.allSettled(promises);
        let subscribedTeachersData = setteledPromise.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        subscribedTeachersData = subscribedTeachersData.filter((value) => !_.isEmpty(value) && !_.isNull(value));
        subscribedTeachersData = _.flatten(subscribedTeachersData);
        let item = [];
        if (!_.isEmpty(subscribedTeachersData)) {
            const teacherList = [];
            subscribedTeachersData.forEach((item) => {
                teacherList.push(item.teacher_id);
            });
            const workerResourceData = [];
            const limit = 10;
            for (let i = 0; i < teacherList.length; i++) {
                workerResourceData.push(TeacherContainer.getTeacherVideos(db, teacherList[i], versionCode, limit));
            }
            let resourceData = await Promise.all(workerResourceData);
            resourceData = resourceData.flat(1);
            resourceData = resourceData.filter((item) => item !== null || item !== undefined);
            resourceData = resourceData.filter((item) => item.is_uploaded == 1);
            resourceData.sort((a, b) => moment(b.created_at) - moment(a.created_at));
            resourceData = resourceData.slice(0, 10);
            for (let i = 0; i < resourceData.length; i++) {
                const bgArr = Data.teacherChannelVideoBackgroundArr;
                const tag = [];
                if (resourceData[i].exam !== null) {
                    tag.push(`${resourceData[i].exam}`);
                }
                if (resourceData[i].board !== null) {
                    tag.push(`${resourceData[i].board}`);
                }
                item.push({
                    deeplink: `doubtnutapp://video?qid=${resourceData[i].resource_reference}&page=HOME_PAGE&playlist_id=TEACHER_CHANNEL`,
                    image_url: Utility.convertoWebP(resourceData[i].image_url),
                    course_resource_id: resourceData[i].id,
                    question_id: resourceData[i].resource_reference,
                    background_color: bgArr[i % 4],
                    image_text: ((resourceData[i].image_url !== null && resourceData[i].image_url === '') || versionCode > 964) ? resourceData[i].name : '',
                    title1: resourceData[i].name,
                    title2: versionCode > 964 ? `${resourceData[i].fname} ${resourceData[i].lname}` : `${resourceData[i].fname} ${resourceData[i].lname} | ${resourceData[i].board}`,
                    description: resourceData[i].description,
                    teacher_image: resourceData[i].img_url ? buildStaticCdnUrl(Utility.convertoWebP(resourceData[i].img_url)) : Data.teacherDefaultImage,
                    tag_text: `Class ${resourceData[i].class} | ${resourceData[i].subject}`,
                    card_width: '1.1',
                    card_ratio: '16:9',
                    tag: !_.isEmpty(tag) ? tag.join(',') : '',
                    views_count: resourceData[i].views !== null ? `${resourceData[i].views} Views` : '0 Views',
                    friend_names: [],
                    friend_image: [],
                    type: 'external',
                });
            }
            item = shuffleArray(item);
            const dataFull = {
                title: global.t8[studentLocale].t('Aapke Subscribed Channels ke Latest Videos'),
                items: item,
                list_orientation: 2,
            };
            if (dataFull.items.length === 0) {
                return [];
            }
            dataFull.id = `${carousel.carousel_id}`;
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_type: 'channel_video_content',
                order: carousel.caraousel_order,
                widget_data: dataFull,
            };
        }
        return [];
    }
    return [];
}

async function getTopTeachersClasses(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (versionCode > 866) {
        if (studentClass == '12' && isDropper) {
            studentClass = '13';
        }
        const studentLocaleTemp = global.t8[studentLocale].t('ENGLISH', { ns: 'exception' });
        let widget;
        let ccmIdList = _.map(studentCcmData, (item) => item.id);
        ccmIdList = [...new Set(ccmIdList)];
        let playlistId = [];
        for (let i = 0; i < ccmIdList.length; i++) {
            const playlistIdTemp = await CourseContainer.getParentPlaylistId(db, studentClass, studentLocaleTemp, ccmIdList[i]);
            if (!_.isEmpty(playlistIdTemp) && playlistIdTemp != 'No Data') {
                playlistId.push(...playlistIdTemp);
            }
        }
        if (_.isEmpty(playlistId)) {
            playlistId = await CourseContainer.getParentPlaylistId(db, studentClass, studentLocaleTemp);
        }
        if (!_.isEmpty(playlistId) || playlistId != 'No Data') {
            playlistId = playlistId.filter((item, index, self) => self.findIndex((t) => t.playlist_id === item.playlist_id) === index);
            let libraryPlaylist = _.map(playlistId, (item) => item.playlist_id);
            libraryPlaylist = [...new Set(libraryPlaylist)];
            let data = [];
            for (let i = 0; i < libraryPlaylist.length; i++) {
                const tempData = await courseV2Redis.getLibraryObjects(db.redis.read, libraryPlaylist[i]);
                const tempDataFinal = JSON.parse(tempData);
                if (!_.isEmpty(tempDataFinal)) {
                    data.push(...tempDataFinal);
                }
            }
            if (!_.isEmpty(data)) {
                data = data.filter((item, index, self) => self.findIndex((t) => t.question_id === item.question_id) === index);
                const paymentCardState = { isVip: false };
                const groupByExpertName = _.groupBy(data, 'expert_name');
                const temp1 = [];
                for (const key in groupByExpertName) {
                    if (Object.prototype.hasOwnProperty.call(groupByExpertName, key)) {
                        for (let i = 0; i < groupByExpertName[key].length; i++) {
                            const newObject = WidgetHelper.createTopTeachersClassesObject(groupByExpertName[key][i], paymentCardState, studentLocale);
                            temp1.push({ type: 'live_class_carousel_card_2', data: newObject, extra: key });
                        }
                    }
                }
                const dataFinal = _.groupBy(temp1, 'extra');
                const tabs = [];
                for (const key in dataFinal) {
                    if (Object.prototype.hasOwnProperty.call(dataFinal, key)) {
                        tabs.push({
                            key,
                            title: key,
                            is_selected: false,
                        });
                    }
                }
                if (tabs.length > 0) {
                    tabs[0].is_selected = true;
                }
                widget = {
                    title: studentLocale === 'hi' ? 'टॉप शिक्षकों की क्लासेस' : "Top Teachers' Classes",
                    is_title_bold: true,
                    items: dataFinal,
                    tabs,
                };
            }
        }
        if (!widget) return;
        widget.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_data: widget,
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
        };
    }
}

async function getPreviousYearCarousels(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const ccmIds = await StudentContainer.getStudentCcmIds(db, studentId); // fetching ccmIds becoz we need all the ccmIds even whose personalisation_active is 0
    const finalItem = [];
    let boardTitle = '';
    for (let i = 0; i < ccmIds.length; i++) {
        let prevYearPdf = await courseV2Redis.getPreviousYearPdf(db.redis.read, ccmIds[i]);
        if (!_.isNull(prevYearPdf)) {
            prevYearPdf = JSON.parse(prevYearPdf);
            const boardData = await CourseMysqlv2.getBoardNameFromCcmId(db.mysql.read, ccmIds[i]);
            boardTitle = global.t8[studentLocale].t('{{board_course}} Previous years PDF', { board_course: boardData[0].course });
        }
        if (prevYearPdf && prevYearPdf.items.length > 0) {
            prevYearPdf.items.forEach((item) => {
                const obj = {
                    type: 'image_card',
                    data: {
                        id: item.id,
                        image_url: buildStaticCdnUrl(item.image_url),
                        deeplink: item.deeplink,
                        card_width: '3.5',
                        card_ratio: '1:1',
                    },
                };
                finalItem.push(obj);
            });
        }
    }
    if (_.isEmpty(finalItem)) {
        return null;
    }
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_parent',
        widget_data: {
            id: `${carousel.carousel_id}`,
            title: boardTitle,
            items: finalItem,
            title_text_size: 14,
            is_title_bold: true,
        },
    };
}
async function getSamplePaperCarousels(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const ccmIds = await StudentContainer.getStudentCcmIds(db, studentId); // fetching ccmIds becoz we need all the ccmIds even whose personalisation_active is 0
    const finalItem = [];
    let boardTitle = '';
    for (let i = 0; i < ccmIds.length; i++) {
        let prevYearPdf = await courseV2Redis.getSamplePaperPdfData(db.redis.read, ccmIds[i]);
        if (!_.isNull(prevYearPdf)) {
            prevYearPdf = JSON.parse(prevYearPdf);
            const boardData = await CourseMysqlv2.getBoardNameFromCcmId(db.mysql.read, ccmIds[i]);
            boardTitle = global.t8[studentLocale].t('{{course}} Sample Papers', { course: boardData[0].course });
        }
        if (prevYearPdf && prevYearPdf.items.length > 0) {
            prevYearPdf.items.forEach((item) => {
                const obj = {
                    type: 'image_card',
                    data: {
                        id: item.id,
                        image_url: buildStaticCdnUrl(item.image_url),
                        deeplink: item.deeplink,
                        card_width: '3.5',
                        card_ratio: '1:1',
                    },
                };
                finalItem.push(obj);
            });
        }
    }
    if (_.isEmpty(finalItem)) {
        return null;
    }
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_parent',
        widget_data: {
            id: `${carousel.carousel_id}`,
            title: boardTitle,
            items: finalItem,
            title_text_size: 14,
            is_title_bold: true,
        },
    };
}
async function getPreviousYearCarouselsExamWise(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const examData = await studentCourseMapping.getStudentBoardExam(db.mysql.read, studentId, 'exam');
    const finalItem = [];
    let boardTitle = '';
    const uniqueDataIds = _.map(examData, (exam) => exam.id);
    for (let i = 0; i < uniqueDataIds.length; i++) {
        let prevYearPdf = await courseV2Redis.getPreviousYearExamWisePdfData(db.redis.read, uniqueDataIds[i]);
        if (!_.isNull(prevYearPdf)) {
            prevYearPdf = JSON.parse(prevYearPdf);
            boardTitle = global.t8[studentLocale].t('Entrance Exams Previous years PDF');
        }
        if (prevYearPdf && prevYearPdf.items.length > 0) {
            prevYearPdf.items.forEach((item) => {
                const obj = {
                    type: 'image_card',
                    data: {
                        id: item.id,
                        image_url: buildStaticCdnUrl(item.image_url),
                        deeplink: item.deeplink,
                        card_width: '3.5',
                        card_ratio: '1:1',
                    },
                };
                finalItem.push(obj);
            });
        }
    }
    if (_.isEmpty(finalItem)) {
        return null;
    }
    return {
        id: carousel.carousel_id,
        tracking_view_id: carousel.carousel_id,
        widget_type: 'widget_parent',
        widget_data: {
            id: `${carousel.carousel_id}`,
            title: boardTitle,
            items: finalItem,
            title_text_size: 14,
            is_title_bold: true,
        },
    };
}

async function getRecommendedInternalTeachers(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    /**
    Functionality - Get Recommended Internal Teachers excluding the already subscribed ones
    Critical assumptions - visible from versionCode 973
    param1 (studentId)
    param2 (studentClass)
    param3 (studentLocale)
    returns - array of recommended internal teachers
    author - Saurabh Raj
    */
    if (versionCode > 972) {
        const subscribedTeachersData = await StudentContainer.getSubscribedInternalTeachersData(db, studentId);
        const subscribeTeachersList = [];
        _.forEach(subscribedTeachersData, (teacher) => {
            subscribeTeachersList.push(teacher.faculty_id);
        });
        let freeCourseAndFacultyByClass = await TeacherContainer.getFreeCourseAndFacultyByClass(db, studentClass);
        if (subscribeTeachersList.length > 0) {
            freeCourseAndFacultyByClass = freeCourseAndFacultyByClass.filter((item) => !subscribeTeachersList.includes(item.faculty_id));
        }
        const randomTeachers = freeCourseAndFacultyByClass;
        let assortments = [];
        const subscriberWorker = [];
        const chunk = 100;
        const subs = [];
        for (let e = 0, f = randomTeachers.length; e < f; e += chunk) {
            const slice = randomTeachers.slice(e, e + chunk);
            for (let i = 0; i < slice.length; i++) {
                assortments.push(slice[i].assortment_ids.split(','));
                subscriberWorker.push(TeacherContainer.getSubsTotalInternal(db, slice[i].faculty_id));
            }
            const subsTemp = await Promise.all(subscriberWorker);
            subsTemp.forEach((item) => {
                subs.push(item);
            });
        }
        assortments = _.flatten(assortments);
        assortments = _.uniq(assortments);
        const workers = [];
        for (let i = 0; i < assortments.length; i++) {
            workers.push(TeacherContainer.getAssortmentDetails(db, assortments[i]));
        }
        let assortmentDetails = await Promise.all(workers);
        assortmentDetails = _.flatten(assortmentDetails);
        const item = [];
        for (let i = 0; i < randomTeachers.length; i++) {
            const hours = parseInt(42 + parseInt(randomTeachers[i].faculty_id) / 10);
            const years = parseInt(5 + parseInt(randomTeachers[i].faculty_id) / 100);
            const bgArr = Data.teacherChannelVideoBackgroundArr;
            const assortment = randomTeachers[i].assortment_ids.split(',');
            const assortmentsTemp = assortmentDetails.filter((item) => assortment.includes(item.assortment_id.toString()));
            let exams = [];
            for (let j = 0; j < assortmentsTemp.length; j++) {
                exams.push(assortmentsTemp[j].category);
            }
            exams = _.uniq(exams);
            exams = exams.splice(0, 2);
            const subsTotal = `${subs[i]}`;
            item.push({
                id: randomTeachers[i].faculty_id,
                name: randomTeachers[i].name,
                image_url: randomTeachers[i].image_url ? buildStaticCdnUrl(randomTeachers[i].image_url) : Data.teacherDefaultImage,
                subscriber: subsTotal,
                hours_taught: `${hours}Hr`,
                experience: randomTeachers[i].experience ? `${randomTeachers[i].experience} Years` : `${years} Years`,
                button_text: 'Subscribe',
                deeplink: `doubtnutapp://teacher_channel?teacher_id=${randomTeachers[i].faculty_id}&type=internal`,
                background_color: bgArr[i % 5],
                tag: !_.isEmpty(exams) ? exams.join(', ') : '',
                subjects: randomTeachers[i].subjects ? randomTeachers[i].subjects.replace(/,/g, ', ') : '',
                card_width: '2.0',
                card_ratio: '16:19',
                type: 'internal',
            });
        }
        const data = {
            title: global.t8[studentLocale].t('Learn with Doubtnut Teachers'),
            items: item,
        };
        if (data.items.length === 0) {
            return [];
        }
        data.id = `${carousel.carousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_type: 'teacher_channel_list',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: carousel.caraousel_order,
            widget_data: data,
        };
    }
    return [];
}

async function getSubscribedInternalTeachers(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    /**
    Functionality - Get Subscribed Internal Teachers
    Critical assumptions - visible from versionCode 973
    param1 (studentId)
    param2 (studentClass)
    param3 (studentLocale)
    returns - array of subscribed internal teachers
    author - Saurabh Raj
    */
    if (versionCode > 972) {
        let subscribedTeachersData = await StudentContainer.getSubscribedInternalTeachersData(db, studentId);
        if (!_.isEmpty(subscribedTeachersData)) {
            subscribedTeachersData = subscribedTeachersData.filter((thing, index, self) => index === self.findIndex((t) => (
                t.faculty_id === thing.faculty_id
            )));
            let assortments = [];
            for (let i = 0; i < subscribedTeachersData.length; i++) {
                assortments.push(subscribedTeachersData[i].assortment_ids.split(','));
            }
            assortments = _.flatten(assortments);
            assortments = _.uniq(assortments);
            const workers = [];
            for (let i = 0; i < assortments.length; i++) {
                workers.push(TeacherContainer.getAssortmentDetails(db, assortments[i]));
            }
            let assortmentDetails = await Promise.all(workers);
            assortmentDetails = _.flatten(assortmentDetails);
            let item = [];
            for (let i = 0; i < subscribedTeachersData.length; i++) {
                let [viewsTotal, newVidCount] = await Promise.all([TeacherRedis.getTotalViewsInternal(db.redis.read, subscribedTeachersData[i].faculty_id), TeacherRedis.getNewVidCountInternal(db.redis.read, subscribedTeachersData[i].faculty_id)]);
                if (!_.isNull(viewsTotal)) {
                    viewsTotal = JSON.parse(viewsTotal);
                }
                if (!_.isNull(newVidCount)) {
                    newVidCount = JSON.parse(newVidCount);
                }
                const assortment = subscribedTeachersData[i].assortment_ids.split(',');
                const assortmentsTemp = assortmentDetails.filter((item) => assortment.includes(item.assortment_id.toString()));
                let exams = [];
                for (let j = 0; j < assortmentsTemp.length; j++) {
                    exams.push(assortmentsTemp[j].category);
                }
                exams = _.uniq(exams);
                exams = exams.splice(0, 2);
                const bgArr = Data.teacherChannelVideoBackgroundArr;
                const bgArrCircle = Data.teacherChannelVideoBackgroundArrCircle;
                const years = parseInt(5 + parseInt(subscribedTeachersData[i].faculty_id) / 100);
                item.push({
                    id: subscribedTeachersData[i].faculty_id,
                    name: subscribedTeachersData[i].name,
                    image_url: subscribedTeachersData[i].image_url ? buildStaticCdnUrl(subscribedTeachersData[i].image_url) : Data.teacherDefaultImage,
                    deeplink: `doubtnutapp://teacher_channel?teacher_id=${subscribedTeachersData[i].faculty_id}&type=internal`,
                    background_color: bgArr[i % 5],
                    tag: !_.isEmpty(exams) ? exams.join(', ') : '',
                    subjects: subscribedTeachersData[i].subjects ? subscribedTeachersData[i].subjects.replace(/,/g, ', ') : '',
                    experience: subscribedTeachersData[i].experience ? `${subscribedTeachersData[i].experience} year Experience` : `${years} year Experience`,
                    // views_count: viewsTotal ? `${viewsTotal} Views` : '0 Views',
                    views_count: '',
                    circle_background_color: bgArrCircle[i % 4],
                    button_text: 'View Now',
                    button_deeplink: `doubtnutapp://teacher_channel?teacher_id=${subscribedTeachersData[i].faculty_id}&type=internal`,
                    new_videos: newVidCount ? `${newVidCount} New Video Added` : '',
                    friend_names: [],
                    friend_image: [],
                    card_width: '2.2',
                    card_ratio: '5:4',
                    channel_image: null,
                    type: 'internal',
                });
            }
            item = shuffleArray(item);
            const data = {
                title: global.t8[studentLocale].t('Your Subscribed Doubtnut Teachers Channel'),
                items: item,
            };
            if (data.items.length === 0) {
                return [];
            }
            data.id = `${carousel.carousel_id}`;
            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_type: 'subscribed_teacher_channels',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carousel.caraousel_order,
                widget_data: data,
            };
        }
    }
    return [];
}

async function getSubscribedInternalTeachersVideos(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    /**
    Functionality - Get the latest 10 videos of subscribed internal teachers
    Critical assumptions - visible from versionCode 973
    param1 (studentId)
    param2 (studentClass)
    param3 (studentLocale)
    returns - array of videos from subscribed internal teachers
    author - Saurabh Raj
    */
    if (versionCode > 972) {
        let subscribedTeachersData = await StudentContainer.getSubscribedInternalTeachersData(db, studentId);
        let item = [];
        if (!_.isEmpty(subscribedTeachersData)) {
            subscribedTeachersData = subscribedTeachersData.filter((thing, index, self) => index === self.findIndex((t) => (
                t.faculty_id === thing.faculty_id
            )));
            const teacherList = [];
            subscribedTeachersData.forEach((item) => {
                teacherList.push(item.faculty_id);
            });
            const workerResourceData = [];
            const limit = 10;
            for (let i = 0; i < teacherList.length; i++) {
                workerResourceData.push(TeacherContainer.getTeacherVideosInternal(db, teacherList[i], studentClass, limit));
            }
            let resourceData = await Promise.all(workerResourceData);
            resourceData = resourceData.flat(1);
            resourceData = resourceData.filter((item) => item !== null || item !== undefined);
            resourceData.sort((a, b) => moment(b.created_at) - moment(a.created_at));
            resourceData = resourceData.slice(0, 10);
            for (let i = 0; i < resourceData.length; i++) {
                const teacherDetails = subscribedTeachersData.filter((item) => item.faculty_id == resourceData[i].faculty_id);
                const bgArr = Data.teacherChannelVideoBackgroundArr;
                const tag = [];
                if (resourceData[i].exam !== null) {
                    tag.push(`${resourceData[i].exam}`);
                }
                if (resourceData[i].board !== null) {
                    tag.push(`${resourceData[i].board}`);
                }
                if (resourceData[i].category !== null) {
                    tag.push(`${resourceData[i].category}`);
                }
                item.push({
                    deeplink: `doubtnutapp://video?qid=${resourceData[i].resource_reference}&page=HOME_PAGE`,
                    image_url: resourceData[i].image_url,
                    course_resource_id: resourceData[i].id,
                    question_id: resourceData[i].resource_reference,
                    background_color: bgArr[i % 4],
                    image_text: ((resourceData[i].image_url !== null && resourceData[i].image_url === '') || versionCode > 964) ? resourceData[i].name : '',
                    title1: resourceData[i].name,
                    title2: versionCode > 964 ? `${resourceData[i].expert_name}` : `${resourceData[i].expert_name} | ${resourceData[i].board}`,
                    description: resourceData[i].description,
                    teacher_image: teacherDetails[0].image_url ? teacherDetails[0].image_url : Data.teacherDefaultImage,
                    tag_text: `Class ${resourceData[i].class} | ${resourceData[i].subject}`,
                    card_width: '1.1',
                    card_ratio: '16:9',
                    tag: !_.isEmpty(tag) ? tag.join(', ') : '',
                    // views_count: resourceData[i].views !== null ? `${resourceData[i].views} Views` : '0 Views',
                    views_count: '',
                    friend_names: [],
                    friend_image: [],
                    type: 'internal',
                });
            }
            item = shuffleArray(item);
            const dataFull = {
                title: global.t8[studentLocale].t('Latest videos from your subscribed channels'),
                items: item,
                list_orientation: 2,
            };
            if (dataFull.items.length === 0) {
                return [];
            }
            dataFull.id = `${carousel.carousel_id}`;

            return {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_type: 'channel_video_content',
                order: carousel.caraousel_order,
                widget_data: dataFull,
            };
        }
        return [];
    }
    return [];
}

async function getJeeMainsAdvData(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const ccmIdList = studentCcmData.map((x) => x.id);
    if (studentLocale === 'en' && !ccmIdList.includes(11203) && !ccmIdList.includes(11303)) {
        const crashCourseData = await LiveClassContainer.getJeeMainsAndAdvCarshCourse(db, 781);

        if (crashCourseData.length > 0) {
            const widgetObj = {
                data: crashCourseData,
                type: 'match_mpvp',
                paymentCardState: { isVip: false },
                title: carousel.title,
                studentLocale,
                versionCode,
            };
            const finalData = await WidgetHelper.homepageVideoWidgetWithoutTabs(widgetObj);

            if (finalData.items.length > 0) {
                finalData.items.forEach((x) => {
                    x.data.target_exam = '';
                    x.data.button.text = 'Join Now for Free';
                    x.data.is_premium = false;
                });
                const returnObj = {
                    id: carousel.carousel_id,
                    tracking_view_id: carousel.carousel_id,
                    widget_data: {
                        title: widgetObj.title,
                        is_title_bold: true,
                        items: finalData.items,
                        id: `${carousel.caraousel_id}`,
                        is_liveclass_carousel: true,
                    },
                    widget_type: 'widget_parent',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#FFFFFF',
                    },
                    order: carousel.caraousel_order,
                };

                // thumbnail experiment
                for (let i = 0; i < returnObj.widget_data.items.length; i++) {
                    const oldId = crashCourseData.filter((x) => x.resource_reference == returnObj.widget_data.items[i].data.id);
                    if (!_.isEmpty(oldId)) {
                        let check = await HomepageRedis.getThumbnailExperiment(db.redis.read, oldId[0].old_detail_id, studentClass, returnObj.widget_data.items[i].data.id);
                        if (check !== null) {
                            check = JSON.parse(check);
                        }
                        if (check && check.active == 1) {
                            returnObj.widget_data.items[i].data.top_title = '';
                            returnObj.widget_data.items[i].data.title1 = '';
                            returnObj.widget_data.items[i].data.title2 = '';
                            returnObj.widget_data.items[i].data.subject = '';
                            returnObj.widget_data.items[i].data.image_url = '';
                            returnObj.widget_data.items[i].data.color = '#00000000';
                            returnObj.widget_data.items[i].data.bg_exam_tag = '';
                            returnObj.widget_data.items[i].data.text_color_exam_tag = '';
                            returnObj.widget_data.items[i].data.target_exam = '';
                            returnObj.widget_data.items[i].data.image_bg_card = `${config.staticCDN}q-thumbnail/notif-thumb-custom-${oldId[0].old_detail_id}-${studentClass}-${returnObj.widget_data.items[i].data.id}.webp`;
                            returnObj.widget_data.items[i].data.image_bg_scale_type = 'FIT_XY';
                        }
                    }
                }
                return returnObj;
            }
        }
    }
}

async function getNkcSirVideos(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    if (studentLocale === 'en') {
        const assortmentList = JSON.parse(carousel.secondary_data);
        const studentCcmDataModified = studentCcmData;
        const ccmIdList = studentCcmData.map((x) => x.id);
        if (!ccmIdList.includes(11203) && !ccmIdList.includes(11303) && !ccmIdList.includes(11103)) {
            if (!_.find(studentCcmData, ['category', 'IIT JEE'])) {
                const iitJeeCourseDetails = await ClassCourseMappingMysql.getByCourseName(db.mysql.read, 'IIT JEE', studentClass);
                if (iitJeeCourseDetails.length > 0) {
                    studentCcmDataModified.unshift({
                        id: iitJeeCourseDetails[0].id,
                        ccm_category: 'exam',
                        course: iitJeeCourseDetails[0].course,
                        category: 'IIT JEE',
                    });
                }
            }
        }

        const { demoVideos, tabs, category } = await CourseHelper.getDemoVideosForEtoosFacultyCourse(db, assortmentList, studentId, studentClass, studentCcmDataModified);
        if (tabs.length) {
            const widgetData = await WidgetHelper.homepageVideoWidgetWithTabs({
                tabs,
                title: `${carousel.title} for ${category}`,
                versionCode,
                studentLocale,
                data: demoVideos,
                paymentCardState: { isVip: true },
            });
            widgetData.id = `${carousel.carousel_id}`;

            const returnObj = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: carousel.title,
                    is_title_bold: true,
                    items: widgetData.items[136674],
                    id: `${carousel.caraousel_id}`,
                    is_liveclass_carousel: true,
                },
                widget_type: 'widget_parent',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#FFFFFF',
                },
                order: carousel.caraousel_order,
            };

            returnObj.widget_data.items.forEach((x) => {
                x.data.top_title = '';
            });
            const allVideos = [];
            for (const key in demoVideos) {
                if (demoVideos[key].length > 0) {
                    allVideos.push(...demoVideos[key]);
                }
            }

            // thumbnail experiment
            for (let i = 0; i < returnObj.widget_data.items.length; i++) {
                const oldId = allVideos.filter((x) => x.resource_reference == returnObj.widget_data.items[i].data.id);
                if (!_.isEmpty(oldId)) {
                    let check = await HomepageRedis.getThumbnailExperiment(db.redis.read, oldId[0].old_detail_id, studentClass, returnObj.widget_data.items[i].data.id);
                    if (check !== null) {
                        check = JSON.parse(check);
                    }
                    if (check && check.active == 1) {
                        returnObj.widget_data.items[i].data.title1 = '';
                        returnObj.widget_data.items[i].data.title2 = '';
                        returnObj.widget_data.items[i].data.subject = '';
                        returnObj.widget_data.items[i].data.image_url = '';
                        returnObj.widget_data.items[i].data.color = '#00000000';
                        returnObj.widget_data.items[i].data.bg_exam_tag = '';
                        returnObj.widget_data.items[i].data.text_color_exam_tag = '';
                        returnObj.widget_data.items[i].data.target_exam = '';
                        returnObj.widget_data.items[i].data.image_bg_card = `${config.staticCDN}q-thumbnail/notif-thumb-custom-${oldId[0].old_detail_id}-${studentClass}-${returnObj.widget_data.items[i].data.id}.webp`;
                        returnObj.widget_data.items[i].data.image_bg_scale_type = 'FIT_XY';
                    }
                }
            }

            return returnObj;
        }
    }
}

async function refereeNudge(db, carousel, studentId) {
    const couponData = await referralFlowHelper.getRefererSidAndCouponCode(db, studentId);
    if (couponData) {
        const couponCode = couponData.coupon_code;
        const referralSid = couponData.referral_sid;
        let username = await studentHelper.getStudentName(db, couponData.student_id);
        if (username) {
            username = username.length > 15 ? 'friend' : username;
        }
        const jsonWidget = carousel.secondary_data.replace(/<coupon_code>/, couponCode).replace(/<username>/, username);
        const widget = JSON.parse(jsonWidget);
        widget.data.id = `${carousel.caraousel_id}`;
        return {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            ...widget,
        };
    }
}

async function generateRecommendedCarousel({ carousel, qids }) {
    let widgetItems = [];
    if (qids.length > 0) {
        widgetItems = qids.map(qid => {
            const it = {};

            it.id = qid.id;
            it.is_live = false;
            it.state = 2;
            it.set_width = true;
            it.image_bg_card = `${config.cdn_url}q-thumbnail/${qid.id}.webp`;
            it.color = Liveclass.getBarColorForRecentclassHomepage(qid.subject);
            it.page = "HOME_PAGE";
            it.lock_state = 0;
            it.topic = "";
            it.students = 13822;
            it.interested = 13822;
            it.card_width = "1.1";
            it.card_ratio = "16:9";
            const textColors = WidgetHelper.getTextColor(qid.subject.toLowerCase());
            it.text_color_primary = textColors.text_color_primary || "#ffffff";
            it.text_color_secondary = textColors.text_color_secondary || "#ffffff";
            it.text_color_title = textColors.text_color_title || "#ffffff";
            it.is_vip = false;
            it.is_premium = false;
            it.show_reminder = false;
            it.bottom_layout = {
                title: qid.subject,
                title_color: "#000000",
                sub_title_color: "#5b5b5b",
                icon_subtitle: "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/509EE326-9771-E4D0-F4C8-B9DF2A27216B.webp"
            }
            return {
                type: "widget_child_autoplay",
                data: it,
            };
        });
    }

    return {
        is_live: false,
        live_text: 'LIVE',
        title: "Recommended",
        auto_play: true,
        auto_play_initiation: 500,
        auto_play_duration: 15000,
        scroll_direction: 'horizontal',
        items: widgetItems,
    };
}

function gcd(a, b) {
    if (b == 0) {
        return a;
    }
    return gcd(b, a % b);
}

async function getAdvBanner(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign) {
    const ccmIds = await StudentContainer.getStudentCcmIds(db, studentId);
    const advBanners = await HomepageMysql.getAdvBannerData(db.mysql.read, ccmIds);
    if (advBanners.length) {
        const firstBanner = advBanners[0];
        let cardRatio = `4:1`

        const height = firstBanner.banner_height;
        const width = firstBanner.banner_width;
        if ((height > 0) && (width > 0)) {
            const gcdHW = gcd(height, width);
            cardRatio = `${height / gcdHW}:${width / gcdHW}`
        }
        const obj = {
            id: carousel.carousel_id,
            tracking_view_id: carousel.carousel_id,
            widget_type: 'banner_image',
            widget_data: {
                id: `${carousel.carousel_id}`,
                _id: carousel.carousel_id,
                image_url: firstBanner.banner_url,
                deeplink: firstBanner.deeplink,
                card_ratio: `${cardRatio}` || '4:1',
                card_width: '1.0',
            },
            order: parseInt(firstBanner.extra_params) || 2,
        };
        return obj;
    }
}

async function getNewClpCategories(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    /**
    Functionality - Get icons list for new clp entry based on ccm
    author - Saurabh Raj
    */
    try {
        const allCategories = await CourseMysqlv2.getDistinctCategories(db.mysql.read, studentClass);
        const studentCategoryData = studentCcmData.filter((item) => !_.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA'], item.category));
        const studyMaterial = CourseHelper.getCategoryIconsForNewClpPage({
            allCategories,
            studentClass,
            versionCode,
            studentCategoryData,
        });
        if (studyMaterial.length) {
            const returnObj = {
                id: carousel.carousel_id,
                tracking_view_id: carousel.carousel_id,
                widget_data: {
                    title: carousel.title,
                    items: studyMaterial,
                },
                widget_type: 'widget_parent',
                layout_config: {
                    margin_top: 5,
                    margin_bottom: 5,
                    margin_left: 0,
                    margin_right: 0,
                },
                order: carousel.caraousel_order,
            };
            return returnObj;
        }
    } catch (e) {
        console.log(e);
    }
}

async function getTeachersWidget(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign) {
    
    carousel.carousel_type = carousel.data_type;
    if (carousel.facultyData) {
        const data = await CourseHelperV6.getLiveClassTopTeachersData(db, studentClass, studentLocale, carousel, versionCode)
        if (data.length) {
            data[0].data.id = `${carousel.carousel_id}`;
            data[0].id = carousel.carousel_id;
            data[0].tracking_view_id = carousel.carousel_id;
            return data[0];
        }
    }
    return null
}
async function getLivePastRecommended(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign) {
    carousel.carousel_type = 'widget_autoplay';
    carousel.view_type = 'free_live_class_all';
    let recommendedList = await db.redis.read.getAsync(`u:rec:${studentId}:carousel`);
    recommendedList = JSON.parse(recommendedList);

    if (!_.isEmpty(recommendedList)) {
        recommendedList = await generateRecommendedCarousel({ carousel, qids: recommendedList });;
    } else {
        const language = studentLocale == "hi" ? "HINDI" : "ENGLISH";
        recommendedList = await db.redis.read.getAsync(`u:rec:${studentClass}_${language}_BOARDS`);
        recommendedList = JSON.parse(recommendedList);
        if (!_.isEmpty(recommendedList)) {
            recommendedList = await generateRecommendedCarousel({ carousel, qids: recommendedList });;
        } else {
            recommendedList = {};
        }
    }
    console.log("here");
    const data = await CourseHelperV6.getLiveRecommendedPastData(db, studentId, studentClass, studentLocale, versionCode, config, carousel, recommendedList);
    if (data.length) {

        return data[0];
    }
    return null
}

async function getAdHocAM(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign) {
    if (carousel.data_type === 'favorite_category_icons') {
        return getAllCategoryWidgets(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount);

    }
    const buildDataTypeMap = {
        'widget_classes_by_teacher': getTeachersWidget,
        'live_recommended_past': getLivePastRecommended
    };
    return buildDataTypeMap[carousel.data_type](carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign)
}

async function getHomeCarousels(db, config, studentId, versionCode, flagVariants, studentClass, studentLocale, { source, home_page_experiment }, headers, isDropper, pznElasticSearchInstance, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, userAssortment, packageValue, campaign) {
    const { country = null, 'x-auth-token': xAuthToken } = headers;
    // start
    let ccmArray = [];
    let homeCarouselsData = [];
    const base_url = `${config.staticCDN}q-thumbnail/`;
    // Check For Personalization
    const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
    // check for package

    const carouselsLocale = (studentLocale === 'hi') ? 'hi' : 'en';
    const studentCurrentSubscriptionDetails = await CourseContainer.getUserActivePackages(db, studentId);

    let studentCourseOrClassSubcriptionDetails = studentCurrentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || (versionCode >= 893 && item.assortment_type === 'subject')));
    const isFreeUser = studentCourseOrClassSubcriptionDetails.length === 0;
    if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
        ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
    }
    const studentCcms = ccmArray.sort().join();
    let enabledHPExp = false;

    const HPExpCampaign = 'new-homepage-exp';
    const versionCodeInt = parseInt(versionCode);
    if ((versionCodeInt >= 1030) && isFreeUser) {
        enabledHPExp = await CourseContainerv2.getFlagrRespWithClassVersionCode(db, HPExpCampaign, studentId, studentClass, versionCodeInt);
    }

    const cacheKey = md5(JSON.stringify({
        studentId, carouselsLocale, studentClass, versionCode, packageValue, campaign: enabledHPExp ? HPExpCampaign : campaign, studentCcms,
    }));

    const cachedHC = await StudentRedis.getHomeCarousels(db.redis.read, studentId, cacheKey);
    let fromCache = false;
    if (cachedHC) {
        homeCarouselsData = JSON.parse(cachedHC);
        fromCache = true;
    }
    if (!fromCache) {
        if (enabledHPExp) {
            homeCarouselsData = await getHomeCarouselsByCampaignAndCcmidWithoutPersonalization(db, flagVariants, versionCode, studentId, HPExpCampaign, carouselsLocale, packageValue);

            if (!homeCarouselsData.length) {
                homeCarouselsData = await getHomeCarouselsByCampaignIdAndClass(db, flagVariants, versionCode, studentClass, HPExpCampaign, carouselsLocale, packageValue);
            }
        }
        if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
            if (campaign && !homeCarouselsData.length) {
                homeCarouselsData = await getHomeCarouselsByCampaignAndCcmid(db, flagVariants, versionCode, studentId, campaign, carouselsLocale, packageValue);

                if (!homeCarouselsData.length) {
                    homeCarouselsData = await getHomeCarouselsByCampaignIdAndClass(db, flagVariants, versionCode, studentClass, campaign, carouselsLocale, packageValue);
                }
            }
        }

        if (!homeCarouselsData.length) {
            if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
                homeCarouselsData = await getHomeCarouselsByCcmId(db, flagVariants, versionCode, studentId, carouselsLocale, packageValue);
            }

            if (!homeCarouselsData.length) {
                homeCarouselsData = await getHomeCaraouselByClass(db, flagVariants, versionCode, studentClass, carouselsLocale, packageValue);
            }
        }

        // for fetching carousel for exam whose personalisation_active is 0
        let examPdfCarouselIncluded = false;
        if (!enabledHPExp) {
            _.map(homeCarouselsData, (carousel) => {
                if (carousel.type === 'PREVIOUS_YEARS_PDF_EXAM_WISE') {
                    examPdfCarouselIncluded = true;
                }
            });
            if (!examPdfCarouselIncluded) {
                const examCarousel = await HomepageMysql.getHomeCarouselBasedOnType(db.mysql.read, 'PREVIOUS_YEARS_PDF_EXAM_WISE', '', studentClass, carouselsLocale, versionCode);
                if (!_.isEmpty(examCarousel)) {
                    homeCarouselsData.push(examCarousel[0]);
                }
            }
        }
        await StudentRedis.setHomeCarousels(db.redis.write, studentId, cacheKey, homeCarouselsData);
    }
    const showFavoriteCount = 7;
    // Over write homeCarouselsData If source Is Non Home To Render Only App_Banners if not return empty array
    // return 'test';
    if (source !== 'home') {
        let appBannerExist = false;
        for (let i = 0; i < homeCarouselsData.length; i++) {
            if (homeCarouselsData[i].type == 'APP_BANNER') {
                homeCarouselsData = [homeCarouselsData[i]];
                appBannerExist = true;
                break;
            }
        }
        if (!appBannerExist) {
            return [];
        }
    }

    if (studentLocale !== 'en') {
        const localisation_promises = [];
        for (let m = 0; m < homeCarouselsData.length; m++) {
            if ('id' in homeCarouselsData[m]) {
                localisation_promises.push(HomepageContainer.getHomeCaraouselStringsLocalised(db, config, versionCode, homeCarouselsData[m].id, studentLocale));
            }
        }
        const resolvedLocalisationPromises = await Promise.all(localisation_promises);
        for (let n = 0, l = 0; n < homeCarouselsData.length; n++) {
            if ('id' in homeCarouselsData[n]) {
                if (!_.isEmpty(resolvedLocalisationPromises[l])) {
                    homeCarouselsData[n].title = (resolvedLocalisationPromises[l].translation !== '') ? resolvedLocalisationPromises[l].translation : homeCarouselsData[n].title;
                }
                l++;
            }
        }
    }
    const homeCarouselsGroupedById = _.groupBy(homeCarouselsData, 'id');

    const carouselIdsArray = _.map(_.keys(homeCarouselsGroupedById), (key) => parseInt(key));
    console.log(carouselIdsArray, ' carouselIdsArray');
    console.log(db.mongo.read, ' ******');
    /* eslint-disable quote-props */
    let carouselsArray = await db.mongo.read.collection('homepage_feed_test').find({ class: parseInt(studentClass), 'carousel_id': { $in: carouselIdsArray } }).toArray();
    carouselsArray = carouselsArray.sort((a, b) => a.caraousel_order - b.caraousel_order);
    carouselsArray = carouselsArray.map((carousel) => {
        // eslint-disable-next-line no-prototype-builtins
        if (carousel.hasOwnProperty('items')) {
            carousel.items = carousel.items.map((item) => {
                // item.image_url = buildStaticCdnUrl(item.image_url);
                item.image_url = buildStaticCdnUrl(Utility.convertoWebP(item.image_url));
                return item;
            });
        }
        return carousel;
    });
    let prevYearsArr = [];
    let newTypesArr = [];
    let hindiTitles = [];
    if (home_page_experiment === 'true' && versionCode > 846) {
        const removeTypeArr = ['LATEST_FROM_DOUBTNUT', 'DAILY_CONTEST', 'BOOKS_93', 'BOOKS_94', 'APP_BANNER', 'PERSONALIZATION_CHAPTER', 'REVISION_SERIES', 'BOOKS_43', 'BOOKS_3', 'NDA_solutions', 'CHEMISTRY'];
        const removeByTitleEn = ['NCERT Revision for NEET', 'NEET 2020 - Revision', 'JEE 2020 - 30 DAY REVISION', 'Formula Sheet', 'NCERT Book Solutions Class 12', 'NCERT Book Solutions Class 11', 'UP Board Prashna Patra Solutions', 'Biology Books Solutions', 'Physics Books Solutions', 'Maths Books Solutions'];
        const removeByTitleHi = ['NCERT किताबों का हल (कक्षा ११)', 'NCERT किताबों का हल (कक्षा १२)', 'UP Board प्रश्पत्र के वीडियो जवाब', 'JEE 2020 -30 दिन का रिवीजन', 'फॉर्मूला शीट', 'NEET के लिए NCERT रिवीजन', 'NEET 2020 - रिवीजन', 'जीवविज्ञान किताबो का हल', 'भौतिक विज्ञान किताबो का हल', 'गणित किताबो का हल'];
        carouselsArray = carouselsArray.filter((carousel) => !removeTypeArr.includes(carousel.type) && !removeByTitleEn.includes(carousel.title) && !removeByTitleHi.includes(carousel.title));
        if (versionCode > 848) {
            const prevYearsExamsType = ['10_BOARDS_PY', '12_BOARDS_PY', 'JEE_MAINS_PY', 'JEE_ADV_PY', 'NEET 2019 SOLUTIONS'];
            prevYearsArr = await getPrevYearsData(db, carouselsArray, prevYearsExamsType, studentLocale);
            carouselsArray = carouselsArray.filter((carousel) => !removeTypeArr.includes(carousel.type) && !removeByTitleEn.includes(carousel.title) && !removeByTitleHi.includes(carousel.title) && !prevYearsExamsType.includes(carousel.type));
        }
        newTypesArr = ['PLAYLIST', 'CHANNELS', 'HOMEPAGE_GAMES_LIST', 'VIDEO_ADS', 'PREVIOUS_YEAR_SOLUTIONS'];
        hindiTitles = await getHindiTitles(db, carouselsArray, newTypesArr);
    }
    let carouselData;
    let addtabs = 0;
    let examCornerData;

    const tabbed_home_carousel_flag = false;

    // * Fetch user active packages

    if (versionCode >= 893) {
        const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        let expiredPackages = await CourseContainer.getUserExpiredPackagesIncludingTrial(db, studentId);
        expiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30 && (versionCode > 966 || item.amount > -1));
        expiredPackages = expiredPackages.filter((item) => !_.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', item.assortment_id]));
        studentCourseOrClassSubcriptionDetails = [...studentCourseOrClassSubcriptionDetails, ...expiredPackages];
    }

    const ccmCourses = await CourseHelper.getCoursesFromCcmArray(db, ccmArray, studentClass, studentLocale);
    const studentCcmData = await CourseMysqlv2.getCoursesClassCourseMappingWithCategory(db.mysql.read, studentId);
    const iitNeetCourses = [];
    let ccmTitle = null;
    CourseHelper.getCategoryByStudentCCM(studentCcmData);
    if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
        ccmTitle = 'IIT JEE';
        const freeIitCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
        freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
    }
    if (_.find(studentCcmData, ['category', 'NEET'])) {
        ccmTitle = ccmTitle ? 'IIT JEE / NEET' : 'NEET';
        const freeNeetCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
        freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
    }
    if (!iitNeetCourses.length && _.includes([11, 12, 13], +studentClass)) {
        ccmTitle = 'IIT JEE / NEET';
        const freeIitCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
        freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
        const freeNeetCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
        freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
    }
    const trendingWidgets = [];
    const carouselsPromises = [];
    const categorizedTopIconPromises = [];
    const tempCarouselData = [];
    const campaignTimer = [];

    const carouselsMapping = {
        'PERSONALIZATION_BOOKS': getPersonalizationBooks,
        'PERSONALIZATION_LIVE_CLASS': getPersonalizationClass,
        'PERSONALIZATION_CHAPTER': getPersonalizationChapter,
        'APP_BANNER': getAppBanner,
        'DAILY_QUIZ': getDailyQuiz,
        'COURSES': getCourses,
        'COURSES_V1': getCoursesV1,
        'ETOOS_FACULTY': getEtoosFaculty,
        'ETOOS_FACULTY_FREE_VIDEOS': getEtoosFacultyFreeVideos,
        'HOMEWORK': getHomework,
        'LIVECLASS_V1': getLiveClassV1,
        'PLAYLIST': getPlaylist,
        'CHANNELS': getChannels,
        'HISTORY': getHistory,
        'HOMEPAGE_GAMES_LIST': getHomepageGamesList,
        'VIDEO_ADS': getVideoAds,
        'PREVIOUS_YEAR_SOLUTIONS': getPrevYearSolutions,
        'PENDING_PAYMENT': getPendingPayment,
        'TOP_FREE_CLASSES': getTopFreeClassesCarousel,
        'MY_COURSES': getMyCourses,
        'DOUBT_FEED': getDoubtFeed,
        'KHELO_JEETO': getKheloJeeto,
        'GOVT_BOOKS': getGovBooks,
        'MY_SACHET': getMySatchet,
        'WIDGET_NUDGE': getWidgetNudge,
        'PROFILE_DETAILS': getProfileDetails,
        'CALLING_CARD': getCallingCard,
        'BANNER': getBanner,
        'LATEST_COURSES': getLatestCourses,
        'DICTIONARY_BANNER': getDictionaryBanner,
        'SUBSCRIBED_TEACHERS': getSubscribedTeachers,
        'CCM_TEACHERS': getCcmTeachers,
        'LIBRARY_TRENDING': getLibraryTrending,
        'CTET_BANNER': getCtetBanner,
        'SUBSCRIBED_TEACHERS_VIDEOS': getSubscribedTeachersVideos,
        'STUDY_TIMER_BANNER': getStudyTimerBanner,
        'PRACTICE_ENGLISH_BANNER': getPracticeEnglishBanner,
        'PRACTICE_ENGLISH_WIDGET': getPracticeEnglishWidget,
        'SPOKEN_ENGLISH_CERTIFICATE': getSpokenEnglishCertificateBanner,
        'MOCK_TEST_WIDGET': getMockTestWidget,
        'COURSE_TRIAL_TIMER': getCourseTrialTimerBanner,
        // 'DNR_BANNER': getDNRDailyStreakWidget,
        'CTET_CAROUSELS': getTeachingCarousel,
        'DEFENCE_CAROUSELS': getDefenceCarousel,
        'REVISION_CLASSES': getRevisionClass,
        'TOP_TEACHERS_CLASSES': getTopTeachersClasses,
        'PREVIOUS_YEARS_PDF': getPreviousYearCarousels,
        'SAMPLE_PAPERS_PDF': getSamplePaperCarousels,
        'PREVIOUS_YEARS_PDF_EXAM_WISE': getPreviousYearCarouselsExamWise,
        'RECOMMENDED_INTERNAL_TEACHERS': getRecommendedInternalTeachers,
        'SUBSCRIBED_INTERNAL_TEACHERS': getSubscribedInternalTeachers,
        'SUBSCRIBED_INTERNAL_TEACHERS_VIDEOS': getSubscribedInternalTeachersVideos,
        'JEE_MAINS_ADV': getJeeMainsAdvData,
        'NKC_SIR_VIDEOS': getNkcSirVideos,
        'REFEREE_NUDGE': refereeNudge,
        'AD_HOC_WIDGETS_AM': getAdHocAM,
        'ADV_BANNER': getAdvBanner,
        'NEW_CLP_CATEGORIES': getNewClpCategories,
    };

    const isDNREnabled = studentHelper.showDnrExp(studentId, headers.package_name);
    if (isDNREnabled) {
        carouselsMapping['DNR_BANNER'] = getDNRDailyStreakWidget;
    }

    const categoriesPromises = [];
    let popularCourses = [];
    const emiPackages = await CourseContainer.getUserEmiPackages(db, studentId);
    const userValues = await HomepageDynamicHelper.generateUserDataForAddtionalChecks(db, studentId, carouselsArray);
    for (const carousel of carouselsArray) {
        if (!HomepageDynamicHelper.checkIfCarouselToBeShown(carousel, userValues)) {
            continue;
        }
        // console.log(carousel.carousel_type, ' carousel.carousel_type');
        if (carousel.carousel_type === 'real_time') {
            let titleForNewCarousals;
            if (home_page_experiment === 'true' && newTypesArr.includes(carousel.type)) {
                const titleEn = carousel.title;
                let titleHi = '';
                hindiTitles.forEach((item) => {
                    if (carousel.type === item.type) {
                        titleHi = item.hindi_title;
                    }
                });
                titleForNewCarousals = studentLocale === 'hi' ? titleHi : titleEn;
            }

            if (carousel.type == 'PERSONALIZATION_NCERT_TAB' && tabbed_home_carousel_flag) {
                // if (addtabs == 0) {
                addtabs++;
                carouselsPromises.push(getPersonalizationNCERTTab(carousel, addtabs, studentClass, studentId, db));
            } else if (carousel.data_type == 'library_video') {
                if (carousel.data_limit < 0) {
                    carouselsArray.data_limit = 10;
                }
                carouselsPromises.push(getLibraryVideo(carousel, studentId, studentClass, db, base_url, homeCarouselsGroupedById, studentLocale));
            } else if (carousel.data_type == 'referral_claim_widget') {
                try {
                    const sData = JSON.parse(carousel.secondary_data);
                    const [referralCount, referralCountDnProperty] = await Promise.all([CourseMysqlv2.getPaymentReferralEntries(db.mysql.read, studentId), Properties.getNameAndValueByBucket(db.mysql.read, 'mlm_referral_invitor_claim_amount_mapping')]);
                    const groupedWidgetData = _.groupBy(referralCountDnProperty, 'name');
                    sData.data[0].data.id = carousel.carousel_id;
                    sData.data[0].id = carousel.carousel_id;
                    sData.data[0].tracking_view_id = carousel.carousel_id;
                    sData.data[0].order = carousel.caraousel_order;

                    sData.data[1].data.id = carousel.carousel_id;
                    sData.data[1].id = carousel.carousel_id;
                    sData.data[1].tracking_view_id = carousel.carousel_id;
                    sData.data[1].order = carousel.caraousel_order;

                    if (referralCount.length == 0) {
                        sData.data[0].widget_type = carousel.data_type;
                        carouselsPromises.push(sData.data[0]);
                    } else {
                        const goodieData = await CourseMysqlv2.getReferralRewardWinnerData(db.mysql.read, referralCount[referralCount.length - 1].id);
                        const ref = groupedWidgetData[referralCount.length][0];
                        sData.data[1].widget_type = carousel.data_type;
                        if (ref.value.includes('://')) {
                            sData.data[1].data.title3 = sData.data[1].data.title3_conditional;
                            if (goodieData.length > 0 && goodieData[0].is_verified) {
                                sData.data[1].data.image_url1 = ref.value;
                            } else {
                                sData.data[1].data.title4 = sData.data[1].data.title4_conditional;
                                sData.data[1].data.image_url1 = ref.value;
                                sData.data[1].data.deeplink = sData.data[1].data.deeplink_conditional.replace(/{id}/g, referralCount[referralCount.length - 1].id);
                            }
                        } else {
                            sData.data[1].data.title3 = sData.data[1].data.title3.replace(/<amount>/g, referralCount[referralCount.length - 1].amount);
                            sData.data[1].data.title4 = sData.data[1].data.title4_conditional_paytm;
                            // sData.data[1].data.image_url1 = ref.value;
                        }
                        carouselsPromises.push(sData.data[1]);
                    }
                } catch (e) {
                    console.log(e);
                }
            } else if (carousel.data_type === 'REFEREE_NUDGE') {
                carouselsPromises.push(refereeNudge(db, carousel, studentId));
            } else if (carousel.type === 'NUDGE') {
                const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
                const renewalPackages = await CourseHelper.checkUserPackageRenewals({
                    db,
                    studentID: studentId,
                    studentSubscriptionDetails: studentCurrentSubscriptionDetails,
                });

                if (!_.isNull(carousel.secondary_data)) {
                    // let nudges = await NudgeMysql.getByTypeAndEvent(db.mysql.read, carousel.secondary_data, 'homepage', 12);
                    const promise = [];
                    for (let i = 0; i < carousel.secondary_data.length; i++) {
                        promise.push(CourseContainer.getByTypeAndEvent(db, carousel.secondary_data[i], 'homepage', 12));
                    }
                    const settledPromises = await Promise.allSettled(promise);
                    let nudges = settledPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
                    nudges = nudges.filter((value) => !_.isEmpty(value) && !_.isNull(value));
                    nudges = _.flatten(nudges);
                    if (nudges.length) {
                        nudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, nudges);
                        if (nudges.length) {
                            const timerFlagrResp = await CourseContainerv2.getFlagrResp(db, 'campaign_timer', studentId);
                            if (nudges[0].type == 'campaign_timer' && versionCode >= 893 && versionCode <= 1015) {
                                if (_.get(timerFlagrResp, 'campaign_timer.payload.enabled', false)) {
                                    const now = moment().add(5, 'hours').add(30, 'minutes');
                                    const trialEnd = moment(nudges[0].end_time);
                                    if (trialEnd > now) {
                                        campaignTimer.push({
                                            widget_type: 'widget_coupon_banner',
                                            widget_data: {
                                                id: carousel.carousel_id,
                                                tracking_view_id: carousel.carousel_id,
                                                title: nudges[0].text,
                                                image_url: nudges[0].display_image_rectangle,
                                                subtitle: '',
                                                description: nudges[0].display_text,
                                                heading: nudges[0].subtitle_text,
                                                time: `${moment(trialEnd).diff(now)}`,
                                                text_color: nudges[0].background_color,
                                            },
                                            order: carousel.caraousel_order,
                                        });
                                    }
                                } else {
                                    campaignTimer.push(null);
                                }
                            }
                        }
                    }
                }

                const event = 'data_watch_time';
                // get active nudges for homepage
                let nudges = await NudgeMysql.getByEvent(db.mysql.read, event, studentClass);
                if (nudges.length) {
                    nudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, nudges);
                    if (nudges.length) {
                        const nudgeWidget = NudgeHelper.getWidget(nudges, config, 0);
                        const tempCarousel = carousel;
                        tempCarousel.items = nudgeWidget.data.items;
                        tempCarousel.show_view_all = 0;
                        tempCarousel.title = nudgeWidget.data.title;
                        tempCarousel.deeplink = '';
                        tempCarouselData.push({
                            id: carousel.carousel_id,
                            tracking_view_id: carousel.carousel_id,
                            widget_data: tempCarousel,
                            widget_type: 'nudges',
                            layout_config: {
                                'margin_top': 16,
                                'bg_color': '#ffffff',
                            },
                            order: carousel.caraousel_order,
                        });
                    }
                }
                let renewalNudges = await NudgeMysql.getByEvent(db.mysql.read, 'renewal_campaign', studentClass);
                if (renewalNudges.length) {
                    renewalNudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, renewalNudges);
                    if (renewalNudges.length) {
                        const thisMonthRenewalPackages = studentCurrentSubscriptionDetails.filter((item) => moment(item.end_date) < moment('2021-11-01'));
                        if (thisMonthRenewalPackages.length) {
                            renewalNudges[0].deeplink = thisMonthRenewalPackages.length > 1 ? `doubtnutapp://course_select?page=renewal_widget||${renewalNudges[0].coupon_id}` : `doubtnutapp://bundle_dialog?id=${thisMonthRenewalPackages[0].assortment_id}&source=POST_PURCHASE_RENEWAL||${renewalNudges[0].coupon_id}`;
                            const renewalNudgeWidget = NudgeHelper.getWidget(renewalNudges, config, 0);
                            const nudgeCarousel = JSON.parse(JSON.stringify(carousel));
                            nudgeCarousel.items = renewalNudgeWidget.data.items;
                            nudgeCarousel.show_view_all = 0;
                            nudgeCarousel.title = renewalNudgeWidget.data.title;
                            nudgeCarousel.deeplink = '';
                            tempCarouselData.push({
                                id: carousel.carousel_id,
                                tracking_view_id: carousel.carousel_id,
                                widget_data: nudgeCarousel,
                                widget_type: 'nudges',
                                layout_config: {
                                    'margin_top': 16,
                                    'bg_color': '#ffffff',
                                },
                                order: carousel.caraousel_order,
                            });
                        }
                    }
                }
                if (emiPackages.length) {
                    const lastEmi = emiPackages[emiPackages.length - 1];
                    const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
                        .endOf('day');
                    if (moment(lastEmi.end_date) >= now && moment(lastEmi.end_date) <= end && !lastEmi.is_last) {
                        const event = 'emi_reminder';
                        const nudges = await NudgeMysql.getByEvent(db.mysql.read, event, studentClass);
                        const nudgeWidget = NudgeHelper.getWidget(nudges, config, lastEmi.next_variant_id);
                        const tempCarousel = carousel;
                        tempCarousel.items = nudgeWidget.data.items;
                        tempCarousel.show_view_all = 0;
                        tempCarousel.title = nudgeWidget.data.title;
                        tempCarousel.deeplink = '';
                        tempCarouselData.push({
                            id: carousel.carousel_id,
                            tracking_view_id: carousel.carousel_id,
                            widget_data: tempCarousel,
                            widget_type: 'nudges',
                            layout_config: {
                                'margin_top': 16,
                                'bg_color': '#ffffff',
                            },
                            order: carousel.caraousel_order,
                        });
                    }
                }
                if (renewalPackages.length) {
                    if (versionCode < 872) {
                        const renewalnudges = await NudgeMysql.getByEvent(db.mysql.read, 'validity_reminder', studentClass);
                        const nudgeWidget = NudgeHelper.getWidget(renewalnudges, config, renewalPackages[0].assortment_id);
                        const tempCarousel = carousel;
                        tempCarousel.items = nudgeWidget.data.items;
                        tempCarousel.show_view_all = 0;
                        tempCarousel.title = nudgeWidget.data.title;
                        tempCarousel.deeplink = '';
                        tempCarouselData.push({
                            id: carousel.carousel_id,
                            tracking_view_id: carousel.carousel_id,
                            widget_data: tempCarousel,
                            widget_type: 'nudges',
                            layout_config: {
                                'margin_top': 16,
                                'bg_color': '#ffffff',
                            },
                            order: carousel.caraousel_order,
                        });
                    } else {
                        carousel.title = global.t8[studentLocale].t('Course ki validity khatam hone wali hai !');
                        const widgetData = WidgetHelper.getPostPuchasePaymentWidget({
                            locale: studentLocale,
                            result: renewalPackages,
                            carousel,
                        });
                        tempCarouselData.push({
                            id: carousel.carousel_id,
                            tracking_view_id: carousel.carousel_id,
                            widget_data: widgetData.data,
                            widget_type: 'validity_widget',
                            layout_config: {
                                'margin_top': 16,
                                'bg_color': '#ffffff',
                            },
                            order: carousel.caraousel_order,
                        });
                    }
                }
            } else if (carousel.type === 'EXAM_CORNER') {
                examCornerData = await ExamCornerCtrl.getFeedForHome(db, studentLocale, studentId, studentClass, versionCode);
                if (examCornerData) {
                    examCornerData.order = carousel.caraousel_order;
                    examCornerData.widget_data.id = carousel.carousel_id;
                    examCornerData.id = carousel.carousel_id;
                    examCornerData.tracking_view_id = carousel.carousel_id;
                }
            } else if (carousel.type === 'CATEGORY_ICONS') {
                categorizedTopIconPromises.push(getAllCategoryWidgets(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, userAssortment, headers.package_name));
            } else if (carousel.type === 'LIVECLASS') {
                const libraryDataCache = await courseV2Redis.getLibraryDataCacheOnHomepage(db.redis.read, studentId, studentClass);
                if (versionCode < 787) {
                    const libraryData = libraryDataCache ? JSON.parse(libraryDataCache) : await Liveclass.getLiveclassCarousel(db, config, ccmArray, studentId, studentClass, versionCode);
                    if (!libraryDataCache && libraryData.length) {
                        courseV2Redis.setLibraryDataCacheOnHomepage(db.redis.write, studentId, studentClass, libraryData);
                    }
                    for (let i = 0; i < libraryData.length; i++) {
                        const tempCarousel = carousel;
                        if (libraryData[i].items && libraryData[i].items.length > 0) {
                            tempCarousel.items = libraryData[i].items;
                            tempCarousel.show_view_all = 0;
                            tempCarousel.title = libraryData[i].title;
                            tempCarousel.deeplink = '';
                            tempCarousel.id = `${carousel.caraousel_id}`;
                            tempCarouselData.push({
                                widget_data: JSON.parse(JSON.stringify(tempCarousel)),
                                widget_type: 'live_class_carousel',
                                layout_config: {
                                    'margin_top': 16,
                                    'bg_color': '#ffffff',
                                },
                                order: carousel.caraousel_order,
                            });
                        }
                    }
                } else {
                    const libraryData = libraryDataCache ? JSON.parse(libraryDataCache) : await CourseHelper.getLiveclassCarouselLatest(db, config, ccmCourses, studentId, studentClass, studentLocale, versionCode, home_page_experiment);
                    if (!libraryDataCache && libraryData.length) {
                        courseV2Redis.setLibraryDataCacheOnHomepage(db.redis.write, studentId, studentClass, libraryData);
                    }
                    for (let i = 0; i < libraryData.length; i++) {
                        const tempCarousel = carousel;
                        if (libraryData[i].items && libraryData[i].items.length > 0) {
                            tempCarousel.items = libraryData[i].items;
                            tempCarousel.show_view_all = 0;
                            tempCarousel.title = libraryData[i].title;
                            tempCarousel.deeplink = '';
                            tempCarouselData.push({
                                id: carousel.carousel_id,
                                tracking_view_id: carousel.carousel_id,
                                widget_data: {
                                    id: `${carousel.carousel_id}`,
                                    title: libraryData[i].title,
                                    items: libraryData[i].items,
                                    is_vip: libraryData[i].is_vip,
                                },
                                widget_type: 'widget_parent',
                                layout_config: {
                                    'margin_top': 16,
                                    'bg_color': '#ffffff',
                                },
                                order: carousel.caraousel_order,
                            });
                        }
                    }
                }
            } else if ((carousel.type === 'TRENDING_EXAM' || carousel.type === 'TRENDING_BOARD') && versionCode > 872) {
                const trendingCourses = await CourseHelper.getTrendingCourses(db, carousel.type, studentCcmData, studentLocale, studentClass);
                const { widgetAttributes } = trendingCourses;
                let arr = trendingCourses.assortmentIds;
                arr = arr.filter((item) => studentCourseOrClassSubcriptionDetails.findIndex((item2) => +item2.assortment_id === +item) === -1);
                if (arr.length) {
                    popularCourses = await CourseHelper.getTrendingCoursesCarousel({
                        db, config, studentId, versionCode, xAuthToken, arr, studentLocale,
                    });
                    const popularCourseWidget = {
                        id: carousel.carousel_id,
                        tracking_view_id: carousel.carousel_id,
                        type: 'widget_popular_course',
                        widget_data: {
                            ...widgetAttributes,
                            link_text: '',
                            deeplink: '',
                            more_text: global.t8[studentLocale].t('See all'),
                            more_deeplink: `doubtnutapp://course_category?category_id=${widgetAttributes.see_all_category}`,
                            auto_scroll_time_in_sec: Data.popular_courses_carousel.auto_scroll_time_in_sec,
                            items: popularCourses || [],
                            background_color: '#ffffff',
                            id: `${carousel.carousel_id}`,
                        },
                        order: carousel.caraousel_order,
                        extra_params: {
                            be_source: 'HOME_TRENDING',
                            widget_type: 'widget_popular_course',
                        },
                    };
                    if (popularCourses.length) {
                        trendingWidgets.push(popularCourseWidget);
                    }
                }
            } else if (carousel.type === 'CURRENT_AFFAIRS' && versionCode > 917) {
                let currentAffairsData = {};
                const currentAffairsDataFromRedis = await courseV2Redis.getCurrentAffairCarousel(db.redis.read, studentId, studentLocale);
                if (!_.isNull(currentAffairsDataFromRedis)) {
                    currentAffairsData = JSON.parse(currentAffairsDataFromRedis);
                } else {
                    currentAffairsData = await getCurrentAffairsCarousels(carousel, studentId, studentClass, studentLocale, db, versionCode);
                    if (currentAffairsData) {
                        courseV2Redis.setCurrentAffairCarousel(db.redis.write, studentId, studentLocale, currentAffairsData);
                    }
                }
                if (!_.isEmpty(currentAffairsData)) {
                    currentAffairsData.widget_data.id = carousel.carousel_id;
                    tempCarouselData.push({
                        id: carousel.carousel_id,
                        tracking_view_id: carousel.carousel_id,
                        ...currentAffairsData
                    });
                }
            } else if (carousel.type === 'AD_HOC_WIDGETS' || carousel.type === 'AD_HOC_WIDGET_CHILD' || carousel.type === 'REFERRAL_CEO_V2_TESTIMONIALS') {
                try {
                    if (Object.keys(carousel.android_widget).length) {
                        if (_.get(carousel, 'android_widget.widget_data.data_type', null) == 'course_extra_marks') {
                            if (flagVariants.indexOf('982') >= 0 && +studentClass !== 14 && !studentCourseOrClassSubcriptionDetails.length) {
                                const data = null;
                                let paidCourses = await CourseHelper.getPaidAssortmentsData({
                                    db,
                                    studentClass,
                                    config,
                                    versionCode,
                                    studentId,
                                    studentLocale,
                                    xAuthToken,
                                    page: 'HOMEPAGE',
                                    pznElasticSearchInstance,
                                    data: carousel.android_widget.widget_data.items[0].data,
                                });
                                paidCourses = paidCourses ? paidCourses.items : [];
                                if (!paidCourses.length) {
                                    carousel.android_widget = undefined;
                                }
                                if (paidCourses.length) {
                                    carousel.android_widget.widget_data.items = paidCourses;
                                    carousel.android_widget.widget_data.title = global.t8[studentLocale].t('Courses for Extra Marks');
                                }
                            } else {
                                carousel.android_widget = undefined;
                            }
                        }
                        if (carousel.android_widget.widget_data) {
                            carousel.android_widget.widget_data.id = `${carousel.carousel_id}`;
                        } else if (carousel.android_widget.data) {
                            carousel.android_widget.data.id = `${carousel.carousel_id}`;
                        }
                        carouselsPromises.push({
                            id: carousel.carousel_id,
                            tracking_view_id: carousel.carousel_id,
                            ...carousel.android_widget
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
                try {
                    // console.log('else case');
                    carouselsPromises.push(carouselsMapping[carousel.type](carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign));
                } catch {
                    undefined;
                }
            }
        } else if (carousel.widget_type == 'whatsapp') {
            carouselsPromises.push(getWhatsapp(carousel));
        } else {
            carouselsPromises.push(getGeneralFlow(carousel, homeCarouselsGroupedById));
        }
    }
    carouselData = await Promise.allSettled(carouselsPromises);
    // return res.send()
    // return 'test';
    let categorizedTopIcon = await Promise.all(categorizedTopIconPromises);
    // return 'true';
    categorizedTopIcon = categorizedTopIcon.filter((item) => Boolean(item));
    carouselData = carouselData.map((x) => { if (x.value !== undefined) return x.value; });
    if (tempCarouselData.some((el) => el.widget_type === 'nudges')) {
        carouselData = [...tempCarouselData, ...carouselData];
    } else {
        carouselData = [...carouselData, ...tempCarouselData];
    }
    carouselData = carouselData.filter((x) => x != undefined);
    carouselData = carouselData.filter((item) => item.length !== 0);
    if (versionCode > 870 && versionCode < 955) {
        const ncertTitles = Data.ncertTitleArr;
        const ncertData = carouselData.filter((x) => x.widget_data && ncertTitles.includes(x.widget_data.title));
        if (ncertData.length == 1 && studentClass != 14 && ncertData[0].widget_data.items) {
            ncertData[0].widget_data.items = await libraryHelperV7.makeNewFlowNcertBooksData(db, studentId, studentClass, studentLocale);
            const ncertModifiedData = await getNcertModifiedData(db, ncertData[0].widget_data.items, studentId, studentClass);
            if (ncertModifiedData && ncertModifiedData.length == ncertData[0].widget_data.items.length) {
                carouselData.forEach((item) => {
                    if (item.widget_data && item.widget_data.title === ncertData[0].widget_data.title) {
                        item.widget_data.show_view_all = 0;
                        item.widget_data.items = ncertModifiedData;
                    }
                });
            }
        }
    }
    if (examCornerData) {
        carouselData.push(examCornerData);
    }
    carouselData.push(...trendingWidgets);
    carouselData.sort((a, b) => a.order - b.order);

    const studentActiveCourses = studentCurrentSubscriptionDetails.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'subject');
    if (!studentActiveCourses.length) {
        const freeCarousels = [];
        let index = 0;
        let campaignScreenTypes = [];
        if (!_.isNull(campaign) && !_.isUndefined(campaign)) {
            campaignScreenTypes = await BranchContainer.getScreenTypeByCampaign(db, campaign);
            campaignScreenTypes = campaignScreenTypes.map((x) => x.screen_type);
        }

        carouselData = [...freeCarousels, ...carouselData];

        if (campaignScreenTypes.includes('Home')) {
            while (index < carouselData.length) {
                if (carouselData[index].widget_data && carouselData[index].widget_data.is_liveclass_carousel) {
                    freeCarousels.push(carouselData[index]);
                    carouselData.splice(index, 1);
                } else {
                    index++;
                }
            }
        }
    }
    for (const carousel of carouselData) {
        if (carousel.widget_data && carousel.widget_data.carousel_id) {
            carousel.id = carousel.widget_data.carousel_id;
        }
    }
    carouselData = [...categorizedTopIcon, ...carouselData];
    carouselData = carouselData.map((item) => {
        const trackingViewId = _.get(item, 'tracking_view_id', null);
        _.set(item, 'extra_params.tracking_view_id', `${trackingViewId}`);
        item.layout_config = {
            margin_top: 5,
            margin_bottom: 5,
            margin_left: 0,
            margin_right: 0,
        };
        return item;
    });

    return carouselData;
}

async function getEtoosCarousels(db, student_class, version_code) {
    const etoosCarouselsData = [];
    const etoosResult = await db.mongo.read.collection('homepage_feed_test').find({
        'carousel_type': 'etoos_caraousel', 'class': parseInt(student_class), 'min_version_code': { $lte: parseInt(version_code) }, 'max_version_code': { $gte: parseInt(version_code) },
    }).toArray();
    for (const etoos of etoosResult) {
        etoosCarouselsData.push({ widget_data: etoos, widget_type: etoos.data_type, order: etoos.caraousel_order });
    }
    return etoosCarouselsData;
}

async function addPostPurchaseExplainer(db, studentID) {
    try {
        const res = await redisPackage.getBoughtAssortments(db.redis.read, studentID);

        if (!_.isNull(res)) {
            const assortmentArray = JSON.parse(res);
            if (assortmentArray && assortmentArray.length > 0) {
                const userPackages = await CourseContainerv2.getUserActivePackages(db, studentID);
                if (userPackages.some((item) => item.amount >= 0)) {
                    return 1;
                }
                PackageRedis.setBoughtAssortments(db.redis.write, studentID, []);
            }
        }
        return 0;
    } catch (e) {
        return 0;
    }
}

async function getTrendingCoursesForFeed(db, type, studentCcmData, studentLocale, studentClass, studentCourseOrClassSubcriptionDetails, config, studentId, versionCode, xAuthToken) {
    const trendingWidgets = [];
    const trendingCourses = await CourseHelper.getTrendingCourses(db, type, studentCcmData, studentLocale, studentClass);
    const { widgetAttributes } = trendingCourses;
    let arr = trendingCourses.assortmentIds;
    arr = arr.filter((item) => studentCourseOrClassSubcriptionDetails.findIndex((item2) => +item2.assortment_id === +item) === -1);
    if (arr.length) {
        const popularCourses = await CourseHelper.getTrendingCoursesCarousel({
            db, config, studentId, versionCode, xAuthToken, arr, studentLocale,
        });
        const popularCourseWidget = {
            type: 'widget_popular_course',
            widget_data: {
                ...widgetAttributes,
                link_text: '',
                deeplink: '',
                more_text: global.t8[studentLocale].t('See all'),
                more_deeplink: `doubtnutapp://course_category?category_id=${widgetAttributes.see_all_category}`,
                auto_scroll_time_in_sec: Data.popular_courses_carousel.auto_scroll_time_in_sec,
                items: popularCourses || [],
                background_color: '#ffffff',
            },
            extra_params: {
                be_source: 'HOME_TRENDING',
                widget_type: 'widget_popular_course',
            },
        };
        if (popularCourses.length) {
            trendingWidgets.push(popularCourseWidget);
        }
    }
    return trendingWidgets
}

module.exports = {
    getHomeCarousels,
    getEtoosCarousels,
    addPostPurchaseExplainer,
    getTrendingCoursesForFeed,
    getCourses,
    getLibraryVideo,
};
