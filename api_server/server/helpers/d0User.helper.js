const _ = require('lodash');
const moment = require('moment');
const md5 = require('md5');

const StaticData = require('../../data/data');
const CameraBlV2 = require('../v2/camera/camera.bl');
const QuestionRedis = require('../../modules/redis/question');
const LiveClassMySql = require('../../modules/mysql/liveclass');
const CourseHelper = require('./course');
const StudentMysql = require('../../modules/mysql/student');
const CourseV2 = require('../../modules/containers/coursev2');
const PackageContainer = require('../../modules/containers/package');
const ClassCourseMapping = require('../../modules/classCourseMapping');
const ClassCourseMappingContainer = require('../../modules/containers/ClassCourseMapping');

const QuetionsNewMysql = require('../../modules/question');
const Utility = require('../../modules/utility');

class D0UserManager {
    constructor(request) {
        this.req = request;
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.user = request.user;
        this.headers = request.headers;
        this.query = request.query;
        this.settings = {
            qaCountForReward: 5,
            mpvpBottomSheetItem: {
                widget_type: 'referral_claim_widget',
                title1_size: '24',
                title1_color: '#ffffff',
                title3_size: '14',
                title3_color: '#ffffff',
                title4_size: '14',
                title4_color: '#ffffff',
                bg_color1: '#004e32',
                bg_color2: '#004e32',
                bg_color3: '#ea532c',
                bg_color4: '#ea532c',
                deeplink: 'doubtnutapp://camera',
            },
            camera: {
                overlay_image: 'engagement_framework/camera-overlay.png',
                bottom_sheet_total_option: 4,
                bottom_sheet_option_settings: {
                    text_color: '#504949',
                    text_size: 14.0,
                    isBold: true,
                    image_start_width: 34,
                    image_start_height: 34,
                    layout_padding: {
                        padding_start: 20,
                        padding_end: 20,
                        padding_top: 4,
                        padding_bottom: 4,
                    },
                },
                bottom_sheet_img_opt_1: 'engagement_framework/87978AA9-9821-3D81-12B2-91CDC610BB48.webp',
                bottom_sheet_img_opt_2: 'engagement_framework/729A64E9-A4EE-B906-A8DB-445FF369E96E.webp',
                bottom_sheet_img_opt_3: 'engagement_framework/236092A2-A5AA-272B-DBFE-C54E604FA76B.webp',
                bottom_sheet_img_opt_4: 'engagement_framework/E6FC82F7-986C-8F99-10B6-DDCF103D4121.webp',
            },
        };
    }

    checkFlagr() {
        let flagExp = false;
        if (!_.isNull(this.headers.flagr_variation_ids) && !_.isEmpty(this.headers.flagr_variation_ids)) {
            const flagVariantsArr = this.headers.flagr_variation_ids.split(',');
            if (flagVariantsArr.includes('1715')) {
                flagExp = true;
            }
        }
        return flagExp;
    }

    async d0ReferralFlagrResp(studentId) {
        const flagrName = 'd0_referral_combined';
        const obj = {};
        obj[`${flagrName}`] = {};
        const d0ReferralFlagrResp = await CourseV2.getFlagrResp(this.db, flagrName, studentId);
        if (_.get(d0ReferralFlagrResp, `${flagrName}.payload.enabled`, false)) {
            return d0ReferralFlagrResp[flagrName].payload.enabled;
        }
    }

    checkD0Status() {
        let d0Status = false;
        const now = moment().add('5', 'hour').add('30', 'minute');
        const userRegDate = moment(this.user.timestamp);
        const diff = now.diff(userRegDate, 'hours', true);
        if (diff <= 24) {
            d0Status = true;
        }
        return d0Status;
    }

    getBottomSheetItemWidget() {
        const totalAsked = this.headers.d0_qa_count;
        const limitOfGettingReward = this.settings.qaCountForReward;
        let title3 = this.user.locale === 'hi' ? StaticData.d0UserQaWidgetMpvpBottomSheet.title3.hi : StaticData.d0UserQaWidgetMpvpBottomSheet.title3.en;
        title3 = _.replace(title3, /xxLEFTQAxx/g, (limitOfGettingReward - parseInt(totalAsked)));
        const d0UserQaWidget = {
            resource_type: 'widget',
            widget_data: {
                widget_type: this.settings.mpvpBottomSheetItem.widget_type,
                widget_data: {
                    title1: this.user.locale === 'hi' ? StaticData.d0UserQaWidgetMpvpBottomSheet.title1.hi : StaticData.d0UserQaWidgetMpvpBottomSheet.title1.en,
                    title1_size: this.settings.mpvpBottomSheetItem.title1_size,
                    title1_color: this.settings.mpvpBottomSheetItem.title1_color,
                    title3,
                    title3_size: this.settings.mpvpBottomSheetItem.title3_size,
                    title3_color: this.settings.mpvpBottomSheetItem.title3_color,
                    title4: this.user.locale === 'hi' ? StaticData.d0UserQaWidgetMpvpBottomSheet.title4.hi : StaticData.d0UserQaWidgetMpvpBottomSheet.title4.en,
                    title4_size: this.settings.mpvpBottomSheetItem.title4_size,
                    title4_color: this.settings.mpvpBottomSheetItem.title4_color,
                    image2_vertical_bias: 1.0,
                    image2_height: 113,
                    image2_width: 114,
                    bg_color1: this.settings.mpvpBottomSheetItem.bg_color1,
                    bg_color2: this.settings.mpvpBottomSheetItem.bg_color2,
                    bg_color3: this.settings.mpvpBottomSheetItem.bg_color3,
                    bg_color4: this.settings.mpvpBottomSheetItem.bg_color4,
                    image_url2: `${this.config.staticCDN}engagement_framework/4892554C-2058-FF31-8E90-35C2DC0A5CA0.webp`,
                    remove_inner_layout_margin: true,
                    deeplink: this.settings.mpvpBottomSheetItem.deeplink,
                    bg_image_url: `${this.config.staticCDN}engagement_framework/CAA109DB-E4B0-1CC2-B66E-07FDA514AD5F.webp`,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                    bg_color: '#FFFFFF',
                },
            },
        };
        return d0UserQaWidget;
    }

    getTargetQaCountForReward() {
        return this.settings.qaCountForReward;
    }

    getCameraSettingsResponse() {
        const returnResponse = {
            exit_app_on_back_press: true,
            timer_data: {
                expiration_time: moment(this.user.timestamp).add('18', 'hour').add('30', 'minute').valueOf(),
                icon: `${this.config.staticCDN}engagement_framework/timer-d0.png`,
            },
        };
        const totalAsked = this.headers.d0_qa_count;
        const limitOfGettingReward = this.settings.qaCountForReward;
        const widgetObj = {
            locale: this.user.locale,
            leftQa: this.settings.qaCountForReward,
            rewardLeftQa: (limitOfGettingReward - parseInt(totalAsked)),
        };
        if (parseInt(this.headers.d0_qa_count) === 0 && this.query.has_camera_permission === 'true') {
            returnResponse.timer_data.title = StaticData.d0UserQaWidgetCamera(widgetObj).top_title_starting;

            const overlayTitle = StaticData.d0UserQaWidgetCamera(widgetObj).overlay_title;
            returnResponse.overlay_data = {
                image: `${this.config.staticCDN}${this.settings.camera.overlay_image}`,
                title: overlayTitle,
                cta: StaticData.d0UserQaWidgetCamera(widgetObj).cta,
            };
        } else {
            returnResponse.timer_data.title = StaticData.d0UserQaWidgetCamera(widgetObj).top_title;
        }
        returnResponse.hide_search_icon = true;
        returnResponse.hide_ask_history = true;
        return returnResponse;
    }

    checkForFeatureShow() {
        let show = false;
        const totalAsked = this.headers.d0_qa_count;
        const limitOfGettingReward = this.settings.qaCountForReward;
        if (limitOfGettingReward > parseInt(totalAsked)) {
            show = true;
        }
        return show;
    }

    async getCameraBackpressResponse() {
        const subjectList = await CameraBlV2.getCameraBottomOverlaySubjectListNew(this.db, this.config, this.user.student_class, this.user.locale, 1, this.user.student_id);

        const cameraBackWidgets = [{
            type: 'widget_sample_question',
            data: {
                title: StaticData.d0UserCameraBackpress(this.user.locale).title,
                image_url: subjectList[0].imageUrl,
                show_or_view: false,
                deeplink: `doubtnutapp://camera?camera_crop_url=${subjectList[0].imageUrl}&intent_flag=FLAG_ACTIVITY_CLEAR_TOP`,
                cta: StaticData.d0UserCameraBackpress(this.user.locale).exampleButtonText,
            },
        }];

        let secondHeadingData = {
            title: StaticData.d0UserCameraBackpress(this.user.locale).title_2,
        };
        secondHeadingData = { ...secondHeadingData, ...this.settings.camera.bottom_sheet_option_settings };

        const secondHeadingObj = {
            type: 'text_widget',
            data: secondHeadingData,
        };
        delete secondHeadingObj.data.image_start_width;
        delete secondHeadingObj.data.image_start_height;
        cameraBackWidgets.push(secondHeadingObj);

        for (let i = 0; i < this.settings.camera.bottom_sheet_total_option; i++) {
            const optionDataKey = `opt_${i + 1}`;
            const optionSettingsKey = `bottom_sheet_img_opt_${i + 1}`;
            let itemData = {
                title: StaticData.d0UserCameraBackpress(this.user.locale)[optionDataKey],
                image_start: `${this.config.staticCDN}${this.settings.camera[optionSettingsKey]}`,
            };
            const itemSettings = this.settings.camera.bottom_sheet_option_settings;
            itemData = { ...itemData, ...itemSettings };

            const itemObj = {
                type: 'text_widget',
                data: itemData,
            };

            cameraBackWidgets.push(itemObj);
        }

        const returnResp = {
            widgets: cameraBackWidgets,
            cta: {
                title: StaticData.d0UserCameraBackpress(this.user.locale).cta,
                text_color: StaticData.cameraPageBottomSheet.cta_button.color,
                deeplink: this.settings.mpvpBottomSheetItem.deeplink,
                bg_color: '#ffffff',
                stroke_color: StaticData.cameraPageBottomSheet.cta_button.color,
            },
            show_top_drag_icon: true,
            padding_bottom: 0,
        };
        return returnResp;
    }

    getD0ActivityBannerOnVideoScreen(type = 'top') {
        const totalAsked = this.headers.d0_qa_count;
        const limitOfGettingReward = this.settings.qaCountForReward;
        const d0UserObj = {
            locale: this.user.locale,
            totalAsked,
            limitReward: (limitOfGettingReward - parseInt(totalAsked)),
        };
        const title = StaticData.d0UserVideoBackpress(d0UserObj).questionsAsked;

        const subTitle = StaticData.d0UserVideoBackpress(d0UserObj).questionsLeft[type];

        const itemObj = {
            type: 'widget_d0_qa',
            data: {
                id: '1234',
                background_color: type === 'backpress' ? '#ffffff' : '#51459e',
                expiration_time: moment(this.user.timestamp).add('18', 'hour').add('30', 'minute').valueOf(),
                expiration_time_color: type === 'backpress' ? '#EB532C' : '#ffc700',
                expiration_time_size: '13',
                title,
                title_color: type === 'backpress' ? '#263238' : '#ffffff',
                title_size: '18',
                subtitle: subTitle,
                subtitle_color: type === 'backpress' ? '#263238' : '#ffffff',
                subtitle_size: '13',
                qa_count: parseInt(totalAsked),
                qa_total: limitOfGettingReward,
                qa_ratio_color: type === 'backpress' ? '#000000' : '#ffffff',
                qa_ratio_size: '17',
                qa_progress_background_color: type === 'backpress' ? '#969696' : '#ffffff',
                qa_progress_color: type === 'backpress' ? '#EB532C' : '#ffc700',
                show_divider: true,
                divider_color: type === 'backpress' ? '#969696' : '#ffffff',
                deeplink: this.settings.mpvpBottomSheetItem.deeplink,
            },
        };

        if (type === 'backpress') {
            itemObj.layout_config = {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
            };
        }

        let widgetObject = {
            widget_type: 'widget_parent',
            widget_data: {
                scroll_direction: 'vertical',
                items: [itemObj],
            },
        };

        if (type === 'backpress') {
            widgetObject = {
                widgets: [itemObj],
                padding_bottom: 0,
            };
        }

        return widgetObject;
    }

    async extractOnlyNonSubscribedCourses(getLatestAssortmentId) {
        const { student_id: studentId } = this.user;
        let allSubscribedPackages = await CourseV2.getUserActivePackages(this.db, studentId);
        if (allSubscribedPackages.length > 0) {
            allSubscribedPackages = allSubscribedPackages.map((x) => x.assortment_id);

            const allParentAssortmentList = await CourseHelper.getChildAssortmentListRecursivelyV1(this.db, allSubscribedPackages);
            allParentAssortmentList.forEach((x) => {
                allSubscribedPackages.push(x);
            });

            getLatestAssortmentId = getLatestAssortmentId.filter((x) => !allSubscribedPackages.includes(x.assortment_id));
        }

        return getLatestAssortmentId;
    }

    async extractOnlyPackageDetailsAddedCourse(getLatestAssortmentId) {
        const { student_id: studentId } = this.user;

        const packageDetailsCallArr = [];
        getLatestAssortmentId.forEach((x) => {
            packageDetailsCallArr.push(CourseHelper.getPackagesForAssortment(this.db, studentId, [x.assortment_id]));
        });

        const promiseResult = await Promise.all(packageDetailsCallArr);

        const finalPackageArr = [];
        getLatestAssortmentId.forEach((x, i) => {
            if (promiseResult[i].length) {
                finalPackageArr.push(x);
            }
        });

        return finalPackageArr;
    }

    async assignCourseCcmWise(categoryList) {
        const cacheKey = md5(JSON.stringify({
            category_list: categoryList,
        }));

        let itemList = [];
        const filteredList = await QuestionRedis.getSrpCache(this.db.redis.read, cacheKey);
        if (!_.isNull(filteredList)) {
            itemList = JSON.parse(filteredList);
        } else {
            const askedSubjects = await QuetionsNewMysql.checkQuestionsAskedCountOfaDay(this.user.student_id, this.db.mysql.read);
            const subjectsArr = askedSubjects.map((x) => x.subject);
            const mostAskedSubject = _.head(_(subjectsArr).countBy().entries().maxBy(_.last));
            let assortmentIdWiseCourse = await LiveClassMySql.getTypeWiseCard(this.db.mysql.read, mostAskedSubject, this.user.student_class, true, categoryList);
            if (assortmentIdWiseCourse.length > 0) {
                assortmentIdWiseCourse = await this.extractOnlyNonSubscribedCourses(assortmentIdWiseCourse);
                if (assortmentIdWiseCourse.length > 0) {
                    assortmentIdWiseCourse = await this.extractOnlyPackageDetailsAddedCourse(assortmentIdWiseCourse);
                    if (assortmentIdWiseCourse.length > 0) {
                        itemList = assortmentIdWiseCourse;
                        QuestionRedis.setSrpCache(this.db.redis.write, cacheKey, itemList);
                    }
                }
            }
        }

        if (itemList.length > 0) {
            const localeText = this.user.locale === 'hi' ? 'HINDI' : 'ENGLISH';
            let itemFinalList = itemList.filter((x) => x.meta_info === localeText);
            if (itemFinalList.length === 0) {
                itemFinalList = itemList.filter((x) => x.meta_info === 'ENGLISH');
                if (itemFinalList.length === 0) {
                    itemFinalList = itemList;
                }
            }
            itemFinalList = [itemFinalList[0]];

            const latestAssortmentIds = itemFinalList.map((x) => x.assortment_id);

            const result = await PackageContainer.createSubscriptionEntryForTrialV1(this.db, this.user.student_id, latestAssortmentIds[0], -1, '7');
            if (!_.isEmpty(result)) {
                return latestAssortmentIds[0];
            }
            return 0;
        }
        return 0;
    }

    async rewardController() {
        let rewardAssignStatus = false;
        const { student_id: studentId } = this.user;
        const studentCourseData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(this.db, studentId);
        if (studentCourseData && studentCourseData.length > 0) {
            const studentCourseArr = studentCourseData.map((x) => x.course);

            let categoryList = [];
            if (studentCourseArr.length > 0) {
                categoryList = await LiveClassMySql.getCategoryList(this.db.mysql.read, studentCourseArr);
                categoryList = categoryList.map((x) => x.category);

                if (categoryList.length > 0) {
                    const d0UserActivityDetails = await this.assignCourseCcmWise(categoryList);
                    if (d0UserActivityDetails !== 0) {
                        rewardAssignStatus = true;
                        this.trialAssortmentId = d0UserActivityDetails;
                    }
                }
            }
        }
        if (rewardAssignStatus) {
            const notificationData = {
                event: 'course_details',
                title: this.user.locale === 'hi' ? 'बधाई हो! आपने जीता है 7 दिन का फ्री ट्रायल  🥳' : 'Congratulations on winning 7 day free trial 🥳',
                message: this.user.locale === 'hi' ? 'आपने 5 सवाल पूछ लिए हैं और आप जीते हैं 7 दिन के लिए फ्री कोर्स!' : 'Aapne 5 question puch liye hai aur aap jeete hain 7 din k liye free course!',
                image: this.user.locale === 'hi' ? `${this.config.staticCDN}engagement_framework/901B91F9-7AC7-C9CE-FCF7-96752A3FF655.webp` : `${this.config.staticCDN}engagement_framework/049DC5B0-6926-BD05-DAD4-5551E508D439.webp`,
                firebase_eventtag: 'd0_trial_activation',
                data: {
                    deeplink: `doubtnutapp://course_details?id=${this.trialAssortmentId}`,
                },
            };
            Utility.sendFcm(this.user.student_id, this.user.gcm_reg_id, notificationData, null, null);
        }
        return rewardAssignStatus;
    }

    checkingifCampaignedUser() {
        if (this.user.campaign) {
            return true;
        }
        return false;
    }

    getCtaForSampeQuestionWidget(cameraBackWidgets) {
        const sampleQuestionWidget = cameraBackWidgets.filter((x) => x.type === 'widget_sample_question');
        if (sampleQuestionWidget.length === 1) {
            const widgetIndex = cameraBackWidgets.findIndex((x) => x.type === 'widget_sample_question');
            if (widgetIndex !== -1) {
                sampleQuestionWidget[0].data.cta = StaticData.d0UserCameraBackpress(this.user.locale).exampleButtonText;
                cameraBackWidgets = cameraBackWidgets.filter((x) => x.type !== 'widget_sample_question');
                cameraBackWidgets.splice(widgetIndex, 0, sampleQuestionWidget[0]);
            }
        }
        return cameraBackWidgets;
    }
}

module.exports = D0UserManager;
