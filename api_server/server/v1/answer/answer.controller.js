/* eslint-disable no-await-in-loop */
// eslint-disable-next-line import/no-extraneous-dependencies
const _ = require('lodash');

const moment = require('moment');
const bl = require('./answer.bl');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionMySql = require('../../../modules/mysql/question');
const AnswerHelper = require('../../helpers/answer');
const AnswerContainerV11 = require('../../v11/answer/answer.container');
const StudentMongo = require('../../../modules/mongo/student');
const CourseContainer = require('../../../modules/containers/coursev2');
const LibraryRedis = require('../../../modules/redis/library');
const LibTranslation = require('../../../modules/translation/library');
const studentRedis = require('../../../modules/redis/student');
const LibraryMysql = require('../../../modules/mysql/library');
const StaticData = require('../../../data/data');
const AnswerContainerv13 = require('../../v13/answer/answer.container');
const AnswerSQL = require('../../../modules/mysql/answer');
const { getTotalLikesShare } = require('../../v8/library/library.controller');
const { makeData, getBookDeeplink } = require('../../v7/library/library.helper');
const Question = require('../../../modules/question');
const D0UserManager = require('../../helpers/d0User.helper');
const CampaignMysql = require('../../../modules/mysql/campaign');
const StudentHelper = require('../../helpers/student.helper');

let db;
let config;

async function getTopicVideosByQuestionId(req, res) {
    db = req.app.get('db');
    const questionId = req.query.question_id;
    const data = await bl.getTopicVideoByQid(db, questionId);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data,
    };
    res.status(responseData.meta.code).json(responseData);
}

/* function getTeachersWidget() {
    const nkcSirVideoQidsList = [649219688, 649222202, 649221083, 649221669, 649222572, 649220455, 649220355, 649220476, 649220457, 649220475, 649220477];
    const nkcSirrandomQid = _.sample(nkcSirVideoQidsList);
    return {
        resource_type: 'widget',
        widget_data: {
            widget_data: {
                _id: 1,
                image_url: `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${nkcSirrandomQid}.webp`,
                deeplink: `doubtnutapp://video?qid=${nkcSirrandomQid}&page=COURSE_DETAIL&create_new_instance=true`,
                card_ratio: '16:9',
            },
            widget_type: 'banner_image',
            layout_config: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
                bg_color: '#FFFFFF',
            },
        },
    };
} */

async function similarBottomSheet(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
    const responseData = {};
    // req.user.campaign = 'UAC_InApp_D1VV_NEET_Course_Patna'; // testing purpose
    try {
        const { question_id: questionId } = req.params;
        const { student_id: studentId, locale, student_class: studentClass } = req.user;
        const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
        const ncertIds = [1, 77, 69];

        const questionDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, questionId);

        // qid --- 1417622333 not found in questions table, but coming in SRP question list
        if (questionDetails.length > 0 && !questionDetails[0].doubt.includes('VOD') && !questionDetails[0].book.includes('ETOOS')) {
            let similarQuestions = [];
            let ncertFlagr = false;
            const { chapter } = questionDetails[0];

            if (questionDetails && questionDetails.length == 1 && ncertIds.includes(parseInt(questionDetails[0].student_id))) {
                const ncertDetails = await QuestionMySql.getNcertDetails(db.mysql.read, questionId);
                if (ncertDetails.length > 0) {
                    ncertFlagr = true;
                    const rowId = ncertDetails[0].id;
                    const masterPlaylistId = ncertDetails[0].main_playlist_id;
                    similarQuestions = await QuestionMySql.getNcertSimilarQuestions(db.mysql.read, masterPlaylistId, rowId);
                    if (similarQuestions.length < 9) {
                        const dataLength = 9 - similarQuestions.length;
                        const additionalQuestions = await QuestionMySql.getNcertAdditionalQuestions(db.mysql.read, masterPlaylistId, dataLength);
                        similarQuestions = [...similarQuestions, ...additionalQuestions];
                    }
                    similarQuestions = [...ncertDetails, ...similarQuestions];
                }
            }

            if (!ncertFlagr) {
                similarQuestions = await QuestionMySql.getSimilarQuestionsBySid(db.mysql.read, questionDetails[0].question_id, questionDetails[0].student_id, questionDetails[0].class);
                if (similarQuestions.length < 9) {
                    const dataLength = 9 - similarQuestions.length;
                    let additionalQuestions = await QuestionMySql.getAdditionalQuestions(db.mysql.read, questionDetails[0].student_id, questionDetails[0].class, dataLength);
                    similarQuestions = bl.addAdditionalQuestions(similarQuestions, additionalQuestions);
                    if (similarQuestions.length < 5) {
                        similarQuestions = await QuestionMySql.getSimilarQuestionsByChapter(db.mysql.read, questionDetails[0].question_id, questionDetails[0].chapter, questionDetails[0].class, 'upper');
                        if (similarQuestions.length < 9) {
                            additionalQuestions = await QuestionMySql.getSimilarQuestionsByChapter(db.mysql.read, questionDetails[0].question_id, questionDetails[0].chapter, 'lower');
                            similarQuestions = bl.addAdditionalQuestions(similarQuestions, additionalQuestions);
                        }
                    }
                }
                similarQuestions = [...questionDetails, ...similarQuestions];
            }

            if (ncertFlagr) {
                let similarQids = similarQuestions.map((x) => x.question_id);
                similarQids = similarQids.join();
                similarQuestions = await QuestionMySql.getSimilarQuestionsByIds(db.mysql.read, similarQids);

                const sortedList = [];
                similarQids = similarQids.split(',');
                similarQids.forEach((item) => {
                    const qData = similarQuestions.filter((x) => x.question_id == item);
                    sortedList.push(qData[0]);
                });
                similarQuestions = sortedList;
            }

            similarQuestions.forEach((item) => {
                item.thumbnail_img = locale === 'hi' ? `${config.cdn_url}question-thumbnail/hi_${item.question_id}.webp` : `${config.cdn_url}question-thumbnail/en_${item.question_id}.webp`;
                if (!_.isEmpty(item.doubt) && !_.isNull(item.doubt) && ncertFlagr) {
                    item.question_tag = AnswerHelper.labelMaker(item.doubt);
                }
                item.bg_color = '';
                item.font_color = '';
                item.font_size = '';
            });

            const unlockStatus = 1;
            similarQuestions = await AnswerContainerV11.getTotalLikesShare(db, similarQuestions, studentId, unlockStatus, versionCode);

            similarQuestions = await AnswerHelper.getOcr(db, similarQuestions);
            if (locale != 'en') {
                similarQuestions = await AnswerHelper.makeLocalisedQuestion(db, similarQuestions, locale);
            }

            similarQuestions = similarQuestions.filter((x) => x.resource_type === 'video');

            similarQuestions.forEach((item) => {
                let qno = 0;
                const exerciseArr = item.doubt.split('_');
                qno = exerciseArr[exerciseArr.length - 1];
                if (!_.isNull(qno) && !_.isEmpty(qno)) {
                    item.question_number = qno;
                }
            });

            const mainQuestion = similarQuestions[0];
            similarQuestions.shift();
            similarQuestions = _.sortBy(similarQuestions, 'question_number');
            similarQuestions.unshift(mainQuestion);

            similarQuestions.forEach((item) => {
                delete item.question_number;
            });

            const analytics = {
                variant_info: [],
            };
            // * Get the popular course carousel
            let userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
            userActivePackages = userActivePackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.class === +studentClass && item.amount !== -1);
            if (!userActivePackages.length && versionCode >= 927) {
                const popularCourseCarousel = await AnswerHelper.getPopularCoursesCarousel({
                    db,
                    studentId,
                    studentClass,
                    studentLocale: locale,
                    config,
                    versionCode,
                    xAuthToken,
                    page: 'SRP',
                    eventPage: 'SRP',
                    pznElasticSearchInstance,
                });
                const popularCourseItems = _.get(popularCourseCarousel, 'popularCourseWidget.widget_data.data.items', null);
                const widgetPlacement = _.get(popularCourseCarousel, 'widget_placement', null);
                if (popularCourseItems && popularCourseItems.length && widgetPlacement === 'similar_bottom_sheet') {
                    similarQuestions.splice(popularCourseCarousel.widget_position, 0, popularCourseCarousel.popularCourseWidget);
                    analytics.variant_info.push(...popularCourseCarousel.variantInfo);
                }
            }
            // nkc sir and other new teachers widget
            /*    if (studentClass >= 11 && studentClass <= 13 && locale !== 'hi') {
                const teacherWidget = getTeachersWidget();
                if (teacherWidget) {
                    similarQuestions.splice(1, 0, teacherWidget);
                }
            } */

            if (req.user.campaign) {
                const campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Video');
                if (campaignDetails.length > 0) {
                    const page = 'SRP';
                    let campaignWidget = {};
                    const liveclassPages = ['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP', 'PAID_CONTENT_FEED', 'CHAPTER_SERIES_CAROUSAL', 'HOME_PAGE_REVISION_CLASSES', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'QA_WIDGET_LIVE', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP'];
                    const [flgrResp] = await Promise.all([
                        AnswerContainerv13.getAllFlagsNeededForThePage(db, versionCode, page, liveclassPages, studentId),
                    ]);
                    const popularCourseCarousel = await AnswerHelper.getPopularCoursesCarousel({
                        db,
                        studentId,
                        studentClass,
                        versionCode,
                        studentLocale: locale,
                        config,
                        xAuthToken,
                        page,
                        eventPage: page,
                        pznElasticSearchInstance,
                        hitFlagr: false,
                        prevFlagrResponse: flgrResp,
                    });
                    const popularCourseItems = _.get(popularCourseCarousel, 'popularCourseWidget.widget_data.data.items', null);
                    let widgetPlacement = _.get(popularCourseCarousel, 'widget_placement', null);
                    widgetPlacement = 'video_page';
                    if (popularCourseItems && popularCourseItems.length && widgetPlacement === 'video_page') {
                        campaignWidget = {
                            delay_in_sec: StaticData.popular_courses_carousel.delay_in_sec,
                            type: 'widget_popular_course',
                            data: popularCourseCarousel.popularCourseWidget.widget_data.data,
                            extra_params: popularCourseCarousel.popularCourseWidget.widget_data.extra_params,
                        };
                        campaignWidget.extra_params.widget_name = 'mpvp_classes_carousel';
                        campaignWidget.data.call_impression_api = true;
                    }
                    campaignWidget = {
                        resource_type: 'widget',
                        widget_data: campaignWidget,
                    };
                    similarQuestions.splice(1, 0, campaignWidget);
                }
            }

            // referral banner img
            /* if (versionCode >= 1000) {
                const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(studentId);
                if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                    const referralBanner = await ReferAndEarnHelper.getReferralBannerWidget(db, locale, studentId);
                    similarQuestions.splice(1, 0, referralBanner);
                }
            } */
            if (versionCode >= 1010) {
                const d0UserManager = new D0UserManager(req);
                if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkFlagr() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                    similarQuestions.splice(1, 0, d0UserManager.getBottomSheetItemWidget());
                }
            }

            responseData.meta = {
                code: 200,
                success: true,
                message: 'SUCCESS',
                analytics,
            };

            let title = locale === 'hi' ? `सिमिलर प्रश्न ${chapter} से` : `Related Questions from ${chapter}`;
            if (ncertFlagr) {
                title = locale === 'hi' ? `आगे के सवाल ${chapter} अध्याय से` : `Aage k sawal ${chapter} k adhyaye se`;
            }
            responseData.data = {
                bottom_sheet_title: title,
                bottom_sheet_type: ncertFlagr ? 'NCERT' : 'Others',
                similar_questions: similarQuestions,
            };
        } else if (questionDetails[0].doubt.includes('VOD') && questionDetails[0].book.includes('ETOOS')) {
            responseData.meta = {
                code: 200,
                success: true,
                message: 'SUCCESS',
            };
            responseData.data = 'Question from VOD or ETOOS';
        } else {
            responseData.meta = {
                code: 500,
                success: false,
                message: 'Not found',
            };
            responseData.data = 'Question not found';
        }
    } catch (e) {
        responseData.meta = {
            code: 500,
            success: false,
            message: 'Error',
        };
        responseData.data = 'Error from Catch block';
    }
    res.status(responseData.meta.code).json(responseData);
}

async function ncertVideosScreenResponse(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { spclBooksWithExtraStep } = StaticData;

    try {
        const { playlist_id: playlistId, type, supported_media_type: supportedMediaList } = req.body;
        const { locale } = req.user;
        let { student_class: studentClass } = req.user;
        const { student_id: studentId } = req.user;
        const { version_code: versionCode } = req.headers;
        const country = 'IN';
        let questionId = 0;
        if (req.body.question_id != undefined && req.body.question_id !== '') {
            questionId = req.body.question_id;
        }
        if (studentClass == undefined || studentClass == null) {
            studentClass = 12;
        }
        const responseData = {};
        const data = {
            divisionTypeEx: false,
            partTypeEx: false,
        };

        if (playlistId.includes('__BOOK')) {
            const playlistIdArr = playlistId.split('__BOOK');
            let actualPlaylistId = 0;
            if (type === 'exercise') {
                if (playlistIdArr[0].includes('_part_')) {
                    data.partTypeEx = true;
                    const partPlaylistArr = playlistIdArr[0].split('_part_');
                    actualPlaylistId = partPlaylistArr[0];
                    data.division_no = partPlaylistArr[1];
                } else if (playlistIdArr[0].includes('_division_')) {
                    data.divisionTypeEx = true;
                    const partPlaylistArr = playlistIdArr[0].split('_division_');
                    actualPlaylistId = partPlaylistArr[0];
                    data.division_no = partPlaylistArr[1];
                }
            } else {
                actualPlaylistId = playlistIdArr[0];
            }

            let activeBook = 0;
            let activeChapter = 0;
            let activeExercise = 0;

            let activeBookName = '';
            let activeChapterName = '';
            let activeExerciseName = '';

            if (questionId === 0) {
                questionId = await LibraryRedis.libraryBookLastView(db.redis.read, `library_book_lv_${actualPlaylistId}`, studentId);
            }
            data.question_id = questionId;

            const [playlistDetails, googleAdsData] = await Promise.all([
                QuestionMySql.getActiveBookLibraryDetails(db.mysql.read, actualPlaylistId, questionId, type),
                StudentHelper.getGoogleAdsInfo({
                    db, studentId, page: 'VIDEO', stClass: studentClass, ccmData: req.user.ccm_data,
                }),
            ]);

            if (playlistDetails.length > 0) {
                activeBook = playlistDetails[0].book_playlist_id;
                activeChapter = playlistDetails[0].chapter_playlist_id;
                activeExercise = playlistDetails[0].exercise_playlist_id;

                let playlistDetailsByIds = [];
                const idArr = [activeBook, activeChapter];
                if (activeExercise != 0) {
                    idArr.push(activeExercise);
                }
                if (locale == 'hi') {
                    playlistDetailsByIds = await LibraryMysql.getPlaylistTranslationDetailsByids(db.mysql.read, idArr);
                } else {
                    playlistDetailsByIds = await LibraryMysql.getPlaylistDetailsByids(db.mysql.read, idArr);
                }

                if (playlistDetailsByIds.length > 0) {
                    const bookNameDetails = playlistDetailsByIds.filter((x) => x.id == activeBook);
                    const chapterNameDetails = playlistDetailsByIds.filter((x) => x.id == activeChapter);
                    const exerciseNameDetails = playlistDetailsByIds.filter((x) => x.id == activeExercise);

                    if (bookNameDetails.length > 0) {
                        activeBookName = bookNameDetails[0].name;
                    }
                    if (chapterNameDetails.length > 0) {
                        activeChapterName = chapterNameDetails[0].name;
                    }
                    if (exerciseNameDetails.length > 0) {
                        activeExerciseName = exerciseNameDetails[0].name;
                    }
                }
            }

            if (type === 'main') {
                if (spclBooksWithExtraStep.includes(parseInt(activeBook))) {
                    const properParentid = await LibraryMysql.getProperBookId(db.mysql.read, activeBook, studentClass);
                    if (properParentid.length > 0) {
                        const bookId = properParentid[0].id;
                        data.chapter_list = await bl.makeChapterForlibraryBook(db, locale, bookId, activeChapter);
                    }
                } else {
                    data.chapter_list = await bl.makeChapterForlibraryBook(db, locale, activeBook, activeChapter);
                }
            }

            if (type === 'main' || type === 'chapter') {
                if (type === 'chapter') {
                    activeChapter = playlistIdArr[0];
                } else if (type === 'main' && activeChapter === 0) {
                    activeChapter = data.chapter_list[0].id;
                }
                if (activeExercise === 0) {
                    data.questions_list = await bl.makeQuestionListForLibraryBook(db, config, locale, supportedMediaList, versionCode, questionId, activeChapter, activeBookName, activeChapterName, activeExerciseName, 'chapter', 'suffle');
                } else {
                    data.exercise_list = await bl.makeExerciseForlibraryBook(db, locale, activeChapter, activeExercise, 'all');
                }
            }

            if (type === 'main' || type === 'chapter' || type === 'exercise') {
                if (type === 'exercise') {
                    if (playlistId.includes('_part_')) {
                        const partPlaylistArr = playlistIdArr[0].split('_part_');
                        activeChapter = partPlaylistArr[0];
                    } else if (playlistId.includes('_division_')) {
                        const partPlaylistArr = playlistIdArr[0].split('_division_');
                        activeExercise = partPlaylistArr[0];
                    } else {
                        activeExercise = playlistIdArr[0];
                    }
                } else if ((type === 'main' || type === 'chapter') && activeExercise === 0 && data.exercise_list != undefined) {
                    activeExercise = data.exercise_list[0].id;
                }
                if (activeExercise != 0) {
                    data.questions_list = await bl.makeQuestionListForLibraryBook(db, config, locale, supportedMediaList, versionCode, questionId, activeExercise, activeBookName, activeChapterName, activeExerciseName, 'exercise', 'suffle');
                } else if (type === 'exercise' && playlistId.includes('_part_')) {
                    data.questions_list = await bl.makeQuestionListForLibraryBook(db, config, locale, supportedMediaList, versionCode, questionId, activeChapter, activeBookName, activeChapterName, activeExerciseName, 'chapter', 'no-suffle');
                }
            }

            if ((type === 'main' || type === 'chapter') && data.exercise_list == undefined) {
                const { exList, quesList } = bl.makeExerciseList(data, activeChapter);
                data.exercise_list = exList;
                data.questions_list = quesList;
            }

            if (data.questions_list.length > 20) {
                if (type === 'exercise') {
                    data.exercise_list = await bl.makeExerciseForlibraryBook(db, locale, activeChapter, activeExercise, 'exercise');
                }
                if (!data.partTypeEx) {
                    data.questions_list = await bl.makeQuestionListForLibraryBook(db, config, locale, supportedMediaList, versionCode, questionId, activeExercise, activeBookName, activeChapterName, activeExerciseName, 'exercise', 'no-suffle');
                }
                if (!data.divisionTypeEx && !data.partTypeEx) {
                    const { exList, quesList } = bl.makeExerciseAndQuestion(data);
                    data.sub_exercise_list = exList;
                    data.questions_list = quesList;
                } else {
                    const quesList = bl.trimQuestionsList(data.questions_list, [{ title: `${activeExerciseName} Part ${data.division_no}`, is_selected: true }], data.question_id);
                    data.questions_list = quesList;
                }
            }

            const questionResponse = bl.makeQuestionResponse(data.questions_list, locale);
            await bl.addGoogleAds(questionResponse, googleAdsData);
            responseData.ncert_similar = bl.makeSimilarDataResponse(questionResponse, data, activeChapter, type);

            if (type === 'main') {
                const tabPlaylistId = playlistDetails[0].tab_playlist_id;
                const libraryBooks = await bl.makeBookList(db, tabPlaylistId, activeBook, locale, 'library');
                if (libraryBooks.length > 0) {
                    responseData.ncert_books = libraryBooks;
                }
            }
        } else if (playlistId.includes('_')) {
            const playlistIdArr = playlistId.split('_');

            const bookSid = playlistIdArr.length === 7 ? playlistIdArr[playlistIdArr.length - 4] : playlistIdArr[playlistIdArr.length - 5];
            let activeExerciseId = '';
            let activeChapterId = '';
            let activeBookName = '';
            let activeChapName = '';
            let activeExName = '';
            if (type === 'main' || type === 'exercise') {
                activeExerciseId = playlistId;
            } else if (type === 'chapter') {
                activeChapterId = playlistId;
            }
            const packageId = playlistIdArr.length === 7 ? playlistIdArr.slice(0, -1).join('_') : playlistIdArr.slice(0, -2).join('_');

            let chapterexerciseDetails = await LibraryRedis.getNcertBooksLibraryDataNew(db.redis.read, packageId);
            if (!_.isNull(chapterexerciseDetails)) {
                chapterexerciseDetails = JSON.parse(chapterexerciseDetails);

                const chapterList = chapterexerciseDetails.map((x, i) => ({
                    id: `${packageId}_${x.id}`, title: x.name, chapter_number: i, type: 'chapter', key: x.name, is_selected: false,
                }));

                if (type === 'main' || type === 'exercise') {
                    chapterexerciseDetails.forEach((x) => {
                        x.flex_list.forEach((y) => {
                            const packageDetailsArr = y.package_details_id.split('_');
                            if (packageDetailsArr.length === 7 && y.package_details_id === activeExerciseId) {
                                activeChapterId = `${packageId}_${x.id}`;
                            } else if (packageDetailsArr.length === 8) {
                                if (type === 'exercise' && y.package_details_id === activeExerciseId) {
                                    activeChapterId = `${packageId}_${x.id}`;
                                } else {
                                    const packageDetailsId = packageDetailsArr.slice(0, -1).join('_');
                                    if (packageDetailsId === activeExerciseId) {
                                        activeExerciseId = y.package_details_id;
                                        activeChapterId = `${packageId}_${x.id}`;
                                    }
                                }
                            }
                        });
                    });
                }

                chapterList.forEach((x) => {
                    if (x.id === activeChapterId) {
                        x.is_selected = true;
                        activeChapName = x.title;
                    }
                });
                data.chapter_list = chapterList;

                let exerciseList = chapterexerciseDetails.filter((x) => `${packageId}_${x.id}` === activeChapterId)[0].flex_list;

                exerciseList = exerciseList.map((x) => ({
                    id: x.package_details_id, title: x.name, type: 'exercise', key: x.name, is_selected: false,
                }));

                if (type === 'chapter') {
                    exerciseList[0].is_selected = true;
                    activeExerciseId = exerciseList[0].id;
                    activeExName = exerciseList[0].title;
                } else {
                    exerciseList.forEach((x) => {
                        if (x.id === activeExerciseId) {
                            x.is_selected = true;
                            activeExName = x.title;
                        }
                    });
                }
                data.exercise_list = exerciseList;

                const [questionCache, googleAdsData] = await Promise.all([
                    LibraryRedis.getNcertBooksLibraryDataNew(db.redis.read, activeExerciseId),
                    StudentHelper.getGoogleAdsInfo({
                        db, studentId, page: 'VIDEO', stClass: studentClass, ccmData: req.user.ccm_data,
                    }),
                ]);

                if (!_.isNull(questionCache)) {
                    const redisData = await studentRedis.getBookFlowData(db.redis.read, `lv_${packageId}`, studentId);
                    let bookData = [];
                    if (!_.isNull(redisData)) {
                        const redisDataDetails = redisData.split('_');
                        const bookListMainId = redisDataDetails[2];

                        bookData = await makeData(db, versionCode, studentClass, studentId, bookListMainId, '', locale, 'SEARCH_SRP');
                        if (config.service_switch.library_translation && versionCode >= 628) {
                            await LibTranslation.translatePlaylist(db, bookData, locale);
                        }
                        bookData = await getBookDeeplink(db, studentId, bookListMainId, bookData.list);
                        const activeBookData = bookData.filter((x) => x.package_details_id === packageId);
                        if (activeBookData.length > 0) {
                            activeBookName = activeBookData[0].name;
                        }
                        bookData = bookData.filter((x) => x.package_details_id !== packageId);
                    }

                    const questionData = JSON.parse(questionCache);
                    const mappedQids = [];
                    questionData.forEach((x) => {
                        mappedQids.push({ question_id: x });
                    });
                    const dataAfterFormatting = await getTotalLikesShare(db, mappedQids, studentId, country, true);
                    data.questions_list = await bl.bookQuestionListResponse(db, config, versionCode, questionId, supportedMediaList, locale, dataAfterFormatting, bookSid, activeBookName, activeChapName, activeExName, activeExerciseId);

                    const questionResponse = bl.makeQuestionResponse(data.questions_list, locale);
                    await bl.addGoogleAds(questionResponse, googleAdsData);
                    responseData.ncert_similar = bl.makeSimilarDataResponse(questionResponse, data, activeChapterId, type);

                    // Book List
                    if (type === 'main' && bookData.length > 0) {
                        const bookListResponse = [];
                        bookData.forEach((item) => {
                            const obj = {
                                type: 'widget_ncert_book',
                                data: {
                                    id: item.id,
                                    type: '',
                                    book_thumbnail: item.image_url,
                                    card_width: '2.2',
                                    card_ratio: '1:1',
                                    deeplink: item.deeplink,
                                },
                            };
                            bookListResponse.push(obj);
                        });
                        responseData.ncert_books = [{
                            widget_data: {
                                items: {
                                    ncert: bookListResponse,
                                },
                                scroll_direction: 'horizontal',
                                tabs: [
                                    {
                                        id: 1,
                                        type: 'book',
                                        key: 'ncert',
                                        title: locale === 'hi' ? 'अन्य पुस्तकें' : 'Other Books',
                                        is_selected: true,
                                    },
                                ],
                            },
                            widget_type: 'widget_parent_tab',
                            layout_config: {
                                margin_top: 16,
                                bg_color: '#ffffff',
                            },
                            order: -955,
                        }];
                    }
                }
            }
        } else {
            let activeBook = 0;
            let activeChapter = 0;
            let activeExercise = 0;

            let activeBookName = '';
            let activeChapterName = '';
            let activeExerciseName = '';
            const [questionDetailsData, googleAdsData] = await Promise.all([
                QuestionMySql.getNcertNewFlowActiveDetails(db.mysql.read, playlistId, questionId, studentClass, type),
                StudentHelper.getGoogleAdsInfo({
                    db, studentId, page: 'VIDEO', stClass: studentClass, ccmData: req.user.ccm_data,
                }),
            ]);
            let questionDetails = questionDetailsData;
            if (_.isEmpty(questionDetails)) {
                questionDetails = await QuestionMySql.getActiveDetails(db.mysql.read, playlistId, questionId, studentClass, type);
            }
            if (questionDetails.length > 0) {
                activeBook = questionDetails[0].book_playlist_id;
                activeChapter = questionDetails[0].chapter_playlist_id;
                activeExercise = questionDetails[0].exercise_playlist_id;

                activeBookName = questionDetails[0].book_name;
                activeChapterName = questionDetails[0].chapter_name;
                activeExerciseName = questionDetails[0].exercise_name;
            }
            if (type === 'main') {
                let chapterList = await QuestionMySql.getAllNcertDataByPlaylist(db.mysql.read, activeBook, 'chapter');
                if (_.isEmpty(chapterList)) {
                    chapterList = await QuestionMySql.getAllDataByPlaylist(db.mysql.read, activeBook, 'chapter');
                }
                chapterList.forEach((item) => {
                    item.type = 'chapter';
                    item.key = item.title;
                    // item.title = locale === 'hi' ? `अध्याय ${item.chapter_number}` : `Chapter ${item.chapter_number}`;
                    if (activeChapter != 0 && item.id == activeChapter) {
                        item.is_selected = true;
                    } else {
                        item.is_selected = false;
                    }
                });
                data.chapter_list = chapterList;
            }
            if (type === 'main' || type === 'chapter') {
                if (type === 'chapter') {
                    activeChapter = playlistId;
                } else if (type === 'main' && activeChapter === 0) {
                    activeChapter = data.chapter_list[0].id;
                }
                data.exercise_list = await bl.getExerciseList(db, activeChapter, activeExercise, 'new');
                if (_.isEmpty(data.exercise_list)) {
                    data.exercise_list = await bl.getExerciseList(db, activeChapter, activeExercise);
                }
            }
            if (type === 'main' || type === 'chapter' || type === 'exercise') {
                if (type === 'exercise') {
                    activeExercise = playlistId;
                } else if ((type === 'main' || type === 'chapter') && activeExercise === 0) {
                    activeExercise = data.exercise_list[0].id;
                }
                data.questions_list = await bl.getNcertNewFlowQuestionList(db, config, versionCode, questionId, activeExercise, supportedMediaList, activeBookName, activeChapterName, activeExerciseName, locale);
            }

            const questionResponse = bl.makeQuestionResponse(data.questions_list, locale);
            await bl.addGoogleAds(questionResponse, googleAdsData);
            responseData.ncert_similar = bl.makeSimilarDataResponse(questionResponse, data, activeChapter, type);

            // Book List
            if (type === 'main') {
                const ncertBooks = await bl.makeBookList(db, playlistId, activeBook, locale, 'ncert', studentId, studentClass);
                if (ncertBooks.length > 0) {
                    responseData.ncert_books = ncertBooks;
                }
            }
        }

        let returnResponse = {};
        if (_.isEmpty(responseData)) {
            returnResponse = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Not matched any of the playlist types',
                },
                data: {
                    message: 'no data found',
                },
            };
        } else {
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: responseData,
            };
        }
        res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        console.log(e);
    }
}

async function storeFeedback(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');

    let returnResponse = {};

    try {
        const { question_id: questiontId } = req.body;
        const { student_id: studentId } = req.user;

        StudentMongo.storeTextSolutionFeedback(studentId, questiontId, db.mongo.write);

        returnResponse = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: 'Data inserted',
        };
    } catch (err) {
        returnResponse = {
            meta: {
                code: 403,
                success: false,
                message: 'FAILED',
            },
            data: 'Unexpected Error',
        };
    }
    res.status(returnResponse.meta.code).json(returnResponse);
}

async function getVideoTopWidget(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const returnResponse = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {},
    };
    res.status(returnResponse.meta.code).json(returnResponse);
}

async function setPopularWidgetClick(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    let returnResponse = {};
    try {
        // initializing variables
        const { student_id: studentId } = req.user;

        studentRedis.updateMpvpKeyCount(db.redis.read, 'popular_course_banner_click', studentId, 1);
        returnResponse = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: 'Data inserted',
        };
    } catch (err) {
        returnResponse = {
            meta: {
                code: 403,
                success: false,
                message: 'FAILED',
            },
            data: 'Unexpected Error',
        };
    }
    res.status(returnResponse.meta.code).json(returnResponse);
}

async function getLastWhatsappVideoView(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    let returnResponse = {};
    try {
        const { student_id: studentId } = req.user;

        let data = {};
        const whatsappDNRData = await studentRedis.getWhatsAppLastDNRData(db.redis.read, studentId);
        if (!_.isNull(whatsappDNRData)) {
            data = JSON.parse(whatsappDNRData);
        } else {
            const questionData = await Question.getLastViewedWAQuestionId(studentId, db.mysql.read);
            if (questionData.length) {
                data = {
                    last_video_view_timestamp: questionData[0].created_at,
                    reward_count: 0,
                };
            } else {
                data = {
                    last_video_view_timestamp: moment().add(5, 'hours').add(30, 'minutes').toDate(),
                    reward_count: 0,
                };
            }
        }
        console.log('data ', data);

        returnResponse = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
    } catch (err) {
        returnResponse = {
            meta: {
                code: 500,
                success: false,
                message: 'FAILED',
            },
            data: {},
        };
    }
    res.status(returnResponse.meta.code).json(returnResponse);
}

async function addTextSolution(req, res, next) {
    try {
        db = req.app.get('db');
        const {
            questionId,
            type,
            pageNo,
            solutionType,
            option1,
            option2,
            option3,
            option4,
            textAnswer,
            solution,
        } = req.body;
        const solutionObj = {
            question_id: questionId,
            type,
            page_no: pageNo,
            sub_obj: solutionType,
            opt_1: option1,
            opt_2: option2,
            opt_3: option3,
            opt_4: option4,
            answer: textAnswer,
            solutions: solution,
        };

        const isSolution = await AnswerSQL.getSolutionByQuestionId(
            db.mysql.read,
            solutionObj.question_id,
        );

        let returnResponse = {};
        const promise = [];

        if (!_.isEmpty(isSolution)) {
            await AnswerSQL.updateTextSolution(
                db.mysql.write,
                solutionObj,
                questionId,
            );

            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    message: `Question id: ${questionId} updated successfully`,
                },
            };
        } else {
            promise.push(AnswerSQL.insertTextSolution(
                db.mysql.write,
                solutionObj,
            ));

            promise.push(AnswerSQL.updateQuestionStatusIsAnswered(
                db.mysql.write,
                questionId,
            ));

            const [results] = await Promise.all(promise);

            if (results.insertId) {
                returnResponse = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: {
                        message: `${results.insertId} inserted successfully`,
                    },
                };
            }
        }
        return res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function addSolutionFromMatchedQuestion(req, res, next) {
    try {
        db = req.app.get('db');
        const { questionId, matchedQuestionId } = req.body;
        const [solution, isSolution] = await Promise.all([AnswerSQL.getSolutionByQuestionId(
            db.mysql.read,
            matchedQuestionId,
        ), AnswerSQL.getSolutionByQuestionId(
            db.mysql.read,
            questionId,
        )]);
        const solutionObj = {
            question_id: questionId,
            solutions: solution[0].solutions,
        };

        let returnResponse = {};
        if (!_.isEmpty(isSolution)) {
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'FAILED',
                },
                data: {
                    message: `Question id ${questionId} have already solution`,
                },
            };
        } else {
            const promise = [];
            promise.push(AnswerSQL.insertTextSolution(
                db.mysql.write,
                solutionObj,
            ));
            promise.push(
                AnswerSQL.updateQuestionStatusIsAnswered(
                    db.mysql.write,
                    questionId,
                    matchedQuestionId,
                ),
            );
            const [results] = await Promise.all(promise);

            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    message: `${results.insertId} solution inserted successfully`,
                },
            };
        }
        return res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    getTopicVideosByQuestionId,
    similarBottomSheet,
    ncertVideosScreenResponse,
    storeFeedback,
    getVideoTopWidget,
    setPopularWidgetClick,
    getLastWhatsappVideoView,
    addTextSolution,
    addSolutionFromMatchedQuestion,
};
