/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-globals */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
/* eslint-disable radix */
/* eslint-disable camelcase */
/* eslint-disable eqeqeq */
/* eslint-disable no-shadow */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const RecommendationMysql = require('../../../modules/mysql/recommendation');
const RecommendationRedis = require('../../../modules/redis/recommendation');
const Coursev2Mysql = require('../../../modules/mysql/coursev2');
const CourseHelper = require('../../helpers/course.js');

const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');

function radioButtonWidget(message) {
    return {
        type: 'widget_cr_que_radio_btn',
        data: {
            submit_id: message.id,
            items: [
            ],
        },
    };
}

function createRedisRepsonse(currentMessageDetails, selectedOptionKey) {
    return {
        message_id: currentMessageDetails.id,
        selected_option_key: selectedOptionKey,
        type: currentMessageDetails.type,
        message_order_group: currentMessageDetails.message_order_group,
    };
}

async function insertLogData({
    db, sessionId, studentId, messageId, nextMessages, selectedOptionKey, initiate,
}) {
    const insertLogData = {
        session_id: sessionId,
        student_id: studentId,
        message_id: (_.isEmpty(messageId.toString())) ? nextMessages[0].id : messageId,
    };
    if (!_.isEmpty(selectedOptionKey) && !initiate) {
        insertLogData.selected_option = selectedOptionKey;
    }
    RecommendationMysql.addSubmitLog(db.mysql.write, insertLogData);
}

function getFeedbackItems(nextMessage) {
    const feedbackOptions = nextMessage.options ? nextMessage.options.split('#!#') : [];
    const feedbackDeeplinks = nextMessage.deeplinks ? nextMessage.deeplinks.split('#!#') : [];
    const feedbackIconUrls = nextMessage.icon_urls ? nextMessage.icon_urls.split('#!#') : [];
    let items = [];
    if (!_.isEmpty(feedbackOptions)) {
        items = feedbackOptions.map((item) => ({
            key: item,
            value: item,
        }));
        items = items.map((item, index) => ({
            ...item,
            icon_url: buildStaticCdnUrl(feedbackIconUrls[index]) || null,
            deeplink: feedbackDeeplinks[index] || null,
        }));
    }
    return items;
}

function getFilterRescursively({
    filterData, userResponse, nextMessage, userLocale,
}) {
    if (nextMessage.type === 'message' || nextMessage.type === 'recommended_package' || _.isEmpty(filterData)) {
        // no filters for message type
        return [];
    }
    if (_.isEmpty(userResponse) && nextMessage.type !== 'message') {
        return _.chain(filterData)
            .groupBy(nextMessage.type)
            .map((value, key) => {
                if (nextMessage.type === 'class') {
                    let v = +key === 13 ? `${userLocale === 'hi' ? 'ड्रॉपर' : 'Dropper'}` : `${userLocale === 'hi' ? 'कक्षा' : 'Class'} ${key}`;
                    if (+key === 14) {
                        v = `${userLocale === 'hi' ? 'Govt. Exam' : 'Govt. Exam'}`;
                    }
                    return {
                        key,
                        value: v,
                    };
                }
                return {
                    key,
                    value: key,
                };
            })
            .value();
    }
    const cloned = _.clone(userResponse);
    let temp = [];
    if (_.isEmpty(userResponse)) {
        temp = _.groupBy(filterData, nextMessage.type);
    } else if (cloned[0].type === 'feedback') {
        temp = filterData;
    } else {
        temp = _.groupBy(filterData, cloned[0].type)[cloned[0].selected_option_key];
    }
    if (_.isEmpty(temp)) {
        console.log('something is wrong/data issue');
        return [];
    }
    cloned.splice(0, 1);
    return getFilterRescursively({
        filterData: temp, userResponse: cloned, nextMessage, userLocale,
    });
}

async function generateByType({
    db,
    config,
    versionCode,
    nextMessage,
    userLocale,
    filterData,
    userResponse,
    studentId,
    xAuthToken,
    isBrowser,
}) {
    const itemWidgets = [];
    const variants = [];
    const shouldNotSendData = nextMessage.type === 'feedback_response' && userResponse[userResponse.length - 1].selected_option_key === 'YES';
    if (shouldNotSendData) return { itemWidgets, variants };
    if (!_.isEmpty(nextMessage.message)) {
        itemWidgets.push({
            type: 'widget_cr_message',
            data: {
                submit_id: nextMessage.id,
                title: nextMessage.message,
            },
        });
    }
    let obj = {};
    switch (nextMessage.type) {
        case 'recommended_package':
            const { courseWidget, flagrVariants: courseWidgetFlagrVariants } = await CourseHelper.generateRecommendedCourseWidget({
                db,
                config,
                versionCode,
                userLocale,
                studentId,
                userResponse,
                xAuthToken,
                isBrowser,
            });
            if (!_.isEmpty(courseWidget.data.items)) {
                itemWidgets.push(courseWidget);
            }
            variants.push(...courseWidgetFlagrVariants);
            break;
        case 'feedback':
        case 'feedback_response':
            obj = radioButtonWidget(nextMessage);
            obj.data.items = getFeedbackItems(nextMessage, userResponse);
            if (!_.isEmpty(obj.data.items)) {
                itemWidgets.push(obj);
            }
            break;
        default:
            obj = radioButtonWidget(nextMessage);
            obj.data.items = getFilterRescursively({
                filterData, userResponse, nextMessage, userLocale,
            });
            if (!_.isEmpty(obj.data.items)) {
                itemWidgets.push(obj);
            }
    }
    return {
        itemWidgets,
        variants,
    };
}

async function generateWidget({
    db, config, versionCode, messageList, filterData, locale, userResponse, studentId, xAuthToken, isBrowser, sessionId, isBack, page,
}) {
    const widget = {};
    widget.type = 'widget_parent_cr_incoming';
    widget.data = {};
    widget.data.image_url = 'test.png';
    widget.data.items = [];
    let itemWidget = [];
    const variants = [];

    for (let i = 0; i < messageList.length; i++) {
        const { itemWidgets: messageWidgets = [], variants: currentVariants = [] } = await generateByType({
            db,
            config,
            versionCode,
            nextMessage: messageList[i],
            userLocale: locale,
            filterData,
            userResponse,
            studentId,
            xAuthToken,
            isBrowser,
        });
        variants.push(...currentVariants);
        if (messageWidgets.length) {
            if ((messageWidgets[0].type === 'widget_cr_que_radio_btn' && messageWidgets[0].data.items.length == 1) || (messageWidgets[1] && messageWidgets[1].type === 'widget_cr_que_radio_btn' && messageWidgets[1].data.items.length == 1)) {
                const dataWidget = messageWidgets[0].type === 'widget_cr_que_radio_btn' ? messageWidgets[0].data : messageWidgets[1].data;
                await RecommendationRedis.setUserResponse(db.redis.write, studentId, sessionId, createRedisRepsonse(messageList[i], dataWidget.items[0].value));
                insertLogData({
                    db, sessionId, studentId, messageId: dataWidget.submit_id, selectedOptionKey: dataWidget.items[0].value,
                });
                userResponse = await RecommendationRedis.getUserResponseBySessionId(db.redis.read, studentId, sessionId);
                userResponse = _.chain(userResponse)
                    .values().map((item) => JSON.parse(item))
                    .sortBy(['message_order_group'])
                    .value();
                const nextMessages = await RecommendationMysql.getMessage(db.mysql.read, messageList[i].message_order_group + 1, locale, isBack, page, versionCode);
                messageList = [...messageList, ...nextMessages];
                continue;
            } else if (messageList[i].type === 'meta_info') {
                const categoryTypeResponse = userResponse.filter((item) => item.type === 'category_type');
                // * Do not show meta_info message type in response, skip to next message type
                if (categoryTypeResponse[0] && (categoryTypeResponse[0].selected_option_key === 'SPOKEN ENGLISH' || categoryTypeResponse[0].selected_option_key === 'SSC' || categoryTypeResponse[0].selected_option_key === 'DEFENCE/NDA/NAVY')) {
                    const nextMessages = await RecommendationMysql.getMessage(db.mysql.read, messageList[i].message_order_group + 1, locale, isBack, page, versionCode);
                    messageList = [...messageList, ...nextMessages];
                    continue;
                }
            }
        }
        itemWidget = [...itemWidget, ...messageWidgets];
    }
    if (!_.isEmpty(itemWidget)) {
        widget.data.items = itemWidget;
        return {
            widgets: [widget],
            variants,
        };
    }
    return {
        widgets: [],
        variants,
    };
}

async function chat(req, res) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let {
            // eslint-disable-next-line prefer-const
            session_id: sessionId, message_id: messageId, selected_option_key: selectedOptionKey, initiate, is_back: isBack = false, page,
        } = req.body;
        const { version_code: versionCode, 'x-auth-token': xAuthToken, is_browser: isBrowser } = req.headers;
        sessionId = (_.isEmpty(sessionId) && initiate) ? uuidv4() : sessionId;
        const { student_id: studentId = 0 } = req.user || {};
        let { locale = 'en' } = req.user || {};
        locale = (locale !== 'hi') ? 'en' : locale;
        page = page || 'explore_page';
        if (isBrowser) {
            locale = 'en';
            page = 'web';
        }
        let messageOrderGroup = 1;
        let currentMessageDetails = [];
        let userResponse = [];
        if (!initiate) {
            currentMessageDetails = await RecommendationMysql.getByMessageId(db.mysql.read, messageId);

            await RecommendationRedis.setUserResponse(db.redis.write, studentId, sessionId, createRedisRepsonse(currentMessageDetails[0], selectedOptionKey));

            // get message by id
            // get user response by session id
            userResponse = await RecommendationRedis.getUserResponseBySessionId(db.redis.read, studentId, sessionId);
            if (!_.isEmpty(currentMessageDetails)) {
                userResponse = _.chain(userResponse)
                    .values().map((item) => JSON.parse(item))
                    .sortBy(['message_order_group'])
                    .value();
                messageOrderGroup = currentMessageDetails[0].message_order_group + 1;
            }
        }
        const nextMessages = await RecommendationMysql.getMessage(db.mysql.read, messageOrderGroup, locale, isBack, page, versionCode);
        let filterData = [];
        if (nextMessages.length > 0 && nextMessages[0].type !== 'recommended_package') {
            filterData = await Coursev2Mysql.getDistinctSelectionsFromCourseDetailsApp(db.mysql.read);
        }
        if ((page === 'post_purchase_page' && !initiate) || page !== 'post_purchase_page') {
            insertLogData({
                db, sessionId, studentId, messageId, nextMessages, initiate, selectedOptionKey,
            });
        }
        const { widgets, variants } = await generateWidget({
            db,
            config,
            versionCode,
            messageList: nextMessages,
            filterData,
            locale,
            userResponse,
            studentId,
            xAuthToken,
            isBrowser,
            sessionId,
            isBack,
            page,
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
                analytics: {
                    variant_info: variants,
                },
            },
            data: { widgets, session_id: sessionId },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    chat,
};
