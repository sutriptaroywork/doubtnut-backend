/**
 * This is a helper file of doubt pe charcha module,
 * built with class based architecture, used mysql as primary database
 * PRD: https://docs.google.com/document/d/1UD6f8_hfkO1FGmvZntbItA33fG1fgs3yQWgOZSepsN4
 */

const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid-random');
const logger = require('../../config/winston').winstonLogger;
const p2pMysql = require('../../modules/mysql/doubtPeCharcha');
const p2pData = require('../../data/doubtPeCharcha.data');
const redisLibrairy = require('../../modules/redis/library');
const redisClient = require('../../config/redis');
const kafka = require('../../config/kafka');
const Utility = require('../../modules/utility');
const microService = require('../../modules/microservice');
const studentRedis = require('../../modules/redis/student');

class DoubtPeCharchaHelper {
    /**
     * Asker can request for P2P in case she is not satisfied with any of the solutions on match page at the end of all
     * suggested videos or on pressing the back button in case user does not watch any solution from match page.
     * Basic notification based connect option for helpers to join a room for solving a doubt. Helpers once leave,
     * cannot rejoin a room later. Max 2 helpers join at a time.
     * Users would be able to access their past doubts - both as asker and helper as well as all active current doubts
     * from the the Doubt pe Charcha Page - which opens up from Top Icon, hamburger and profile icons of Doubt pe
     * charcha. Extended Room Availability: The rooms once created won't close and users would be able to enter them
     * later anytime as well / revisit solutions
     * @constructor
     */
    constructor(req, studentClass, studentId, locale, db, config, mongoClient) {
        this.config = config;
        this.db = db;
        this.locale = locale;
        this.mongoClient = mongoClient;
        this.req = req;
        this.roomType = 'p2p';
        this.totalAllowedMemebers = 3;
        this.student_id = studentId;
        this.collectionName = 'p2p_active_members';
        this.engagegdHelpersCollection = 'p2p_engaged_students';
        this.minVersionAllowed = 870;
        this.maxVersionAllowed = 906;
        this.maxOffsetCursor = 50;
        this.maxCoummunityVisitVideo = 5;
        this.studentName = (req.user.student_fname ? req.user.student_fname.replace(/\r?\n|\r/g, ' ').replace(/ +/g, ' ') : 'Doubtnut User');
        this.capitalize = (s) => {
            if (typeof s !== 'string') return '';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
        this.homeWidget = moment().add(2, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        if (_.isNull(studentClass)) {
            studentClass = 12;
        }
        this.student_class = parseInt(studentClass);
        this.inWords = (num) => {
            num = num.toString();
            const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ',
                'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
            const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
            if (num.length > 9) return '';
            const n = (`000000000${num}`).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return;
            let str = '';
            str += (parseInt(n[1]) !== 0) ? `${a[Number(n[1])] || `${b[n[1][0]]} ${a[n[1][1]]}`}crore ` : '';
            str += (parseInt(n[2]) !== 0) ? `${a[Number(n[2])] || `${b[n[2][0]]} ${a[n[2][1]]}`}lakh ` : '';
            str += (parseInt(n[3]) !== 0) ? `${a[Number(n[3])] || `${b[n[3][0]]} ${a[n[3][1]]}`}thousand ` : '';
            str += (parseInt(n[4]) !== 0) ? `${a[Number(n[4])] || `${b[n[4][0]]} ${a[n[4][1]]}`}hundred ` : '';
            str += (parseInt(n[5]) !== 0) ? `${((str !== '') ? 'and ' : '') + (a[Number(n[5])] || `${b[n[5][0]]} ${a[n[5][1]]}`)}` : '';
            return str;
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    async totalActiveP2pHelpers(helperFilter) {
        try {
            const redisKey = `P2P_HELPERS_${helperFilter.student_class}_${helperFilter.version_code.$gte}_${helperFilter.version_code.$lt}`;
            let totalHelpersCount = await redisLibrairy.getByKey(redisKey, redisClient);
            if (!totalHelpersCount) {
                totalHelpersCount = await this.mongoClient.read.collection(this.collectionName).countDocuments(helperFilter);
                await redisLibrairy.setByKey(redisKey, totalHelpersCount, 86400, redisClient);
            }
            return parseInt(totalHelpersCount);
        } catch (e) {
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'totalActiveP2pHelpers', error: errorLog });
            throw (e);
        }
    }

    async connect() {
        try {
            const roomId = `p2p${uuid()}`;
            const questionData = await p2pMysql.getQuestionNewDetails(this.req.body.question_id, this.db.mysql.read);
            await Promise.all([p2pMysql.connect(this.db.mysql.write, this.student_id, true, roomId, this.req.body.question_id, questionData[0].subject, questionData[0].class, questionData[0].locale),
                p2pMysql.addMember(this.db.mysql.write, this.student_id, true, roomId)]);
            const response = {
                members: [{ student_id: this.student_id, image: this.req.user.img_url || p2pData.defaultUserImage, name: this.studentName }],
                is_host: true,
                room_id: roomId,
                room_type: this.roomType,
                max_members: this.totalAllowedMemebers,
            };
            const { question_image: questionImage } = this.req.body;
            const { question_text: questionText } = this.req.body;
            this.notifyUsers(questionImage, questionText, roomId, this.studentName, this.student_class);
            await redisLibrairy.setByKey(`P2P_${this.student_id}`, 1, 10800, redisClient);
            return response;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'connect', error: errorLog });
            throw (e);
        }
    }

    async listMembers() {
        try {
            let isFeedback = false;
            const { room_id: roomId } = this.req.body;
            const members = _.uniq(await p2pMysql.getMembers(roomId, this.db.mysql.read), 'student_id');
            const roomType = 'p2p';
            let isGroupLimitReached = false;
            const reasons = (this.locale === 'hi' ? p2pData.feedbackSuggestionsHi : p2pData.feedbackSuggestionsEn);
            // isFeedback true means feedback would be required.
            const isFeedbackSubmitted = await p2pMysql.isFeedbackSubmitted(roomId, this.student_id, this.db.mysql.read);
            if (isFeedbackSubmitted && isFeedbackSubmitted[0].EXIST === 0) {
                isFeedback = true;
            }
            const data = [];
            for (let i = 0; i < members.length; i++) {
                if (_.isEmpty(members[i].name) || members[i].name === ' ') {
                    members[i].name = 'Doubtnut user';
                }
                data.push(members[i]);
            }
            const totalJoinedHelpers = _.countBy(members, (c) => c.is_host === 0).true;
            isGroupLimitReached = totalJoinedHelpers >= this.totalAllowedMemebers;
            const metaData = p2pData.meta_data;
            if (members.length) {
                metaData.question_image_url = members[0].question_image ? `${this.config.staticCDN}images/${members[0].question_image}` : null;
                metaData.question_text = members[0].ocr_text;
                metaData.branch_link = await this.getRoomBranchLink(this.req.body.room_id);
                metaData.notify_on_whatsapp_message = `doubt pe charcha #${this.req.body.room_id}`;
            }
            return {
                members: data,
                room_id: roomId,
                room_type: roomType,
                is_group_limit_reached: isGroupLimitReached,
                group_limit_reached_msg: p2pData.group_limit_reached_msg,
                reasons,
                max_members: this.totalAllowedMemebers,
                is_active: true,
                is_feedback: isFeedback,
                meta_data: metaData,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'listMembers', error: errorLog });
            throw (e);
        }
    }

    async feedback() {
        try {
            const {
                room_id: roomId, rating, text_feedback: textFeedback, reason, rating_for_student: ratingForStudent,
            } = this.req.body;
            await p2pMysql.feedback(rating, reason, this.student_id, ratingForStudent, roomId, textFeedback, this.db.mysql.write);
            return { message: 'Thanks for submitting feedback' };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'feedback', error: errorLog });
            throw (e);
        }
    }

    async getFeedbackData() {
        try {
            const { room_id: roomId } = this.req.body;
            const members = _.uniq(await p2pMysql.getMembers(roomId, this.db.mysql.read), 'student_id');
            const feedbackData = [];
            for (let i = 0; i < members.length; i++) {
                let title = members[i].name;
                if (_.isEmpty(members[i].name) || members[i].name === ' ') {
                    title = 'Doubtnut User';
                }
                feedbackData.push({
                    title: `Rate ${title.trim()}'s Answer`,
                    user_id: members[i].student_id,
                    profile_image: members[i].image,
                });
            }
            return {
                title: 'Give Feedback',
                skip_button_title: 'Skip',
                feedback_data: feedbackData,
                options_data: p2pData.options_data,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'getFeedbackData', error: errorLog });
            throw (e);
        }
    }

    async getDoubts(limit, offset, doubtType) {
        /**
         * The Doubt pe charcha page has 2 tabs and the details visible for each of the doubts will be as per
         * designs below. Rename the tabs as- My Doubts and Community Doubts. My Doubts will have past and
         * current doubts of the user(both as asker and helper). Community Doubts tab to have all new current P2P
         * requests coming in.Max 50 doubts to be shown in community doubts of only class of user or lower class ordered
         * by descending time.
         */
        try {
            // is_message = true -> user can send message ,false -> user can not send message
            // is_reply = true -> direct chat screen will be shown ,false -> animation screen will be shown
            const doubtData = [];
            let doubts;
            if (doubtType === 'My Doubts' || doubtType === 'मेरे डाउट') {
                doubts = await p2pMysql.getAskedDoubts(this.db.mysql.read, this.student_id, limit, offset);
            } else {
                doubts = await p2pMysql.getCommunityDoubts(this.db.mysql.read, this.student_class, limit, offset);
                doubts = _.uniqBy(doubts, 'room_id');
            }
            if (_.isEmpty(doubts)) {
                return [];
            }
            const members = _.uniq(await p2pMysql.getP2PMembers(this.db.mysql.read, _.map(doubts, (x) => x.room_id)), 'student_id');
            const groupedMembers = _.groupBy(members, 'room_id');
            for (let i = 0; i < doubts.length; i++) {
                let ctaText = (this.locale === 'hi' ? p2pData.ctaTextHi.myDoubts : p2pData.ctaTextEn.myDoubts);
                if (doubtType === 'Community Doubts' || doubtType === 'समुदाय डाउट') {
                    ctaText = (this.locale === 'hi' ? p2pData.ctaTextHi.community : p2pData.ctaTextEn.community);
                } else if (doubtType === 'similar') {
                    ctaText = (this.locale === 'hi' ? p2pData.ctaTextHi.similar : p2pData.ctaTextEn.similar);
                }
                let isReply = doubtType === 'similar';
                const membersImage = _.map(groupedMembers[doubts[i].room_id], (x) => x.img_url || p2pData.defaultUserImage);
                const filteredHost = _.filter(groupedMembers[doubts[i].room_id], { is_host: 1, student_id: this.student_id }).length;
                const isHost = filteredHost >= 1;
                const topIcon = (isHost ? p2pData.hostIcon : p2pData.helperIcon);
                // checking if student is already a member of this group, then we will take them to chat screen directly.
                const filteredMember = _.filter(groupedMembers[doubts[i].room_id], { student_id: this.student_id }).length;
                if (filteredMember >= 1) {
                    ctaText = (this.locale === 'hi' ? p2pData.ctaTextHi.myDoubts : p2pData.ctaTextEn.myDoubts);
                    isReply = true;
                    // we can not show doubts in which user is joined in any community doubts
                    if (doubtType === 'Community Doubts' || doubtType === 'समुदाय डाउट') {
                        continue;
                    }
                }
                const data = {
                    widget_data: {
                        room_id: doubts[i].room_id,
                        created_at: moment(doubts[i].created_at).format('Do MMM YYYY hh:mm A'),
                        top_icon: topIcon,
                        question_text: doubts[i].ocr_text,
                        question_image: (!_.isEmpty(doubts[i].question_image) ? `https://d10lpgp6xz60nq.cloudfront.net/images/${doubts[i].question_image}` : null),
                        message_count: null,
                        people_count: (membersImage.length === 1 ? null : membersImage.length),
                        is_host: isHost,
                        is_active: !!+doubts[i].is_active,
                        members_image: membersImage.slice(0, 2),
                        deeplink: `doubtnutapp://doubt_pe_charcha?room_id=${doubts[i].room_id}&is_host=${isHost}&is_message=${doubtType !== 'similar'}&is_reply=${isReply}`,
                        cta_text: ctaText,
                        message_icon: p2pData.messageIcon,
                    },
                    widget_type: 'widget_doubt_p2p',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                };
                doubtData.push(data);
            }
            return doubtData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'getAskedDoubts', error: errorLog });
            return false;
        }
    }

    async getHomeWidget() {
        try {
            const p2pHomeData = await redisLibrairy.getByKey(`P2P_${this.student_id}`, redisClient);
            if (!p2pHomeData) {
                return false;
            }
            const doubts = await p2pMysql.getHomeAskedDoubt(this.db.mysql.read, this.student_id, this.homeWidget);
            const members = _.uniq(await p2pMysql.getP2PMembers(this.db.mysql.read, _.map(doubts, (x) => x.room_id)), 'student_id');
            const groupedMembers = _.groupBy(members, 'room_id');
            if (!_.isEmpty(doubts)) {
                const membersImage = _.map(groupedMembers[doubts[0].room_id], (x) => x.img_url || p2pData.defaultUserImage);
                let text;
                const isAnyMemberJoined = membersImage.length > 1;
                if (isAnyMemberJoined) {
                    text = (this.locale === 'hi' ? p2pData.homeWidgetOneHi : p2pData.homeWidgetOneEn).replace('<>', this.inWords(membersImage.length));
                } else {
                    text = this.locale === 'hi' ? p2pData.homeWidgetConnectHi : p2pData.homeWidgetConnectEn;
                }
                return {
                    widget_data: {
                        title: 'Doubt Pe Charcha',
                        top_icon: p2pData.p2pTopIcon,
                        items: [{
                            type: 'widget_doubt_p2p_home',
                            scroll_type: 'Horizontal',
                            data: {
                                id: 24,
                                members_image: membersImage.slice(0, 2),
                                text,
                                is_any_member_joined: membersImage.length > 1,
                                question_image: (!_.isEmpty(doubts[0].question_image) ? `https://d10lpgp6xz60nq.cloudfront.net/images/${doubts[0].question_image}` : null),
                                question_text: doubts[0].ocr_text,
                                card_width: '1.1x',
                                deeplink: `doubtnutapp://doubt_pe_charcha?title=Doubt&room_id=${doubts[0].room_id}&room_type=p2p&is_host=${!!+doubts[0].is_host}&is_message=true&is_reply=true`,
                                unread_count: null,
                                cta_text: this.locale === 'hi' ? p2pData.ctaJoinHi : p2pData.ctaJoinEn,
                                secondary_cta_text: this.locale === 'hi' ? p2pData.ctaIgnoreHi : p2pData.ctaIgnoreEn,
                            },
                        }],
                        id: '1099',
                    },
                    widget_type: 'widget_parent',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                };
            }
            return false;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'getHomeWidget', error: errorLog });
            return false;
        }
    }

    async doubtTypes() {
        try {
            let doubtTypes = this.locale === 'hi' ? p2pData.doubtTypesHi : p2pData.doubtTypesEn;
            let activeTab = doubtTypes[0];
            let doubtData = await this.getDoubts(10, 0, activeTab);
            if (_.isEmpty(doubtData)) {
                doubtTypes = this.locale === 'hi' ? p2pData.doubtTypes2Hi : p2pData.doubtTypes2En;
                activeTab = doubtTypes[0];
                doubtData = await this.getDoubts(10, 0, activeTab);
            }
            return {
                doubt_types: doubtTypes, active_tab: activeTab, doubt_data: doubtData, offset_cursor: 10,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'doubtTypes', error: errorLog });
            throw (e);
        }
    }

    async doubts() {
        try {
            let offsetCursor;
            const limit = 10;
            let offset = 0;
            let doubtData = [];
            if (_.isEmpty(this.req.body.offset_cursor)) {
                offsetCursor = limit;
            } else {
                offsetCursor = parseInt(this.req.body.offset_cursor) + limit;
                offset = parseInt(this.req.body.offset_cursor);
            }
            if (offsetCursor <= this.maxOffsetCursor) {
                doubtData = await this.getDoubts(limit, offset, this.req.body.doubt_type);
            }
            return { doubt_type: this.req.body.doubt_type, doubt_data: doubtData, offset_cursor: offsetCursor };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'doubtTypes', error: errorLog });
            throw (e);
        }
    }

    async similarSolvedDoubts() {
        try {
            let offsetCursor;
            const limit = 10;
            let offset = 0;
            let doubtData = [];
            if (_.isEmpty(this.req.body.offset_cursor)) {
                offsetCursor = limit;
            } else {
                offsetCursor = parseInt(this.req.body.offset_cursor) + limit;
                offset = parseInt(this.req.body.offset_cursor);
            }
            if (offsetCursor <= this.maxOffsetCursor) {
                doubtData = await this.getDoubts(limit, offset, 'similar');
            }
            return { question_id: this.req.body.question_id, doubt_data: doubtData, offset_cursor: offsetCursor };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'doubtTypes', error: errorLog });
            throw (e);
        }
    }

    async helperData() {
        try {
            let data = {};
            const getHelperData = await p2pMysql.getHelperData(this.db.mysql.read, this.req.body.room_id);
            if (!_.isEmpty(getHelperData)) {
                data = {
                    room_id: getHelperData[0].room_id,
                    question_text: getHelperData[0].ocr_text,
                    question_image: (!_.isEmpty(getHelperData[0].question_image) ? `https://d10lpgp6xz60nq.cloudfront.net/images/${getHelperData[0].question_image}` : null),
                    is_active: true,
                    title1: this.locale === 'hi' ? p2pData.helperTitle1Hi : p2pData.helperTitle1En,
                    title2: this.locale === 'hi' ? p2pData.helperTitle2Hi : p2pData.helperTitle2En,
                    button_text: this.locale === 'hi' ? p2pData.ctaHelperHi : p2pData.ctaHelperEn,
                    thumbnail_images: this.locale === 'hi' ? p2pData.p2pHelperThumbnailsHi : p2pData.p2pHelperThumbnailsEn,
                };
            }
            return { doubt_type: this.req.body.doubt_type, ques_data: data };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'helperData', error: errorLog });
            throw (e);
        }
    }

    async addMember() {
        try {
            const { room_id: roomId } = this.req.body;
            let isGroupLimitReached = true;
            let response = {
                is_group_limit_reached: isGroupLimitReached,
            };
            const hostData = await p2pMysql.getHostDetails(roomId, this.db.mysql.read);
            if (!_.isEmpty(hostData) && hostData[0].gcm_reg_id) {
                // first check if student is already a member of this group
                const isMember = await p2pMysql.isMember(roomId, this.student_id, this.db.mysql.read);
                if (isMember && isMember[0].EXIST === 0) {
                    await p2pMysql.addMember(this.db.mysql.write, this.student_id, false, roomId);
                }
                isGroupLimitReached = false;
                response = {
                    is_group_limit_reached: isGroupLimitReached,
                };
                const notificationData = {
                    event: 'doubt_pe_charcha',
                    title: p2pData.acceptNotifEn.replace('<>', this.studentName),
                    message: p2pData.acceptNotifMessageEn,
                    image: null,
                    firebase_eventtag: 'p2p',
                    data: {
                        title: 'Doubt', room_id: roomId, room_type: this.roomType, is_host: true, is_reply: true, is_message: true,
                    },
                };
                // TODO: version code to be updated
                if (this.req.headers.version_code <= 1010) {
                    kafka.newtonNotification({
                        data: notificationData,
                        to: [hostData[0].gcm_reg_id],
                        studentId: [hostData[0].student_id],
                    });
                }
                // const data = {
                //     phone: parseInt(`91${hostData[0].mobile}`),
                //     studentId: hostData[0].student_id,
                //     text: `${p2pData.solve_now_whatsapp_msg.replace('{name}', this.studentName)}\n`,
                //     preview: false,
                //     bulk: false,
                // };
                // microService.requestMicroServer('/api/whatsapp/send-text-msg', data, this.req.headers['x-auth-token'], this.req.headers.version_code, 'PUT');
            }
            return response;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'addMember', error: errorLog });
            throw (e);
        }
    }

    async deactivate() {
        try {
            const { room_id: roomId } = this.req.body;
            const isHost = await p2pMysql.isHost(roomId, this.student_id, this.db.mysql.read);
            let isHostDeactivated = false;
            if (isHost && isHost[0].EXIST === 1) {
                // applicable to deactivate group now
                const totalHelpers = await p2pMysql.getTotalHelpers(roomId, this.db.mysql.read);
                if (totalHelpers && totalHelpers[0].total !== 0) {
                    // TODO: temporarily changed host can not deactivate
                    // await doubtPeCharchaMysql.deactivateGroup(room_id, this.db.mysql.write);
                    // isHostDeactivated = true;
                    isHostDeactivated = false;
                }
            } else {
                // deactivate only non host member
                console.log('temporary deactivation not enabled');
                // TODO: uncomment below line if member can be deactivated
                // await doubtPeCharchaMysql.deactivateMember(room_id, this.student_id, this.db.mysql.write);
            }
            return {
                is_host: isHostDeactivated,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'deactivate', error: errorLog });
            throw (e);
        }
    }

    async notifyUsers(questionImage, questionText, roomId, name, studentClass) {
        try {
            const chunkSize = 200;
            const engagedChunkSize = 25;
            const notificationData = {
                event: 'doubt_pe_charcha',
                title: p2pData.notifyTitleEn.replace('<>', name),
                message: p2pData.notifyMessageEn.replace('<>', ''),
                image: null,
                firebase_eventtag: 'p2p',
                data: {
                    title: 'Doubt', room_id: roomId, room_type: this.roomType, is_host: false, is_reply: false, is_message: true,
                },
            };
            if (questionImage) {
                notificationData.image = questionImage;
            }
            if (questionText) {
                notificationData.message = p2pData.notifyMessageEn.replace('<>', `on ${questionText}`);
            }
            if (studentClass) {
                studentClass = parseInt(studentClass);
            }
            if (this.req.headers.version_code >= 906) {
                this.minVersionAllowed = 906;
                this.maxVersionAllowed = 2000;
            }
            const helperFilter = {
                student_class: studentClass,
                version_code: { $gte: this.minVersionAllowed, $lt: this.maxVersionAllowed },
            };
            const totalHelpers = await this.totalActiveP2pHelpers(helperFilter);
            const randomSeq = _.random(1, totalHelpers - chunkSize);
            let randomStudentIds = await this.mongoClient.read.collection(this.collectionName).find(helperFilter).limit(chunkSize).skip(randomSeq)
                .toArray();
            const engagedHelpers = await this.mongoClient.read.collection(this.engagegdHelpersCollection).aggregate([
                {
                    $match: {
                        student_class: studentClass,
                    },
                },
                { $sample: { size: engagedChunkSize } },
            ]).toArray();
            randomStudentIds = randomStudentIds.concat(engagedHelpers);
            const studentIds = [];
            let students = null;
            const totalRandomStudents = randomStudentIds.length;
            // console.log('totalRandomStudents found => ', totalRandomStudents);
            if (totalRandomStudents) {
                for (let s = 0; s <= totalRandomStudents; s++) {
                    if (randomStudentIds[s] && randomStudentIds[s].student_id && randomStudentIds[s].student_id !== this.student_id) {
                        studentIds.push(parseInt(randomStudentIds[s].student_id));
                    }
                }
                students = await p2pMysql.getStudentsData(studentIds, this.minVersionAllowed, this.db.mysql.read);
            }
            if (students) {
                const notifReceivers = [];
                const gcmRegIds = [];
                for (let i = 0; i <= students.length; i++) {
                    if (students[i] && students[i].gcm_reg_id) {
                        notifReceivers.push(students[i].student_id);
                        gcmRegIds.push(students[i].gcm_reg_id);
                    }
                }
                if (notifReceivers.length) {
                    kafka.newtonNotification({
                        data: notificationData,
                        to: gcmRegIds,
                        studentId: notifReceivers,
                    });
                }
            }
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'notifyUsers', error: errorLog });
            return false;
        }
    }

    async home() {
        /**
         * The Doubt pe charcha page has 2 tabs and the details visible for each of the doubts will be as per
         * designs below. Rename the tabs as- My Doubts and Community Doubts. My Doubts will have past and
         * current doubts of the user(both as asker and helper). Community Doubts tab to have all new current P2P
         * requests coming in.Max 50 doubts to be shown in community doubts of only class of user or lower class ordered
         * by descending time.
         */
        try {
            const { homeTabs } = p2pData;
            const limit = 10;
            const offset = 0;
            const primaryTabId = this.req.body.primary_tab_id;
            // secondary_tab_id will be integer field only, can be used as bool in mysql query
            const secondaryTabId = this.req.body.secondary_tab_id;
            const doubtData = await this.getDoubtsV2(primaryTabId, secondaryTabId, limit, offset);
            const filters = p2pData.default_filters;
            homeTabs.secondary_tabs = primaryTabId === 2 ? [] : p2pData.secondary_tabs;
            homeTabs.active_secondary_tab_id = secondaryTabId;
            if (primaryTabId === 2) {
                const communityDoubtVisitCount = await studentRedis.getP2pCommunityVisitCount(this.db.redis.read, this.student_id);
                if (!communityDoubtVisitCount) {
                    studentRedis.setP2pCommunityVisitCount(this.db.redis.write, this.student_id, 1);
                    doubtData.unshift(p2pData.video_widget);
                } else if (communityDoubtVisitCount <= this.maxCoummunityVisitVideo) {
                    studentRedis.updateP2pCommunityVisitCount(this.db.redis.write, this.student_id);
                    doubtData.unshift(p2pData.video_widget);
                }
            }

            // primary tabs data based on my doubts availability
            // homeTabs.primary_tabs = (isMyDoubtsExists && isMyDoubtsExists[0].exist === 1) ? p2pData.homeTabs.primary_tabs : p2pData.primary_tabs_community_only;

            // show no doubts info screen in case no doubts found with applied filters
            homeTabs.no_doubts = _.isEmpty(doubtData) ? p2pData.no_doubts : null;
            return {
                ...homeTabs, filters, doubt_data: doubtData,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'home', error: errorLog });
            return false;
        }
    }

    async getDoubtsV2(primaryTabId, isAskedByMe, limit, offset) {
        /**
         * The Doubt pe charcha page has 2 tabs and the details visible for each of the doubts will be as per
         * designs below. Rename the tabs as- My Doubts and Community Doubts. My Doubts will have past and
         * current doubts of the user(both as asker and helper). Community Doubts tab to have all new current P2P
         * requests coming in.Max 50 doubts to be shown in community doubts of only class of user or lower class ordered
         * by descending time.
         */
        try {
            console.log('Calling get doubts v2 function => ', {
                primaryTabId, isAskedByMe, limit, offset,
            });
            // is_message = true -> user can send message ,false -> user can not send message
            // is_reply = true -> direct chat screen will be shown ,false -> animation screen will be shown
            const doubtData = [];
            // subject will be comma separated: maths, science, english
            const { subjects } = this.req.body;
            const questionClasses = this.req.body.question_classes;
            const questionLanguages = this.req.body.question_languages;
            const filterQuery = DoubtPeCharchaHelper.getFilterQuery(subjects, questionClasses, questionLanguages);
            console.log('\n', filterQuery, ' <== filters ==>\n\n');
            let doubts = [];
            console.log(this.studentName, this.student_id);
            let showHelpPage = false;
            if (primaryTabId === 1) {
                // my doubts section
                doubts = await p2pMysql.getHomeDoubts(this.db.mysql.read, this.student_id, isAskedByMe, limit, offset, filterQuery);
            } else if (primaryTabId === 2) {
                // community doubts section
                const tillDate = moment().add(5, 'hours').add(30, 'minutes').subtract(30, 'days')._d;
                doubts = await p2pMysql.getCommunityDoubtsV2(this.db.mysql.read, limit, offset, tillDate, filterQuery);
            }
            doubts = _.uniqBy(JSON.parse(JSON.stringify(doubts)), 'question_id');
            for (let i = 0; i <= doubts.length; i++) {
                if (doubts[i]) {
                    if ((doubts[i].is_host === 1 && primaryTabId === 2) || primaryTabId === 1) {
                        showHelpPage = false;
                    } else if (doubts[i].is_host === 0 && primaryTabId === 2) {
                        showHelpPage = true;
                    }
                    let topStripBgColor = p2pData.top_strip_bg_color_odd;
                    let outerBgColor = p2pData.outer_bg_color_odd;
                    let tagBgColor = p2pData.evenTagColor;
                    if (i % 2 === 0) {
                        topStripBgColor = p2pData.top_strip_bg_color_even;
                        outerBgColor = p2pData.outer_bg_color_even;
                        tagBgColor = p2pData.oddTagColor;
                    }
                    const ctaData = p2pData.solve_stage_cta[doubts[i].is_solved][`secondary_tab_id_${isAskedByMe}`];
                    const data = {
                        widget_data: {
                            subject: doubts[i].subject,
                            timestamp: moment(doubts[i].created_at).format('Do MMM YYYY hh:mm A'),
                            ocr_text: doubts[i].ocr_text,
                            image_url: (!_.isEmpty(doubts[i].question_image) ? `https://doubtnut-static.s.llnwi.net/static-imagekit/images/${doubts[i].question_image}` : null),
                            room_id: doubts[i].room_id,
                            question_id: doubts[i].question_id,
                            cta: {
                                title: ctaData.title,
                                deeplink: `doubtnutapp://doubt_pe_charcha?room_id=${doubts[i].room_id}&show_help_page=${showHelpPage}&is_reply=true`,
                                title_color: ctaData.title_color,
                            },
                            top_strip_bg_color: topStripBgColor,
                            outer_bg_color: outerBgColor,
                            featured_tag: null,
                        },
                    };
                    const tags = [];
                    if (doubts[i].class || typeof doubts[i].class !== 'undefined') {
                        let classPrefix = p2pData.default_class_prefix;
                        if (doubts[i].class === 14) {
                            classPrefix = '';
                        }
                        let classTitle = `${classPrefix} ${DoubtPeCharchaHelper.getMappingTitle(doubts[i].class, _.find(p2pData.default_filters, { title_filter: 'Class' }).options)}`;
                        if (doubts[i].class === 13) {
                            classTitle = 'Class 12';
                        }
                        tags.push({
                            // title: `Class ${doubts[i].class}`,
                            title: classTitle,
                            bg_color: tagBgColor,
                        });
                    }
                    if (doubts[i].locale || typeof doubts[i].locale !== 'undefined') {
                        tags.push({
                            title: `${DoubtPeCharchaHelper.getMappingTitle(doubts[i].locale, _.find(p2pData.default_filters, { title_filter: 'Language' }).options)} Medium`,
                            bg_color: tagBgColor,
                        });
                    }
                    data.widget_data.tags = tags;
                    data.widget_data.debug_data = doubts[i];
                    // console.log(Object.assign(p2pData.doubtWidget, data), ' Object assign');
                    doubtData.push(JSON.parse(JSON.stringify(Object.assign(p2pData.doubtWidget, data))));
                    // console.log(doubtData, ' doubtData');
                }
            }
            return doubtData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'getDoubtsV2', error: errorLog });
            return [];
        }
    }

    async doubtsV2() {
        /**
         * The Doubt pe charcha page has 2 tabs and the details visible for each of the doubts will be as per
         * designs below. Rename the tabs as- My Doubts and Community Doubts. My Doubts will have past and
         * current doubts of the user(both as asker and helper). Community Doubts tab to have all new current P2P
         * requests coming in.Max 50 doubts to be shown in community doubts of only class of user or lower class ordered
         * by descending time.
         */
        try {
            const limit = 10;
            let page = parseInt(this.req.body.page);
            const offset = page * limit;
            const doubtData = await this.getDoubtsV2(this.req.body.primary_tab_id, this.req.body.secondary_tab_id, limit, offset);
            if (doubtData) {
                page += 1;
            }
            return { doubt_data: doubtData, page };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'doubtsV2', error: errorLog });
            return false;
        }
    }

    async getHomeFilters() {
        /**
         * The Doubt pe charcha page has 2 tabs and the details visible for each of the doubts will be as per
         * designs below. Rename the tabs as- My Doubts and Community Doubts. My Doubts will have past and
         * current doubts of the user(both as asker and helper). Community Doubts tab to have all new current P2P
         * requests coming in.Max 50 doubts to be shown in community doubts of only class of user or lower class ordered
         * by descending time.
         */
        try {
            const filters = await p2pMysql.getAskedDoubtFilters(this.db.mysql.read, this.student_id);
            const filtersData = [];
            if (filters) {
                const filterData = JSON.parse(JSON.stringify(filters));
                const subjectOccurrences = _.uniq(_.map(filterData, 'subject'));
                const classOccurrences = _.sortBy(_.uniq(_.map(filterData, 'class')));
                const localeOccurrences = _.uniq(_.map(filterData, 'locale'));
                if (subjectOccurrences) {
                    const subjectFilters = await this.getSpecificFilter(subjectOccurrences, 'Subject', this.req.body.subject);
                    if (subjectFilters) {
                        filtersData.push(subjectFilters);
                    }
                }
                if (classOccurrences) {
                    const classFilters = await this.getSpecificFilter(classOccurrences, 'Class', this.req.body.question_classes);
                    if (classFilters) {
                        filtersData.push(classFilters);
                    }
                }
                if (localeOccurrences) {
                    const localeFilters = await this.getSpecificFilter(localeOccurrences, 'Language', this.req.body.question_languages);
                    if (localeFilters) {
                        filtersData.push(localeFilters);
                    }
                }
            }
            return filtersData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'getHomeFilters', error: errorLog });
            return false;
        }
    }

    async getSpecificFilter(filterArray, title, selected) {
        try {
            let selectedOptionId = 'All';
            if (selected) {
                selectedOptionId = filterArray[0];
            }
            const options = [];
            for (let i = 0; i < filterArray.length; i++) {
                options.push({ filter_id: filterArray[i], title: filterArray[i] });
            }
            return { title_filter: title, selected_option_id: selectedOptionId, options };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'getSpecificFilter', error: errorLog });
            return false;
        }
    }

    async whatsappInitiated() {
        /**
         * The Doubt pe charcha page has 2 tabs and the details visible for each of the doubts will be as per
         * designs below. Rename the tabs as- My Doubts and Community Doubts. My Doubts will have past and
         * current doubts of the user(both as asker and helper). Community Doubts tab to have all new current P2P
         * requests coming in.Max 50 doubts to be shown in community doubts of only class of user or lower class ordered
         * by descending time.
         */
        try {
            const roomId = this.req.body.number;
            await redisLibrairy.setByKey(`P2P_WA_${roomId}`, true, 86400, redisClient);
            return { message: [`${p2pData.whatsapp.confirm_whatsapp_notify} ${p2pData.community_doubt_deeplink}`] };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'doubtsV2', error: errorLog });
            return false;
        }
    }

    async markSolved() {
        try {
            const {
                room_id: roomId, sender_id: senderId, message_id: messageId, event,
            } = this.req.body;
            const solveStage = p2pData.mark_solved_stage[event];
            const promises = [p2pMysql.markSolved(this.db.mysql.write, roomId, this.student_id, senderId, messageId, event, solveStage),
                p2pMysql.updateHelperLevelDoubtStage(this.db.mysql.write, solveStage, this.student_id, roomId),
                this.getRoomBranchLink(roomId), p2pMysql.getHostDetails(roomId, this.db.mysql.read)];
            // mark solved at parent only in case doubt is completely solved, so that it won't show in community doubts
            if (p2pData.solved_stages.includes(solveStage)) {
                promises.push(p2pMysql.markSolvedAtParent(this.db.mysql.write, solveStage, roomId));
            }
            let whatsappText = null;
            if (event === 'solve_now_clicked') {
                whatsappText = p2pData.solve_now_whatsapp_msg.replace('{name}', this.studentName);
            } else if (event === 'answer_mark_solved') {
                whatsappText = p2pData.mark_solved_whatsapp_msg;
            } else if (event === 'answer_rejected') {
                promises.push(p2pMysql.updateHelperLevelDoubtStage(this.db.mysql.write, solveStage, senderId, roomId));
            }
            const promiseData = await Promise.all(promises);
            if (whatsappText && !_.isEmpty(promiseData[3])) {
                const data = {
                    phone: parseInt(`91${promiseData[3][0].mobile}`),
                    studentId: this.student_id,
                    text: `${whatsappText}\n ${promiseData[2]}`,
                    preview: false,
                    bulk: false,
                };
                microService.requestMicroServer('/api/whatsapp/send-text-msg', data, this.req.headers['x-auth-token'], this.req.headers.version_code, 'PUT');
            }
            return {
                is_marked: true,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'markSolved', error: errorLog });
            throw (e);
        }
    }

    async getRoomBranchLink(roomId) {
        try {
            // sample deeplink to visit chat page
            // doubtnutapp://doubt_pe_charcha?room_id=p2p37bb4066-c6c2-4a93-994b-17e67537a94d&is_host=true
            let branchLink = null;
            const p2pBranchLink = await redisLibrairy.getByKey(`P2P_BRANCH_${roomId}`, redisClient);
            if (!p2pBranchLink) {
                const shareLink = await Utility.generateDeeplinkFromAppDeeplinkWithNewSession(this.config.branch_key, 'p2p_room',
                    'doubt_pe_charcha', `doubtnutapp://doubt_pe_charcha?room_id=${roomId}&is_reply=true&is_message=true`);
                if (shareLink && shareLink.url) {
                    branchLink = shareLink.url;
                    await redisLibrairy.setByKey(`P2P_BRANCH_${roomId}`, branchLink, 10800, redisClient);
                }
            } else {
                branchLink = JSON.parse(p2pBranchLink);
            }
            return branchLink;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'DoubtPeCharchaHelper', source: 'generateRoomBranchLink', error: errorLog });
            throw (e);
        }
    }

    static getFilterQuery(subjects, questionClasses, questionLanguages) {
        let subjectsQuery = '';
        let classesQuery = '';
        let languagesQuery = '';
        if (subjects.length) {
            subjectsQuery = ` and p2p.subject in ('${subjects.join("','")}')`;
        }
        if (questionClasses.length) {
            classesQuery = ` and p2p.class in (${questionClasses})`;
        }
        if (questionLanguages.length) {
            languagesQuery = ` and p2p.locale in ('${questionLanguages.join("','")}')`;
        }
        return subjectsQuery.concat(classesQuery, languagesQuery);
    }

    static getMappingTitle(filterId, data) {
        const mappedObj = _.find(data, { filter_id: filterId });
        if (mappedObj && mappedObj.title) {
            return mappedObj.title;
        }
        // in case any tag is not mapped, still show tabs like en
        return filterId;
    }
}

module.exports = DoubtPeCharchaHelper;
