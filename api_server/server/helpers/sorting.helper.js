const _ = require('lodash');
const moment = require('moment');

const CourseContainer = require('../../modules/containers/coursev2');
// const courseMysql = require('../../modules/mysql/course');
const UtilityFlagr = require('../../modules/Utility.flagr');
const ClassCourseMappingContainer = require('../../modules/containers/ClassCourseMapping');
const StudentHelper = require('./student.helper');

class SortingManager {
    constructor(request) {
        this.req = request;
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.user = request.user;
        this.headers = request.headers;
        this.itemsMain = [];
        this.onlyFreeItems = [];
        this.itemsWithCcmId = [];
        this.itemsWithSubscription = [];
        this.itemsWithSubscriptionWithCcm = [];
    }

    getCcmDetails() {
        return ClassCourseMappingContainer.getStudentsExamsBoardsData(this.db, this.user.student_id, 'none');
    }

    async getSubscriptionDetails() {
        // * Fetch user active packages
        const studentCurrentSubscriptionDetails = await CourseContainer.getUserActivePackages(this.db, this.user.student_id);

        let studentCourseOrClassSubcriptionDetails = studentCurrentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || (this.headers.versionCode >= 893 && item.assortment_type === 'subject')));
        if (this.headers.versionCode >= 893) {
            const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            let expiredPackages = await CourseContainer.getUserExpiredPackagesIncludingTrial(this.db, this.user.student_id);
            expiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30 && (this.headers.versionCode > 966 || item.amount > -1));
            expiredPackages = expiredPackages.filter((item) => !_.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', item.assortment_id]));
            studentCourseOrClassSubcriptionDetails = [...studentCourseOrClassSubcriptionDetails, ...expiredPackages];
        }
        return studentCourseOrClassSubcriptionDetails;
        // return courseMysql.checkVipV1(this.db.mysql.read, this.user.student_id);
    }

    makeItemsArrayWithLatest() {
        this.itemsMain = _.reverse(this.itemsMain);
        this.itemsMain = _.uniqBy(this.itemsMain, 'title');
    }

    getCcmWiseAddition(type, ccmDetails) {
        let items = this.itemsWithCcmId;
        if (type === 'ccm_secondary') {
            items = this.itemsWithSubscriptionWithCcm;
        }
        const userCcmIds = ccmDetails.map((x) => x.id);
        items.forEach((x) => {
            const ccmIds = x.filter_value;
            if (ccmIds.includes(',')) {
                const ccmList = ccmIds.split(',');
                ccmList.forEach((y) => {
                    if (userCcmIds.includes(y)) {
                        this.itemsMain.push(x);
                        return false;
                    }
                });
            } else if (userCcmIds.includes(x)) {
                this.itemsMain.push(x);
            }
        });
    }

    getCcmIdWiseItems(itemList, ccmDetails, subscriptionDetails) {
        this.itemsWithCcmId = itemList.filter((y) => y.filter_type === 'ccm_id');
        if (subscriptionDetails.length > 0) {
            this.itemsWithCcmId = this.itemsWithCcmId.filter((y) => y.secondary_filter_type === '' || (y.secondary_filter_type === 'subscription' && y.secondary_filter_value === '1'));
        } else {
            this.itemsWithCcmId = this.itemsWithCcmId.filter((y) => y.secondary_filter_type === '' || (y.secondary_filter_type === 'subscription' && y.secondary_filter_value === '0'));
        }

        if (this.itemsWithCcmId.length > 0) {
            this.getCcmWiseAddition('ccm_primary', ccmDetails);
            this.makeItemsArrayWithLatest();
        }
    }

    getsubscriptionWiseItems(itemList, ccmDetails) {
        this.itemsWithSubscription = itemList.filter((y) => y.filter_type === 'subscription' && y.filter_value === '1' && y.secondary_filter_type === '');
        if (ccmDetails.length > 0) {
            this.itemsWithSubscriptionWithCcm = itemList.filter((y) => y.filter_type === 'subscription' && y.filter_value === '1' && y.secondary_filter_type === 'ccm_id');
        }

        if (this.itemsWithSubscription.length > 0) {
            this.itemsMain = [...this.itemsMain, ...this.itemsWithSubscription];
            this.makeItemsArrayWithLatest();
        }

        if (this.itemsWithSubscriptionWithCcm.length > 0) {
            this.getCcmWiseAddition('ccm_secondary', ccmDetails);
            this.makeItemsArrayWithLatest();
        }
    }

    async checkFlagrForItems() {
        const itemsWithFlagrNames = this.itemsMain.filter((x) => x.flagr_name !== '');
        const flagrNames = itemsWithFlagrNames.map((x) => x.flagr_name);

        const flagrPromise = [];
        flagrNames.forEach((x) => {
            const obj = {};
            obj[x] = {};
            flagrPromise.push(UtilityFlagr.getFlagrResp({ body: { capabilities: obj, entityId: this.user.student_id } }));
        });
        const flagrResponses = await Promise.all(flagrPromise);

        this.itemsMain.forEach((x) => {
            let removeItem = false;
            if (x.flagr_name !== '') {
                const flagrName = x.flagr_name;
                const iconArrIndex = flagrNames.findIndex((y) => y === flagrName);
                if (iconArrIndex > -1) {
                    const flagrResponseForIcon = flagrResponses[iconArrIndex];
                    if (flagrResponseForIcon != undefined && flagrResponseForIcon[flagrName] && flagrResponseForIcon[flagrName].enabled) {
                        if (x.flag_variants.toString().includes(',')) {
                            const flagArr = x.flag_variants.split(',');
                            let gotMatch = false;
                            flagArr.forEach((y) => {
                                if (flagrResponseForIcon[flagrName].variantId === y) {
                                    gotMatch = true;
                                }
                            });
                            if (!gotMatch) {
                                removeItem = true;
                            }
                        } else if (flagrResponseForIcon[flagrName].variantId !== x.flag_variants) {
                            removeItem = true;
                        }

                        if (!removeItem && flagrResponseForIcon[flagrName].payload.position) {
                            x.position = flagrResponseForIcon[flagrName].payload.position.toString();
                        }
                    }
                }
            }
            if (removeItem) {
                x.removeItem = removeItem;
            }
        });
        this.itemsMain = this.itemsMain.filter((x) => !x.removeItem);
        flagrNames.forEach((x) => {
            const iconIndex = this.itemsMain.findIndex((y) => y.flagr_name === x);
            if (iconIndex > -1) {
                const icondetails = this.itemsMain.filter((y) => y.flagr_name === x);
                this.itemsMain.splice(iconIndex, 1);
                this.itemsMain.splice((parseInt(icondetails[0].position) - 1), 0, icondetails[0]);
            }
        });
    }

    checkEvenSidAndAddIcons() {
        const isDNREnabled = StudentHelper.showDnrExp(this.user.student_id, this.headers.package_name);
        if (!isDNREnabled) {
            const featureTypeLists = ['navigate_dnr', 'dnr_bottom_sheet_icon', 'doubtnut_rupya'];
            this.itemsMain = this.itemsMain.filter((x) => !featureTypeLists.includes(x.feature_type));
        }
    }

    async getSortedItems(itemList) {
        // getting all items in the basis of class, locale and screen_type with position.
        // for only ccm_id, insert just ccm_id. for subscription and non-subscription, enter two values with the respective position.
        const ccmDetails = await this.getCcmDetails();
        const subscriptionDetails = await this.getSubscriptionDetails();

        this.itemsMain = itemList.filter((x) => x.filter_type === '');
        if (subscriptionDetails.length === 0) {
            this.onlyFreeItems = itemList.filter((x) => x.filter_type === 'subscription' && x.filter_value === '0' && x.secondary_filter_type === '');
            this.itemsMain = [...this.itemsMain, ...this.onlyFreeItems];
            this.makeItemsArrayWithLatest();
        }

        if (ccmDetails.length > 0 || subscriptionDetails.length > 0) {
            if (ccmDetails.length > 0) {
                this.getCcmIdWiseItems(itemList, ccmDetails, subscriptionDetails);
            }

            if (subscriptionDetails.length > 0) {
                this.getsubscriptionWiseItems(itemList, ccmDetails);
            }
        }

        if (this.itemsMain.length > 0) {
            await this.checkFlagrForItems();
            this.checkEvenSidAndAddIcons();
            this.itemsMain = _.orderBy(this.itemsMain, ['position'], ['asc']);
        }
        return this.itemsMain;
    }
}

module.exports = SortingManager;
