const _ = require('lodash');
const staticData = require('../../../data/data');
const Answer = require('../../../modules/answer');
const answerMysql = require('../../../modules/mysql/answer');
const answerContainer = require('../../../modules/containers/answer');
const questionContainer = require('../../../modules/containers/question');
const QuestionMysql = require('../../../modules/mysql/question');
const QuestionController = require('../../../modules/containers/question');
const AnswerContainerV13 = require('../../v13/answer/answer.container');
const LibraryMysql = require('../../../modules/mysql/library');
const LibraryHelper = require('../../v7/library/library.helper');
const Utility = require('../../../modules/utility');

async function getToatalLikesShare(db, elasticSearchResult) {
    const durationPromise = [];
    const tagPromise = [];
    for (let i = 0; i < elasticSearchResult.length; i++) {
        durationPromise.push(answerContainer.getByQuestionIdWithTextSolution(elasticSearchResult[i].question_id, db));
        durationPromise.push(questionContainer.getTotalViewsNew(elasticSearchResult[i].question_id, db));
        tagPromise.push(answerContainer.getTagList(elasticSearchResult[i].question_id, db));
    }
    const videoData = await Promise.all(durationPromise);
    const tagData = await Promise.all(tagPromise);
    for (let i = 0; i < tagData.length; i++) {
        const tagList = tagData[i];
        elasticSearchResult[i].tags_list = [];
        elasticSearchResult[i].ref = '';
        if (tagList && tagList.length && tagList[0].tags_list) {
            const tags = tagList[0].tags_list.split(/[($#)(||)]/).filter(Boolean);
            elasticSearchResult[i].ref = tags.filter((x) => /\d/.test(x));
            elasticSearchResult[i].ref = elasticSearchResult[i].ref[0] || tags[0];
            elasticSearchResult[i].tags_list = tagList[0].tags_list.split('$#');
        }
        elasticSearchResult[i].ref = elasticSearchResult[i].ref ? elasticSearchResult[i].ref.replace(/\s\s+/g, ' ').trim() : null;
    }

    for (let i = 0; i < elasticSearchResult.length; i++) {
        if (videoData[i * 2].length > 0 && videoData[i * 2][0].is_text_answered == 1 && videoData[i * 2][0].is_answered == 0) {
            elasticSearchResult[i].resource_type = 'text';
            elasticSearchResult[i].duration = 0;
            videoData[i * 2][0].answer_id = videoData[i * 2][0].text_solution_id;
            videoData[i * 2][0].answer_video = 'text';
        } else {
            elasticSearchResult[i].resource_type = 'video';
            if (videoData[i * 2].length > 0 && videoData[i * 2][0].duration) {
                if (videoData[i * 2][0].duration === 'NULL') {
                    elasticSearchResult[i].duration = 0;
                } else {
                    elasticSearchResult[i].duration = videoData[i * 2][0].duration;
                }
            } else {
                elasticSearchResult[i].duration = 0;
            }
        }

        elasticSearchResult[i].is_locked = 0;
        elasticSearchResult[i].bg_color = '#223d4e';
        elasticSearchResult[i].share = videoData[i * 2 + 1][0].share;
        elasticSearchResult[i].like = videoData[i * 2 + 1][0].likes;
        elasticSearchResult[i].views = videoData[i * 2 + 1][0].views;
        elasticSearchResult[i].share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
        elasticSearchResult[i].isLiked = false;
    }
    return elasticSearchResult;
}

async function getTopicVideoByQid(db, questionId) {
    const data = {};
    data.tab = [];
    data.list = [];
    const chapterData = await Answer.getChapterDataByQid(db.mysql.read, questionId);
    if (chapterData.length && chapterData[0].master_chapter_aliases) {
        const packageIdList = await answerMysql.getPackgeListOfChapterAlias(db.mysql.read, chapterData[0].class, chapterData[0].master_chapter_aliases);
        if (packageIdList.length) {
            let dataByChapterAlias = await answerContainer.getDataByChapterAlias(db, chapterData[0].master_chapter_aliases, chapterData[0].class, packageIdList);
            data.tab = _.uniqBy(dataByChapterAlias.map((x) => {
                const obj = { title: x.package_id, type: x.package_id };
                if (x.package_id === 'UP_BOARDS') {
                    obj.title = 'UP BOARDS';
                }
                return obj;
            }), 'type');
            dataByChapterAlias = await getToatalLikesShare(db, dataByChapterAlias);
            data.list = dataByChapterAlias;
            data.tab.sort((a, b) => staticData.topicVideoOrder.indexOf(a.type) - staticData.topicVideoOrder.indexOf(b.type));
        }
    }
    return data;
}

function addAdditionalQuestions(similarQuestions, additionalQuestions) {
    const similarQuestionsId = similarQuestions.map((x) => x.question_id);
    additionalQuestions.forEach((item) => {
        if (!similarQuestionsId.includes(item.question_id)) {
            const additionalQuestion = additionalQuestions.filter((x) => x.question_id == item.question_id);
            similarQuestions = [...similarQuestions, ...additionalQuestion];
        }
    });
    return similarQuestions;
}

async function getExerciseList(db, activeChapter, activeExercise, flow) {
    let exerciseList = [];
    if (flow === 'new') {
        exerciseList = await QuestionMysql.getAllNcertDataByPlaylist(db.mysql.read, activeChapter, 'exercise');
    } else {
        exerciseList = await QuestionMysql.getAllDataByPlaylist(db.mysql.read, activeChapter, 'exercise');
    }
    const questionPromise = [];
    exerciseList.forEach((item) => {
        item.type = 'exercise';
        item.key = item.title;
        if (item.id == activeExercise) {
            item.is_selected = true;
        } else {
            item.is_selected = false;
        }
        if (flow === 'new') {
            questionPromise.push(QuestionMysql.getAllNcertDataByPlaylist(db.mysql.read, item.id, 'questions'));
        } else {
            questionPromise.push(QuestionMysql.getAllDataByPlaylist(db.mysql.read, item.id, 'questions'));
        }
    });
    const questionResponse = await Promise.all(questionPromise);
    const exerciseNonEmpty = [];
    const activeExerciseData = exerciseList.filter((x) => x.is_selected);
    if (activeExerciseData.length == 0) {
        exerciseList.forEach((item, index) => {
            if (index == 0) {
                item.is_selected = true;
            }
            if (questionResponse[index].length != 0) {
                exerciseNonEmpty.push(item);
            }
        });
    }
    return exerciseList;
}

function makeQuestionItemData(config, item, isPlaying, videoTitle, qno, locale) {
    return {
        type: 'widget_ncert_similar',
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
            bg_color: '#ffffff',
        },
        data: {
            id: item.question_id,
            is_playing: isPlaying,
            type: 'video',
            title: item.title,
            question_language: staticData.langNameByCode[`${item.video_language.toLowerCase()}`],
            ocr_text: item.ocr_text,
            question: item.question,
            question_thumbnail: locale === 'hi' ? `${config.cdn_url}question-thumbnail/hi_${item.question_id}.webp` : `${config.cdn_url}question-thumbnail/en_${item.question_id}.webp`,
            question_id: item.question_id,
            answer_id: item.answer_id,
            video_title: `${videoTitle} Question ${qno}`,
        },
    };
}

async function makeFinalQuestionList(db, config, supportedMediaList, versionCode, locale, questionId, questionList, activeBookName, activeChapterName, activeExerciseName, type, exerciseName = '', suffleFlag) {
    let flag = 0;
    const postQuestionList = [];
    const preQuestionList = [];
    const viewsPromise = [];
    const videoPromise = [];
    const videoTitle = `${activeBookName} ${activeChapterName} ${activeExerciseName}`;
    let newQuestionList = [];
    if (suffleFlag) {
        questionList.forEach((item, index) => {
            const qno = index + 1;
            item.title = type === 'ncert' ? `${exerciseName} Question ${qno}` : '';
            if (flag === 1) {
                postQuestionList.push(makeQuestionItemData(config, item, false, videoTitle, qno, locale));
            }
            if (questionId != 0 && item.question_id == questionId) {
                flag = 1;
                postQuestionList.push(makeQuestionItemData(config, item, true, videoTitle, qno, locale));
            }
            if (flag === 0) {
                preQuestionList.push(makeQuestionItemData(config, item, false, videoTitle, qno, locale));
            }
        });
        newQuestionList = [...postQuestionList, ...preQuestionList];
    } else {
        questionList.forEach((item, index) => {
            const qno = index + 1;
            item.title = type === 'ncert' ? `${exerciseName} Question ${qno}` : '';
            if (questionId != 0 && item.question_id == questionId) {
                newQuestionList.push(makeQuestionItemData(config, item, true, videoTitle, qno, locale));
            } else {
                newQuestionList.push(makeQuestionItemData(config, item, false, videoTitle, qno, locale));
            }
        });
    }

    newQuestionList.forEach((item) => {
        viewsPromise.push(QuestionController.getTotalViews(item.data.question_id, db));
        videoPromise.push(AnswerContainerV13.getAnswerVideoResource(db, config, item.data.answer_id, item.data.question_id, supportedMediaList, versionCode));
    });
    const viewsResponse = await Promise.all(viewsPromise);
    const videoResponse = await Promise.all(videoPromise);
    newQuestionList.forEach((item, index) => {
        let views = viewsResponse[index];
        if (views.length > 0) {
            views = views[0].total_count * (Math.floor(Math.random() * 10) + 1); // random between 1-100
        } else {
            views = Math.floor(Math.random() * 1000000) + 100000;
        }
        item.data.asked_count = views;
        if (videoResponse[index] != undefined && videoResponse[index].length > 0 && videoResponse[index][0] != undefined) {
            item.data.video_resources = [videoResponse[index][0]];
        }
    });
    newQuestionList = newQuestionList.filter((x) => x.data.video_resources);
    if (suffleFlag) {
        newQuestionList[0].data.is_playing = true;
    }
    return newQuestionList;
}

async function getQuestionList(db, config, versionCode, questionId, activeExercise, supportedMediaList, activeBookName, activeChapterName, activeExerciseName, locale) {
    const questionList = await QuestionMysql.getAllDataByPlaylist(db.mysql.read, activeExercise, 'questions');
    const activeExerciseDetails = await QuestionMysql.getPlaylistDetails(db.mysql.read, activeExercise);
    const exerciseName = activeExerciseDetails[0].exercise_name;
    return makeFinalQuestionList(db, config, supportedMediaList, versionCode, locale, questionId, questionList, activeBookName, activeChapterName, activeExerciseName, 'ncert', exerciseName, true);
}

async function getNcertNewFlowQuestionList(db, config, versionCode, questionId, activeExercise, supportedMediaList, activeBookName, activeChapterName, activeExerciseName, locale) {
    let questionList = await QuestionMysql.getAllNcertDataByPlaylist(db.mysql.read, activeExercise, 'questions');
    if (_.isEmpty(questionList)) {
        questionList = await QuestionMysql.getAllDataByPlaylist(db.mysql.read, activeExercise, 'questions');
    }
    let activeExerciseDetails = await QuestionMysql.getNcertPlaylistDetails(db.mysql.read, activeExercise);
    if (_.isEmpty(activeExerciseDetails)) {
        activeExerciseDetails = await QuestionMysql.getPlaylistDetails(db.mysql.read, activeExercise, 'questions');
    }
    const exerciseName = activeExerciseDetails[0].exercise_name;
    return makeFinalQuestionList(db, config, supportedMediaList, versionCode, locale, questionId, questionList, activeBookName, activeChapterName, activeExerciseName, 'ncert', exerciseName, true);
}

function makeBookQuestionItemData(config, item, isPlaying, locale, packageLanguage, activeExerciseId) {
    const obj = {
        type: 'widget_ncert_similar',
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
            bg_color: '#ffffff',
        },
        data: {
            id: item.question_id,
            is_playing: isPlaying,
            type: item.resource_type,
            title: item.title,
            ocr_text: item.ocr_text,
            question: item.question,
            question_thumbnail: locale === 'hi' ? `${config.cdn_url}question-thumbnail/hi_${item.question_id}.webp` : `${config.cdn_url}question-thumbnail/en_${item.question_id}.webp`,
            asked_count: item.views,
            question_id: item.question_id,
            video_title: item.video_title,
            active_chapter_id: activeExerciseId,
        },
    };
    if (packageLanguage !== 0) {
        obj.data.question_language = staticData.langNameByCode[packageLanguage];
    }
    return obj;
}

async function bookQuestionListResponse(db, config, versionCode, questionId, supportedMediaList, locale, questionList, bookSid, activeBookName, activeChapName, activeExName, activeExerciseId) {
    const packageLanguageResp = await QuestionMysql.getStudentPackageLang(db.mysql.read, bookSid);
    let packageLanguage = 0;
    if (packageLanguageResp.length > 0) {
        packageLanguage = packageLanguageResp[0].package_language;
    }

    const postQuestionList = [];
    const preQuestionList = [];
    let flag = 0;

    for (let i = 0; i < questionList.length; i++) {
        const x = questionList[i];
        const videoTitle = `${activeBookName} ${activeChapName} ${activeExName}`;
        const title = '';
        x.title = title;
        x.video_title = videoTitle;
        if (flag === 1) {
            postQuestionList.push(makeBookQuestionItemData(config, x, false, locale, packageLanguage, activeExerciseId));
        }
        if (questionId != 0 && x.question_id == questionId) {
            flag = 1;
            postQuestionList.push(makeBookQuestionItemData(config, x, true, locale, packageLanguage, activeExerciseId));
        }
        if (flag === 0) {
            preQuestionList.push(makeBookQuestionItemData(config, x, false, locale, packageLanguage, activeExerciseId));
        }
    }
    let newQuestionList = [...postQuestionList, ...preQuestionList];

    const answerPromise = [];
    newQuestionList.forEach((item) => {
        answerPromise.push(answerMysql.getByQuestionId(item.data.question_id, db.mysql.read));
    });
    const answerResponse = await Promise.allSettled(answerPromise);

    newQuestionList.forEach((item, index) => {
        if (answerResponse[index] != undefined && answerResponse[index].value != undefined && answerResponse[index].value.length === 1) {
            item.data.answer_id = answerResponse[index].value[0].answer_id;
        }
    });

    const videoPromise = [];
    newQuestionList.forEach((item) => {
        videoPromise.push(AnswerContainerV13.getAnswerVideoResource(db, config, item.data.answer_id, item.data.question_id, supportedMediaList, versionCode));
    });
    const videoResponse = await Promise.allSettled(videoPromise);
    newQuestionList.forEach((item, index) => {
        if (videoResponse[index] != undefined && videoResponse[index].value != undefined && videoResponse[index].value.length > 0 && videoResponse[index].value[0] != undefined) {
            item.data.video_resources = [videoResponse[index].value[0]];
        }
    });
    newQuestionList = newQuestionList.filter((x) => x.data.video_resources);
    if (newQuestionList.length > 0) {
        newQuestionList[0].data.is_playing = true;
    }
    return newQuestionList;
}

async function formatData(db, dataList, locale, activePlaylistId, type) {
    let localisedChapters = [];
    if (locale == 'hi') {
        const idArr = dataList.map((x) => x.id);
        localisedChapters = await LibraryMysql.getPlaylistTranslationDetailsByids(db.mysql.read, idArr);
    }
    dataList.forEach((item, index) => {
        if (activePlaylistId != 0 && item.id == activePlaylistId) {
            item.is_selected = true;
        } else {
            item.is_selected = false;
        }
        if (locale == 'hi' && localisedChapters.length > 0) {
            const localisedDetails = localisedChapters.filter((x) => x.id === item.id);
            if (localisedDetails.length > 0) {
                item.title = localisedDetails[0].name;
                item.key = localisedDetails[0].name;
            }
        } else {
            item.title = item.name;
            item.key = item.name;
        }
        item.id = `${item.id}__BOOK`;
        item.type = type;
        item.chapter_number = index;
    });
    return dataList;
}

async function makeChapterForlibraryBook(db, locale, activeBook, activeChapter) {
    let chapterList = await LibraryMysql.getChapterList(db.mysql.read, activeBook);
    chapterList = await formatData(db, chapterList, locale, activeChapter, 'chapter');
    return chapterList;
}

async function makeExerciseForlibraryBook(db, locale, activeChapter, activeExercise, type) {
    if (type === 'exercise') {
        const getChapterId = await LibraryMysql.getChapterIdByExId(db.mysql.read, activeExercise);
        if (getChapterId.length > 0) {
            activeChapter = getChapterId[0].chapter_playlist_id;
        }
    }
    const exercisePlaylistList = await LibraryMysql.getExerciseList(db.mysql.read, activeChapter);
    const idArr = exercisePlaylistList.map((x) => x.exercise_playlist_id);
    let exerciseList = await LibraryMysql.getPlaylistDetailsByids(db.mysql.read, idArr);
    exerciseList = await formatData(db, exerciseList, locale, activeExercise, 'exercise');
    return exerciseList;
}

async function makeQuestionListForLibraryBook(db, config, locale, supportedMediaList, versionCode, questionId, activeIdForQuestion, activeBookName, activeChapterName, activeExerciseName, type, returnType) {
    const questionList = await LibraryMysql.getQuestionList(db.mysql.read, activeIdForQuestion, type);
    let suffleFlag = true;
    if (returnType === 'no-suffle') {
        suffleFlag = false;
    }
    return makeFinalQuestionList(db, config, supportedMediaList, versionCode, locale, questionId, questionList, activeBookName, activeChapterName, activeExerciseName, 'library', '', suffleFlag);
}

async function makeBookList(db, playlistId, activeBook, locale, type, studentId, studentClass) {
    const { exceptionBooks, notActiveBooks } = staticData;
    let bookList = [];
    if (type === 'ncert') {
        bookList = await LibraryHelper.makeNewFlowNcertBooksData(db, studentId, studentClass, locale);
    } else {
        bookList = await QuestionMysql.getBookList(db.mysql.read, playlistId);
    }
    const bookListResponse = [];
    if (bookList.length > 0) {
        bookList = bookList.filter((x) => x.id != activeBook && !notActiveBooks.includes(x.id));
        const firstQuestionPromise = [];

        bookList.forEach((item) => {
            if (type === 'ncert') {
                firstQuestionPromise.push(questionContainer.getNcertVideoOfPlaylist(db, item.id));
            } else if (type === 'library') {
                firstQuestionPromise.push(LibraryMysql.geLibraryBookFirstVideoDetails(db.mysql.read, item.id));
            }
        });

        const firstQuestionData = await Promise.all(firstQuestionPromise);
        bookList.forEach((item, index) => {
            const obj = {
                type: 'widget_ncert_book',
                data: {
                    id: item.id,
                    type: '',
                    book_thumbnail: item.image_url,
                    card_width: '2.2',
                    card_ratio: '1:1',
                },
            };
            if (type === 'library' && exceptionBooks.includes(item.id)) {
                obj.data.deeplink = `doubtnutapp://playlist?playlist_id=${item.id}&playlist_title=${item.name}&packageId=&source=&is_last=0`;
                obj.data.open_new_page = true;
            } else {
                obj.data.deeplink = type === 'library' ? `doubtnutapp://video?qid=${firstQuestionData[index][0].question_id}&page=LIBRARY_BOOK_LIST&playlist_id=${item.id}__BOOK` : `doubtnutapp://video?qid=${firstQuestionData[index][0].question_id}&page=NCERT_NEW_FLOW&playlist_id=${playlistId}`;
            }
            bookListResponse.push(obj);
        });
        const ncertBooks = [{
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
                        title: locale === 'hi' ? 'अन्य NCERT पुस्तकें' : 'Other NCERT books',
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
        if (type === 'library') {
            ncertBooks[0].widget_data.tabs[0].title = locale === 'hi' ? 'अन्य पुस्तकें' : 'Other books';
        }
        return ncertBooks;
    }
    return [];
}

function makeQuestionResponse(qList, locale) {
    return [{
        widget_type: 'widget_collapsed',
        widget_data: {
            id: '',
            items: qList,
            show_more_button_text: locale === 'hi' ? 'अधिक वीडियो दिखाएं' : 'Show More',
            show_more_button_text_color: '#ea532c',
            show_more_button_gravity: 'right',
            displayed_item_count: 4,
            title: null,
            scroll_direction: 'vertical',
            card_radius: 0.0,
            item_decorator: false,
            card_compat_padding: false,
            card_elevation: 0.0,
        },
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
            bg_color: '#ffffff',
        },
    }];
}

function trimQuestionsList(qList, exList, questionId) {
    const activeEx = exList.filter((x) => x.is_selected);
    const activeExArr = activeEx[0].title.split(' ');
    const activeExNo = activeExArr[activeExArr.length - 1];
    const lowerQuestionIndex = (activeExNo - 1) * 20;
    const upperQuestionIndex = (activeExNo * 20);
    qList = qList.slice(lowerQuestionIndex, upperQuestionIndex);
    let flag = 0;
    const preQlist = [];
    const postQlist = [];
    qList.forEach((item) => {
        if (flag === 1) {
            postQlist.push(item);
        }
        if (questionId != 0 && item.data.id == questionId) {
            flag = 1;
            postQlist.push(item);
        }
        if (flag === 0) {
            preQlist.push(item);
        }
    });
    const newQlist = [...postQlist, ...preQlist];
    return newQlist;
}

function makeMultiExList(data, activePlaylistId, exTitle, type) {
    const activeQuesIndexNo = data.questions_list.findIndex((x) => x.data.is_playing == true);
    const exerciseListLength = Math.ceil(data.questions_list.length / 20);
    const exList = [];
    for (let i = 0; i < exerciseListLength; i++) {
        const exNo = i + 1;
        let isSelected = false;
        if (activeQuesIndexNo === -1 && i === 0) {
            isSelected = true;
        } else if (activeQuesIndexNo !== -1) {
            const lowerLim = 20 * i;
            const upperLim = (20 * (i + 1)) - 1;
            if (lowerLim <= activeQuesIndexNo && upperLim >= activeQuesIndexNo) {
                isSelected = true;
            }
        }

        exList.push(
            {
                id: type === 'new' ? `${activePlaylistId}_part_${exNo}__BOOK` : `${activePlaylistId}_division_${exNo}__BOOK`,
                title: `${exTitle} Part ${exNo}`,
                type: 'exercise',
                key: `${exTitle} Part ${exNo}`,
                is_selected: isSelected,
            },
        );
    }
    return exList;
}

function makeExerciseList(data, activeChapter) {
    if (data.questions_list.length > 20) {
        data.exercise_list = makeMultiExList(data, activeChapter, 'Ex', 'new');
    } else {
        data.exercise_list = [
            {
                id: `${activeChapter}_part_1__BOOK`,
                title: 'Ex Part 1',
                type: 'exercise',
                key: 'Ex Part 1',
                is_selected: true,
            },
        ];
    }
    data.questions_list = trimQuestionsList(data.questions_list, data.exercise_list, data.question_id);
    return { exList: data.exercise_list, quesList: data.questions_list };
}

function makeExerciseAndQuestion(data) {
    const selectedExIndex = data.exercise_list.findIndex((x) => x.is_selected == true);
    const exData = data.exercise_list[selectedExIndex];
    const exIdArr = exData.id.split('__BOOK');
    const exId = exIdArr[0];
    const exList = makeMultiExList(data, exId, exData.title, 'modify');

    const questionList = trimQuestionsList(data.questions_list, exList, data.question_id);

    return { exList, quesList: questionList };
}

function makeSimilarDataResponse(questionResponse, data, activeChapter, type) {
    if (type === 'exercise') {
        if (data.sub_exercise_list != undefined && !data.divisionTypeEx) {
            const activeSubEx = data.sub_exercise_list.filter((x) => x.is_selected);
            return [{
                widget_data: {
                    items: {
                        [`${activeSubEx[0].key}`]: questionResponse,
                    },
                    tabs: data.sub_exercise_list,
                },
                widget_type: 'widget_parent_grid_selection',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: -955,
            }];
        }
        return questionResponse;
    }
    if (type === 'chapter') {
        const activeEx = data.exercise_list.filter((x) => x.is_selected);
        let widgetData = {
            items: {
                [`${activeEx[0].key}`]: questionResponse,
            },
            tabs: data.exercise_list,
        };
        if (data.sub_exercise_list != undefined) {
            const activeSubEx = data.sub_exercise_list.filter((x) => x.is_selected);
            widgetData = {
                items: {
                    [`${activeEx[0].key}`]: [{
                        widget_data: {
                            items: {
                                [`${activeSubEx[0].key}`]: questionResponse,
                            },
                            tabs: data.sub_exercise_list,
                        },
                        widget_type: 'widget_parent_grid_selection',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                        order: -955,
                    }],
                },
                scroll_direction: 'vertical',
                tabs: data.exercise_list,
            };
        }
        return [{
            widget_data: widgetData,
            widget_type: 'widget_parent_grid_selection',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: -955,
        }];
    }
    if (type === 'main') {
        const activeCh = data.chapter_list.filter((x) => x.is_selected);
        const activeEx = data.exercise_list.filter((x) => x.is_selected);
        let widgetData = {
            items: {
                [`${activeEx[0].key}`]: questionResponse,
            },
            tabs: data.exercise_list,
        };
        if (data.sub_exercise_list != undefined) {
            const activeSubEx = data.sub_exercise_list.filter((x) => x.is_selected);
            widgetData = {
                items: {
                    [`${activeEx[0].key}`]: [{
                        widget_data: {
                            items: {
                                [`${activeSubEx[0].key}`]: questionResponse,
                            },
                            tabs: data.sub_exercise_list,
                        },
                        widget_type: 'widget_parent_grid_selection',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                        order: -955,
                    }],
                },
                scroll_direction: 'vertical',
                tabs: data.exercise_list,
            };
        }
        return [{
            widget_data: {
                items: {
                    [`${activeCh[0].key}`]: [{
                        widget_data: widgetData,
                        widget_type: 'widget_parent_grid_selection',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                        order: -955,
                    }],
                },
                scroll_direction: 'vertical',
                tabs: data.chapter_list,
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

function createNcertNudgedata(data) {
    return {
        type: 'live_class_carousel_card_2',
        data: {
            id: data.resource_reference,
            assortment_id: data.assortment_id,
            subject_assortment_id: data.subject_assortment,
            title1: `${data.display} || ${data.chapter}`,
            page: 'SIMILAR',
            top_title: '',
            title2: `By ${data.expert_name}`,
            image_url: data.expert_image,
            is_live: true,
            subject: data.subject,
            color: '#6f0477',
            player_type: 'liveclass',
            live_at: 1623173048000,
            image_bg_card: staticData.freeLiveClassTab.subjetBgImage[data.subject.toLowerCase()] || staticData.freeLiveClassTab.subjetBgImage.default,
            lock_state: 0,
            bottom_title: '',
            topic: '',
            students: 13822,
            interested: 13822,
            is_premium: false,
            is_vip: true,
            state: 2,
            show_reminder: false,
            reminder_message: 'Reminder has been set',
            payment_deeplink: `doubtnutapp://vip?assortment_id=${data.assortment_id}`,
            card_width: '1.3',
            card_ratio: '16:8',
            text_color_primary: '#000000',
            text_color_secondary: '#000000',
            text_color_title: '#000000',
            set_width: true,
            button_state: 'multiple',
            image_vertical_bias: 1,
            bg_exam_tag: '#6f0477',
            text_color_exam_tag: '#ffffff',
            target_exam: '',
            deeplink: `doubtnutapp://course_details?id=${data.chapter_assortment_id}`,
        },
    };
}

function widetParentDataFormat(data, locale) {
    if (!data || !data.length) {
        return null;
    }
    const items = [];
    for (let i = 0; i < data.length; i++) {
        items.push(createNcertNudgedata(data[i]));
    }
    if (items.length) {
        const result = {
            widget_type: 'widget_parent',
            layout_config: {
                margin_top: 16,
                bg_color: '#FFFFFF',
            },
            extra_params: { source: 'ncert_solutions' },
            widget_data: {
                title: locale === 'hi' ? 'इस अध्याय की फ्री क्लासेस देखें' : 'Free Classes of this Chapter',
                subtitle: locale === 'hi' ? 'क्लासेस पूरी करें और इनाम पाएं' : 'Complete classes and earn rewards',
                link_text: locale === 'hi' ? 'सभी देखें' : 'View All',
                deeplink: items[0].data.deeplink,
                is_title_bold: true,
                items,
            },
            is_liveclass_carousel: true,
        };
        return result;
    }
    return null;
}

function getncertLibCardSimilar(subject, locale) {
    const hindiSubj = staticData.subjectHindi[subject] || 'सभी विषय';
    const cardData = {
        widget_type: 'widget_dnr_home',
        widget_data: {
            title_line_1: locale === 'hi' ? `<br><b>अब जमकर करें ${hindiSubj} की तैयारी</b><br>आप लाइब्रेरी पर ${hindiSubj} के एनसीईआरटी सॉल्यूशंस के साथ साथ और भी बहुत कुछ देख सकते हैं` : `<br><b>Ab jamkar karein ${_.startCase(subject)} ki taiyaari</b><br>Aap library par ${_.startCase(subject)} k NCERT Solutions k sath sath aur bhi bahut kuch dekh sakte hai`,
            title_color: '#2f2f2f',
            cta: locale === 'hi' ? 'लाइब्रेरी देखें' : 'Explore Library',
            cta_color: '#eb532c',
            coin_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F570E857-1366-E62D-27BF-10F817DFE64B.webp',
            deeplink: 'doubtnutapp://library_tab?tag=library',
            background_color: '#FFEED8',
        },
        extra_params: { source: 'ncert_solutions', feature: 'explore_library' },
        layout_config: {
            margin_top: 12,
            margin_bottom: 0,
            margin_left: 12,
            margin_right: 12,
        },
    };
    return cardData;
}

async function addGoogleAds(questionResponse, googleAdsData) {
    if (googleAdsData && googleAdsData.length && questionResponse && _.get(questionResponse, '[0].widget_data.items[0].type') === 'widget_ncert_similar') {
        for (let i = 0; i < questionResponse[0].widget_data.items.length; i++) {
            const qData = questionResponse[0].widget_data.items[i];
            if (qData.data && qData.data.ocr_text) {
                questionResponse[0].widget_data.items[i].data.adTagResource = [];
                for (let j = 0; j < googleAdsData.length; j++) {
                    const webUrl = `https://www.doubtnut.com/question-answer/${Utility.ocrToUrl(qData.data.ocr_text)}-${qData.data.question_id}`;
                    const objData = {
                        adTag: `${googleAdsData[j].adTag}&description_url=${encodeURIComponent(webUrl)}`,
                        ad_timeout: googleAdsData[j].ad_timeout,
                    };
                    questionResponse[0].widget_data.items[i].data.adTagResource.push(objData);
                }
            }
        }
    }
}

module.exports = {
    getTopicVideoByQid,
    addAdditionalQuestions,
    getExerciseList,
    getQuestionList,
    bookQuestionListResponse,
    makeChapterForlibraryBook,
    makeExerciseForlibraryBook,
    makeQuestionListForLibraryBook,
    makeBookList,
    makeQuestionResponse,
    makeSimilarDataResponse,
    makeMultiExList,
    trimQuestionsList,
    makeExerciseAndQuestion,
    makeExerciseList,
    widetParentDataFormat,
    getncertLibCardSimilar,
    addGoogleAds,
    getNcertNewFlowQuestionList,
};
