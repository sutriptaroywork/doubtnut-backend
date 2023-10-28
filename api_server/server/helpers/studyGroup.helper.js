/**
 * This is a helper file of student rewards module,
 * built with class based architecture, used no-sql as primary database
 * PRD: https://docs.google.com/document/d/1IpWMIPNUi9EyIciisMSLb9Tgu8GQVtqDig4Wd_e3ASs
 */

const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid-random');
const logger = require('../../config/winston').winstonLogger;
const studyGroupMysql = require('../../modules/mysql/studyGroup');
const Utility = require('../../modules/utility');
const UtilityFlagr = require('../../modules/Utility.flagr');
const studGroupData = require('../../data/studyGroup.data');
// const messages = require('./sendsms.handler');
const studyGroupRedis = require('../../modules/redis/studygroup');
const studentRedis = require('../../modules/redis/student');
const profanity = require('./profanity-hindi');
const inst = require('../../modules/axiosInstances');

const TOTAL_ALLOWED_GROUPS_AS_ADMIN = 5;
const TOTAL_ALLOWED_MEMBERS_IN_GROUP = 250;
const MIN_MEMBERS_IN_GROUP_TO_ENABLE_COMMUNICATION = 1;
const CDN_URL = 'https://d10lpgp6xz60nq.cloudfront.net/images/';
const MUTED_TILL_DAYS = 365 * 2;

class StudyGroupHelper {
    /**
     * Reward system is a new feature where students can mark their attendance,
     * and basis their attendance marked and  being consistent on the app will
     * give them rewards. There will be 7 levels of this reward system in which
     * users will get scratch cards.
     * @constructor
     */
    constructor(req, studentClass, studentId, locale, studentName, db, config, mongoClient) {
        this.config = config;
        this.db = db;
        this.locale = locale;
        this.mongoClient = mongoClient;
        this.req = req;
        this.xAuthToken = req.headers['x-auth-token'];
        this.roomType = 'studygroup';
        this.student_id = studentId;
        this.studentName = (studentName ? studentName.replace(/\r?\n|\r/g, ' ').replace(/ +/g, ' ') : 'Doubtnut User');
        this.message = 'Success';
        this.student_class = studentClass;
        this.groupId = null;
        this.capitalize = (s) => {
            if (typeof s !== 'string') return '';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
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

    getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    async updateGroupCache(groupId, field) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'x-auth-token': this.xAuthToken,
            };
            await inst.configMicroInst({
                method: 'POST',
                url: `${this.config.microUrl}/api/study-group/update-group-details`,
                timeout: 500,
                headers,
                data: {
                    group_id: groupId,
                    field,
                },
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    async isNotificationEnabled(studentId) {
        try {
            let isMute = false;
            const data = await studentRedis.get7Day(this.db.redis.read, 'SG_FEATURE_MUTE', studentId);
            if (!_.isNull(data)) {
                isMute = JSON.parse(data);
            } else {
                const studyGroupFeature = await studyGroupMysql.isFeatureMute(studentId, this.db.mysql.read);
                if (studyGroupFeature) {
                    isMute = Boolean(studyGroupFeature[0].is_mute);
                }
                studentRedis.set7Day(this.db.redis.write, 'SG_FEATURE_MUTE', studentId, isMute);
            }
            return isMute;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async notificationToInvitee(inviteeId, groupId, groupName) {
        try {
            const inviteeDetails = await studyGroupMysql.getStudentDetailsById(this.db.mysql.read, inviteeId);
            const isNotificationMuted = await this.isNotificationEnabled(inviteeId);
            if (inviteeDetails.length && inviteeDetails[0].gcm_reg_id && !isNotificationMuted) {
                const locale = inviteeDetails[0].locale || 'en';
                const notificationData = {
                    event: 'study_group_chat',
                    title: (locale === 'hi' ? studGroupData.inviteNotificationTitleHi : studGroupData.inviteNotificationTitleEn).replace('<>', this.studentName).replace('{}', unescape(groupName)),
                    message: locale === 'hi' ? studGroupData.inviteNotificationMessageHi : studGroupData.inviteNotificationMessageEn,
                    image: null,
                    firebase_eventtag: 'studygroup_invite',
                    data: {
                        is_faq: false, inviter: this.student_id, invitee: inviteeId, group_id: groupId,
                    },
                };
                Utility.sendFcm(inviteeId, inviteeDetails[0].gcm_reg_id, notificationData, null, null);
            }
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'notificationToInvitee', error: errorLog });
        }
    }

    async sendCreateGroupNotification() {
        const isNotificationMuted = await this.isNotificationEnabled(this.student_id);
        if (!isNotificationMuted) {
            const notificationData = {
                event: 'video',
                title: studGroupData.createGroupNotifTopic,
                message: studGroupData.createGroupNotifDescription,
                image: null,
                firebase_eventtag: 'studygroup_create',
                data: { qid: 644931887, page: 'STUDYGROUP' },
            };
            Utility.sendFcm(this.student_id, this.req.user.gcm_reg_id, notificationData, null, null);
        }
        // messages.sendSms({
        //     mobile: this.req.user.mobile,
        //     msg: studGroupData.createGroupSMS,
        //     msg_type: 'Unicode_Text',
        // });
    }

    async inviteAcceptanceNotification(inviterId, groupId, groupName) {
        try {
            const inviterDetails = await studyGroupMysql.getStudentDetailsById(this.db.mysql.read, inviterId);
            const isNotificationMuted = await this.isNotificationEnabled(inviterId);
            if (inviterDetails.length && inviterDetails[0].gcm_reg_id && !isNotificationMuted) {
                const notificationData = {
                    event: 'study_group_chat',
                    title: studGroupData.accptanceNotificationTitle.replace('<>', this.studentName).replace('{}', unescape(groupName)),
                    message: studGroupData.accptanceNotificationMessage,
                    image: null,
                    firebase_eventtag: 'studygroup_acceptance',
                    data: { group_id: groupId, is_faq: false },
                };
                Utility.sendFcm(inviterId, inviterDetails[0].gcm_reg_id, notificationData, null, null);
            }
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'inviteAcceptanceNotification', error: errorLog });
        }
    }

    async isEligibleToCreateGroup() {
        try {
            const totalGroupsAsAdmin = await studyGroupMysql.getTotalGroupsAsAdmin(this.student_id, this.db.mysql.read);
            return totalGroupsAsAdmin && totalGroupsAsAdmin[0].total < TOTAL_ALLOWED_GROUPS_AS_ADMIN;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'isEligibleToCreateGroup', error: errorLog });
            return false;
        }
    }

    async isGroupMute() {
        try {
            let isMute = false;
            let muteTime = await studyGroupRedis.getStudyGroupDetail(this.req.body.group_id, `MUTE:${this.student_id}`, this.db.redis.read);
            if (!_.isNull(muteTime)) {
                isMute = JSON.parse(muteTime);
            } else {
                muteTime = await studyGroupMysql.getMuteTime(this.req.body.group_id, this.student_id, this.db.mysql.read);
                if (muteTime.length && muteTime[0].muted_till) {
                    isMute = moment().add(5, 'hours').add(30, 'minutes').isBefore(moment(muteTime[0].muted_till));
                }
                studyGroupRedis.setStudyGroupDetail(this.req.body.group_id, `MUTE:${this.student_id}`, isMute, this.db.redis.write);
            }
            return isMute;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'isGroupMute', error: errorLog });
            return false;
        }
    }

    async createGroup(groupName, groupImage) {
        try {
            const groupId = `sg-${uuid()}`;
            const data = {
                group_id: groupId, group_name: escape(groupName), group_image: groupImage, image_updated_by: this.student_id, image_updated_at: this.currentDate, name_updated_by: this.student_id, name_updated_at: this.currentDate,
            };
            const studyGroupCreate = await this.db.mysql.write.query('INSERT INTO study_group SET ?', data, (err, result, fields) => {
                if (err) {
                    throw err;
                }
                console.log(result, fields);
            });
            await this.addMember(studyGroupCreate.insertId, true);
            this.message = 'Group successfully created!';
            this.groupId = groupId;
            this.sendCreateGroupNotification();
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'createGroup', error: errorLog });
            return false;
        }
    }

    async addMember(groupId, isAdmin) {
        try {
            await studyGroupMysql.addMember(this.student_id, groupId, isAdmin, this.db.mysql.write);
            return true;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'addMember', error: errorLog });
            return false;
        }
    }

    async create() {
        try {
            let isGroupCreated = false;
            let inviteUrl = null;
            const isEligibleToCreateGroup = await this.isEligibleToCreateGroup();
            if (!isEligibleToCreateGroup) {
                this.message = 'This Student is not eligible to create group';
            } else {
                if (profanity.isMessageDirty(this.req.body.group_name)) {
                    this.message = 'Profane group names are not allowed';
                    this.mongoClient.write.collection('profane_group_names').insertOne({
                        room_type: 'study_group', group_name: this.req.body.group_name, student_id: this.student_id, created_at: this.currentDate,
                    });
                    return {
                        message: this.message,
                        is_group_created: isGroupCreated,
                        title: this.locale === 'hi' ? studGroupData.profaneGroupNameHi : studGroupData.profaneGroupNameEn,
                        cta: this.locale === 'hi' ? studGroupData.ctaTextHi : studGroupData.ctaTextEn,
                        group_guideline: studGroupData.groupMsgGuidLine,
                    };
                }
                let groupImage = `${CDN_URL}${this.req.body.group_image}`;
                if (!this.req.body.group_image || typeof this.req.body.group_image === 'undefined') {
                    groupImage = null;
                }
                const requestGroupCreate = await this.createGroup(this.req.body.group_name, groupImage);
                if (!requestGroupCreate) {
                    this.message = 'Oops! Some issue occurred in creating this group';
                } else {
                    isGroupCreated = true;
                    const inviteLink = await Utility.generateDeeplinkFromAppDeeplink(this.config.branch_key, 'studygroup',
                        'invite_members', `doubtnutapp://study_group_chat?group_id=${this.groupId}&is_faq=false&inviter=${this.student_id}`);
                    if (inviteLink && inviteLink.url) {
                        inviteUrl = inviteLink.url;
                    }
                }
            }

            const initialMessageData = {
                group_guideline: studGroupData.groupMsgGuidLine,
                invite_message: studGroupData.firstInviteMessageEn,
                invite_cta_text: studGroupData.inviteCtaTextEn,
                copy_invite_cta_text: studGroupData.copyInviteCtaTextEn,
                invite_deeplink: inviteUrl,
            };
            return {
                message: this.message, is_group_created: isGroupCreated, initial_messages_data: initialMessageData, group_id: this.groupId,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'create', error: errorLog });
            throw (e);
        }
    }

    async listGroups() {
        try {
            const data = await studyGroupMysql.getActiveGroups(this.student_id, this.db.mysql.read);
            const groups = [];
            let canCreateGroup = false;
            for (let i = 0; i <= data.length; i++) {
                if (data[i] && data[i].pk) {
                    data[i].last_message_sent_at = JSON.parse(await studyGroupRedis.getStudyGroupDetail(data[i].group_id, 'LAST_SENT', this.db.redis.read)) || null;
                    let subititle = '';
                    let isMute = false;

                    if (data[i].last_message_sent_at !== null && data[i].is_active === 1) {
                        subititle = `${data[i].subtitle} Students\nLast message sent ${moment(data[i].last_message_sent_at).subtract(5, 'hours').subtract(30, 'minutes').fromNow()}`;
                    } else if (data[i].is_active === 1) {
                        subititle = `${data[i].subtitle} Students`;
                    } else if (data[i].is_left === 1 && data[i].left_at) {
                        subititle = `You left ${moment(data[i].left_at).subtract(5, 'hours').subtract(30, 'minutes').fromNow()}`;
                    } else if (data[i].is_blocked === 1 && data[i].blocked_at) {
                        subititle = `You were removed from this group ${moment(data[i].blocked_at).subtract(5, 'hours').subtract(30, 'minutes').fromNow()}`;
                    }

                    if (data[i].muted_till) {
                        isMute = moment().add(5, 'hours').add(30, 'minutes').isBefore(moment(data[i].muted_till));
                    }
                    delete data[i].muted_till;
                    data[i].subtitle = subititle;
                    data[i].is_faq = false;
                    data[i].is_mute = isMute;
                    data[i].group_image = (data[i].group_image === null ? studGroupData.defaultGroupImage : data[i].group_image);
                    data[i].group_name = unescape(data[i].group_name);
                    groups.push(data[i]);
                }
            }
            const sortedGroups = [];
            const activeGroups = _.orderBy(_.filter(groups, (item) => item.is_active === 1), [(o) => o.last_message_sent_at || ''], ['desc']);
            const leftGroups = _.orderBy(_.filter(groups, (item) => item.is_left === 1 || item.is_blocked === 1), ['left_at', 'blocked_at'], ['desc']);
            sortedGroups.push(...activeGroups, (this.locale === 'hi' ? studGroupData.faqGroupDataHi : studGroupData.faqGroupDataEn), ...leftGroups);
            const GroupsAsAdmin = _.filter(activeGroups, (item) => item.is_admin === 1);
            if (GroupsAsAdmin.length < TOTAL_ALLOWED_GROUPS_AS_ADMIN) {
                canCreateGroup = true;
            }
            return {
                groups: sortedGroups,
                user_left_message: (this.locale === 'hi' ? studGroupData.userLefFromGroupHi : studGroupData.userLefFromGroupEn),
                user_blocked_message: (this.locale === 'hi' ? studGroupData.userBlockedFromGroupHi : studGroupData.userBlockedFromGroupEn),
                cta_text: (this.locale === 'hi' ? studGroupData.ctaTextHi : studGroupData.ctaTextEn),
                can_create_group: canCreateGroup,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'listGroups', error: errorLog });
            throw (e);
        }
    }

    async getNextAdmin(groupMembers) {
        try {
            if (groupMembers.length > 1) {
                for (let i = 0; i <= groupMembers.length; i++) {
                    if (groupMembers[i].is_admin === 0) {
                        return groupMembers[i].student_id;
                    }
                }
            }
            return false;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'getNextAdmin', error: errorLog });
            return false;
        }
    }

    async leaveGroup() {
        try {
            let isGroupLeft = false;
            let socketMsg = null;
            const groupData = await studyGroupMysql.getSpecificUserGroupData(this.student_id, this.req.body.group_id, this.db.mysql.read);
            if (groupData.length === 1) {
                if (groupData[0].is_admin === 1) {
                    // user is admin
                    const groupMembers = await studyGroupMysql.getGroupMembers(groupData[0].id, this.db.mysql.read);
                    if (groupMembers.length === 1) {
                        // only one member in this group and requested user is admin :)
                        // we can deactivate the group as no-one has joined and admin requested to leave
                        await studyGroupMysql.deactivateGroup(groupMembers[0].study_group_id, this.db.mysql.write);
                        this.message = 'group deactivated as only requested member was added in this group';
                        socketMsg = studGroupData.socketLeftMsg.replace('<>', this.studentName);
                        isGroupLeft = true;
                        studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                        this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                    } else {
                        // more than one members in the group, need to assign admin who joined just after admin
                        const nextAdminStudentId = await this.getNextAdmin(groupMembers);
                        if (nextAdminStudentId) {
                            await studyGroupMysql.leaveAdmin(groupMembers[0].study_group_id, this.student_id, this.db.mysql.write);
                            await studyGroupMysql.assignNewAdmin(groupMembers[0].study_group_id, nextAdminStudentId, this.db.mysql.write);
                            this.message = 'New Admin successfully assigned to this group';
                            socketMsg = studGroupData.socketLeftMsg.replace('<>', this.studentName);
                            isGroupLeft = true;
                            await studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                            this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                        } else {
                            this.message = 'Unable to assign new admin, some error occurred!';
                        }
                    }
                } else {
                    // user is a member of the group
                    await studyGroupMysql.leaveMember(groupData[0].id, this.student_id, this.db.mysql.write);
                    this.message = 'this member has successfully left the group';
                    isGroupLeft = true;
                    studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                    this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                    socketMsg = studGroupData.socketLeftMsg.replace('<>', this.studentName);
                }
            } else {
                this.message = 'No active groups found';
            }
            return { message: this.message, is_group_left: isGroupLeft, socket_msg: socketMsg };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'leaveGroup', error: errorLog });
            throw (e);
        }
    }

    async blockFromGroup() {
        try {
            let isBlocked = false;
            let socketMsg = null;
            const groupData = await studyGroupMysql.getSpecificUserGroupData(this.student_id, this.req.body.group_id, this.db.mysql.read);
            if (groupData.length === 1) {
                if (groupData[0].is_admin === 1) {
                    // user is admin, he/she can block other members
                    await studyGroupMysql.blockMember(this.student_id, groupData[0].id, this.req.body.student_id, this.db.mysql.write);
                    isBlocked = true;
                    const blockerUserDetails = await studyGroupMysql.getStudentName(this.req.body.student_id, this.db.mysql.write);
                    const blockedUser = blockerUserDetails ? blockerUserDetails[0].name : 'Doubtnut User';
                    socketMsg = studGroupData.socketBlockedMsg.replace('[]', blockedUser).replace('<>', this.studentName).replace('{}', unescape(groupData[0].group_name));
                    this.message = 'user is successfully blocked from this group';
                    await studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                    this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                } else {
                    // user is a member of the group, can't block anyone
                    this.message = 'this user is not the admin of this group';
                }
            } else {
                this.message = 'No active groups found';
            }
            return { message: this.message, is_blocked: isBlocked, socket_msg: socketMsg };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'leaveGroup', error: errorLog });
            throw (e);
        }
    }

    async updateGroupInfo() {
        try {
            let isUpdated = false;
            const groupData = await studyGroupMysql.getSpecificUserGroupData(this.student_id, this.req.body.group_id, this.db.mysql.read);
            if (groupData.length === 1) {
                if (groupData[0].is_admin === 1) {
                    // user is admin, he/she can update group info
                    if (this.req.body.group_name) {
                        // user wants to update group name
                        if (profanity.isMessageDirty(this.req.body.group_name)) {
                            this.message = 'Profane group names are not allowed';
                            return {
                                message: this.message,
                                is_updated: isUpdated,
                                title: this.locale === 'hi' ? studGroupData.profaneGroupNameHi : studGroupData.profaneGroupNameEn,
                                cta: this.locale === 'hi' ? studGroupData.ctaTextHi : studGroupData.ctaTextEn,
                                group_guideline: studGroupData.groupMsgGuidLine,
                            };
                        }
                        await studyGroupMysql.updateGroupName(escape(this.req.body.group_name), this.student_id, groupData[0].id, this.db.mysql.write);
                        await studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                        this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                        this.message = 'user has successfully updated group name';
                        isUpdated = true;
                    } else if (this.req.body.group_image) {
                        // user wants to update group image
                        await studyGroupMysql.updateGroupImage(`${CDN_URL}${this.req.body.group_image}`, this.student_id, groupData[0].id, this.db.mysql.write);
                        await studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                        this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                        this.message = 'user has successfully updated group image';
                        isUpdated = true;
                    }
                } else {
                    // user is a member of the group, can't block anyone
                    this.message = 'this user is not the admin of this group';
                }
            } else {
                this.message = 'No active groups found';
            }
            return { message: this.message, is_updated: isUpdated };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'leaveGroup', error: errorLog });
            throw (e);
        }
    }

    async canCreateGroup() {
        try {
            const canCreateGroup = await this.isEligibleToCreateGroup();
            let sliderData = [];
            let heading = null;
            if (canCreateGroup) {
                sliderData = (this.locale === 'hi' ? studGroupData.createGroupHi : studGroupData.createGroupEn);
                heading = (this.locale === 'hi' ? studGroupData.groupCreateHeadingHi : studGroupData.groupCreateHeadingEn);
                this.message = 'this user is eligible to create a group';
            } else {
                this.message = 'this user can not create another group';
            }
            return {
                message: this.message, can_create_group: canCreateGroup, slider_data: sliderData, heading,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'canCreateGroup', error: errorLog });
            throw (e);
        }
    }

    async groupInfo() {
        try {
            let isGroupEnabled = true;
            let isGroupActive = true;
            let groupInfo = null;
            let groupName = null;
            let groupMinimumMemberWarningMessage = null;
            const groupBlockedMemberMessage = null;
            const isFaq = false;
            if (this.req.body.group_id && this.req.body.group_id === 'study_group_faq') {
                return (this.locale === 'hi' ? studGroupData.faqGroupInfoHi : studGroupData.faqGroupInfoEn);
            }
            this.message = 'Group is enabled for communications';
            let members = [];
            let totalGroupMembers;
            let isBlocked = 0;

            let data = await studyGroupRedis.getStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.read);
            // checking the attributes from redis first, if not available then sql will be performed
            if (!_.isNull(data)) {
                data = JSON.parse(data);
                members = data.members;
                totalGroupMembers = members.length;
                groupInfo = data.groupInfo;
                groupName = data.groupName;
            } else {
                const groupData = await studyGroupMysql.getGroupInfo(this.req.body.group_id, this.db.mysql.read);
                totalGroupMembers = groupData.length;
                for (let i = 0; i <= groupData.length; i++) {
                    if (groupData[i] && groupData[i].name) {
                        members.push({
                            is_admin: groupData[i].is_admin,
                            name: groupData[i].name,
                            image: groupData[i].image,
                            student_id: groupData[i].student_id,
                            is_blocked: groupData[i].is_blocked,
                            is_active: groupData[i].is_active,
                        });
                    }
                }

                if (totalGroupMembers >= 1) {
                    groupInfo = {
                        group_id: groupData[0].group_id,
                        group_name: unescape(groupData[0].group_name),
                        group_image: (groupData[0].group_image === null ? studGroupData.defaultGroupImage : groupData[0].group_image),
                        group_created_at: groupData[0].group_created_at,
                    };
                    groupInfo.subtitle = null;
                    groupName = unescape(groupData[0].group_name);

                    const obj = {
                        members,
                        groupInfo,
                        groupName,
                    };
                    studyGroupRedis.setStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', obj, this.db.redis.write);
                }
            }
            isBlocked = _.filter(members, (user) => user.student_id === this.student_id);
            if (!_.isEmpty(isBlocked) && isBlocked[0].is_blocked) {
                isGroupEnabled = false;
                this.message = this.locale === 'hi' ? studGroupData.groupBlockedMemberMessageHi : studGroupData.groupBlockedMemberMessageEn;
                groupMinimumMemberWarningMessage = this.locale === 'hi' ? studGroupData.groupBlockedMemberMessageHi : studGroupData.groupBlockedMemberMessageEn;
            }
            members = _.filter(members, (user) => user.is_blocked !== 1);
            if (totalGroupMembers === 0) {
                isGroupActive = false;
            }

            if (totalGroupMembers < MIN_MEMBERS_IN_GROUP_TO_ENABLE_COMMUNICATION) {
                isGroupEnabled = false;
                this.message = 'Group is not enabled due to less members than minimum required!';
                groupMinimumMemberWarningMessage = this.locale === 'hi' ? studGroupData.groupMinimumUserWarningMessageHi : studGroupData.groupMinimumUserWarningMessageEn;
                groupMinimumMemberWarningMessage = groupMinimumMemberWarningMessage.replace('<>', this.inWords(totalGroupMembers)).replace('[]', this.inWords(MIN_MEMBERS_IN_GROUP_TO_ENABLE_COMMUNICATION - totalGroupMembers));
            }

            let inviteUrl = await studyGroupRedis.getStudyGroupDetail(this.req.body.group_id, `${this.student_id}_INVITE`, this.db.redis.read);
            if (!_.isNull(inviteUrl)) {
                inviteUrl = JSON.parse(inviteUrl);
            } else {
                inviteUrl = await Utility.generateDeeplinkFromAppDeeplink(this.config.branch_key, 'studygroup',
                    'invite_members', `doubtnutapp://study_group_chat?group_id=${this.req.body.group_id}&is_faq=false&inviter=${this.student_id}`);
                if (inviteUrl) {
                    inviteUrl = inviteUrl.url;
                    studyGroupRedis.setStudyGroupDetail(this.req.body.group_id, `${this.student_id}_INVITE`, inviteUrl, this.db.redis.write);
                }
            }
            const isMute = await this.isGroupMute();
            const onlyActiveMembers = _.filter(members, (user) => user.is_active === 1);
            const isMember = onlyActiveMembers.filter((item) => item.student_id === this.student_id);
            return {
                group_data: { group_info: groupInfo, members },
                is_mute: isMute,
                is_member: Boolean(isMember.length),
                is_group_enabled: isGroupEnabled,
                is_group_active: isGroupActive,
                is_faq: isFaq,
                message: this.message,
                group_guideline: (this.locale === 'hi' ? studGroupData.groupGuideLineHi : studGroupData.groupGuideLineEn),
                know_more_text: (this.locale === 'hi' ? studGroupData.knowMoreTextHi : studGroupData.knowMoreTextEn),
                know_more_deeplink: studGroupData.knowMoreDeeplink,
                group_minimum_member_warning_message: groupMinimumMemberWarningMessage,
                faq_deeplink: studGroupData.faqDeeplink,
                invite_text: studGroupData.inviteText.replace('<>', this.studentName).replace('{}', unescape(groupName)).replace('[]', inviteUrl),
                report_reasons: this.locale === 'hi' ? studGroupData.reportReasons.hi : studGroupData.reportReasons.en,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'leaveGroup', error: errorLog });
            throw (e);
        }
    }

    async invite() {
        try {
            // check if invitor is the member of the group
            let isMemberInvited = false;
            const groupData = await studyGroupMysql.getSpecificUserGroupData(this.student_id, this.req.body.group_id, this.db.mysql.read);
            if (groupData.length === 1) {
                this.message = 'Invitor is a active member of the group';
                const inviteeData = await studyGroupMysql.getSpecificUserGroupData(this.req.body.invitee, this.req.body.group_id, this.db.mysql.read);
                if (!inviteeData.length) {
                    const isInvited = await studyGroupMysql.isInvited(this.student_id, this.req.body.invitee, groupData[0].id, this.db.mysql.read);
                    if (isInvited && isInvited[0].EXIST === 0) {
                        // can be invite
                        await studyGroupMysql.inviteMember(this.student_id, this.req.body.invitee, groupData[0].id, groupData[0].is_admin, this.db.mysql.write);
                        this.message = 'Successfully invited to the group';
                        isMemberInvited = true;
                        this.notificationToInvitee(this.req.body.invitee, this.req.body.group_id, groupData[0].group_name);
                    } else {
                        this.message = 'requested invitor has already invited earlier for same group';
                    }
                } else {
                    this.message = 'invitee is already member of this group';
                }
            } else {
                this.message = 'invitor is not a member of this group';
            }
            return { message: this.message, is_invited: isMemberInvited };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'invite', error: errorLog });
            throw (e);
        }
    }

    async notifyIfInviterActive(groupData) {
        try {
            // checking if inviter is still active on the same group, so we can notify him/her
            const isMember = await studyGroupMysql.getMuteTime(this.req.body.group_id, this.req.body.inviter, this.db.mysql.read);
            if (isMember.length && (isMember[0].muted_till === null || moment().add(5, 'hours').add(30, 'minutes').isAfter(moment(isMember[0].muted_till)))) {
                this.inviteAcceptanceNotification(this.req.body.inviter, this.req.body.group_id, groupData[0].group_name);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    async isEnabledFromFlagr(xAuthToken) {
        const flagData = { xAuthToken, body: { capabilities: { 'study-rooms-v1': {} } } };
        const flagrResp = await UtilityFlagr.getFlagrResp(flagData);
        return !!(flagrResp && flagrResp['study-rooms-v1'] && flagrResp['study-rooms-v1'].payload.enabled);
    }

    async accept() {
        try {
            let isMemberJoined = false;
            let description = null;
            let isAlreadyMember = false;
            let isPreviouslyBlocked = false;
            let ctaText = null;
            let socketMsg = null;
            // check if invitee is already the member of the group
            const inviteeGroupData = await studyGroupMysql.getSpecificUserGroupData(this.student_id, this.req.body.group_id, this.db.mysql.read);
            if (!inviteeGroupData.length) {
                const groupData = await studyGroupMysql.getGroupId(this.req.body.group_id, this.db.mysql.read);
                if (!groupData.length) {
                    this.message = 'Sorry this group no longer exists.';
                    description = this.locale === 'hi' ? studGroupData.groupNotExistHi : studGroupData.groupNotExistEn;
                    ctaText = this.locale === 'hi' ? studGroupData.ctaTextHi : studGroupData.ctaTextEn;
                    return {
                        message: this.message, is_member_joined: isMemberJoined, description, cta_text: ctaText, is_already_member: isAlreadyMember, is_previously_blocked: isPreviouslyBlocked,
                    };
                }
                this.message = 'invitee is not a active member of the group, can join!';
                const isBlocked = await studyGroupMysql.isBlocked(this.student_id, groupData[0].id, this.db.mysql.read);
                if (!isBlocked) {
                    // some error occurred;
                    this.message = 'Oops! There is some issue in joining group, please try again!';
                    description = this.locale === 'hi' ? studGroupData.groupJoiningErrorHi : studGroupData.groupJoiningErrorEn;
                    ctaText = this.locale === 'hi' ? studGroupData.ctaHomeHi : studGroupData.ctaTextEn;
                    return {
                        message: this.message, is_member_joined: isMemberJoined, description, cta_text: ctaText, is_already_member: isAlreadyMember, is_previously_blocked: isPreviouslyBlocked,
                    };
                }
                if (isBlocked && isBlocked[0].EXIST === 1) {
                    // user is blocked by admin on this group earlier
                    this.message = 'User is blocked';
                    description = this.locale === 'hi' ? studGroupData.groupJoiningBlockHi : studGroupData.groupJoiningBlockEn;
                    ctaText = this.locale === 'hi' ? studGroupData.ctaTextHi : studGroupData.ctaTextEn;
                    isPreviouslyBlocked = true;
                    return {
                        message: this.message, is_member_joined: isMemberJoined, description, cta_text: ctaText, is_already_member: isAlreadyMember, is_previously_blocked: isPreviouslyBlocked,
                    };
                }

                // checking if invited through profile or link, if entry found then user has invited through profile else
                // invitee is trying to join through shared link on whatsapp or any social media
                const isInvited = await studyGroupMysql.isInvited(this.req.body.inviter, this.student_id, groupData[0].id, this.db.mysql.read);
                if (!isInvited) {
                    // some error occurred;
                    this.message = 'Oops! There is some issue in joining group, please try again!';
                    description = this.locale === 'hi' ? studGroupData.groupJoiningErrorHi : studGroupData.groupJoiningErrorEn;
                    ctaText = this.locale === 'hi' ? 'पुनः प्रयास करें' : 'Retry';
                    return {
                        message: this.message, is_member_joined: isMemberJoined, description, cta_text: ctaText, is_already_member: isAlreadyMember, is_previously_blocked: isPreviouslyBlocked,
                    };
                }
                if (isInvited && isInvited[0].EXIST === 0) {
                    // user is joining through link, adding a entry in invite table.
                    await studyGroupMysql.inviteMember(this.req.body.inviter, this.student_id, groupData[0].id, groupData[0].is_admin, this.db.mysql.write);
                    this.message = 'Successfully added to the group';
                }
                const totalMembers = await studyGroupMysql.getTotalGroupMembers(groupData[0].id, this.db.mysql.read);
                if (totalMembers && totalMembers[0].TOTAL <= TOTAL_ALLOWED_MEMBERS_IN_GROUP) {
                    // checking if user was previously left the group
                    const isLeftPreviously = await studyGroupMysql.isPreviouslyLeftThisStudyGroup(this.student_id, groupData[0].id, this.db.mysql.read);
                    if (isLeftPreviously && isLeftPreviously[0].EXIST === 1) {
                        // rejoining member
                        await studyGroupMysql.reJoinMember(groupData[0].id, this.student_id, this.db.mysql.write);
                        this.message = 'User was previously left this group, now re-joined successfully';
                        isMemberJoined = true;
                        this.notifyIfInviterActive(groupData);
                        studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                        this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                        socketMsg = studGroupData.socketJoinedAgainMsg.replace('<>', this.studentName);
                        return {
                            message: this.message, is_member_joined: isMemberJoined, description, cta_text: ctaText, is_already_member: isAlreadyMember, is_previously_blocked: isPreviouslyBlocked, socket_msg: socketMsg,
                        };
                    }
                    // user can join
                    await studyGroupMysql.addMember(this.student_id, groupData[0].id, 0, this.db.mysql.write);
                    isMemberJoined = true;
                    socketMsg = `${this.studentName} joined`;
                    this.notifyIfInviterActive(groupData);
                    studyGroupRedis.delStudyGroupDetail(this.req.body.group_id, 'GROUP_INFO', this.db.redis.write);
                    this.updateGroupCache(this.req.body.group_id, 'GROUP_INFO');
                    this.message = 'Invitee is successfully joined';
                } else {
                    this.message = 'Invited group is already full';
                    description = this.locale === 'hi' ? studGroupData.groupFullHi : studGroupData.groupFullEn;
                    ctaText = this.locale === 'hi' ? studGroupData.ctaHomeHi : studGroupData.ctaHomeEn;
                }
            } else {
                this.message = 'invitee is already a member of this group';
                description = 'invitee is already a member of this group';
                isAlreadyMember = true;
            }
            return {
                message: this.message,
                is_member_joined: isMemberJoined,
                description,
                cta_text: ctaText,
                is_already_member: isAlreadyMember,
                socket_msg: socketMsg,
                is_previously_blocked: isPreviouslyBlocked,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'accept', error: errorLog });
            throw (e);
        }
    }

    async invitationStatus() {
        try {
            const activeGroups = await studyGroupMysql.getActiveGroupsWithMembersCount(this.student_id, this.db.mysql.read);
            const { invitee } = this.req.body;
            const data = [];
            for (let i = 0; i <= activeGroups.length; i++) {
                if (activeGroups[i]) {
                    const groupData = {
                        group_id: activeGroups[i].group_id,
                        group_name: unescape(activeGroups[i].group_name),
                        group_image: (activeGroups[i].group_image === null ? studGroupData.defaultGroupImage : activeGroups[i].group_image),
                        subtitle: `${activeGroups[i].total_members} Students`,
                        is_admin: activeGroups[i].is_admin,
                    };
                    groupData.last_message_sent_at = JSON.parse(await studyGroupRedis.getStudyGroupDetail(activeGroups[i].group_id, 'LAST_SENT', this.db.redis.read)) || null;
                    // invitation status -> 0 - (Invite), 1 - (Invite Sent), 2 - (Member)
                    const isMember = await studyGroupMysql.isMember(activeGroups[i].id, invitee, this.db.mysql.read);
                    if (isMember.length && isMember[0].EXIST === 1) {
                        groupData.invite_status = 2;
                        data.push(groupData);
                        continue;
                    }
                    const isInvited = await studyGroupMysql.isInvited(this.student_id, invitee, activeGroups[i].id, this.db.mysql.read);
                    if (isInvited && isInvited[0].EXIST === 1) {
                        groupData.invite_status = 1;
                        data.push(groupData);
                        continue;
                    }
                    groupData.invite_status = 0;
                    data.push(groupData);
                }
            }
            const groups = _.orderBy(data, [(o) => o.last_message_sent_at || ''], ['desc']);
            return {
                groups,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'invitationStatus', error: errorLog });
            throw (e);
        }
    }

    async mute() {
        try {
            const { group_id: groupId, type } = this.req.body;
            if (groupId) {
                // type 0 - mute and 1 - unmute
                let muteTill = null;
                this.message = 'Group has been un-muted successfully';
                if (type === 0) {
                    muteTill = moment().add(5, 'hours').add(30, 'minutes').add(MUTED_TILL_DAYS, 'days')
                        .format('YYYY-MM-DD HH:MM:SS');
                    this.message = 'Group has been muted successfully';
                }
                await studyGroupMysql.muteGroup(groupId, this.student_id, muteTill, this.db.mysql.write);
                await studyGroupRedis.delStudyGroupDetail(groupId, `MUTE:${this.student_id}`, this.db.redis.write);
                this.updateGroupCache(groupId, `MUTE:${this.student_id}`);
            } else {
                // type 0 - mute and 1 - unmute
                const muteFeature = await studyGroupMysql.isMuteFeatureExist(this.student_id, this.db.mysql.read);
                if (muteFeature && muteFeature[0].EXIST) {
                    await studyGroupMysql.updateFeatureMute(Boolean(!type), this.student_id, this.db.mysql.write);
                } else {
                    await studyGroupMysql.insertFeatureMute(Boolean(!type), this.student_id, this.db.mysql.write);
                }
                await studentRedis.del7Day(this.student_id, 'SG_FEATURE_MUTE', this.db.redis.write);
                this.updateGroupCache(`USER:${this.student_id}`, 'SG_FEATURE_MUTE');
                this.message = 'Feature notification status updated';
            }
            return { message: this.message };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyGroupHelper', source: 'mute', error: errorLog });
            throw (e);
        }
    }
}

module.exports = StudyGroupHelper;
