const _ = require('lodash');
const moment = require('moment');

const CourseContainer = require('../../modules/containers/coursev2');
const scholarshipHelper = require('../v1/scholarship/scholarship.helper');
const studentRedis = require('../../modules/redis/student');
const StudentMysql = require('../../modules/mysql/student');
const redisClient = require('../../config/redis');
const IconsHelperV1 = require('../v1/icons/icons.helper');
const UtilityFlagr = require('../../modules/Utility.flagr');
const RedisUtil = require('../../modules/redis/utility.redis');
const ExamCornerMysql = require('../../modules/mysql/examCorner');
const IconsHelper = require('./icons');
const StaticData = require('../../data/data');
const redisQuestionContainer = require('../../modules/redis/question');
const QuestionMysql = require('../../modules/mysql/question');
const dnExamRewardsHelper = require('../v1/dn_exam_rewards/dn_exam_rewards.helper');

const { isStudyGroupEnabled } = require('../v1/studyGroup/studyGroup.controller');

class IconFormattingManager {
    constructor(request) {
        this.req = request;
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.user = request.user;
        this.headers = request.headers;
        this.query = request.query;
        this.freeUsersType = ['scholarship_test', 'dn_exam_rewards', 'dn_ceo', 'topic_booster', 'studygroup', 'gupshup', 'khelo_jeeto', 'external_url', 'courses', 'ncert'];
        this.paidUsersType = ['scholarship_test', 'dn_exam_rewards', 'dn_ceo', 'topic_booster', 'studygroup', 'gupshup', 'khelo_jeeto', 'external_url', 'bounty_feed', 'exam_corner', 'live_class_home', 'faq_icon', 'ncert'];
        this.removeTopicBoosterIcon = false;
        this.removeGupshupIcon = false;
        this.removeKheloJeetoIcon = false;
        this.isWhatsapp = { show: 0, index: -1 };
        this.bountyFlagIndex = -1;
        this.gupshupFlag = -1;
        this.examCornerFlag = 0;
        this.doesUserHaveCourseOrClass = true;
        this.showCeoIcon = false;
        this.courseIcon = [];
        this.allIcons = [];
        this.removeLiveClassHome = false;
    }

    async getSubscriptionDetails() {
        // * Fetch user active packages
        const studentCurrentSubscriptionDetails = await CourseContainer.getUserActivePackages(this.db, this.user.student_id);
        this.currentPackages = studentCurrentSubscriptionDetails;

        let studentCourseOrClassSubcriptionDetails = studentCurrentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || (this.headers.versionCode >= 893 && item.assortment_type === 'subject')));
        const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        let expiredPackages = await CourseContainer.getUserExpiredPackagesIncludingTrial(this.db, this.user.student_id);
        expiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30 && (this.headers.versionCode > 966 || item.amount > -1));
        expiredPackages = expiredPackages.filter((item) => !_.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', item.assortment_id]));
        studentCourseOrClassSubcriptionDetails = [...studentCourseOrClassSubcriptionDetails, ...expiredPackages];
        return studentCourseOrClassSubcriptionDetails;
        // return courseMysql.checkVipV1(this.db.mysql.read, this.user.student_id);
    }

    async getScholarshipTestData(index) {
        const type = this.allIcons[index].feature_type.replace('scholarship_test_', '');
        // eslint-disable-next-line
        this.allIcons[index].deeplink = await scholarshipHelper.scholarshipDeeplink(this.headers.version_code, this.db, type, this.headers['x-auth-token'], this.user.student_id);
    }

    async getDnExamRewardsData(index) {
        this.allIcons[index].deeplink = await dnExamRewardsHelper.redirect(this.user.student_class, this.headers.versionCode, this.headers.locale, this.headers['x-auth-token']);
    }

    async getDnCeoData(index) {
        const ceoIcon = await IconsHelperV1.getDnCeoIcon(this.db, this.user.student_id, this.headers.version_code);
        if (ceoIcon) {
            this.showCeoIcon = true;
        }
    }

    getCoursesData(index) {
        if (!_.isNull(this.homepageVisitCount) && +this.homepageVisitCount === -1) {
            this.courseIcon.push(this.allIcons[index]);
        }
    }

    async getTopicBoosterData(index) {
        try {
            // eslint-disable-next-line
            const lastPlayedData = await studentRedis.getLastAvailableTopic(this.user.student_id, redisClient);
            if (lastPlayedData) {
                // console.log('redis key exist');
                let lastTopicData = JSON.parse(lastPlayedData);
                if (typeof lastTopicData === 'string') {
                    lastTopicData = JSON.parse(lastTopicData);
                }
                if (lastTopicData.question_id && lastTopicData.chapter_alias) {
                    // console.log('condition matched, can show topic game');
                    this.allIcons[index].deeplink = `doubtnutapp://topic_booster_game?qid=${lastTopicData.question_id}`;
                    studentRedis.set7Day(this.db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', this.user.student_id, 1);
                } else {
                    this.removeTopicBoosterIcon = true;
                }
            } else {
                // console.log('Redis key not found');
                this.removeTopicBoosterIcon = true;
            }
        } catch (e) {
            this.removeTopicBoosterIcon = true;
        }
    }

    async getStudyGroupData(index) {
        // eslint-disable-next-line
        const isStudyGroup = await isStudyGroupEnabled(this.req);
        this.allIcons[index].deeplink = _.replace(this.allIcons[index].deeplink, /xxxstudygroupexistxxx/g, isStudyGroup.isGroupExist);
    }

    getGupshupData(index) {
        if (!this.isGupShupUser) {
            this.gupshupFlag = index;
        }
        this.removeGupshupIcon = true;
    }

    getKheloJeetoData() {
        this.removeTopicBoosterIcon = true;
    }

    getExternalUrlData(index) {
        if (this.allIcons[index].title.toLowerCase().includes('whatsapp')) {
            this.isWhatsapp.show = 1;
            this.isWhatsapp.index = index;
        }
    }

    getBountyFeedData(index) {
        this.bountyFlagIndex = index;
    }

    async getExamCornerData(index) {
        // check if studentCcmIds available in redis
        let studentCcmIds = await studentRedis.getStudentCcmIds(this.db.redis.read, this.user.student_id);
        studentCcmIds = JSON.parse(studentCcmIds);
        if (_.isNull(studentCcmIds)) {
            // if not available  in redis getting from mysql and caching in redis
            studentCcmIds = await StudentMysql.getCcmIdbyStudentId(this.db.mysql.read, this.user.student_id);
            studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
            // adding the data to student hset
            studentRedis.setStudentCcmIds(this.db.redis.write, this.user.student_id, studentCcmIds);
        }
        // checking if article for any of class or ccm_id is set active on redis
        const promisesData = [];
        promisesData.push(studentRedis.getExamCornerArticleAvailableByClass(this.db.redis.read, this.user.student_class));
        for (let i = 0; i < studentCcmIds.length; i++) {
            promisesData.push(studentRedis.getExamCornerArticleAvailableByCcmId(this.db.redis.read, studentCcmIds[i]));
        }
        const resolvedPromises = await Promise.all(promisesData);
        let countTrue = resolvedPromises.filter((item) => item === '1').length;
        const countFalse = resolvedPromises.filter((item) => item === '0').length;
        // if any true then Top icon has to be shown
        // if none are true and all are false then not to be shown
        // if data not in redis for some while none are true, then query it from mysql and update in redis

        if (countTrue === 0 && countFalse !== resolvedPromises.length) {
            const result = await ExamCornerMysql.examCornerArticlesForTopIconCheck(this.db.mysql.read, studentCcmIds, this.user.student_class);
            const trueCcmIds = result.map((item) => item.ccm_id).filter((item) => Boolean(item));
            const falseCcmIds = studentCcmIds.filter((item) => !trueCcmIds.includes(item));

            const isThereAnArticleForTheWholeClass = result.some((item) => item.ccm_id === null);

            if (isThereAnArticleForTheWholeClass) {
                studentRedis.setExamCornerArticleAvailableByClass(this.db.redis.read, this.user.student_class, 1);
            } else {
                studentRedis.setExamCornerArticleAvailableByClass(this.db.redis.read, this.user.student_class, 0);
            }
            trueCcmIds.forEach((item) => studentRedis.setExamCornerArticleAvailableByCcmId(this.db.redis.read, item, 1));
            falseCcmIds.forEach((item) => studentRedis.setExamCornerArticleAvailableByCcmId(this.db.redis.read, item, 0));
            countTrue = result.length;
        }
        if (countTrue) {
            this.examCornerFlag = 1;
        }
    }

    getExternalUrlForPaid(index) {
        if (this.reminderIconData) {
            const { position } = this.allIcons[index];
            this.allIcons[index] = this.reminderIconData;
            this.allIcons[index].position = position;
        }
    }

    async getLiveClassHomeData(index) {
        if (this.packageType.length) {
            this.allIcons[index].deeplink = ((this.packageType.length > 1) || (this.etoosAssortment.length && this.packageType.length)) ? 'doubtnutapp://course_select' : `doubtnutapp://course_details?id=${this.packageType[this.packageType.length - 1].assortment_id}`;
            if (this.query.user_assortment) {
                this.allIcons[index].deeplink = +this.query.user_assortment === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${this.query.user_assortment}`;
            }
        } else {
            this.removeLiveClassHome = true;
        }
    }

    getfaqData(index) {
        if (this.userActiveCourses.length) {
            if (!_.get(this.faqIconExperimentData, 'faq_top_icon_ab.payload.enabled', null)) {
                this.allIcons[index].title = 'Invite & Earn';
                this.allIcons[index].deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://doubtnut.com/referral?sid=${this.user.student_id}`;
                this.allIcons[index].new_link = `${this.config.staticCDN}engagement_framework/AA456585-0CA3-E258-51E4-68B72AA905FC.webp`;
            }
        } else {
            this.doesUserHaveCourseOrClass = false;
        }
    }

    async getNextQid(nextQid, lastVideoAccessId, ncertIdDetails) {
        let lastId = lastVideoAccessId[0].id;
        const lastQid = lastVideoAccessId[0].question_id;
        const lastVideoDetails = await QuestionMysql.getLastWatchedVideoDetails(this.db.mysql.read, lastQid, this.user.student_id);
        if (lastVideoDetails[0] && lastVideoDetails[0].duration != null && lastVideoDetails[0].duration != '' && lastVideoDetails[0].duration == lastVideoDetails[0].video_time) {
            lastId++;
            const nextVideoDetails = await QuestionMysql.getNextVideoDetails(this.db.mysql.read, lastId);
            if (nextVideoDetails.length > 0 && nextVideoDetails[0].main_playlist_id == ncertIdDetails[0]) {
                nextQid = nextVideoDetails[0].question_id;
            }
        } else {
            nextQid = ncertIdDetails[1];
        }
        return nextQid;
    }

    async getNcertData(index) {
        const noBookListClassList = [6, 7, 8];
        const ncertWatchDetails = await redisQuestionContainer.getNcertLastWatchedDetails(this.db.redis.read, `ncert_lv_${this.user.student_class}`, this.user.student_id);
        if (!_.isNull(ncertWatchDetails)) {
            let nextQid = 0;
            const ncertIdDetails = ncertWatchDetails.split('_');
            const lastVideoAccessId = await QuestionMysql.getLastVideoAccessId(this.db.mysql.read, ncertIdDetails[0], ncertIdDetails[1]);
            nextQid = await this.getNextQid(nextQid, lastVideoAccessId, ncertIdDetails);
            if (nextQid != 0) {
                this.allIcons[index].deeplink = `doubtnutapp://video?qid=${nextQid}&page=NCERT&playlist_id=${ncertIdDetails[0]}`;
            }
        } else if (noBookListClassList.includes(parseInt(this.user.student_class))) {
            const ncertIconDeeplink = this.allIcons[index].deeplink;
            let deeplinkArr = ncertIconDeeplink.split('ncert?');
            deeplinkArr = deeplinkArr[1].split('&');
            deeplinkArr = deeplinkArr[0].split('=');
            const ncertPlaylistId = deeplinkArr[1];
            const parentOfPlaylist = await QuestionMysql.getPlaylistDetailsForParent(this.db.mysql.read, ncertPlaylistId);
            if (parentOfPlaylist.length == 1 && parentOfPlaylist[0].master_parent != null) {
                this.allIcons[index].deeplink = `doubtnutapp://ncert?playlist_id=${parentOfPlaylist[0].master_parent}&playlist_title=NCERT%20Books%20Solutions&is_last=0&page=NCERT`;
            }
        } else if (this.user.student_class != 14) {
            this.allIcons[index].deeplink = `${this.allIcons[index].deeplink}&page=NCERT`;
        }
    }

    iconRemovingTasks() {
        if (this.removeTopicBoosterIcon) {
            this.allIcons = this.allIcons.filter((i) => i.feature_type !== 'topic_booster');
        }

        if (this.removeGupshupIcon) {
            this.allIcons = this.allIcons.filter((i) => i.feature_type !== 'gupshup');
        }

        if (this.isWhatsapp && this.isWhatsapp.show) {
            this.allIcons.splice(1, 0, this.allIcons.splice(this.isWhatsapp.index, 1)[0]);
        }

        if (this.user.student_id % this.config.bounty_mod_factor !== 0 && this.bountyFlagIndex > -1) {
            this.allIcons.splice(this.bountyFlagIndex, 1);
            if (this.bountyFlagIndex < this.gupshupFlag) {
                this.gupshupFlag--;
            }
        }
        if (this.gupshupFlag > -1) {
            this.allIcons.splice(this.gupshupFlag, 1);
        }

        if (!this.showCeoIcon) {
            this.allIcons = this.allIcons.filter((item) => item.feature_type !== 'dn_ceo');
        }

        if (this.courseIcon.length > 0) {
            const courseIconIndex = this.allIcons.findIndex((x) => x.feature_type === 'course');
            if (courseIconIndex > -1) {
                this.allIcons.splice(courseIconIndex, 1);
            }
            this.allIcons.unshift(this.courseIcon);
        }

        if (!this.subscriptionDetails.length || !this.doesUserHaveCourseOrClass) {
            this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'faq_icon'));
        }

        if (this.subscriptionDetails.length > 0) {
            if (!this.examCornerFlag) {
                this.allIcons = this.allIcons.filter((item) => item.feature_type !== 'exam_corner');
            }

            if (this.packageType.length && !this.etoosAssortment.length) {
                this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'course_iit'));
            } else if (!this.packageType.length && this.etoosAssortment.length) {
                this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'live_class_home'));
            }

            if (!_.get(this.faqIconExperimentData, 'faq_top_icon_ab.payload.enabled', null)) {
                this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'schedule'));
            }

            this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'courses'));
            if (this.removeLiveClassHome) {
                this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'live_class_home'));
                const index1 = this.allIcons.findIndex((item) => (item.id === 12345678));
                const index2 = this.allIcons.findIndex((item) => (item.feature_type === 'courses'));
                if (index1 !== -1 && index2 !== -1) {
                    const tmp = this.allIcons[index1];
                    this.allIcons[index1] = this.allIcons[index2];
                    this.allIcons[index2] = tmp;
                } else {
                    this.allIcons = this.allIcons.filter((item) => (item.feature_type !== 'courses'));
                }
            }
        }
    }

    async getFormattedIcons(allIcons) {
        this.allIcons = allIcons;
        const { 'x-auth-token': xAuthToken } = this.headers;
        this.scholarship_test = this.getScholarshipTestData;
        this.dn_exam_rewards = this.getDnExamRewardsData;
        this.topic_booster = this.getTopicBoosterData;
        this.studygroup = this.getStudyGroupData;
        this.gupshup = this.getGupshupData;
        this.khelo_jeeto = this.getKheloJeetoData;
        this.external_url = this.getExternalUrlData;
        this.bounty_feed = this.getBountyFeedData;
        this.exam_corner = this.getExamCornerData;
        this.live_class_home = this.getLiveClassHomeData;
        this.dn_ceo = this.getDnCeoData;
        this.courses = this.getCoursesData;
        this.faq_icon = this.getfaqData;
        this.ncert = this.getNcertData;

        const promise = [
            this.getSubscriptionDetails(),
            RedisUtil.sismember(this.db.redis.read, 'gupshup_show', this.user.student_id),
            IconsHelper.getEmiReminderIcon(this.db, this.config, this.user.student_id, 'new'),
            studentRedis.getUserHomepageVisitCount(this.db.redis.read, this.user.student_id),
            UtilityFlagr.getFlagrResp({ xAuthToken, body: { capabilities: { faq_top_icon_ab: {} } } }),
        ];
        const requiredDataForFormatting = await Promise.all(promise);

        this.subscriptionDetails = requiredDataForFormatting[0];
        this.isGupShupUser = requiredDataForFormatting[1];
        this.reminderIconData = requiredDataForFormatting[2];
        this.homepageVisitCount = requiredDataForFormatting[3];
        this.faqIconExperimentData = requiredDataForFormatting[4];

        this.packageType = this.currentPackages.filter((e) => e.assortment_type === 'course' && e.assortment_id !== 138829);
        this.etoosAssortment = this.currentPackages.filter((e) => e.assortment_id === 138829);
        this.userActiveCourses = this.currentPackages.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'class');

        const flagVariants = this.headers.flagr_variation_ids.split(',');
        if (!flagVariants.includes('1169')) {
            this.allIcons = this.allIcons.filter((item) => item.feature_type !== 'doubt_feed');
        }

        if (this.subscriptionDetails.length === 0) {
            const dataFormatterPromise = [];
            for (let j = 0; j < this.allIcons.length; j++) {
                this.allIcons[j].deeplink = _.replace(this.allIcons[j].deeplink, /xxsidxx/g, this.user.student_id);
                this.allIcons[j].deeplink = _.replace(this.allIcons[j].deeplink, /xxsclsxx/g, this.user.student_class);
                if (this.freeUsersType.includes(this.allIcons[j].feature_type)) {
                    dataFormatterPromise.push(this[this.allIcons[j].feature_type](j));
                }
            }
            await Promise.all(dataFormatterPromise);
        } else {
            this.external_url = this.getExternalUrlForPaid;
            const dataFormatterPromise = [];
            for (let j = 0; j < this.allIcons.length; j++) {
                this.allIcons[j].deeplink = _.replace(this.allIcons[j].deeplink, /xxsidxx/g, this.user.student_id);
                this.allIcons[j].deeplink = _.replace(this.allIcons[j].deeplink, /xxsclsxx/g, this.user.student_class);
                if (this.paidUsersType.includes(this.allIcons[j].feature_type)) {
                    dataFormatterPromise.push(this[this.allIcons[j].feature_type](j));
                }
            }
            await Promise.all(dataFormatterPromise);
        }

        this.iconRemovingTasks();
        this.allIcons = _.orderBy(this.allIcons, ['position'], ['asc']);

        return this.allIcons;
    }
}

module.exports = IconFormattingManager;
