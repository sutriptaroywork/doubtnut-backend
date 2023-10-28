// const _ = require('lodash');
const webBookContainer = require('../../../modules/containers/webLibrary');
const libraryredis = require('../../../modules/redis/library');
const staticData = require('../../../data/data');
const bl = require('./web_library.bl');

async function getBookList(req, res, next) {
    try {
        const db = req.app.get('db');
        const classList = [12, 11, 10, 9, 8, 7, 6];
        const { class: stClass, medium, subject } = req.query;
        let resp = { title: '', description: '', list: [] };
        if (!stClass) {
            const bookList = [];
            const classTitle = [];
            classList.forEach((x) => {
                bookList.push(webBookContainer.getWebBooksLandingPageData(db, x));
                classTitle.push(webBookContainer.getWebBooksDetailsByClass(db, x, 'en'));
            });
            const booksData = await Promise.all(bookList);
            const classTilteData = await Promise.all(classTitle);
            resp = {
                title: 'All Books from Class 6th to 12th with complete questions, answers and solutions 2022',
                description: staticData.webLibraryClassText,
                list: [],
            };
            for (let i = 0; i < booksData.length; i++) {
                if (booksData[i].length) {
                    resp.list.push({
                        title: `Books for Class ${booksData[i][0].class}`,
                        description: classTilteData[i].length && classTilteData[i].web_content ? classTilteData[i].web_content : '',
                        list: booksData[i],
                        cta_url: `class-${booksData[i][0].class}-all-books-download-questions-answers-solutions`,
                    });
                }
            }
        }

        if (stClass || medium || subject) {
            const [filteredBookData, classTilteData] = await Promise.all([
                webBookContainer.getFilteredWebBooksData(db, stClass, medium, subject),
                webBookContainer.getWebBooksDetailsByClass(db, stClass, medium),
            ]);

            if (filteredBookData && filteredBookData.length) {
                resp.title = `Class ${stClass} All Books with complete questions, answers and solutions 2022`;
                resp.description = classTilteData && classTilteData.length && classTilteData[0].web_content ? classTilteData[0].web_content : '';
                resp.list = filteredBookData;
                resp.filter_list = await bl.getWebFilterData(db, stClass, medium, subject);
                resp.breadcrumb_url_mapping = [{ title: `Class ${stClass}`, web_url: `class-${stClass}-all-books-download-questions-answers-solutions` }];
            }
        }
        next({ data: resp });
    } catch (e) {
        next(e);
    }
}

async function getBookData(req, res, next) {
    try {
        const db = req.app.get('db');
        const { web_url: webUrl } = req.query;

        const resp = { list: [], title: '', description: '' };
        if (!webUrl) return next({ data: resp });

        const bookData = await webBookContainer.getWebBookData(db, webUrl);
        if (bookData && bookData.length) {
            const [redisCache, chapterData] = await Promise.all([
                libraryredis.getNcertBooksLibraryDataNew(db.redis.read, bookData[0].old_url_schema),
                webBookContainer.getWebChapterUrlData(db, bookData[0].student_id, bookData[0].class, bookData[0].subject),
            ]);
            if (redisCache != null && redisCache.length && chapterData && chapterData.length) {
                const redisData = JSON.parse(redisCache);
                if (redisData && redisData.length) {
                    const bookChapterData = {}; // mapped chapters data for response
                    for (let i = 0; i < redisData.length; i++) {
                        if (redisData[i].description && redisData[i].description.includes('#!#')) {
                            redisData[i].chapter_video_count = redisData[i].description.replace('#!#', '');
                        }
                        redisData[i].flex_list = null; // remove to show exercise at book level
                        if (redisData[i].name.length > 2) { // remove chapter whose name is less than 2 words
                            bookChapterData[redisData[i].name] = redisData[i];
                        }
                    }

                    const chapterList = [];
                    for (let i = 0; i < chapterData.length; i++) {
                        if (bookChapterData[chapterData[i].chapter]) {
                            bookChapterData[chapterData[i].chapter].web_url = chapterData[i].chapter_url;
                            // remove below parts to disable exercise list show
                            // eslint-disable-next-line no-await-in-loop
                            const exerciseData = await webBookContainer.getWebChapterExerciseUrlData(db, bookData[0].student_id, bookData[0].class, bookData[0].subject, chapterData[i].chapter);
                            bookChapterData[chapterData[i].chapter].list = [];
                            exerciseData.forEach((x) => {
                                bookChapterData[chapterData[i].chapter].list.push({ name: x.exercise_name, web_url: x.final_url });
                            });
                            if (bookChapterData[chapterData[i].chapter].list.length) {
                                bookChapterData[chapterData[i].chapter].list[0].web_url = chapterData[i].chapter_url;
                                bookChapterData[chapterData[i].chapter].total_items = bookChapterData[chapterData[i].chapter].list.length;
                                chapterList.push(bookChapterData[chapterData[i].chapter]);
                            }
                        }
                    }

                    resp.title = `Free Solutions to ${bookData[0].original_book_name} Class ${bookData[0].class} book Chapters, Questions, Answers and Solutions 2022`;
                    resp.description = bookData[0].web_content && bookData[0].web_content.length ? bookData[0].web_content : `For all the students of Class ${bookData[0].class} - we are providing free solutions to all the questions from all the chapters of ${bookData[0].original_book_name} book`;
                    resp.list = chapterList;
                    resp.total_items = chapterList.length;
                    resp.breadcrumb_url_mapping = [
                        { title: `Class ${bookData[0].class}`, web_url: `class-${bookData[0].class}-all-books-download-questions-answers-solutions` },
                        { title: bookData[0].original_book_name, web_url: webUrl },
                    ];
                }
            }
        }
        next({ data: resp });
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

async function getBookChapterData(req, res, next) {
    try {
        const db = req.app.get('db');
        const { web_url: webUrl, page_no: pageNo } = req.query;

        const resp = { list: [], title: '', description: '' };
        if (!webUrl) return next({ data: resp });

        const chapterData = await webBookContainer.getWebBookChapterData(db, webUrl);
        if (chapterData && chapterData.length) {
            const [redisCache, exerciseUrlData] = await Promise.all([
                libraryredis.getNcertBooksLibraryDataNew(db.redis.read, `LIBRARY_NEW_BOOK_${chapterData[0].student_id}_${chapterData[0].class}_${chapterData[0].subject}`),
                webBookContainer.getWebChapterExerciseUrlData(db, chapterData[0].student_id, chapterData[0].class, chapterData[0].subject, chapterData[0].chapter),
            ]);

            if (redisCache != null && redisCache.length) {
                const redisData = JSON.parse(redisCache);
                let exerciseList = [];
                if (redisData && redisData.length) {
                    for (let i = 0; i < redisData.length; i++) {
                        if (redisData[i].name === chapterData[0].chapter) {
                            exerciseList = redisData[i].flex_list;
                            // resp.total_items = redisData[i].flex_list.length;
                            if (redisData[i].description && redisData[i].description.includes('#!#')) {
                                redisData[i].chapter_video_count = redisData[i].description.replace('#!#', '');
                            }
                            break;
                        }
                    }
                }

                const exerciseDataMapping = {};
                for (let i = 0; i < exerciseList.length; i++) {
                    exerciseDataMapping[exerciseList[i].name] = exerciseList[i];
                }

                const exerciseFinalList = [];
                for (let i = 0; i < exerciseUrlData.length; i++) {
                    if (exerciseDataMapping[exerciseUrlData[i].exercise_name]) {
                        exerciseDataMapping[exerciseUrlData[i].exercise_name].web_url = exerciseUrlData[i].final_url;
                        exerciseFinalList.push(exerciseDataMapping[exerciseUrlData[i].exercise_name]);
                    }
                }
                if (exerciseFinalList.length) { // uncomment if want to show exercise and chapter content in one page
                    exerciseFinalList[0].is_selected = true;
                    const qData = await bl.getQuestionsList(db, exerciseFinalList[0].package_details_id, pageNo);
                    exerciseFinalList[0].list = qData.list;
                    exerciseFinalList[0].total_items = qData.total_items;
                    exerciseFinalList[0].web_url = webUrl;
                    resp.breadcrumb_url_mapping = [
                        { title: `Class ${chapterData[0].class}`, web_url: `class-${chapterData[0].class}-all-books-download-questions-answers-solutions` },
                        { title: chapterData[0].original_book_name, web_url: chapterData[0].new_url_schema },
                        { title: chapterData[0].chapter, web_url: chapterData[0].chapter_url },
                        { title: exerciseFinalList[0].name, web_url: exerciseFinalList[0].web_url },
                    ];
                }
                resp.list = exerciseFinalList;
                resp.total_items = exerciseFinalList.length;
                resp.title = `Free Solutions to chapter ${chapterData[0].chapter} of ${chapterData[0].original_book_name} of Class ${chapterData[0].class} book with complete answers and questions`;
                resp.description = chapterData[0].web_content && chapterData[0].web_content.length ? chapterData[0].web_content : `For the chapter ${chapterData[0].chapter} of ${chapterData[0].original_book_name} of Class ${chapterData[0].class} - we are providing free solutions to all the questions in complete details`;
            }
        }
        next({ data: resp });
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

async function getBookChapterExerciseData(req, res, next) {
    try {
        const db = req.app.get('db');
        const { page_no: pageNo, web_url: webUrl } = req.query;

        const resp = { list: [], title: '', description: '' };
        if (!webUrl) return next({ data: resp });

        const exerciseData = await webBookContainer.getWebBookChapterExerciseData(db, webUrl);
        if (exerciseData && exerciseData.length) {
            resp.header = `${exerciseData[0].chapter} ${exerciseData[0].exercise_name} Questions Solved, ${exerciseData[0].package_name} Book Class ${exerciseData[0].class} Solutions`;
            const [redisCache, chapterData, exerciseUrlData] = await Promise.all([
                libraryredis.getNcertBooksLibraryDataNew(db.redis.read, `LIBRARY_NEW_BOOK_${exerciseData[0].student_id}_${exerciseData[0].class}_${exerciseData[0].subject}`),
                webBookContainer.getWebBookChapterData(db, exerciseData[0].chapter_url),
                webBookContainer.getWebChapterExerciseUrlData(db, exerciseData[0].student_id, exerciseData[0].class, exerciseData[0].subject, exerciseData[0].chapter),
            ]);

            if (redisCache != null && redisCache.length) {
                const redisData = JSON.parse(redisCache);
                let exerciseList = [];
                if (redisData && redisData.length) { // matching chapter
                    for (let i = 0; i < redisData.length; i++) {
                        if (redisData[i].name === exerciseData[0].chapter) {
                            exerciseList = redisData[i].flex_list;
                            if (redisData[i].description && redisData[i].description.includes('#!#')) {
                                redisData[i].chapter_video_count = redisData[i].description.replace('#!#', '');
                            }
                            break;
                        }
                    }
                }

                const exerciseDataMapping = {};
                for (let i = 0; i < exerciseList.length; i++) {
                    exerciseDataMapping[exerciseList[i].name] = exerciseList[i];
                }

                const exerciseFinalList = [];
                for (let i = 0; i < exerciseUrlData.length; i++) {
                    if (exerciseDataMapping[exerciseUrlData[i].exercise_name]) {
                        exerciseDataMapping[exerciseUrlData[i].exercise_name].web_url = i === 0 ? exerciseData[0].chapter_url : exerciseUrlData[i].final_url;
                        if (exerciseData[0].exercise_name === exerciseUrlData[i].exercise_name) {
                            exerciseDataMapping[exerciseUrlData[i].exercise_name].is_selected = true;
                            // eslint-disable-next-line no-await-in-loop
                            const qData = await bl.getQuestionsList(db, exerciseDataMapping[exerciseUrlData[i].exercise_name].package_details_id, pageNo);
                            exerciseDataMapping[exerciseUrlData[i].exercise_name].list = qData.list;
                            exerciseDataMapping[exerciseUrlData[i].exercise_name].total_items = qData.total_items;
                            resp.breadcrumb_url_mapping = [
                                { title: `Class ${chapterData[0].class}`, web_url: `class-${chapterData[0].class}-all-books-download-questions-answers-solutions` },
                                { title: chapterData[0].original_book_name, web_url: chapterData[0].new_url_schema },
                                { title: chapterData[0].chapter, web_url: chapterData[0].chapter_url },
                                { title: exerciseDataMapping[exerciseUrlData[i].exercise_name].name, web_url: exerciseDataMapping[exerciseUrlData[i].exercise_name].web_url },
                            ];
                            resp.title = `Complete Solutions to ${exerciseUrlData[i].exercise_name} of chapter ${chapterData[0].chapter} of Class ${chapterData[0].class} book with complete answers and questions`;
                            resp.description = exerciseData[0].web_content && exerciseData[0].web_content.length ? exerciseData[0].web_content : `${exerciseUrlData[i].exercise_name} questions and complete solutions for chapter ${chapterData[0].chapter} of ${chapterData[0].original_book_name} of Class ${chapterData[0].class}`;
                        }
                        exerciseFinalList.push(exerciseDataMapping[exerciseUrlData[i].exercise_name]);
                    }
                }
                resp.list = exerciseFinalList;
                resp.total_items = exerciseFinalList.length;
            }
        }
        next({ data: resp });
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

module.exports = {
    getBookList,
    getBookData,
    getBookChapterData,
    getBookChapterExerciseData,
};
