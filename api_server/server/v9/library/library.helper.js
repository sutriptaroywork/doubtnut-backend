const _ = require('lodash');
const moment = require('moment');
const LanguageContainer = require('../../../modules/containers/language');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const LibraryV8Controller = require('../../v8/library/library.controller');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const Utility = require('../../../modules/utility');
const Data = require('../../../data/data');
const LibraryV7Helper = require('../../v7/library/library.helper');
const UtilityTranslate = require('../../../modules/utility.translation');
const libraryMysql = require('../../../modules/mysql/library');
const pznContainer = require('../../../modules/containers/pzn');
// const question = require('../../../modules/question');
const LibTranslation = require('../../../modules/translation/library');
const AnswerContainer = require('../../../modules/containers/answer');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');

function getLibraryV9Deeplink(type, id, title = '', playistID = '') {
    let deeplink = '';
    if (type === 'video') {
        deeplink = `doubtnutapp://video?qid=${id}&page=LIBRARY`;
        if (!_.isEmpty(playistID)) {
            deeplink = `${deeplink}&playlist_id=${playistID}`;
        } else {
            deeplink = `${deeplink}&playlist_id=${id}`;
        }
    } else if (type === 'library_previous_year') {
        deeplink = `doubtnutapp://library_previous_year_papers?exam_id=${id}`;
    } else if (type === 'library_deeplink') {
        deeplink = 'doubtnutapp://library_tab?tag=library&library_screen_selected_Tab=2';
    } else {
        deeplink = `doubtnutapp://${type}?playlist_id=${id}&playlist_title=${title}&page=LIBRARY`;
    }
    return deeplink;
}

function capitalizeFirstLetterOfString(line) {
    const stringArray = line.split(' ');
    for (let i = 0; i < stringArray.length; i++) {
        stringArray[i] = stringArray[i].charAt(0).toUpperCase() + stringArray[i].slice(1);
    }
    return stringArray.join(' ');
}

/**
 * This function removes 'HINDI' and 'ENGLISH' appended at the end of
 * package name (package name is used to search for books in new_libbrary) in questions table
 * Package Name examples from PZN response: 'DC PANDEY ENGLISH', but book name is 'DC PANDEY'
 */
function removeLocaleFromPackageName(element) {
    const packageNameArray = element.package.split(' ');
    element.package = (_.difference(packageNameArray, ['ENGLISH', 'HINDI'])).join(' ');
}

async function fetchResources(obj) {
    const {
        studentClass, studentId, locale, country, limit, db, config,
    } = obj;
    let { playlistIdData } = obj;
    const readMysql = db.mysql.read;
    const lang = await LanguageContainer.getByCode(locale, db);
    const language = (lang.length) ? lang[0].language : 'english';
    let str = _.replace(playlistIdData.resource_path, /xxlanxx/g, language);
    str = _.replace(str, /xxclsxx/g, studentClass);
    str = _.replace(str, /xxsidxx/g, studentId);
    str = _.replace(str, /xxplaylistxx/g, playlistIdData.id);
    // for playlist based on last watched video
    if (_.includes(playlistIdData.libNotificationIds, playlistIdData.id)) {
        const [lastWatchedVideo, studentCcmId] = await Promise.all([
            studentCourseMapping.getLatestWatchedVideo(db.mysql.read, studentId),
            ClassCourseMappingContainer.getStudentCcmIds(db, studentId),
        ]);

        if (lastWatchedVideo.length && lastWatchedVideo[0].answer_id && studentCcmId.length && studentCcmId[0]) {
            str = _.replace(str, /xxccmxx/g, studentCcmId[0]);
            str = _.replace(str, /xxaidxx/g, lastWatchedVideo[0].answer_id);
        }
    }
    let sql = str;
    if (limit) {
        sql = `${str} limit ${limit}`;
    }
    const title = playlistIdData.name;
    playlistIdData = await readMysql.query(sql, [playlistIdData.id]);

    playlistIdData = await LibraryV8Controller.getTotalLikesShare(db, playlistIdData, studentId, country, false);
    playlistIdData = Utility.addWebpThumbnail([playlistIdData], config);
    if (country && country.toLowerCase() !== 'us') {
        const whatsappData = await appConfigConatiner.getWhatsappData(db, studentClass);
        if (whatsappData.length > 0) {
            Utility.getWhatsappDataModified(whatsappData);
            playlistIdData[0].splice(Data.whatsappCardPosition, 0, whatsappData[0]);
        }
    }

    return {
        list: playlistIdData[0],
        title,
    };
}

async function createNcertWidgetList(playlistData, widgetSource = '') {
    const result = [];
    playlistData.forEach((element) => {
        const widget = {
            type: 'widget_ncert_book',
            data: {
                id: element.id,
                page: 'LIBRARY',
                type: 'book',
                card_width: '2.6',
                open_new_page: true,
                image_url: element.image_url,
                card_ratio: '1:1',
                image_corner_radius: 8.0,
                bottom_title: element.name,
                background_color: widgetSource === 'trending_section' ? '#EFF2F5' : '#E2EDDF',
                bottom_subtitle: '',
                bottom_subtitle_color: '#54138a',
                bottom_subtitle_icon: '',
                deeplink: element.deeplink || getLibraryV9Deeplink('topic', element.id, element.name),
                layout_padding: {
                    padding_start: 0,
                    padding_end: 0,
                    padding_top: 15,
                    padding_bottom: 20,
                },
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 12,
                margin_right: 4,
            },
        };
        result.push(widget);
    });
    return result;
}

async function createWidgetLibraryCardList(playlistData, card_ratio, playlistID) {
    const result = [];
    playlistData.forEach((element) => {
        const widget = {
            type: 'widget_library_card',
            data: {
                id: element.id,
                page: 'LIBRARY',
                image_url: element.thumbnail_image,
                card_width: '1.2',
                card_ratio,
                deeplink: getLibraryV9Deeplink('video', element.question_id, '', playlistID),
                ocr_text: '',
                background_color: '#FFEDD2',
            },
        };
        result.push(widget);
    });
    return result;
}

async function createBooksWidget(obj) {
    const {
        versionCode, studentClass, studentId, playlistId, packageId, locale, source, bookFlow, order, id, db,
    } = obj;
    try {
        const ncertData = await LibraryV7Helper.makeData(db, versionCode, studentClass, studentId, playlistId, packageId, locale, source, bookFlow);
        // NCERT widget
        const widget = {
            widget_data: {
                title: UtilityTranslate.translate('NCERT Book Solutions', locale, Data),
                original_title: 'NCERT Book Solutions',
                scroll_direction: 'horizontal',
                background_color: '#e2eddf',
                is_title_bold: true,
                title_text_size: 16,
                items: [],
                id,
            },
            widget_type: 'widget_parent',
            order,
        };
        ncertData.list = await LibraryV7Helper.getNcertFirstQuestions(db, ncertData.list);
        await LibTranslation.fetchLandingData(db, ncertData.list, locale);
        widget.widget_data.items = await createNcertWidgetList(ncertData.list);
        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createSubjectTopicsWidget(obj) {
    const {
        versionCode, playlistIdsData, locale, id, db,
    } = obj;
    try {
    // NCERT widget
        let title = 'Check topic videos';
        if (playlistIdsData.length > 1) {
            title = 'Check Subject wise topic videos';
        }
        const widget = {
            widget_data: {
                title: UtilityTranslate.translate(title, locale, Data),
                scroll_direction: playlistIdsData.length % 2 === 0 ? 'grid' : 'vertical',
                is_title_bold: true,
                title_text_size: 16,
                items: [],
                id,
            },
            widget_type: 'widget_parent',
            order: playlistIdsData[0].new_playlist_order,
        };
        const widgetLength = playlistIdsData.length % 2 === 0 ? 'even' : 'odd';
        const cardRatio = playlistIdsData.length % 2 === 0 ? '13:10' : '23:5';
        const cardWidth = playlistIdsData.length % 2 === 0 ? '2.0' : '0.97';
        for (let i = 0; i < playlistIdsData.length; i++) {
        // console.log('check topic videos', element);
        // eslint-disable-next-line no-await-in-loop
            const headers = await libraryMysql.getPlaylistHeader(db.mysql.read, playlistIdsData[i].id, versionCode);
            // console.log('Subjectheaders', headers, playlistIdsData[i].id);
            const deeplinkId = ((!_.isEmpty(headers[2])) ? headers[2].id : playlistIdsData[i].id);
            widget.widget_data.items.push({
                type: 'image_card',
                data: {
                    id: playlistIdsData[i].id,
                    name: Data.library_v957_subjects[playlistIdsData[i].original_name.toLowerCase()].text[locale],
                    page: 'LIBRARY',
                    image_url: Data.library_v957_subjects[playlistIdsData[i].original_name.toLowerCase()].image[widgetLength][locale],
                    corner_radius: 16,
                    card_ratio: cardRatio,
                    card_width: cardWidth,
                    deeplink: getLibraryV9Deeplink('topic', deeplinkId, playlistIdsData[i].name),
                },
            });
        }
        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createHistoryWatchLaterWidget(obj) {
    const {
        playlistIdsData, locale, id,
    } = obj;
    try {
        const widget = {
            widget_data: {
                scroll_direction: 'vertical',
                is_title_bold: true,
                title_text_size: 16,
                show_item_decorator: true,
                card_compat_padding: true,
                card_elevation: 4.0,
                items: [],
                id,
            },
            widget_type: 'widget_collapsed',
            layout_config: {
                margin_top: 20,
                margin_bottom: 16,
                margin_left: 16,
                margin_right: 16,
                bg_color: '#ffffff',
            },
            order: playlistIdsData[0].new_playlist_order,
        };

        playlistIdsData.forEach((element) => {
            widget.widget_data.items.push({
                type: 'widget_pdf_view',
                data: {
                    title: UtilityTranslate.translate(element.name, locale, Data),
                    deeplink: Data.library_v957_subjects[element.original_name.toLowerCase().replace(' ', '_')].deeplink,
                    image_url: Data.library_v957_subjects[element.original_name.toLowerCase().replace(' ', '_')].image,
                    show_forward_arrow: true,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                },
            });
        });

        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createDearSirTopicsWidget(obj) {
    const {
        studentClass, studentId, playlistIdsData, locale, country, limit, id, db, config,
    } = obj;
    try {
        const widget = {
            widget_data: {
                title: UtilityTranslate.translate('Learn with Dear Sir', locale, Data),
                title_text_size: 16,
                scroll_direction: 'horizontal',
                is_title_bold: true,
                items: {
                    English: [],
                    Maths: [],
                },
                tabs: [{
                    key: 'English',
                    title: Data.library_v957_subjects.english.text[locale],
                    is_selected: true,
                },
                {
                    key: 'Maths',
                    title: Data.library_v957_subjects.maths.text[locale],
                    is_selected: false,
                },
                ],
                id,
            },
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 0,
                margin_bottom: 14,
                margin_left: 0,
                margin_right: 0,
            },
            order: playlistIdsData[0].new_playlist_order,
        };

        const englishResourceDescription = playlistIdsData[0].description;
        const mathResourceDescription = playlistIdsData[1].description;
        const [resourceDataEnglish, resourceDataMath] = await Promise.all([
            fetchResources({
                studentClass, studentId, playlistIdData: playlistIdsData[0], locale, country, limit, db, config,
            }),
            fetchResources({
                studentClass, studentId, playlistIdData: playlistIdsData[1], locale, country, limit, db, config,
            }),
        ]);

        const [englishWidgetList, mathWidgetList] = await Promise.all([
            createWidgetLibraryCardList(resourceDataEnglish.list, '13:10', englishResourceDescription),
            createWidgetLibraryCardList(resourceDataMath.list, '13:10', mathResourceDescription),
        ]);
        widget.widget_data.items.English = englishWidgetList;
        widget.widget_data.items.Maths = mathWidgetList;

        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createMoreFromDoubtnutVideosWidget(obj) {
    const {
        studentClass, studentId, playlistIdData, locale, topIcon, country, limit, db, config,
    } = obj;
    try {
        const { description } = playlistIdData;
        const resourceData = await fetchResources({
            studentClass, studentId, playlistIdData, locale, country, limit, db, config,
        });
        const widget = {
            widget_data: {
                title: resourceData.title,
                scroll_direction: 'horizontal',
                is_title_bold: true,
                title_text_size: 16,
                items: [],
                id: playlistIdData.id,
                layout_padding: {
                    padding_start: 16,
                    padding_end: 16,
                },
            },
            widget_type: 'widget_parent',
            order: playlistIdData.new_playlist_order,
        };
        if (topIcon) {
            widget.widget_data.top_icon = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2DDABD5C-84E4-1639-A2EE-FE2F8098D100.webp';
        }
        if (limit) {
            widget.widget_data.link_text = UtilityTranslate.translate('See all', locale, Data);
            widget.widget_data.deeplink = getLibraryV9Deeplink('playlist', playlistIdData.id, resourceData.title);
        }

        widget.widget_data.items = await createWidgetLibraryCardList(resourceData.list, '16:9', description);
        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createClassExamsWidget(obj) {
    const {
        versionCode, studentClass, studentId, playlistIdsData, packageId, locale, source, bookFlow, id, db, ccmIdData, widgetSource = '',
    } = obj;
    try {
        const widget = {
            widget_data: {
                title: UtilityTranslate.translate('Exams', locale, Data),
                title_text_size: 16,
                scroll_direction: 'vertical',
                subtitle: '',
                subtitle_text_size: 12.0,
                subtitle_text_color: '#777777',
                subtitle_remove_drawable_end: true,
                link_text: '',
                is_title_bold: true,
                items: {},
                tabs: [],
                id,
            },
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 0,
                margin_bottom: 14,
                margin_left: 0,
                margin_right: 0,
            },
            order: playlistIdsData[0].new_playlist_order,
        };
        const examTabColors = [
            '#99C8FF',
            '#C791FF',
            '#EDD247',
            '#F68B57',
            '#83DD7C',
        ];

        const ccmidExamMapping = {
            1201: [
                'CBSE Boards',
            ],
            1202: [
                'UP Boards',
            ],
            1208: [
                'Rajasthan Boards',
            ],
            11201: [
                'JEE Mains',
                'JEE Advanced',
            ],
            11203: [
                'NEET 2020',
            ],
            11206: [
                'NDA',
            ],
            11301: [
                'JEE Mains',
                'JEE Advanced',
            ],
            11303: [
                'NEET 2020',
            ],
            11306: [
                'NDA',
            ],
        };
        // 974
        if (studentClass === '12' && widgetSource !== 'change_exam' && versionCode >= 974) {
            const ccmidSelectedExams = [];
            if (!_.isEmpty(ccmIdData)) {
                for (let i = 0; i < ccmIdData.length; i++) {
                    if (!_.isEmpty(ccmidExamMapping[ccmIdData[i].ccm_id])) {
                        ccmidSelectedExams.push(...ccmidExamMapping[ccmIdData[i].ccm_id]);
                    }
                }
            }
            if (_.isEmpty(ccmidSelectedExams)) {
                ccmidSelectedExams.push('CBSE Boards');
            }
            const playlistIdsDataClone = _.remove(playlistIdsData, (e) => {
                console.log(e);
                return !_.includes(ccmidSelectedExams, e.original_name);
            });
            // console.log('playlistIdsDataClone', playlistIdsDataClone);
        }
        if (studentClass === '12' && versionCode >= 974) {
            widget.widget_data.link_text = UtilityTranslate.translate('Explore Other Exams', locale, Data);
        }
        for (let i = 0; i < playlistIdsData.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            const ncertData = await LibraryV7Helper.makeData(db, versionCode, studentClass, studentId, playlistIdsData[i].id, packageId, locale, source, bookFlow);
            widget.widget_data.items[playlistIdsData[i].original_name] = [];
            let headingsTrue = false;
            let j = 0;
            if (ncertData.headers) {
                headingsTrue = true;
                // eslint-disable-next-line no-await-in-loop
                await LibTranslation.fetchLandingData(db, ncertData.headers, locale);
                ncertData.headers.forEach((element) => {
                    widget.widget_data.items[playlistIdsData[i].original_name].push({
                        type: 'text_widget',
                        data: {
                            title: element.name,
                            linkify: false,
                            text_color: '#17181f',
                            text_size: '16.0',
                            background_color: examTabColors[j],
                            isBold: false,
                            layout_padding: {
                                padding_start: 22,
                                padding_end: 22,
                                padding_top: 15,
                                padding_bottom: 15,
                            },
                            deeplink: getLibraryV9Deeplink('library_previous_year', element.id, ''),
                        },
                        layout_config: {
                            margin_top: 12,
                            margin_bottom: 0,
                            margin_left: 12,
                            margin_right: 12,
                        },
                    });
                    j = (j + 1) % 5;
                });
            } else if (ncertData.list) {
                // eslint-disable-next-line no-await-in-loop
                await LibTranslation.fetchLandingData(db, ncertData.list, locale);
                ncertData.list.forEach((element) => {
                    if (element.view_type === 'BOOK' || element.view_type === 'BOOK_INDEX') {
                        headingsTrue = true;
                        widget.widget_data.items[playlistIdsData[i].original_name].push({
                            type: 'text_widget',
                            data: {
                                title: element.name,
                                linkify: false,
                                text_color: '#17181f',
                                text_size: '16.0',
                                background_color: examTabColors[j],
                                isBold: false,
                                layout_padding: {
                                    padding_start: 22,
                                    padding_end: 22,
                                    padding_top: 15,
                                    padding_bottom: 15,
                                },
                                deeplink: getLibraryV9Deeplink('library_previous_year', element.id, ''),
                            },
                            layout_config: {
                                margin_top: 12,
                                margin_bottom: 0,
                                margin_left: 12,
                                margin_right: 12,
                            },
                        });
                        j = (j + 1) % 5;
                    }
                });
            }
            if (!headingsTrue) {
                widget.widget_data.items[playlistIdsData[i].original_name].push({
                    type: 'text_widget',
                    data: {
                        title: UtilityTranslate.translate('Previous Year Papers', locale, Data),
                        linkify: false,
                        text_color: '#17181f',
                        text_size: '16.0',
                        background_color: '#99c8ff',
                        isBold: false,
                        layout_padding: {
                            padding_start: 22,
                            padding_end: 22,
                            padding_top: 15,
                            padding_bottom: 15,
                        },
                        deeplink: getLibraryV9Deeplink('library_previous_year', playlistIdsData[i].id, ''),
                    },
                    layout_config: {
                        margin_top: 12,
                        margin_bottom: 0,
                        margin_left: 12,
                        margin_right: 12,
                    },
                });
            }
            widget.widget_data.tabs.push({
                key: playlistIdsData[i].original_name,
                title: playlistIdsData[i].name,
                is_selected: false,
                id: playlistIdsData[i].id,
            });
        }
        widget.widget_data.tabs[0].is_selected = true;
        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createContinueWatchingWidget(obj) {
    const {
        studentId, locale, order, id, db,
    } = obj;
    try {
        const data = await pznContainer.getVideosByStudentId(studentId, locale);

        // console.log(data);
        const widget = {
            widget_data: {
                title: UtilityTranslate.translate('Continue watching', locale, Data),
                link_text: UtilityTranslate.translate('View History', locale, Data),
                scroll_direction: 'horizontal',
                deeplink: Data.library_v957_subjects.history.deeplink,
                is_title_bold: true,
                title_text_size: 16,
                items: [],
                id,
            },
            widget_type: 'widget_parent',
            order,
        };

        const playlistPromises = [];
        const questionPromises = [];
        data.forEach((element) => {
            removeLocaleFromPackageName(element);
            playlistPromises.push(libraryMysql.getPlaylistIdWithClassNameSubject(db.mysql.read, element.package, element.class, element.subject));
            const questionId = element.id.split('_');
            // questionPromises.push(question.getByQuestionId(questionId[1], db.mysql.read));
            questionPromises.push(AnswerContainer.getByQuestionId(questionId[1], db));
        });
        const [playlistResult, questionResult] = await Promise.all([Promise.all(playlistPromises), Promise.all(questionPromises)]);
        for (let i = 0; i < data.length; i++) {
            const questionId = data[i].id.split('_');
            let timeDifference = null;
            if (!_.isEmpty(data[i].created_time)) {
                timeDifference = moment(new Date()).diff(moment(data[i].created_time), 'h');
            }
            if (timeDifference === 0 && timeDifference !== null) {
                timeDifference = moment(new Date()).diff(moment(data[i].created_time), 'minutes');
                timeDifference = `${timeDifference} ${UtilityTranslate.translate('minutes ago', locale, Data)}`;
            } else if (timeDifference < 24 && timeDifference !== null) {
                timeDifference = `${timeDifference} ${timeDifference} ${UtilityTranslate.translate('hours ago', locale, Data)}`;
            } else {
                timeDifference = `on ${data[i].created_date}`;
            }
            if (_.isEmpty(questionResult[i]) || questionResult[i][0].is_answered === 1) {
                const widgetItem = {
                    type: 'live_class_carousel_card_2',
                    data: {
                        id: questionId[1],
                        page: 'LIBRARY',
                        image_bg_card: data[i].book === 'LIVE CLASS' ? `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${questionId[1]}.png` : '',
                        bottom_title: '',
                        show_reminder: false,
                        card_width: '1.2',
                        card_ratio: '16:9',
                        extra_bottom_text: `${UtilityTranslate.translate('You were watching', locale, Data)} ${timeDifference}`,
                        image_bg_scale_type: 'FIT_CENTER',
                        ocr_text: (!_.isEmpty(questionResult[i])) ? questionResult[i][0].ocr_text : '',
                        background_color: '#FFEDD2',
                        button: {
                            text: UtilityTranslate.translate('Go To Video', locale, Data),
                            deeplink: getLibraryV9Deeplink('video', questionId[1]),
                        },
                        deeplink: getLibraryV9Deeplink('video', questionId[1]),
                    },
                    layout_config: {
                        margin_top: 8,
                        margin_bottom: 14,
                        margin_left: 8,
                        margin_right: 0,
                    },
                };
                if (Data.library_v957_subjects[data[i].subject.toLowerCase().replace(' ', '_')]) {
                    widgetItem.data.background_color = Data.library_v957_subjects[data[i].subject.toLowerCase().replace(' ', '_')].ocr_text_color_code;
                }
                if (!_.isEmpty(widgetItem.data.image_bg_card) || locale === 'hi') {
                    widgetItem.data.ocr_text = '';
                }
                if (data[i].book !== 'LIVE CLASS' && widgetItem.data.ocr_text === '') {
                    widgetItem.data.image_bg_card = `https://d10lpgp6xz60nq.cloudfront.net/question-thumbnail/${locale}_${questionId[1]}.png`;
                }
                // console.log(playlistResult[i]);
                if (!_.isEmpty(playlistResult[i])) {
                    widgetItem.data.button.text = `${UtilityTranslate.translate('Go To', locale, Data)} ${playlistResult[i][0].name}`;
                    widgetItem.data.button.deeplink = getLibraryV9Deeplink('books', playlistResult[i][0].id, playlistResult[i][0].name);
                }
                widget.widget_data.items.push(widgetItem);
            }
        }
        if (widget.widget_data.items.length) {
            return widget;
        }
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createCcmIdBasedVideosWidget(obj) {
    const {
        ccmIdData, order, id, db, locale, studentClass,
    } = obj;
    try {
        if (!_.isEmpty(ccmIdData) || !_.isEmpty(studentClass)) {
            const startTime = moment().subtract(24, 'h').subtract(5, 'h').subtract(30, 'minutes')
                .format('YYYY-MM-DD HH:mm:ss');
            const endTime = moment().subtract(5, 'h').subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const data = await pznContainer.getTop10VideosByCcmIdForTimeRange(ccmIdData, startTime, endTime, studentClass, locale);

            const widget = {
                widget_data: {
                    title: UtilityTranslate.translate('What your friends are watching', locale, Data),
                    scroll_direction: 'horizontal',
                    subtitle: UtilityTranslate.translate('In most recent 24 hours', locale, Data),
                    is_title_bold: true,
                    title_text_size: 16,
                    items: [],
                    id,
                    layout_padding: {
                        padding_start: 16,
                        padding_end: 16,
                    },
                },
                widget_type: 'widget_parent',
                order,
            };

            const promises = [];
            data.forEach((element) => {
                const questionId = element.id.split('_');
                // promises.push(question.getByQuestionId(questionId[1], db.mysql.read));
                promises.push(AnswerContainer.getByQuestionId(questionId[1], db));
            });
            const result = await Promise.all(promises);
            for (let i = 0; i < data.length; i++) {
                const questionId = data[i].id.split('_');
                if (_.isEmpty(result[i]) || result[i][0].is_answered === 1) {
                    const widgetItem = {
                        type: 'widget_library_card',
                        data: {
                            id: questionId[1],
                            page: 'LIBRARY',
                            thumbnail: data[i].book === 'LIVE CLASS' ? `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${questionId[1]}.png` : '',
                            card_width: '1.2',
                            card_ratio: '16:9',
                            title: capitalizeFirstLetterOfString(data[i].chapter.toLowerCase()),
                            deeplink: getLibraryV9Deeplink('video', questionId[1]),
                            ocr_text: (!_.isEmpty(result[i])) ? result[i][0].ocr_text : '',
                            background_color: '#FFEDD2',
                        },
                    };
                    if (Data.library_v957_subjects[data[i].subject.toLowerCase().replace(' ', '_')]) {
                        widgetItem.data.background_color = Data.library_v957_subjects[data[i].subject.toLowerCase().replace(' ', '_')].ocr_text_color_code;
                    }
                    widget.widget_data.items.push(widgetItem);
                }
            }
            if (widget.widget_data.items.length) {
                return widget;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createPdfsWidget(obj) {
    const {
        playlistIdsData, id, locale,
    } = obj;
    try {
        const widget = {
            widget_data: {
                title: playlistIdsData[0].student_course,
                link_text: '',
                scroll_direction: 'vertical',
                is_title_bold: true,
                title_text_size: 16,
                items: [{
                    widget_data: {
                        scroll_direction: 'vertical',
                        show_item_decorator: true,
                        displayed_item_count: playlistIdsData.length > 4 ? 4 : playlistIdsData.length,
                        card_compat_padding: true,
                        card_elevation: 4.0,
                        show_more_button_text: UtilityTranslate.translate('View More', locale, Data),
                        show_more_button_text_color: '#ea532c',
                        show_more_button_gravity: 'END',
                        items: [],
                        id: '20',
                    },
                    widget_type: 'widget_collapsed',
                    layout_config: {
                        margin_top: 0,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                        bg_color: '#ffffff',
                    },
                    order: playlistIdsData[0].new_playlist_order,
                }],
                id,
                layout_padding: {
                    padding_start: 16,
                    padding_end: 16,
                },
            },
            widget_type: 'widget_parent',
            order: playlistIdsData[0].new_playlist_order,
        };
        // console.log('pdf widget', playlistIdsData);

        // console.log('pdf widget', playlistIdsData);
        playlistIdsData.forEach((element) => {
            widget.widget_data.items[0].widget_data.items.push({
                type: 'widget_pdf_view',
                data: {
                    title: element.name,
                    deeplink: (!_.isEmpty(element.resource_path)) ? '' : getLibraryV9Deeplink('topic', element.id, element.name),
                    link: (!_.isEmpty(element.resource_path)) ? element.resource_path : '',
                    show_forward_arrow: true,
                    image_url: Data.newPDFIcons[element.id] ? Data.newPDFIcons[element.id] : Data.newPDFIcons.default,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                },
            });
        });
        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createVideoDataForTrendingWidget(videoData, db) {
    const responseList = [];
    const promises = [];
    try {
        videoData.forEach((element) => {
            const questionId = element.id.split('_');
            // promises.push(question.getByQuestionId(questionId[1], db.mysql.read));
            promises.push(AnswerContainer.getByQuestionId(questionId[1], db));
        });
        const result = await Promise.all(promises);
        for (let i = 0; i < videoData.length; i++) {
            const questionId = videoData[i].id.split('_');
            if ((_.isEmpty(result[i]) || result[i][0].is_answered === 1) && !_.isEmpty(videoData[i].chapter)) {
                const widgetItem = {
                    type: 'widget_library_card',
                    data: {
                        id: questionId[1],
                        page: 'LIBRARY',
                        thumbnail: videoData[i].book === 'LIVE CLASS' ? `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${questionId[1]}.png` : '',
                        card_width: '2.0',
                        card_ratio: '16:9',
                        title: capitalizeFirstLetterOfString(videoData[i].chapter.toLowerCase()),
                        ocr_text: (!_.isEmpty(result[i])) ? result[i][0].ocr_text : '',
                        background_color: '#FFEDD2',
                        deeplink: getLibraryV9Deeplink('video', questionId[1]),
                    },
                };
                if (Data.library_v957_subjects[videoData[i].subject.toLowerCase().replace(' ', '_')]) {
                    widgetItem.data.background_color = Data.library_v957_subjects[videoData[i].subject.toLowerCase().replace(' ', '_')].ocr_text_color_code;
                }
                responseList.push(widgetItem);
            }
        }
    } catch (e) {
        console.error(e);
    }
    return responseList;
}

async function createBookDataForTrendingWidget(bookData, db, config, studentId, locale) {
    const playlistPromises = [];
    try {
        bookData.forEach((element) => {
            removeLocaleFromPackageName(element);
            // console.log('changed', element);
            playlistPromises.push(libraryMysql.getPlaylistIdWithClassNameSubject(db.mysql.read, element.package, element.class, element.subject));
        });
        let playlistResult = await Promise.all(playlistPromises);
        const playlistResultClone = [];
        playlistResult.forEach((element) => {
            if (element.length) {
                playlistResultClone.push(...element);
            }
        });
        playlistResult = playlistResultClone;
        // console.log('trending book playlist result not unique', playlistResult);
        playlistResult = _.uniqBy(playlistResult, (e) => e.id);
        await LibTranslation.fetchLandingData(db, playlistResult, locale);
        playlistResult = await LibraryV7Helper.getLibraryBookDeeplink(db, config, studentId, playlistResult);
        // console.log('trending book playlist result', playlistResult);
        return createNcertWidgetList(playlistResult, 'trending_section');
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createPDFDataForTrendingWidget(bookData, db, studentId, locale) {
    const responseList = [];
    // responseList.push({
    //     type: 'widget_pdf_view',
    //     data: {
    //         title: element.name,
    //         deeplink: (!_.isEmpty(element.resource_path)) ? '' : getLibraryV9Deeplink('topic', element.id, element.name),
    //         link: (!_.isEmpty(element.resource_path)) ? element.resource_path : '',
    //         show_forward_arrow: true,
    //         image_url: element.image_url,
    //     },
    //     layout_config: {
    //         margin_top: 0,
    //         margin_bottom: 0,
    //         margin_left: 0,
    //         margin_right: 0,
    //     },
    // });
    return responseList;
}

async function createTrendingWithCcmIDWidget(obj) {
    const {
        studentId, studentClass, ccmIdData, order, id, db, locale, source, config,
    } = obj;

    try {
        if (!_.isEmpty(ccmIdData) || !_.isEmpty(studentClass)) {
            // calculating video data for t-4 to t-3 due to lag in data in pzn repo
            const videoDataStartTime = moment().subtract(28, 'h').subtract(5, 'h').subtract(30, 'minutes')
                .format('YYYY-MM-DD HH:mm:ss');
            const videoDataEndTime = moment().subtract(27, 'h').subtract(5, 'h').subtract(30, 'minutes')
                .format('YYYY-MM-DD HH:mm:ss');
            // calculating book data for t-27 to t-3
            const bookDataStartTime = moment().subtract(30, 'h').subtract(5, 'h').subtract(30, 'minutes')
                .format('YYYY-MM-DD HH:mm:ss');
            const bookDataEndTime = moment().subtract(6, 'h').subtract(5, 'h').subtract(30, 'minutes')
                .format('YYYY-MM-DD HH:mm:ss');

            const [videoData, bookData] = await Promise.all([
                pznContainer.getTop10VideosByCcmIdForTimeRange(ccmIdData, videoDataStartTime, videoDataEndTime, studentClass, locale),
                pznContainer.getTop10VideosByCcmIdForTimeRange(ccmIdData, bookDataStartTime, bookDataEndTime, studentClass),
            ]);

            const pdfData = [];
            // console.log('videoData', videoData);
            // console.log('bookData', bookData);

            let title = '';
            if (_.isEmpty(ccmIdData)) {
                title = locale === 'hi' ? `क्लास ${studentClass}` : `Class ${studentClass}`;
            } else {
                title = locale === 'hi' ? `क्लास ${ccmIdData[0].class} ${ccmIdData[0].course}` : `Class ${ccmIdData[0].class} ${ccmIdData[0].course}`;
                if (studentClass === '14') {
                    title = `${ccmIdData[0].course}`;
                }
            }
            const widget = {
                widget_data: {
                    title: locale === 'hi' ? `${title} के साथ ट्रेंड कर रहा` : `Trending with ${title}`,
                    title_text_size: 16,
                    scroll_direction: 'horizontal',
                    subtitle: UtilityTranslate.translate('Based on last 1 hour', locale, Data),
                    subtitle_text_size: 12.0,
                    subtitle_text_color: '#777777',
                    bottom_cta: '',
                    bottom_cta_deeplink: '',
                    tabs_background_color: '#EFF2F5',
                    background_color: '#EFF2F5',
                    subtitle_remove_drawable_end: true,
                    is_title_bold: true,
                    items: {
                        Videos: [],
                        Books: [],
                        PDFs: [],
                    },
                    tabs: [{
                        key: 'Videos',
                        title: UtilityTranslate.translate('Videos', locale, Data),
                        is_selected: true,
                    },
                    {
                        key: 'Books',
                        title: UtilityTranslate.translate('Books', locale, Data),
                        is_selected: false,
                    },
                    {
                        key: 'PDFs',
                        title: UtilityTranslate.translate('PDFs', locale, Data),
                        is_selected: false,
                    },
                    ],
                    id,
                    layout_padding: {
                        padding_start: 16,
                        padding_end: 16,
                    },
                },
                widget_type: 'widget_parent_tab',
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 14,
                    margin_left: 0,
                    margin_right: 0,
                },
                order,
            };

            [widget.widget_data.items.Videos, widget.widget_data.items.Books, widget.widget_data.items.PDFs] = await Promise.all([
                createVideoDataForTrendingWidget(videoData, db),
                createBookDataForTrendingWidget(bookData, db, config, studentId, locale),
                createPDFDataForTrendingWidget(pdfData, db, studentId, locale),
            ]);

            // console.log('widget.widget_data.items.Videos', widget.widget_data.items.Videos);
            // console.log('widget.widget_data.items.Books', widget.widget_data.items.Books);
            if (source === 'HOMEPAGE_WIDGET') {
                widget.widget_data.bottom_cta = UtilityTranslate.translate('Explore Library', locale, Data);
                widget.widget_data.bottom_cta_deeplink = getLibraryV9Deeplink('library_deeplink');
                widget.widget_data.items.Videos = _.slice(widget.widget_data.items.Videos, 0, 2);
                widget.widget_data.items.Books = _.slice(widget.widget_data.items.Books, 0, 2);
                widget.widget_data.items.PDFs = _.slice(widget.widget_data.items.PDFs, 0, 2);
            }
            if (!widget.widget_data.items.Videos.length) {
                delete widget.widget_data.items.Videos;
                delete widget.widget_data.tabs.splice(0, 1);
            }
            if (!widget.widget_data.items.Books.length) {
                delete widget.widget_data.items.Books;
                delete widget.widget_data.tabs.splice(widget.widget_data.tabs.length - 2, 1);
            }
            if (!widget.widget_data.items.PDFs.length) {
                delete widget.widget_data.items.PDFs;
                delete widget.widget_data.tabs.splice(widget.widget_data.tabs.length - 1, 1);
            }
            if (!_.isEmpty(widget.widget_data.items)) {
                widget.widget_data.tabs[0].is_selected = true;
                return widget;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function createBooksWithTabsWidget(obj) {
    const {
        versionCode, studentClass, studentId, playlistIdsData, packageId, locale, source, bookFlow, id, db, config,
    } = obj;

    try {
        let title = 'Popular Book Solutions';
        if (studentClass === '14') {
            title = 'NCERT Book Solutions';
        }
        const widget = {
            widget_data: {
                title: UtilityTranslate.translate(title, locale, Data),
                original_title: title,
                title_text_size: 16,
                scroll_direction: 'horizontal',
                is_title_bold: true,
                tabs_background_color: '#E2EDDF',
                items: {},
                tabs: [],
                background_color: '#E2EDDF',
                id,
            },
            widget_type: 'widget_parent_tab',
            layout_config: {
                margin_top: 0,
                margin_bottom: 14,
                margin_left: 0,
                margin_right: 0,
            },
            layout_padding: {
                padding_start: 16,
                padding_end: 16,
            },
            order: playlistIdsData[0].new_playlist_order,
        };

        for (let i = 0; i < playlistIdsData.length; i++) {
        // eslint-disable-next-line no-await-in-loop
            const bookData = await LibraryV7Helper.makeData(db, versionCode, studentClass, studentId, playlistIdsData[i].id, packageId, locale, source, bookFlow);
            if (versionCode >= 946 && packageId === '' && bookFlow) {
                const typeOfBookView = ['BOOK', 'BOOK_INDEX'];
                const { dcPandeyBooks } = Data;
                const allowedClass = [9, 10, 11, 12];
                if (source === 'SEARCH_SRP') {
                // eslint-disable-next-line no-await-in-loop
                    bookData.list = await LibraryV7Helper.getBookDeeplink(db, studentId, playlistIdsData[i].id, bookData.list);
                } else if (versionCode >= 955 && source === '' && allowedClass.includes(parseInt(studentClass))) {
                    if (typeOfBookView.includes(bookData.list[0].view_type) || (bookData.list[0].view_type === 'LIST' && dcPandeyBooks.includes(bookData.list[0].id))) {
                    // eslint-disable-next-line no-await-in-loop
                        bookData.list = await LibraryV7Helper.getLibraryBookDeeplink(db, config, studentId, bookData.list);
                    }
                }
            }
            let itemName = '';
            if (studentClass != 14) {
                itemName = playlistIdsData[i].name;
            } else {
                itemName = locale === 'hi' ? `क्लास ${playlistIdsData[i].student_class}` : `Class ${playlistIdsData[i].student_class}`;
            }
            widget.widget_data.items[itemName] = [];

            // eslint-disable-next-line no-await-in-loop
            await LibTranslation.fetchLandingData(db, bookData.list, locale);
            // eslint-disable-next-line no-await-in-loop
            widget.widget_data.items[itemName] = await createNcertWidgetList(bookData.list);
            widget.widget_data.tabs.push({
                key: itemName,
                title: itemName,
                is_selected: false,
            });
        }
        if (studentClass === '14') {
            widget.widget_data.tabs = _.sortBy(widget.widget_data.tabs, (o) => parseInt(o.title.split(' ')[1]));
        }
        widget.widget_data.tabs[0].is_selected = true;
        return widget;
    } catch (e) {
        console.error(e);
    }
    return [];
}

// static response to-do for v2 Dynamic Widget
async function createTopicsSuggestedForYouWidget() {
    const widget = {
        widget_data: {
            title: 'Topics suggested for you',
            link_text: '',
            is_title_bold: true,
            title_text_size: 16,
            scroll_direction: 'horizontal',
            subtitle: 'Based on your question asked history',
            items: [{
                type: 'widget_library_card',
                data: {
                    id: '648619700',
                    page: 'LIBRARY',
                    thumbnail: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/094FA1C2-0C6D-A8BE-F3DD-8E10D74EB0AE.webp',
                    card_width: '1.2',
                    card_ratio: '16:9',
                    title: 'Dimension and Measurement',
                    deeplink: 'doubtnutapp://course_details?id=337087',
                    ocr_text: '',
                    background_color: '#000033',
                },
            }, {
                type: 'widget_library_card',
                data: {
                    id: '648619700',
                    page: 'LIBRARY',
                    thumbnail: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/094FA1C2-0C6D-A8BE-F3DD-8E10D74EB0AE.webp',
                    card_width: '1.2',
                    card_ratio: '16:9',
                    title: 'Dimension and Measurement',
                    deeplink: 'doubtnutapp://course_details?id=337087',
                    ocr_text: '',
                    background_color: '#000033',
                },
            }],
            id: '18',
            layout_padding: {
                padding_start: 16,
                padding_end: 16,
            },
        },
        widget_type: 'widget_parent',
        order: -30066,
    };
    return widget;
}

module.exports = {
    getLibraryV9Deeplink,
    createBooksWidget,
    createSubjectTopicsWidget,
    createHistoryWatchLaterWidget,
    createDearSirTopicsWidget,
    createMoreFromDoubtnutVideosWidget,
    createClassExamsWidget,
    createContinueWatchingWidget,
    createCcmIdBasedVideosWidget,
    createPdfsWidget,
    createTrendingWithCcmIDWidget,
    createBooksWithTabsWidget,
    createTopicsSuggestedForYouWidget,
};
