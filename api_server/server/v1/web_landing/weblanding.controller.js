/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TeacherMysql = require('../../../modules/mysql/teacher');
const ClassContainer = require('../../../modules/containers/class');
const Utility = require('../../../modules/utility');

async function videoResource(db, config, questionId) {
    /**
    Functionality - Get video resources
    param1 (questionId) - question id of the video
    returns - object containing array of video resources
    author - Saurabh Raj
    */
    const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, questionId);
    let videoResources = [];
    if (answerData.length) {
        videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, questionId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
    }
    return videoResources;
}

async function getDetails(req, res, next) {
    /**
    Functionality - Get Details for NKC web landing
    param1 (group_id)
    returns - widgets with announcement video, team details, testimonails, course details and callback
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { group_id: groupId, variant_id: variantId } = req.query;

        const widgets = [];
        const getWidgets = await CourseMysqlV2.getWebActiveWidgetsByGroupId(db.mysql.read, groupId);
        getWidgets.sort((a, b) => a.priority - b.priority);
        for (let i = 0; i < getWidgets.length; i++) {
            if (getWidgets[i].widget_type === 'demo_video') {
                const videoDetails = {
                    type: 'video',
                    items: [],
                };
                const thumbnails = !_.isEmpty(getWidgets[i].image) ? getWidgets[i].image.split('||') : '';
                for (let j = 0; j < thumbnails.length; j++) {
                    thumbnails[j] = thumbnails[j].trim();
                }
                const qids = !_.isEmpty(getWidgets[i].question_id) ? getWidgets[i].question_id.split('||') : '';
                for (let j = 0; j < qids.length; j++) {
                    qids[j] = qids[j].trim();
                }
                const forcedVideoUrl = !_.isEmpty(getWidgets[i].video_url) ? getWidgets[i].video_url.split('||') : '';
                for (let j = 0; j < forcedVideoUrl.length; j++) {
                    forcedVideoUrl[j] = forcedVideoUrl[j].trim();
                }
                for (let j = 0; j < qids.length; j++) {
                    const temp = await videoResource(db, config, qids[j]);
                    const det = {
                        thumbnail: thumbnails[j],
                        video_resources: temp,
                    };
                    if (_.isArray(forcedVideoUrl) && forcedVideoUrl[j] !== '' && forcedVideoUrl[j] !== null) {
                        const videoResources = [{
                            resource: forcedVideoUrl[j],
                            video_resource: forcedVideoUrl[j].split('||')[forcedVideoUrl[j].split('||').length - 1],
                            timeout: 4,
                            drm_scheme: 'widevine',
                            media_type: 'BLOB',
                            drop_down_list: [],
                            drm_license_url: '',
                            offset: null,
                        }];
                        det.video_resources = videoResources;
                    }
                    videoDetails.items.push(det);
                }
                if (videoDetails.items.length) {
                    widgets.push(videoDetails);
                }
            } else if (getWidgets[i].widget_type === 'page_title') {
                widgets.push({
                    type: 'page_title',
                    title: getWidgets[i].title,
                    is_html: !_.isNull(getWidgets[i].is_html) ? getWidgets[i].is_html : 0,
                });
            } else if (getWidgets[i].widget_type === 'medium') {
                widgets.push({
                    type: 'medium',
                    title: getWidgets[i].title,
                    is_html: !_.isNull(getWidgets[i].is_html) ? getWidgets[i].is_html : 0,
                });
            } else if (getWidgets[i].widget_type === 'rating') {
                const rating = Utility.getRandomInt(20000, 30000);
                const students = Utility.getRandomInt(30000, 50000);
                widgets.push({
                    type: 'rating',
                    title: getWidgets[i].title,
                    subtitle: `(${rating.toLocaleString('en-IND')} ratings) ${students.toLocaleString('en-IND')} students`,
                });
            } else if (getWidgets[i].widget_type === 'price_widget') {
                widgets.push({
                    type: 'price_widget',
                    price_text: getWidgets[i].title.split('||')[1],
                    crossed_price_text: getWidgets[i].title.split('||')[0],
                });
            } else if (getWidgets[i].widget_type === 'registration_widget' || getWidgets[i].widget_type === 'bottom_registration') {
                const classes = getWidgets[i].text.split('||');
                const regWidget = {
                    type: getWidgets[i].widget_type,
                    title: !_.isEmpty(getWidgets[i].title) ? getWidgets[i].title : '',
                    button_cta: getWidgets[i].cta,
                    is_clickable: getWidgets[i].cta_click,
                    assortment_id: getWidgets[i].assortment_id,
                    tag: getWidgets[i].sub_title,
                    variant_id: variantId,
                    class_dropdown: [],
                };
                for (let j = 0; j < classes.length; j++) {
                    regWidget.class_dropdown.push({
                        student_class: classes[j],
                        display_text: classes[j],
                    });
                }
                widgets.push(regWidget);
            } else if (getWidgets[i].widget_type === 'course_details') {
                const detailsWidget = {
                    type: 'course_details',
                    title: getWidgets[i].title,
                    subtitle: getWidgets[i].sub_title,
                    description: [],
                    is_html: !_.isNull(getWidgets[i].is_html) ? getWidgets[i].is_html : 0,
                };
                const description = getWidgets[i].text.split('||');
                for (let j = 0; j < description.length; j++) {
                    detailsWidget.description.push({
                        text: description[j],
                    });
                }
                widgets.push(detailsWidget);
            } else if (getWidgets[i].widget_type === 'team_details') {
                const teamDetails = {
                    type: 'team_details',
                    items: [],
                    is_clickable: getWidgets[i].cta_click === null ? 0 : getWidgets[i].cta_click,
                };
                const facultyIds = getWidgets[i].faculty_id.split('||');
                const facultyText = !_.isEmpty(getWidgets[i].text) ? getWidgets[i].text.split('||') : '';
                let teacherDetails = await TeacherMysql.getTeacherDetailsForWeb(db.mysql.read, facultyIds);
                // sort the teacher details by facultyIds array
                teacherDetails = _.sortBy(teacherDetails, ['faculty_id']);
                const tempTeacherDetails = [];
                for (let j = 0; j < facultyIds.length; j++) {
                    const index = _.findIndex(teacherDetails, ['id', parseInt(facultyIds[j])]);
                    if (index !== -1) {
                        tempTeacherDetails.push(teacherDetails[index]);
                    }
                }
                teacherDetails = tempTeacherDetails;
                const landing = !_.isEmpty(getWidgets[i].landing_url) ? getWidgets[i].landing_url.split('||') : '';
                for (let j = 0; j < landing.length; j++) {
                    landing[j] = landing[j].trim();
                }
                for (let j = 0; j < teacherDetails.length; j++) {
                    let degree = '';
                    if (!_.isEmpty(teacherDetails[j].degree) && !_.isEmpty(teacherDetails[j].college)) {
                        degree = `${teacherDetails[j].degree}- ${teacherDetails[j].college}`;
                    } else if (!_.isEmpty(teacherDetails[j].college)) {
                        degree = teacherDetails[j].college;
                    }
                    const teamWidget = {
                        name: teacherDetails[j].name,
                        degree,
                        experience: !_.isEmpty(teacherDetails[j].experience) ? `${teacherDetails[j].experience} yrs Experience` : '',
                        image_url: teacherDetails[j].image_url,
                    };
                    if (_.isArray(landing) && landing[j] !== '' && landing[j] !== null) {
                        teamWidget.landing = landing[j];
                    } else {
                        teamWidget.landing = '';
                    }
                    if (_.isArray(facultyText) && facultyText[j] !== '' && facultyText[j] !== null) {
                        teamWidget.text = facultyText[j];
                    } else {
                        teamWidget.text = '';
                    }
                    teamDetails.items.push(teamWidget);
                }
                widgets.push(teamDetails);
            } else if (getWidgets[i].widget_type === 'banner') {
                widgets.push({
                    type: 'banner',
                    image_url: getWidgets[i].image.trim(),
                    title: !_.isEmpty(getWidgets[i].title) ? getWidgets[i].title : '',
                    landing: getWidgets[i].landing_url === null ? '' : getWidgets[i].landing_url.trim(),
                    is_clickable: getWidgets[i].cta_click === null ? 0 : getWidgets[i].cta_click,
                });
            } else if (getWidgets[i].widget_type === 'testimonials') {
                const testimonialWidget = {
                    type: 'testimonial',
                    title: getWidgets[i].title,
                    items: [],
                };
                const name = getWidgets[i].sub_title.split('||');
                const image = getWidgets[i].image.split('||');
                for (let j = 0; j < image.length; j++) {
                    image[j] = image[j].trim();
                }
                const testimonialDetails = getWidgets[i].text.split('||');
                for (let j = 0; j < name.length; j++) {
                    testimonialWidget.items.push({
                        name: name[j],
                        image_url: image[j],
                        testimonial: testimonialDetails[j],
                    });
                }
                widgets.push(testimonialWidget);
            } else if (getWidgets[i].widget_type === 'bottom_strip') {
                const heading = getWidgets[i].title.split('||');
                const value = getWidgets[i].sub_title.split('||');
                const bottomStrip = {
                    type: 'bottom_strip',
                    items: [],
                };
                for (let j = 0; j < heading.length; j++) {
                    bottomStrip.items.push({
                        heading: heading[j],
                        value: value[j],
                    });
                }
                widgets.push(bottomStrip);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function setDetails(req, res, next) {
    /**
    Functionality - Set data in leads_web_landing_page table
    param1 (mobile)
    param2 (studentClass)
    param3 (assortmentId)
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const {
            mobile, assortment_id: assortmentId, student_class: studentClass, variant_id: variantId, tag,
        } = req.body;
        const newThing = `${tag}-${variantId}`;
        const check = await CourseMysqlV2.checkNKCInterestedDetails(db.mysql.read, assortmentId, mobile, newThing, studentClass);
        // const check = await CourseMysqlV2.checkWebLeads(db.mysql.read, assortmentId, mobile, tag, studentClass, variantId);
        let messageToSend = 'Already Requested';
        if (_.isEmpty(check)) {
            // await CourseMysqlV2.setWebLeadsDetails(db.mysql.write, assortmentId, mobile, tag, studentClass, variantId);
            await CourseMysqlV2.setNKCInterestedDetails(db.mysql.write, assortmentId, mobile, newThing, studentClass);
            messageToSend = 'Request Accepted';
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                message: messageToSend,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getFormDetails(req, res, next) {
    /**
    Functionality - Get Form Widget Details from web_form_widgets table
    param1 - (group_id)
    returns - widgets with form details and options (wherever applicable)
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const { group_id: groupId, variant_id: variantId } = req.query;

        const widgets = [];
        const getWidgets = await CourseMysqlV2.getFormActiveWidgetsByGroupId(db.mysql.read, groupId);
        getWidgets.sort((a, b) => a.priority - b.priority);
        const multipleOptionWidget = ['dropdown', 'multi_choice_select', 'single_choice_select', 'checkbox'];
        for (let i = 0; i < getWidgets.length; i++) {
            if (getWidgets[i].widget_type === 'text_widget') {
                widgets.push({
                    type: getWidgets[i].widget_type,
                    title: getWidgets[i].title,
                    sub_title: getWidgets[i].sub_title,
                });
            } else if (getWidgets[i].widget_type === 'button_widget') {
                widgets.push({
                    type: getWidgets[i].widget_type,
                    button_cta: getWidgets[i].title,
                    variant_id: variantId,
                    group_id: groupId,
                });
            } else if (multipleOptionWidget.includes(getWidgets[i].widget_type)) {
                const options = getWidgets[i].text.split('||');
                widgets.push({
                    id: getWidgets[i].id,
                    type: getWidgets[i].widget_type,
                    title: getWidgets[i].title,
                    sub_title: getWidgets[i].sub_title,
                    label_text: getWidgets[i].label,
                    option: options,
                    is_mandatory: getWidgets[i].is_mandatory,
                    is_unique_indetifier: getWidgets[i].identifier,
                });
            } else {
                widgets.push({
                    id: getWidgets[i].id,
                    type: getWidgets[i].widget_type,
                    title: getWidgets[i].title,
                    sub_title: getWidgets[i].sub_title,
                    label_text: getWidgets[i].label,
                    is_mandatory: getWidgets[i].is_mandatory,
                    is_unique_indetifier: getWidgets[i].identifier,
                });
            }
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function setFormDetails(req, res, next) {
    /**
    Functionality - Set data in web_form_responses table
    param1 (unique_identifier)
    param2 (variant_id)
    param3 (group_id)
    param4 (responses)
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        const {
            variant_id: variantId, group_id: groupId, responses,
        } = req.body;
        const uniqueIdentifier = responses.filter((item) => item.is_unique_indetifier === 1);
        let messageToSend = 'No Unique Indentifier Defined';
        if (uniqueIdentifier.length > 0) {
            const check = await CourseMysqlV2.checkWebFormDetails(db.mysql.read, groupId, uniqueIdentifier[0].submission);
            messageToSend = 'Already Requested';
            if (_.isEmpty(check)) {
                const obj = {};
                for (let i = 0; i < responses.length; i++) {
                    const replacement = `${responses[i].type}-${responses[i].id}`;
                    obj[replacement] = responses[i].submission;
                }
                await CourseMysqlV2.setWebFormDetails(db.mysql.write, groupId, variantId, uniqueIdentifier[0].submission, obj);
                messageToSend = 'Request Accepted';
            }
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                message: messageToSend,
            },
        };
        const widgets = await CourseMysqlV2.getFormActiveWidgetsByGroupId(db.mysql.read, groupId);
        const redirectionUrl = widgets.filter((item) => item.widget_type === 'button_widget');
        if (redirectionUrl.length > 0 && (redirectionUrl[0].label !== '' || redirectionUrl[0].label !== null)) {
            responseData.data.redirection_url = redirectionUrl[0].label;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getDetails,
    setDetails,
    getFormDetails,
    setFormDetails,
};
