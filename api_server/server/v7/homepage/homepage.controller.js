/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
const _ = require('lodash');
const moment = require('moment');

const HomepageContainer = require('../../../modules/containers/homepage');
const HomepageRedis = require('../../../modules/redis/homepage');
const Utility = require('../../../modules/utility');
const StructuredCourse = require('../../../modules/mysql/structuredCourse');
const HomepageHelper = require('./homepage.helper');
const StructuredCourseContainer = require('../../../modules/containers/structuredCourse');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const HomeWidgetSubmissions = require('../../../modules/HomeWidgetSubmissions');
const StudentPersonalisation = require('../../../modules/redis/studentPersonalisation');
const Data = require('../../../data/data');
const bl = require('./homepage.bl');

let db; let config;

async function get(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        let { student_class } = req.user;
        if (_.isNull(student_class)) {
            student_class = 12;
        }
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        const { featureIds } = req.query;
        let flagVariants = [];
        flagVariants.push(Data.defaultFlagVariantsForHomepage);
        if (featureIds) {
            if (Array.isArray(featureIds)) {
                flagVariants = [...flagVariants, ...featureIds];
            } else {
                flagVariants.push(featureIds);
            }
        }
        const { student_id } = req.user;
        console.log('student_id', student_id);
        console.log('student_class', student_class);
        const student_locale = req.user.locale;
        const language = 'english';
        const type = '';
        const subtitle = '';
        const description = '';
        const { page } = req.params;
        const action_activity = 'pdf_viewer';
        const capsule_text = '';
        const capsule_bg_color = '#ffffff';
        const capsule_text_color = '#000000';
        const capsule = [capsule_text, capsule_text_color, capsule_bg_color];
        const button_text = '';
        const button_text_color = '#000000';
        const button_bg_color = '#f4e70c';
        const button = [button_text, button_text_color, button_bg_color];
        const duration_text_color = '#000000';
        const duration_bg_color = '#ffffff';
        const duration = [duration_text_color, duration_bg_color];
        const base_colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
        const color = Utility.generateColorArr(base_colors);
        const caraousel_limit = 8;
        const weekNo = moment().format('ww');
        const base_url = `${config.staticCDN}q-thumbnail/`;
        const cdn_url = `${config.staticCDN}images/`;
        const subjectUrl = [`${cdn_url}physics_tricky.png`, `${cdn_url}chemistry_tricky.png`, `${cdn_url}maths_tricky.png`, `${cdn_url}biology_tricky.png`, `${cdn_url}default_tricky.png`];
        const data = {
            student_id,
            student_class,
            student_locale,
            page,
            home_page: 'HOME_PAGE',
            base_url,
            type,
            caraousel_limit,
            description,
            subtitle,
            action_activity,
            capsule,
            duration,
            button,
            color,
            page_param: 'HOME_FEED',
            language,
            version_code,
            week_no: weekNo,
            subjectUrl,
            flagVariants,
        };
        let homePageWidgets;
        let homePageWidgetsData;
        let displayWigets = 0;
        if (parseInt(page) === 1) {
            homePageWidgets = await HomepageContainer.getAllActiveHomePageWidgets(db, config, student_class, version_code, page, caraousel_limit);
            if (typeof homePageWidgets !== 'undefined' && homePageWidgets.length > 0) {
                homePageWidgetsData = await HomepageHelper.getAllActiveHomePageWidgetsData(db, config, homePageWidgets, student_id, student_class);
                displayWigets = 1;
            }
        }

        let personalisationFlag = 0;
        const ccmArray = [];
        const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, student_id);
        if (typeof checkForPersonalisation !== 'undefined') {
            if (checkForPersonalisation.length > 0) {
                personalisationFlag = 1;
                let cem_str = '';
                for (let i = 0; i < checkForPersonalisation.length; i++) {
                    cem_str += checkForPersonalisation[i].ccm_id;
                    ccmArray.push(checkForPersonalisation[i].ccm_id);
                }
                data.cem_string = cem_str;
            }
        }
        data.ccmList = ccmArray;
        console.log(ccmArray);

        let result;
        console.log('personalisationFlag', data);
        if (personalisationFlag) {
            // in personalised block
            result = await HomepageContainer.getCachePersonalisedHomepage(data, config, HomepageHelper, db, elasticSearchInstance);
        } else {
            // default block
            result = await HomepageContainer.getCacheHomepage(data, config, HomepageHelper, db, elasticSearchInstance);
        }

        if (version_code > 675 && parseInt(page) === 1 && Utility.checkAb(data.student_id)) {
            const etoosResult = await bl.getEtoosAllData(db, data);
            result = [...etoosResult, ...result];
            result.sort((a, b) => a.caraousel_order - b.caraousel_order);
        }

        let structuredDataList;
        if ((parseInt(student_class) === 11 || parseInt(student_class) === 12) && parseInt(page) === 1) {
            const structuredData = await StructuredCourse.getStrucredCourseDetails(db.mysql.read);
            const structuredCourseId = structuredData[0].id;
            const structuredCourseTitle = structuredData[0].title;
            const structuredCourseDescription = structuredData[0].description;
            const structuredCourseButtonText = structuredData[0].button_text;
            const structuredCourseLogo = structuredData[0].logo;
            const list = await StructuredCourseContainer.getListingDetails(structuredCourseId, student_class, db);
            if (list.length > 0) {
                if (version_code < 636) {
                    list.forEach((listItem) => {
                        listItem.type = 'STRUCTURED_COURSE_ITEM';
                    });
                    structuredDataList = {
                        type: 'STRUCTURED_COURSE',
                        title: structuredCourseTitle,
                        description: structuredCourseDescription,
                        button_text: structuredCourseButtonText,
                        course_logo: structuredCourseLogo,
                        course_id: structuredCourseId,
                        data_type: 'STRUCTURED_COURSE',
                        scroll_type: 'Horizontal',
                        scroll_size: '1x',
                        data_limit: 1,
                        view_all: 0,
                        list,
                    };
                } else if (version_code >= 636) {
                    list.forEach((listItem) => {
                        // eslint-disable-next-line no-sequences
                        listItem.type = 'STRUCTURED_COURSE_ITEM',
                        listItem.event = 'demo_video',
                        listItem.page_data = {
                            video_id: listItem.id,
                            course_id: listItem.structured_course_id,
                            video_url: listItem.video_url,
                            subject: listItem.subject,
                            course_detail_id: listItem.structured_course_detail_id,
                        };
                    });
                    structuredDataList = {
                        type: 'STRUCTURED_COURSE',
                        title: structuredCourseTitle,
                        description: structuredCourseDescription,
                        button_text: structuredCourseButtonText,
                        course_logo: structuredCourseLogo,
                        course_id: structuredCourseId,
                        data_type: 'STRUCTURED_COURSE',
                        scroll_type: 'Horizontal',
                        scroll_size: '1x',
                        data_limit: 1,
                        view_all: 0,
                        header_image: structuredData[0].header_image,
                        bottom_text: structuredData[0].bottom_text,
                        button: {
                            text: structuredData[0].button_text_new,
                            event: 'live_classes',
                            page_data: {
                                library_screen_selected_Tab: 1,
                                course_id: structuredCourseId,
                                subject: 'physics',
                            },
                        },
                        list,
                    };
                }
                result.splice(1, 0, structuredDataList);
            }
        }

        if (displayWigets) {
            if (homePageWidgetsData.length > 0) {
                for (let i = 0; i < homePageWidgetsData.length; i++) {
                    const local_widget_order = (homePageWidgetsData[i].widget_order - ((page - 1) * caraousel_limit)) + i;
                    result.splice(local_widget_order, 0, homePageWidgetsData[i]);
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: result,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function submitOptionsSelectedForActionWidgets(req, res, next) {
    try {
        db = req.app.get('db');

        const { widget_name } = req.body;
        const { options_string } = req.body;
        const { student_id } = req.user;

        const fetchIdsToDelete = await StudentCourseMapping.selectDataFromStudentCourseMappingForWidget(db.mysql.write, student_id, widget_name);

        if (!_.isEmpty(fetchIdsToDelete) && fetchIdsToDelete[0].length) {
            await StudentCourseMapping.removeDataFromStudentCourseMappingForWidget2(db.mysql.write, student_id, widget_name);
        }

        if (options_string.split(',').length > 1) {
            const options_selected = options_string.split(',');
            const promises = [];
            for (let i = 0; i < options_selected.length; i++) {
                const obj = {
                    student_id,
                    ccm_id: options_selected[i],
                };
                promises.push(StudentCourseMapping.insertWidgetSelectionForStudent(db.mysql.write, obj));
            }
            await Promise.all(promises);
        } else {
            const obj = {
                student_id,
                ccm_id: options_string,
            };
            await StudentCourseMapping.insertWidgetSelectionForStudent(db.mysql.write, obj);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: 'data inserted successfully after deletion',
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function removeAllDataFromStudentCourseMapping(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id } = req.user;
        await StudentCourseMapping.deleteAllFromStudentCourseMapping(db.mysql.write, student_id);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: 'removed all previous selections',
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

async function submitQuestionWidgetAnswersSelected(req, res, next) {
    try {
        db = req.app.get('db');
        const st_id = req.user.student_id;
        const insert_obj = {
            student_id: st_id,
            response: req.body.response,
            question_id: req.body.question_id,
            widget_name: req.body.widget_type,
        };

        console.log(insert_obj);
        await HomeWidgetSubmissions.insertUserResponse(db.mysql.write, insert_obj);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: 'successfully inserted the response',
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

async function submitPersonalisationBySubjectInRedis(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id } = req.user;
        const pref_obj = {
            subject: req.body.subject_choice,
        };
        await StudentPersonalisation.setStudentSubjectPrefrence(db.redis.write, student_id, pref_obj);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: 'successfully inserted the response',
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getHomepageUS(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const HomepageConfig = Data.HOMEPAGE_USA;

        const { active_classes } = HomepageConfig;
        let data = [];
        const homepageCachedResponse = await HomepageRedis.getHomepageUs(db.redis.read);
        if (_.isNull(homepageCachedResponse)) {
            for (let i = 0; i < active_classes.length; i++) {
                const student_class = active_classes[i].class;
                const cached_caraousel = await HomepageRedis.getHomepageUsCaraousel(db.redis.read, student_class);
                if (config.caching && !_.isNull(cached_caraousel)) {
                    data.push(JSON.parse(cached_caraousel));
                } else {
                    const caraousel = {};
                    const subjectAvailableForClasses = await HomepageContainer.getActiveSubjectsByClass(db, student_class);
                    if (subjectAvailableForClasses && subjectAvailableForClasses.length > 0) {
                        const tabs = [];
                        caraousel.id = i;
                        caraousel.class = student_class;
                        const parent_id_promises1 = [];
                        for (let j = 0; j < subjectAvailableForClasses.length; j++) {
                            const obj = {
                                id: j,
                                name: subjectAvailableForClasses[j].name,
                                display: subjectAvailableForClasses[j].name.toUpperCase(),
                            };
                            tabs.push(obj);
                            parent_id_promises1.push(HomepageContainer.getActiveNcertLibraryRowByParentId(db, subjectAvailableForClasses[j].id));
                        }
                        const parent_id_resolved_promises1 = await Promise.all(parent_id_promises1);

                        for (let j = 0; j < tabs.length; j++) {
                            const parent_id_promises2 = [];
                            let data;
                            if (parent_id_resolved_promises1[j] && parent_id_resolved_promises1[j].length) {
                                for (let k = 0; k < parent_id_resolved_promises1[j].length; k++) {
                                    parent_id_promises2.push(HomepageContainer.getActiveLibraryRowByParentId(db, parent_id_resolved_promises1[j][k].id));
                                }
                                const parent_id_resolved_promises2 = await Promise.all(parent_id_promises2);
                                const topics = [];
                                // console.log(parent_id_resolved_promises2);
                                for (let m = 0; m < parent_id_resolved_promises2[0].length; m++) {
                                    const topic = parent_id_resolved_promises2[0][m].name;
                                    const key_id = parent_id_resolved_promises2[0][m].id;
                                    const query = parent_id_resolved_promises2[0][m].resource_path;

                                    topics.push({
                                        topic,
                                        id: key_id,
                                        data_query: query,
                                    });
                                }
                                data = [...topics];
                            }
                            tabs[j].data = data;
                        }

                        for (let j = 0; j < tabs.length; j++) {
                            const { data } = tabs[j];
                            const query_promises = [];
                            for (let p = 0; p < data.length; p++) {
                                if (_.isNull(data[p].data_query)) {
                                    query_promises.push(HomepageContainer.getActiveLibraryRowByParentId(db, data[p].id));
                                }
                            }
                            const resolved_query_promises = await Promise.all(query_promises);
                            // console.log(resolved_query_promises);
                            let sync_counter = 0;
                            for (let q = 0; q < data.length; q++) {
                                if (_.isNull(data[q].data_query)) {
                                    sync_counter += 1;
                                    data[sync_counter].data_query = resolved_query_promises[sync_counter][0].resource_path;
                                }
                            }
                        }

                        for (let j = 0; j < tabs.length; j++) {
                            const { data } = tabs[j];
                            const query_execution_promises = [];
                            for (let k = 0; k < data.length; k++) {
                                query_execution_promises.push(HomepageContainer.getChapterDataByLibrary(db, _.replace(data[k].data_query, /xxlanxx/g, 'english'), student_class, data[k].topic));
                            }
                            const resolved_query_execution_promises = await Promise.all(query_execution_promises);
                            for (let k = 0; k < data.length; k++) {
                                data[k].data = resolved_query_execution_promises[k];
                            }
                        }

                        for (let j = 0; j < tabs.length; j++) {
                            const { data } = tabs[j];
                            for (let k = 0; k < data.length; k++) {
                                if (data[k].hasOwnProperty('data_query')) {
                                    delete data[k].data_query;
                                }
                                for (let m = 0; m < data[k].data.length; m++) {
                                    const elem = data[k].data[m];
                                    elem.web_ocr_url = Utility.ocrToUrl(elem.ocr_text);
                                    elem.capsule_bg_color = '#ffffff';
                                    elem.capsule_text_color = '#000000';
                                    elem.start_gradien = '#D9DFF2';
                                    elem.mid_gradient = '#D9DFF2';
                                    elem.end_gradient = '#D9DFF2';
                                    elem.duration_text_color = '#000000';
                                    elem.duration_bg_color = '#ffffff';
                                    data[k].data[m] = elem;
                                }
                            }
                            const filtered_data = data.filter((elem) => elem.data.length > 0);
                            tabs[j].data = filtered_data;
                        }
                        caraousel.tabs = tabs;
                        caraousel.card_title = active_classes[i].caraousel_title;
                        caraousel.total_tabs = tabs.length;
                        caraousel.view_all = true;
                        data.push(caraousel);
                        HomepageRedis.setHomepageUsCaraousel(db.redis.write, student_class, caraousel);
                    }
                }
            }
            HomepageRedis.setHomepageUs(db.redis.write, data);
        } else {
            data = JSON.parse(homepageCachedResponse);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    get, submitOptionsSelectedForActionWidgets, removeAllDataFromStudentCourseMapping, submitQuestionWidgetAnswersSelected, submitPersonalisationBySubjectInRedis, getHomepageUS,
};
