const _ = require('lodash');
const AnswerContainer = require('../../../modules/containers/answer');
const Feed = require('../../../modules/feed');
const LiveClassData = require('../../../data/liveclass.data');
const AnswerControllerContainer = require('../../v13/answer/answer.container');
const Utility = require('../../../modules/utility');
const StaticData = require('../../../data/data');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const VideoViewMysql = require('../../../modules/mysql/videoView');
const QuestionMysql = require('../../../modules/mysql/question');
const redisQuestionContainer = require('../../../modules/redis/question');
const studentMysql = require('../../../modules/mysql/student');
const studentRedis = require('../../../modules/redis/student');
const homepageMysql = require('../../../modules/mysql/homepage');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const CourseHelper = require('../../helpers/course');
const CourseContainer = require('../../../modules/containers/coursev2');
const AnswerMysql = require('../../../modules/mysql/answer');
// const UtilityFlagr = require('../../../modules/Utility.flagr');
const LibraryHelperV7 = require('../../v7/library/library.helper');
// const UtilityVDO = require('../../../modules/utility.vdocipher');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const scholarshipHelper = require('../../v1/scholarship/scholarship.helper');
const { getClassesOfChapterByQuestionID } = require('../../v1/course/course.controller');
const logger = require('../../../config/winston').winstonLogger;
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const StudentHelper = require('../../helpers/student.helper');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');

/**
 * Will return true if page is zero and source is not home
 * @param {Will provide the page type} source
 * @param {Will provide the page Number} page_number
 */
function isFeedForPagesOtherThanHomeRequired(source, page_number) {
    return source !== 'home' && page_number === 0;
}

async function recommended_sqlpost_formatter(db, widget, supportedMediaList, version_code = 602, config) {
    let video_url = config.cdn_video_url;
    const question_id = widget.id;
    widget._id = `${widget.id}_recommended`;
    widget.attachment = [];
    widget.student_id = '98';
    widget.is_deleted = false;
    widget.is_profane = false;
    widget.is_active = false;

    widget.show_comments = false;
    widget.disable_lcsf_bar = true;

    const answer = await AnswerContainer.getByQuestionId(question_id, db);
    video_url += answer[0].answer_video;
    if (answer[0].is_vdo_ready == '3') {
        video_url = answer[0].answer_video;
    }
    widget.video_obj = {
        question_id,
        video_url,
        thumbnail_image: `${config.staticCDN}q-thumbnail/${widget.id}.png`,
        show_full_screen: true,

        autoplay: false,
        mute: true,
    };

    if (version_code >= LiveClassData.videoAlltypeHandlingVersionCode && supportedMediaList.length) {
        widget.video_obj.video_resources = await AnswerControllerContainer.getAnswerVideoResource(db, config, answer[0].answer_id, answer[0].question_id, supportedMediaList, version_code);
    }

    widget.type = 'dn_paid_video';
    widget.premium_video_offset = 300;
    return widget;
}

async function sqlpost_formatter(db, pinned, type, student_id, supportedMediaList, version_code = 602, config) {
    let video_url = config.cdn_video_url;
    if (type == 'engagement') {
        pinned.post_type = pinned.type;
    }
    const pinned_object = {
        _id: `${pinned.id}_${type}`,
        attachment: [],
        msg: pinned.title,
        student_id: (type === 'pinned' || type === 'pinned_experiment') ? pinned.student_id : 98,
        old_entity_id: (type === 'pinned' || type === 'pinned_experiment') ? `${pinned.id}_${type}` : `${pinned.id}`,
        old_entity_type: pinned.post_type,
        is_deleted: false,
        is_profane: false,
        is_active: false,
        created_at: pinned.created_at,
        disable_lcsf_bar: true,
    };
    if (pinned.post_type == 'viral_videos') {
        const answer = await AnswerContainer.getByQuestionId(pinned.question_id, db);
        video_url += answer[0].answer_video;
        if (answer[0].is_vdo_ready == '3') {
            video_url = answer[0].answer_video;
        }
        pinned_object.video_obj = {
            question_id: pinned.question_id ? pinned.question_id : '123',
            autoplay: false, // Set Default false for all
            auto_play_duration: 15000,
            video_url,
            thumbnail_image: pinned.image_url,
            show_full_screen: true,
            mute: (type === 'pinned'),
        };
        if (version_code >= LiveClassData.videoAlltypeHandlingVersionCode && supportedMediaList.length) {
            pinned_object.video_obj.video_resources = await AnswerControllerContainer.getAnswerVideoResource(db, config, answer[0].answer_id, answer[0].question_id, supportedMediaList);
        }
        pinned_object.type = 'dn_video';
    } else if (pinned.post_type == 'youtube') {
        pinned_object.video_obj = {
            question_id: pinned.question_id ? pinned.question_id : '123',
            autoplay: false,
            video_url,
            thumbnail_image: pinned.image_url,
            mute: (type === 'pinned'),
        };
        pinned_object.type = 'dn_video';
        pinned_object.video_obj.youtube_id = pinned.youtube_id;
        if (type == 'engagement') {
            pinned_object.video_obj.youtube_id = pinned.action_data;
        }
    } else if (pinned.post_type == 'news') {
        const image_url = _.split(pinned.image_url, '/');
        pinned_object.attachment = [image_url[image_url.length - 1]];
        image_url.pop();
        pinned_object.cdn_url = `${_.join(image_url, '/')}/`;
        pinned_object.type = 'image';
    } else if (pinned.post_type == 'polling') {
        pinned_object.poll_data = {};
        pinned_object.poll_data.options = _.split(pinned.options, ':');
        pinned_object.poll_data.poll_id = pinned.id;
        let isPolled = 0;
        const pollResults = await Feed.getPollResults(pinned_object.poll_data.poll_id, db.mysql.read);
        console.log(pollResults);
        const index = pollResults.filter((obj) => {
            if (obj.student_id === student_id) {
                return obj;
            }
            return false;
        });
        console.log(index);
        pinned_object.poll_data.user_response = null;
        if (index.length > 0) {
            isPolled = 1;
            pinned_object.poll_data.user_response = index[0].option_id;
        }
        pinned_object.poll_data.is_polled = isPolled;
        pinned_object.poll_data.total_polled_count = pollResults.length;
        const result = Utility.calculatePollResults(pollResults, pinned_object.poll_data.options);
        pinned_object.poll_data.result = result;
        pinned_object.type = 'poll';
    }
    if (type === 'pinned' && pinned_object.type === 'dn_video' && version_code >= 932) {
        pinned_object.default_mute = false;
        pinned_object.video_obj.auto_play_duration = 15000;
        pinned_object.video_resources = pinned_object.video_obj.video_resources;
        pinned_object.id = pinned_object._id;
        const pin = {};
        pin.data = pinned_object;
        pin.type = 'feed_pinned_autoplay_child';
        return pin;
    }
    return pinned_object;
}

async function getNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, student_id) {
    let lastId = lastVideoAccessId[0].id;
    const lastQid = lastVideoAccessId[0].question_id;
    const lastVideoDetails = await QuestionMysql.getLastWatchedVideoDetails(db.mysql.read, lastQid, student_id);
    if (lastVideoDetails[0] && lastVideoDetails[0].duration != null && lastVideoDetails[0].duration != '' && lastVideoDetails[0].duration == lastVideoDetails[0].video_time) {
        lastId++;
        const nextVideoDetails = await QuestionMysql.getNextVideoDetails(db.mysql.read, lastId);
        if (nextVideoDetails.length > 0 && nextVideoDetails[0].main_playlist_id == ncertIdDetails[0]) {
            nextQid = nextVideoDetails[0].question_id;
        }
    } else {
        nextQid = ncertIdDetails[1];
    }
    return nextQid;
}

async function getNcertNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, student_id) {
    let lastId = lastVideoAccessId[0].id;
    const lastQid = lastVideoAccessId[0].question_id;
    const lastVideoDetails = await QuestionMysql.getLastWatchedVideoDetails(db.mysql.read, lastQid, student_id);
    if (lastVideoDetails[0] && lastVideoDetails[0].duration != null && lastVideoDetails[0].duration != '' && lastVideoDetails[0].duration == lastVideoDetails[0].video_time) {
        lastId++;
        const nextVideoDetails = await QuestionMysql.getNcertNextVideoDetails(db.mysql.read, lastId);
        if (nextVideoDetails.length > 0 && nextVideoDetails[0].book_playlist_id == ncertIdDetails[0]) {
            nextQid = nextVideoDetails[0].question_id;
        }
    } else {
        nextQid = ncertIdDetails[1];
    }
    return nextQid;
}

async function getIconsDetails(iconsResult, carouselsData = {}, student_id = 0, student_class = 0, versionCode = 0, db = {}) {
    const iconsArr = [];
    let ncertFlag = 0;
    iconsResult.forEach((item) => {
        if (StaticData.ncertIconsTitles.includes(item.title)) {
            ncertFlag = 1;
        }
    });
    if (ncertFlag && versionCode > 870) {
        const ncertTitles = StaticData.ncertTitleArr;
        const ncertData = carouselsData.filter((x) => x.widget_data && ncertTitles.includes(x.widget_data.title));
        let ncertNewFlow = false;
        if (ncertData.length == 1 && ncertData[0].widget_data.show_view_all == 0) {
            ncertNewFlow = true;
        } else {
            ncertNewFlow = true;
        }
        if (ncertNewFlow) {
            const noBookListClassList = [6, 7, 8];
            const ncertWatchDetails = await redisQuestionContainer.getNcertLastWatchedDetails(db.redis.read, `ncert_new_flow_lv_${student_class}`, student_id);
            if (!_.isNull(ncertWatchDetails)) {
                let nextQid = 0;
                const ncertIdDetails = ncertWatchDetails.split('_');
                const lastVideoAccessId = await QuestionMysql.getNcertLastVideoAccessId(db.mysql.read, ncertIdDetails[0], ncertIdDetails[1]);
                nextQid = await getNcertNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, student_id);
                if (nextQid != 0) {
                    iconsResult.forEach((item) => {
                        if (StaticData.ncertIconsTitles.includes(item.title)) {
                            item.deeplink = `doubtnutapp://video?qid=${nextQid}&page=NCERT_NEW_FLOW&playlist_id=${ncertIdDetails[0]}`;
                        }
                    });
                }
            } else if (noBookListClassList.includes(parseInt(student_class))) {
                const ncertIconData = iconsResult.filter((item) => StaticData.ncertIconsTitles.includes(item.title));
                const ncertIconDeeplink = ncertIconData[0].deeplink;
                let deeplinkArr = ncertIconDeeplink.split('ncert?');
                deeplinkArr = deeplinkArr[1].split('&');
                deeplinkArr = deeplinkArr[0].split('=');
                const ncertPlaylistId = deeplinkArr[1];
                const parentOfPlaylist = await QuestionMysql.getPlaylistDetailsForParent(db.mysql.read, ncertPlaylistId);
                if (parentOfPlaylist.length == 1 && parentOfPlaylist[0].master_parent != null) {
                    iconsResult.forEach((item) => {
                        if (StaticData.ncertIconsTitles.includes(item.title)) {
                            item.deeplink = `doubtnutapp://ncert?playlist_id=${parentOfPlaylist[0].master_parent}&playlist_title=NCERT%20Books%20Solutions&is_last=0&page=NCERT_NEW_FLOW`;
                        }
                    });
                } else {
                    iconsResult.forEach((item) => {
                        if (StaticData.ncertIconsTitles.includes(item.title)) {
                            item.deeplink = `${item.deeplink}&page=NCERT_NEW_FLOW`;
                        }
                    });
                }
            } else if (student_class != 14) {
                iconsResult.forEach((item) => {
                    if (StaticData.ncertIconsTitles.includes(item.title)) {
                        item.deeplink = `${item.deeplink}&page=NCERT_NEW_FLOW`;
                    }
                });
            }
        }
    }
    for (let i = 0; i < iconsResult.length; i++) {
        const item = iconsResult[i];
        const obj = {
            id: item.id,
            title: item.title,
            icon: item.new_link ? item.new_link : item.link,
            deepLink: item.deeplink ? item.deeplink : '',
        };
        iconsArr.push(obj);
    }
    return iconsArr;
}

async function getPlaylistDeeplink(db, lastIdData, studentId, locale, page) {
    let returnData = {};
    const questionDetails = await QuestionMysql.getByQuestionId(lastIdData, db.mysql.read);
    let questionList = await redisQuestionContainer.getSimilarQuestionsList(db.redis.read, lastIdData, page);
    if (!_.isNull(questionList)) {
        questionList = JSON.parse(questionList);
        if (questionList.length != 0) {
            let showQid = 0;
            let progressCount = 0;
            let flag = 0;
            let dataExist = false;

            let playlistViewdIds = await redisQuestionContainer.getStudentLastViewedQuestion(db.redis.read, studentId, `${page}_last_viewed`);
            if (!_.isNull(playlistViewdIds)) {
                playlistViewdIds = JSON.parse(playlistViewdIds);
                if (playlistViewdIds.length > 0) {
                    dataExist = true;
                }
            }

            if (dataExist) {
                questionList.forEach((item) => {
                    if (flag === 0 && playlistViewdIds.includes(item)) {
                        progressCount++;
                    } else if (flag === 0) {
                        flag = 1;
                        showQid = item;
                    }
                });
            } else {
                showQid = questionList[0];
            }

            if (showQid != 0 && questionDetails.length == 1) {
                const { chapter, student_id: bookStudentId } = questionDetails[0];

                let description = global.t8[locale].t('Based on your last asked question of {{chapter}}', { chapter });
                if (page === 'NON_SRP_PLAYLIST') {
                    const bookName = await VideoViewMysql.getBookNameBySid(db.mysql.read, bookStudentId);
                    if (bookName.length != 0 && !_.isEmpty(bookName[0]) && !_.isEmpty(bookName[0].package)) {
                        description = global.t8[locale].t('Based on your last watched video of {{chapter}} from {{bookNamePackage}}', { chapter, bookNamePackage: bookName[0].package });
                    }
                }

                returnData = {
                    type: 'widget_playlist',
                    data: {
                        id: lastIdData,
                        title: chapter,
                        description,
                        completed_playlist: progressCount,
                        total_playlist: questionList.length,
                        sideBarColor: '#541388',
                        // deeplink: `doubtnutapp://playlist?playlist_id=449484&playlist_title=${playListTitle}&page=SRP_PLAYLIST&is_last=1`,
                        deeplink: `doubtnutapp://video?qid=${showQid}&page=${page}&playlist_id=NCERT`,
                        button_text: StaticData.playListPlayText(locale),
                    },
                };
            }
        }
    }

    return returnData;
}

async function srpNonSrpDetails(db, studentId, locale) {
    const returnData = [];

    const videoLastIdPromise = [
        redisQuestionContainer.getStudentLastQuestion(db.redis.read, studentId, 'SRP'),
        redisQuestionContainer.getStudentLastQuestion(db.redis.read, studentId, 'NON_SRP'),
    ];
    const videoLastIdData = await Promise.all(videoLastIdPromise);

    const srpLastIdData = videoLastIdData[0];
    const nonSrpLastIdData = videoLastIdData[1];

    if (!_.isNull(srpLastIdData)) {
        const page = 'SRP_PLAYLIST';
        const finalData = await getPlaylistDeeplink(db, srpLastIdData, studentId, locale, page);
        if (!_.isEmpty(finalData)) {
            returnData.push(finalData);
        }
    }
    if (!_.isNull(nonSrpLastIdData)) {
        const page = 'NON_SRP_PLAYLIST';
        const finalData = await getPlaylistDeeplink(db, nonSrpLastIdData, studentId, locale, page);
        if (!_.isEmpty(finalData)) {
            returnData.push(finalData);
        }
    }
    return returnData;
}

async function peopleWatchShouldWatchDetails(db, studentId, locale) {
    const returnData = [];

    const srpLastViewedId = await redisQuestionContainer.getStudentLastQuestion(db.redis.read, studentId, 'SRP');
    if (!_.isNull(srpLastViewedId)) {
        const questionDetails = await AnswerMysql.getByQuestionIdNew(db.mysql.read, srpLastViewedId);
        if (questionDetails.length == 1) {
            const { question_id: questionId, answer_id: answerId, chapter } = questionDetails[0];
            const ccmIdDetails = await ClassCourseMappingContainer.getStudentCcmIds(db, studentId);
            if (ccmIdDetails.length > 0) {
                const ccmId = ccmIdDetails[0];
                const videoRecomendations = await VideoViewMysql.getVideoRecomendation(db.mysql.read, ccmId, answerId);
                if (videoRecomendations.length > 0) {
                    let showQid = 0;
                    let progressCount = 0;
                    let flag = 0;
                    let dataExist = false;

                    let playlistViewdIds = await redisQuestionContainer.getStudentLastViewedQuestion(db.redis.read, studentId, 'RECOMENDED_PLAYLIST_last_viewed');
                    if (!_.isNull(playlistViewdIds)) {
                        playlistViewdIds = JSON.parse(playlistViewdIds);
                        if (playlistViewdIds.length > 0) {
                            dataExist = true;
                        }
                    }

                    if (dataExist) {
                        videoRecomendations.forEach((item) => {
                            if (flag === 0 && playlistViewdIds.includes(item.question_id.toString())) {
                                progressCount++;
                            } else if (flag === 0) {
                                flag = 1;
                                showQid = item.question_id;
                            }
                        });
                    } else {
                        showQid = videoRecomendations[0].question_id;
                    }

                    if (showQid != 0) {
                        returnData.push(
                            {
                                type: 'widget_playlist',
                                data: {
                                    id: questionId,
                                    title: chapter,
                                    description: StaticData.peopleWatchSubTitle(locale),
                                    completed_playlist: progressCount,
                                    total_playlist: videoRecomendations.length,
                                    sideBarColor: '#541388',
                                    // deeplink: `doubtnutapp://playlist?playlist_id=119676&playlist_title=${playListTitle}&page=RECOMENDED_PLAYLIST&is_last=1`,
                                    deeplink: `doubtnutapp://video?qid=${showQid}&page=RECOMENDED_PLAYLIST&playlist_id=NCERT`,
                                    button_text: StaticData.playListPlayText(locale),
                                },
                            },
                        );
                    }
                }
            }
        }
    }
    return returnData;
}

async function makeChannelData(db, studentId, className, studentLocale, versionCode) {
    const getLastViews = await VideoViewMysql.getAllViewsDetails(db.mysql.read, studentId, 200);
    const viewQids = getLastViews.map((x) => x.question_id);

    const { colorDetails } = StaticData;
    const returnArr = [];

    const allChannelsData = await studentMysql.getChannelsByCcmId(db.mysql.read, studentId, className, versionCode);
    if (allChannelsData.length > 0) {
        const nonPlaylistData = allChannelsData.filter((x) => x.mapped_playlist_id === 0);
        const playlistData = allChannelsData.filter((x) => x.mapped_playlist_id !== 0);
        const distinctPlaylistData = _.uniqBy(playlistData, 'mapped_playlist_id');
        let finalChannels = [...nonPlaylistData, ...distinctPlaylistData];
        finalChannels = _.sortBy(finalChannels, 'item_order');

        const promiseArr = [];
        const allStaticChannels = finalChannels.filter((x) => x.type === 'STATIC_CHANNEL');
        const staticChannelsArr = [];
        allStaticChannels.forEach((item) => {
            const redisKey = item.data_type;
            staticChannelsArr.push(redisKey);
            promiseArr.push(studentRedis.getChannelData(db.redis.read, redisKey));
        });
        const allStaticChannelsData = await Promise.all(promiseArr);

        const channelsData = [];
        allStaticChannelsData.forEach((item, index) => {
            if (!_.isNull(item)) {
                channelsData.push({
                    type: staticChannelsArr[index],
                    qid_list: JSON.parse(item),
                });
            }
        });

        finalChannels.forEach((item, index) => {
            const colorCodeIndex = index % 3;
            if (item.type === 'STATIC_CHANNEL') {
                const questionData = channelsData.filter((x) => x.type === item.data_type);
                if (questionData.length > 0) {
                    const qList = questionData[0].qid_list;
                    if (qList.length > 0) {
                        let qid = 0;
                        qList.forEach((x) => {
                            if (qid == 0 && !viewQids.includes(x)) {
                                qid = x;
                            }
                        });
                        if (qid != 0) {
                            let { deeplink } = item;
                            deeplink = _.replace(deeplink, /xxqidxx/g, qid);
                            returnArr.push(
                                {
                                    type: 'gradient_card',
                                    data: {
                                        title: studentLocale === 'hi' ? item.hindi_title : item.title,
                                        gradient: {
                                            color_start: colorDetails[`${colorCodeIndex}`].colorStart,
                                            color_mid: colorDetails[`${colorCodeIndex}`].colorMid,
                                            color_end: colorDetails[`${colorCodeIndex}`].colorEnd,
                                        },
                                        deeplink,
                                    },
                                },
                            );
                        }
                    }
                }
            } else {
                returnArr.push(
                    {
                        type: 'gradient_card',
                        data: {
                            title: studentLocale === 'hi' ? item.hindi_title : item.title,
                            gradient: {
                                color_start: colorDetails[`${colorCodeIndex}`].colorStart,
                                color_mid: colorDetails[`${colorCodeIndex}`].colorMid,
                                color_end: colorDetails[`${colorCodeIndex}`].colorEnd,
                            },
                            deeplink: item.deeplink,
                        },
                    },
                );
            }
        });
    }

    return returnArr;
}

async function makeVideoAddData(db, studentId, studentLocale, studentClass, xAuthToken, registeredDate, flagVariants, versionCode) {
    const videoAdsList = [];
    let isReferralStudent = false;
    let [
        allVideoAds,
        // eslint-disable-next-line prefer-const
        referralEligibility,
    ] = await Promise.all([
        QuestionMysql.getAllVideoAds(db.mysql.read, studentId, studentLocale, versionCode, flagVariants),
        CourseMysqlV2.checkReferralEligibility(db.mysql.read, studentId),
    ]);
    const userDays = StudentHelper.getUserDaysOnApp(registeredDate);
    allVideoAds = StudentHelper.getDataBasisOfUserDays(allVideoAds, userDays);
    let classArr;
    const typeArr = [];
    let classArrDnst;
    let scholarshipDeeplink;
    let dataTest;
    const isScholarship = allVideoAds.filter((item) => item.description.includes('Scholarship'));
    if (isScholarship && isScholarship.length > 0) {
        for (let i = 0; i < isScholarship.length; i++) {
            const type = isScholarship[i].description.split(' ')[2];
            typeArr.push(type);
            // eslint-disable-next-line no-await-in-loop
            scholarshipDeeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentId);
            // eslint-disable-next-line no-await-in-loop
            dataTest = await CourseContainerV2.getScholarshipExams(db);
            if (dataTest && dataTest[0]) {
                const dnstTest = dataTest.filter((e) => e.type.includes(type));
                if (dnstTest && dnstTest[0]) {
                    classArr = (dnstTest[0].scholarship_class.split(',')).map(Number);
                    classArrDnst.push(classArr);
                }
            }
        }
    }
    if (allVideoAds.length > 0) {
        const deeplinkArr = [];
        allVideoAds.forEach((x) => {
            if (!deeplinkArr.includes(x.deeplink) || x.deeplink == null) {
                if (!x.description.includes('Scholarship')) {
                    const obj = {
                        type: 'video_banner_autoplay_child',
                        data: {
                            id: x.id,
                            image_url: ((x.id == 6 || x.id == 7) && studentId % 5 == 0) ? LiveClassData.referralInstallDiscountBannerHome : x.thumbnail_img,
                            deeplink: x.deeplink,
                            video_resource: {
                                resource: ((x.id == 6 || x.id == 7) && studentId % 5 == 0) ? `${StaticData.cdnUrlLimeLight}/referral_install.mp4` : x.link,
                                auto_play_duration: x.duration,
                            },
                            default_mute: false,
                        },
                    };
                    const resourceArr = obj.data.video_resource.resource.split('.');
                    if (resourceArr[resourceArr.length - 1] === 'mpd') {
                        obj.data.video_resource.drm_scheme = 'widevine';
                        obj.data.video_resource.drm_license_url = '';
                        obj.data.video_resource.media_type = 'DASH';
                    }
                    videoAdsList.push(obj);
                    deeplinkArr.push(x.deeplink);
                }
            }
            if (x.description.includes('Scholarship')) {
                const typeAgain = x.description.split(' ')[2];
                if (typeArr.includes(typeAgain)) {
                    const index = typeArr.indexOf(typeAgain);
                    const classes = classArrDnst[index];
                    if (classes && classes[0] && classes.includes(parseInt(studentClass))) {
                        const obj = {
                            type: 'video_banner_autoplay_child',
                            data: {
                                id: x.id,
                                image_url: x.thumbnail_img,
                                deeplink: x.deeplink,
                                video_resource: {
                                    resource: x.link,
                                    auto_play_duration: x.duration,
                                },
                                default_mute: false,
                            },
                        };
                        obj.data.deeplink = scholarshipDeeplink;
                        videoAdsList.unshift(obj);
                        deeplinkArr.unshift(obj.data.deeplink);
                    }
                }
            }
        });
    }
    if (referralEligibility && referralEligibility.length == 1 && referralEligibility[0].payment_info_id == null && [9, 10, 11, 12, 13, 14].includes(parseInt(studentClass))) {
        const refObj = {
            type: 'video_banner_autoplay_child',
            data: {
                id: 8,
                image_url: LiveClassData.referralDiscountBannerHome,
                deeplink: LiveClassData.referralDiscountBannerHomeDeeplink,
                video_resource: {
                    resource: LiveClassData.referralDiscountBannerHomeVideoLink,
                    auto_play_duration: 11000,
                },
                default_mute: false,
            },
        };
        // videoAdsList.push(refObj);
        videoAdsList.splice(1, 0, refObj);
        isReferralStudent = true;
    }
    return { videoAdsList, isReferralStudent };
}

async function getPrevYearsData(db, carouselsArray, prevYearsExamsType, studentLocale) {
    const prevYearsArr = [];
    const carouselIdArr = [];
    prevYearsExamsType.forEach((items) => {
        const itemsArr = carouselsArray.filter((carousel) => carousel.type === items);
        if (itemsArr.length != 0) {
            if (studentLocale === 'hi') {
                carouselIdArr.push({
                    id: itemsArr[0]._id,
                    carousel_id: itemsArr[0].carousel_id,
                    title: itemsArr[0].title,
                });
            }
            const obj = {
                group_id: itemsArr[0]._id,
                group_title: itemsArr[0].title,
                items: itemsArr[0].items,
                deeplink: itemsArr[0].deeplink,
            };
            prevYearsArr.push(obj);
        }
    });
    if (carouselIdArr.length != 0) {
        let carouselIds = carouselIdArr.map((x) => x.carousel_id);
        carouselIds = carouselIds.join();
        const hindiTitles = await homepageMysql.getAllHindiTitlesByids(db.mysql.read, carouselIds);
        carouselIdArr.forEach((item, index) => {
            item.hindi_title = (hindiTitles[index] && hindiTitles[index].translation && hindiTitles[index].translation != '') ? hindiTitles[index].translation : item.title;
        });
        prevYearsArr.forEach((item) => {
            carouselIdArr.forEach((x) => {
                if (x.id === item.group_id) {
                    item.group_title = x.hindi_title;
                }
            });
        });
    }
    return prevYearsArr;
}

async function getHindiTitles(db, carouselsArray, newTypesArr) {
    const hindiTitles = [];
    const newTypesResponsesArr = carouselsArray.filter((carousel) => newTypesArr.includes(carousel.type));
    newTypesResponsesArr.forEach((x) => {
        hindiTitles.push({
            type: x.type,
            carousel_id: x.carousel_id,
        });
    });
    let carouselIds = newTypesResponsesArr.map((x) => x.carousel_id);
    if (carouselIds.length) {
        carouselIds = carouselIds.join();
        const hindiTitlesForNewTypes = await homepageMysql.getAllHindiTitlesByids(db.mysql.read, carouselIds);
        hindiTitlesForNewTypes.forEach((item) => {
            hindiTitles.forEach((x) => {
                if (x.carousel_id === item.row_id) {
                    x.hindi_title = item.translation;
                }
            });
        });
    }
    return hindiTitles;
}

async function makeHistoryData(db, staticCDN, historyData) {
    const promiseArr = [];
    historyData.forEach((item) => {
        // can this be picked from cache?
        // promiseArr.push(QuestionMysql.getOcrText(mysqlDb.read, item.question_id));
        promiseArr.push(AnswerContainer.getByQuestionId(item.question_id, db));
    });
    const ocrArr = await Promise.all(promiseArr);
    historyData.forEach((item, index) => {
        const startSec = item.watched_time > 5 ? item.watched_time - 5 : 0;
        item.ocr_text = ocrArr[index][0].ocr_text;
        if (ocrArr[index][0].ocr_text.includes('<math')) {
            item.ocr_text = ocrArr[index][0].question;
        }
        item.thumbnail_image = `${staticCDN}q-thumbnail/${item.question_id}.png`;
        item.deeplink = `doubtnutapp://video?qid=${item.question_id}&page=VIDEO_HISTORY&playlist_id=null&video_start_position=${startSec}`;
    });
    return historyData;
}

async function getNcertModifiedData(db, ncertDataList, studentId, studentClass) {
    ncertDataList = await LibraryHelperV7.getNewFlowNcertFirstQuestions(db, ncertDataList);
    const ncertWatchDetails = await redisQuestionContainer.getNcertLastWatchedDetails(db.redis.read, `ncert_new_flow_lv_${studentClass}`, studentId);
    if (!_.isNull(ncertWatchDetails)) {
        let nextQid = 0;
        const ncertIdDetails = ncertWatchDetails.split('_');
        const lastVideoAccessId = await QuestionMysql.getNcertLastVideoAccessId(db.mysql.read, ncertIdDetails[0], ncertIdDetails[1]);
        nextQid = await getNcertNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, studentId);
        if (nextQid != 0) {
            ncertDataList.forEach((item) => {
                if (item.id == ncertIdDetails[0]) {
                    item.deeplink = `doubtnutapp://video?qid=${nextQid}&page=NCERT_NEW_FLOW&playlist_id=${ncertIdDetails[0]}`;
                }
            });
        }
    }
    return ncertDataList;
}

/**
 *
 * @param db
 * @param studentClass
 * @returns {Promise<{pinned: ({value}|*|null), pinnedExperiments: ({value}|*|null)}>}
 */
async function getPinnedPosts(db, studentClass, studentId, supportedMediaList, versionCode, config, page_number) {
    //* * Pinned Only Showed On Zeroth Page **//
    if (page_number || versionCode >= 932) {
        return [];
    }
    // ** Todo It can Be stored In Redis After Attaching UserData **//
    const pinnedPosts = [];
    const promises = [];

    const pinned_experiments_sql = 'select  * from pinned_post_experiments where class in (?,\'all\') and post_type in (\'viral_videos\',\'youtube\',\'news\') and is_active = 1 and `start_date` <= CURRENT_TIMESTAMP and `end_date` >=CURRENT_TIMESTAMP order by created_at desc limit 1 ';
    promises.push(db.mysql.read.query(pinned_experiments_sql, [studentClass]));
    const pinned_sql = 'select  * from pinned_post where class in (?,\'all\') and post_type in (\'viral_videos\',\'youtube\',\'news\') and is_active = 1 and `start_date` <= CURRENT_TIMESTAMP and `end_date` >=CURRENT_TIMESTAMP order by created_at desc limit 1';
    promises.push(db.mysql.read.query(pinned_sql, [studentClass]));
    const [pinnedExperiments, pinned] = await Promise.allSettled(promises);
    if (pinned.value && pinned.value.length) {
        pinnedPosts.push(sqlpost_formatter(db, pinned.value[0], 'pinned', studentId, supportedMediaList, versionCode, config));
    }
    if (pinnedExperiments.value && pinnedExperiments.value.length) {
        pinnedPosts.push(sqlpost_formatter(db, pinnedExperiments.value[0], 'pinned_experiment', studentId, supportedMediaList, versionCode, config));
    }

    const returnObj = [];
    const pinnedPostsResponses = await Promise.allSettled(pinnedPosts);
    console.log(pinnedPostsResponses);
    pinnedPostsResponses.forEach((response) => {
        if (response.status === 'fulfilled' && response.value) {
            returnObj.push(response.value);
        }
    });

    //* *Logging **//
    (() => {
        //* * Loggging Rejected Queries **//
        if (pinnedExperiments.status === 'rejected') {
            // logger.warn(`PinnedExperiments Sql Fails for ${studentClass}`, pinnedExperiments.reason);
        }

        if (pinned.status === 'rejected') {
            // logger.warn(`Pinned Sql Fails  ${studentClass}`, pinned.reason);
        }
        pinnedPostsResponses.forEach((response, index) => {
            if (response.status === 'rejected') {
                // logger.warn(` Pinned ${index ? 'pinned_experiment' : 'pinned'} Formatter Failed  ${studentClass}`, response.reason);
            }
        });
        if (!returnObj.length) {
            // logger.warn(`missing pinned - Class ${studentClass}`);
        }
    })();
    //* *Logging End **//

    return returnObj;
}

async function getPinnedPostsV2(db, studentClass, studentId, supportedMediaList, versionCode, config, page_number) {
    if (page_number || versionCode < 932) {
        return [];
    }
    // ** Todo It can Be stored In Redis After Attaching UserData **//
    const pinnedPromises = [];

    const pinned_sql = 'select  * from pinned_post where class in (?,\'all\') and post_type in (\'viral_videos\',\'youtube\',\'news\') and is_active = 1 and `start_date` <= CURRENT_TIMESTAMP and `end_date` >=CURRENT_TIMESTAMP order by created_at desc limit 5';
    const pinned = await db.mysql.read.query(pinned_sql, [studentClass]);
    if (pinned && pinned.length) {
        for (let i = 0; i < 5; i++) {
            if (pinned[i]) {
                pinnedPromises.push(sqlpost_formatter(db, pinned[i], 'pinned', studentId, supportedMediaList, versionCode, config));
            }
        }
    }

    const returnObj = [];
    const pinnedPostsResponses = await Promise.allSettled(pinnedPromises);
    console.log(pinnedPostsResponses);
    pinnedPostsResponses.forEach((response) => {
        if (response.status === 'fulfilled' && response.value) {
            returnObj.push(response.value);
        }
    });

    //* *Logging **//
    (() => {
        //* * Loggging Rejected Queries **//

        if (pinned.status === 'rejected') {
            // logger.warn(`Pinned Sql Fails  ${studentClass}`, pinned.reason);
        }
        pinnedPostsResponses.forEach((response, index) => {
            if (response.status === 'rejected') {
                // logger.warn(` Pinned ${index ? 'pinned_experiment' : 'pinned'} Formatter Failed  ${studentClass}`, response.reason);
            }
        });
        if (!returnObj.length) {
            // logger.warn(`missing pinned - Class ${studentClass}`);
        }
    })();
    //* *Logging End **//

    return returnObj;
}

async function getEngagementPosts(config, db, student_class, page_number, student_id, supportedMediaList, version_code) {
    const NO_ENGAGEMENT_POST = 5;
    try {
        const engagementPostSql = `SELECT 'doubtnut'  as student_username,'${config.logo_path}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE class in (?,'all') and start_date <= CURRENT_TIMESTAMP and type in ('viral_videos','youtube','polling') order by created_at DESC LIMIT ? OFFSET ?`;
        let engagementData = await db.mysql.read.query(engagementPostSql, [student_class, NO_ENGAGEMENT_POST, page_number * NO_ENGAGEMENT_POST]);
        engagementData = engagementData.map((engagementItem) => {
            engagementItem.image_url = buildStaticCdnUrl(engagementItem.image_url);
            engagementItem.profile_image = buildStaticCdnUrl(engagementItem.profile_image);
            // engagementItem.image_url = buildStaticCdnUrl(Utility.convertoWebP(engagementItem.image_url));
            // engagementItem.profile_image = buildStaticCdnUrl(Utility.convertoWebP(engagementItem.profile_image));
            return engagementItem;
        });
        let engagementPosts = [];
        if (engagementData && engagementData.length) {
            const processPosts = await Promise.all(engagementData.map(async (eachPost) => {
                const engagementPost = await sqlpost_formatter(db, eachPost, 'engagement', student_id, supportedMediaList, version_code, config);
                engagementPost.cdn_url = buildStaticCdnUrl(engagementPost.cdn_url);
                // engagementPost.cdn_url = buildStaticCdnUrl(Utility.convertoWebP(engagementPost.cdn_url));
                return engagementPost;
            }));
            engagementPosts = [...processPosts];
        }
        return engagementPosts;
    } catch (e) {
        // logger.warn('Engagement Post Issue', e);
        return [];
    }
}

function getPopularWidget() {
    return {
        widget_data: {
            title: 'Popular Stories',
            items: [],
            is_vip: false,
        },
        widget_type: 'widget_recent_status',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: -1000,
    };
}

function getPopularStudentWidget(student_id) {
    return {
        widget_data: {
            title: 'Follow and Learn Together',
            id: student_id,
        },
        widget_type: 'widget_follow',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: -1000,
    };
}

async function getDefaultVideos(db, student_id, student_class, student_locale, start = 0, size = 1) {
    const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, student_id);
    const assortmentID = await CourseHelper.getAssortmentByCategory(db, studentCcmData, student_class, student_locale);
    const defaultVideos = await CourseContainer.getDemoVideoExperiment(db, assortmentID);
    return defaultVideos.slice(start, start + size);
}

async function getRecommendedWidgets(req, student_id, page_number, db, config, student_locale, version_code, supportedMediaList, student_class) {
    if (version_code < 905) {
        return [];
    }
    try {
        const recentQuestionIDs = await req.app.get('pznElasticSearchInstance').searchPznQuestionIDs(student_id, page_number, 2);
        const relatedClassesPromise = [];
        let defaultWidget;
        let recommendedWidgets;
        let recentQIDsSize;
        let qID; let
            title;
        if (recentQuestionIDs.hits) {
            recentQIDsSize = recentQuestionIDs.hits.total.value;
        } else {
            recentQIDsSize = 0;
        }
        if (recentQuestionIDs.hits && recentQuestionIDs.hits.hits && recentQuestionIDs.hits.hits.length) {
            recentQuestionIDs.hits.hits.map((lastwatched) => {
                relatedClassesPromise.push(getClassesOfChapterByQuestionID(db, config, student_locale, version_code, lastwatched._source.question_id, [], student_id));
                return [];
            });
            const relatedClasses = await Promise.all(relatedClassesPromise);
            console.log(relatedClasses);
            if (relatedClasses) {
                const recommendedWidgetsPromise = [];

                relatedClasses.forEach((x) => {
                    const recommendedItems = x.widgets[1].data.items;
                    const i = Math.floor(Math.random() * recommendedItems.length - 1);
                    qID = recommendedItems[i].data.id;
                    title = recommendedItems[i].data.title1;
                    recommendedWidgetsPromise.push(recommended_sqlpost_formatter(db, { id: qID, title }, supportedMediaList, version_code, config));
                });
                recommendedWidgets = await Promise.all(recommendedWidgetsPromise);
            }
        }
        if (recommendedWidgets && recommendedWidgets[0]) {
            if (recommendedWidgets[1]) {
                return recommendedWidgets;
            }
            if (recentQIDsSize <= 5 && 2 * page_number - recentQIDsSize >= 0 <= 4) {
                defaultWidget = await getDefaultVideos(db, student_id, student_class, student_locale, 2 * page_number - recentQIDsSize + 1, 1);
                qID = defaultWidget[0].resource_reference;
                title = defaultWidget[0].topic;
                defaultWidget = await recommended_sqlpost_formatter(db, { id: qID, title }, supportedMediaList, version_code, config);
                return [recommendedWidgets[0], defaultWidget];
            }
        } else if (recentQIDsSize <= 5 && 2 * page_number - recentQIDsSize >= 0 <= 5) {
            const defaultWidgetsPromise = [];
            defaultWidget = await getDefaultVideos(db, student_id, student_class, 2 * page_number - recentQIDsSize, 2);
            defaultWidget.forEach((x) => {
                qID = x.resource_reference;
                title = x.topic;
                defaultWidgetsPromise.push(recommended_sqlpost_formatter(db, { id: qID, title }, supportedMediaList, version_code, config));
            });
            defaultWidget = await Promise.all(defaultWidgetsPromise);
            return defaultWidget;
        }
        return [];
    } catch (error) {
        // logger.warn('recommended live class post', error);
        return [];
    }
}

async function profileDataMaker(db, config, studentId, studentClass, isDropper, locale, versionCode) {
    let finalResponse = {};
    if (versionCode >= 913) {
        finalResponse = {
            widget_data: {
                id: '1',
                deeplink: 'doubtnutapp://edit_profile?refresh_home_feed=true',
                title: StaticData.updateProfileSectionInHomepage(locale),
                bg_image: `${config.staticCDN}homepage-profile-icons/profile-section-bg.webp`,
                user_class: {
                    image: `${config.staticCDN}homepage-profile-icons/class-icon.webp`,
                    title: global.t8[locale].t('Class {{studentClass}}', { studentClass }),
                },
            },
            widget_type: 'widget_class_board_exam',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: -30040,
        };
        if (isDropper) {
            finalResponse.widget_data.user_class.title = global.t8[locale].t('Dropper/ Repeat Year');
        }
        if (studentClass == 14) {
            finalResponse.widget_data.user_class.title = global.t8[locale].t('Government Exams (SSC, Railways, State Police, Defence, Teaching, Civil Services, IT)');
        }
        const classForBoard = [9, 10, 11, 12];
        const classForExam = [11, 12, 13, 14];

        if (classForBoard.includes(parseInt(studentClass))) {
            const boardData = await studentCourseMapping.getStudentBoardExam(db.mysql.read, studentId, 'board');
            if (boardData.length > 0) {
                finalResponse.widget_data.user_board = {
                    image: `${config.staticCDN}homepage-profile-icons/board-icon.webp`,
                    title: locale === 'hi' ? boardData[0].hindi_name : boardData[0].course,
                };
            }
        }

        if (classForExam.includes(parseInt(studentClass))) {
            const examData = await studentCourseMapping.getStudentBoardExam(db.mysql.read, studentId, 'exam');
            if (examData.length > 0) {
                finalResponse.widget_data.user_exam = {
                    image: `${config.staticCDN}homepage-profile-icons/exam-icon.webp`,
                    title: locale === 'hi' ? examData.map((x) => x.hindi_name).join() : examData.map((x) => x.course).join(),
                };
            }
        }
    }
    return finalResponse;
}

function filterBannerData(data, value, field) { // Filter Out Data On Basis Of ccm_id and language.
    return data.filter((x) => {
        if (x[field] === 'all') {
            return true;
        }
        if (x[field].includes(',')) {
            const arrVal = x[field].split(',');
            return arrVal.includes(value.toString());
        }
        return x[field] === value;
    });
}

function dataReplaceOnDeeplink(data, studentId, studentCourseOrClassSubcriptionLength) {
    const finalData = [];
    data.forEach((x) => {
        if (x.cta_link.includes('subscription=none') && !studentCourseOrClassSubcriptionLength) {
            x.cta_link = _.replace(x.cta_link, /xxxbase64sidxxx/g, Buffer.from(studentId.toString()).toString('base64'));
            finalData.push(x);
        } else if (!x.cta_link.includes('subscription=none')) {
            finalData.push(x);
        }
    });
    return finalData;
}

async function homeBanner(db, versionCode, flagVariants, studentId, studentClass, locale, type, registeredDate, studentCourseOrClassSubcriptionLength, campaign) {
    try {
        let response = {};
        const promise = [];
        const { todayStartDateTime } = Utility.todayEndAndStarting();
        promise.push(studentMysql.getCcmIdbyStudentId(db.mysql.read, studentId));
        promise.push(homepageMysql.getBannerDetails(db.mysql.read, type, [0, studentClass], versionCode, flagVariants, todayStartDateTime, campaign));
        const promiseResult = await Promise.all(promise);

        const studentData = promiseResult[0];
        let bannerData = promiseResult[1];

        const ccmId = studentData.length > 0 ? studentData[0].ccm_id : 0;

        if (!_.isEmpty(bannerData)) {
            bannerData = filterBannerData(bannerData, locale, 'locale');
            bannerData = filterBannerData(bannerData, ccmId, 'ccm_id');
            bannerData = dataReplaceOnDeeplink(bannerData, studentId, studentCourseOrClassSubcriptionLength);
        }
        const userDays = StudentHelper.getUserDaysOnApp(registeredDate);
        bannerData = StudentHelper.getDataBasisOfUserDays(bannerData, userDays);

        if (!_.isEmpty(bannerData)) {
            const bannerList = [];
            for (const banner of bannerData) {
                const data = {
                    id: banner.id.toString(),
                    image: banner.img_url,
                    deeplink: banner.cta_link,
                    card_width: '1.3',
                    card_ratio: type === 'short_banner' ? '10:3' : '5:3',
                };
                const obj = {
                    type: 'auto_scroll_home_banner',
                    data,
                };
                bannerList.push(obj);
            }
            response = {
                widget_type: 'widget_parent',
                data_type: 'long_banner',
                widget_data: {
                    autoplay_duration: 3000,
                    remove_padding: true,
                    scroll_direction: 'horizontal',
                    items: bannerList,
                },
            };
        }
        return response;
    } catch (e) {
        console.error(e);
        return {};
    }
}

async function getDistrictAdminForm(page_number) {
    if (!page_number) {
        return {
            img_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/FB4C149C-B67D-5B34-45EE-3E7DA4958470.webp',
            _id: 'whatsappadmin',
            deeplink: 'doubtnutapp://whatsapp_admin_form',
            widget_type: 'banner_image',
            student_id: 98,
        };
    }
}

module.exports = {
    recommended_sqlpost_formatter,
    isFeedForPagesOtherThanHomeRequired,
    sqlpost_formatter,
    getIconsDetails,
    srpNonSrpDetails,
    peopleWatchShouldWatchDetails,
    makeChannelData,
    makeVideoAddData,
    getPrevYearsData,
    getHindiTitles,
    makeHistoryData,
    getNcertModifiedData,
    getNextQid,
    getPinnedPosts,
    getPinnedPostsV2,
    getEngagementPosts,
    getPopularWidget,
    getPopularStudentWidget,
    getRecommendedWidgets,
    profileDataMaker,
    homeBanner,
    getDistrictAdminForm,
};
