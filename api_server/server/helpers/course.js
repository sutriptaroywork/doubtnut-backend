/* eslint-disable no-shadow */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-mixed-operators */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const CourseContainer = require('../../modules/containers/course');
const CourseContainerv2 = require('../../modules/containers/coursev2');
const CourseMysqlv2 = require('../../modules/mysql/coursev2');
const TestSeries = require('../../modules/mysql/testseries');
// const CourseMysql = require('../../modules/mysql/course');
const Liveclass = require('../../modules/mysql/liveclass');
const Package = require('../../modules/mysql/package');
const liveclassData = require('../../data/liveclass.data');
const Data = require('../../data/data');
const LiveclassHelper = require('./liveclass');
const Flagr = require('../../modules/containers/Utility.flagr');
// const async = require('async');
const UtilityFlagr = require('../../modules/Utility.flagr');
const UtilityTranslate = require('../../modules/utility.translation');
const PaymentConstants = require('../../data/data.payment');
// const async = require('async');
const { buildStaticCdnUrl } = require('./buildStaticCdnUrl');
const TGHelper = require('./target-group');
const CouponMySQL = require('../../modules/mysql/coupon');
const StudentContainer = require('../../modules/containers/student');
const ClassCourseMappingContainer = require('../../modules/containers/ClassCourseMapping');
const StructuredCourse = require('../../modules/mysql/eStructuredCourse');
const CourseRedisv2 = require('../../modules/redis/coursev2');
const PackageRedis = require('../../modules/redis/package');
const scholarshipHelper = require('../v1/scholarship/scholarship.helper');
const QuestionContainer = require('../../modules/containers/question');
const { autoScrollTime } = require('../../data/data');
const PaidUserChampionshipHelper = require('./paidUserChamionship');
const randomNumberGenerator = require('../../modules/randomNumberGenerator');
const PayMySQL = require('../../modules/mysql/payment');
const FlagrMySQL = require('../../modules/mysql/Utility.flagr');
const liveclassHelper = require('./liveclass');
const { winstonLogger: logger } = require('../../config/winston');
const config = require('../../config/config');
// const LiveclassHelperV6 = require('../v6/course/course.helper');
const PznContainer = require('../../modules/containers/pzn');
const PackageContainer = require('../../modules/containers/package');
const TeacherContainer = require('../../modules/containers/teacher');

function numberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getPaymentDeeplink(flagrResponse, data) {
    return `doubtnutapp://vip?assortment_id=${data.parent === 4 ? 138829 : data.assortment_id}`;
}

function getBarColorHomepage(subject) {
    const colorMap = {
        PHYSICS: '#508f17',
        BIOLOGY: '#8064f4',
        CHEMISTRY: '#b62da8',
        MATHS: '#1f3157',
        ENGLISH: '#1a99e9',
        SCIENCE: '#0E2B6D',
        GUIDANCE: '#0E2B6D',
        ALL: '#0E2B6D',
        TEST: '#54138a',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return liveclassData.subjectColor;
}

async function generateStructuredCourseDataV1(data) {
    const {
        caraouselObject,
        caraouselData,
    } = data;
    for (let i = 0; i < caraouselData.length; i++) {
        caraouselData[i].image_bar_color = '#FF0000';
        caraouselData[i].course_type = caraouselData[i].is_live === 1 ? 'LIVE' : 'VIDEOS';
        caraouselData[i].faculty = caraouselData[i].faculty_avatars ? caraouselData[i].faculty_avatars.split('|') : [];
    }

    const obj = {};
    const secondaryObj = {};
    obj.type = caraouselObject.data_type;
    obj.action = {};
    obj.action.action_activity = 'structured_course';
    obj.action.action_data = null;
    secondaryObj.title = 'ALL COURSES';
    secondaryObj.link_text = '';
    secondaryObj.items = caraouselData;
    obj.data = secondaryObj;
    return obj;
}

async function generateStructuredCourseDataV2(data) {
    const {
        caraouselData,
        db,
        config,
    } = data;
    const result = [];
    for (let i = 0; i < caraouselData.length; i++) {
        const o = {};
        o.id = caraouselData[i].id;
        o.title = caraouselData[i].image_title;
        o.subtitle = caraouselData[i].image_subtitle;
        o.image_bg = caraouselData[i].is_free ? `${config.staticCDN}liveclass/COURSE_FREE.png` : `${config.staticCDN}liveclass/COURSE_VIP.png`;
        o.course_type = caraouselData[i].is_live === 1 ? 'LIVE' : 'VIDEOS';
        o.faculty = caraouselData[i].faculty_avatars ? caraouselData[i].faculty_avatars.split('|') : [];
        o.registered = `${(await CourseContainer.getRandomSubsViews({
            db,
            type: 'liveclass_faculty',
            id: caraouselData[i].faculty_id,
        })).subs} registered`;
        o.deeplink = `doubtnutapp://course_details?id=${caraouselData[i].id}`;
        o.is_premium = false;
        o.icon_url = caraouselData[i].is_free ? '' : `${config.staticCDN}liveclass/VIP_ICON.png`;
        o.title_top = caraouselData[i].is_free ? 'Free Course' : 'VIP';
        o.title_top_color = caraouselData[i].is_free ? '#378e07' : '#fec29d';
        if (!caraouselData[i].is_free) {
            o.title_one_color = '#ffffff';
            o.title_two_color = '#ffffff';
            o.registered_text_color = '#ffffff';
        }
        result.push(o);
    }

    const obj = {};
    const secondaryObj = {};
    obj.type = 'course_list2';
    obj.action = {};
    obj.action.action_activity = 'CourseActivityV3';
    obj.action.action_data = null;
    secondaryObj.title = 'COURSES';
    secondaryObj.link_text = '';
    secondaryObj.items = result;
    obj.data = secondaryObj;
    return obj;
}

function generateTopicObject(data, showBy) {
    const obj = {};
    obj.type = 'topic';
    obj.detail_id = data.detail_id;
    obj.subject = data.subject;
    obj.subject_color = getBarColorHomepage(obj.subject);
    obj.title = data.chapter;
    const faculty = data.faculty_name ? `by ${data.faculty_name}` : '';
    const degree = data.degree ? `, ${data.degree}` : '';
    obj.subtitle = showBy ? `${faculty}${degree}` : `${data.faculty_name}`;
    obj.lecture_count = data.lecture_count > 1 ? `${data.lecture_count} lectures` : `${data.lecture_count} lecture`;
    const hr = Math.floor(data.duration / 3600);
    const min = Math.floor((data.duration % 3600) / 60);
    obj.duration = `${hr > 0 ? `${hr} hr ` : ''}${min > 0 ? `${min} mins` : ''}`;
    return obj;
}

function getPaymentCardStateV2({
    data,
    flagrResponse = {},
    courseType,
    categoryID,
}) {
    const vipState = CourseContainer.getPaymentCardStateV2({
        data,
        flagrResponse,
        courseType,
        categoryID,
    });
    return vipState;
}
//
async function getResourcesByAssortmentListRecursively(db, assortmentList, totalResource = [], startDate, endDate, batchID) {
    try {
        if (assortmentList.length) {
            let results = await CourseMysqlv2.getAssortmentsByAssortmentList(db.mysql.read, assortmentList);
            // divide it into resources and assortment ids
            if (!results.length) {
                results = await CourseMysqlv2.getResourcesByAssortmentList(db.mysql.read, assortmentList, startDate, endDate, batchID);
            }
            const groupedMapping = _.groupBy(results, 'assortment_type');
            if (typeof groupedMapping.resource !== 'undefined' && groupedMapping.resource.length > 0) {
                totalResource = [...totalResource, ...groupedMapping.resource];
            }
            if (typeof groupedMapping.assortment !== 'undefined' && groupedMapping.assortment.length > 0) {
                const assortmentListArr = groupedMapping.assortment.reduce((acc, obj) => acc.concat(obj.course_resource_id), []);
                return getResourcesByAssortmentListRecursively(db, assortmentListArr, totalResource, startDate, endDate, batchID);
            }
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}

async function getResourcesByAssortmentListRecursivelyV1(db, assortmentList, totalResource = [], startDate, endDate, studentID, batchID) {
    try {
        if (assortmentList.length) {
            let results = await CourseMysqlv2.getAssortmentsByAssortmentListWithoutNotes(db.mysql.read, assortmentList, startDate, endDate);
            // divide it into resources and assortment ids
            if (!results.length) {
                results = await CourseMysqlv2.getResourcesByAssortmentListWithoutNotes(db.mysql.read, assortmentList, startDate, endDate, studentID, batchID);
            } else if (results[0].a_type.includes('resource')) {
                results = results.filter((e) => e.live_at !== null);
            }
            const groupedMapping = _.groupBy(results, 'assortment_type');
            if (typeof groupedMapping.resource !== 'undefined' && groupedMapping.resource.length > 0) {
                totalResource = [...totalResource, ...groupedMapping.resource];
            }
            if (typeof groupedMapping.assortment !== 'undefined' && groupedMapping.assortment.length > 0) {
                const assortmentListArr = groupedMapping.assortment.reduce((acc, obj) => acc.concat(obj.course_resource_id), []);
                return getResourcesByAssortmentListRecursivelyV1(db, assortmentListArr, totalResource, startDate, endDate, studentID, batchID);
            }
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}

async function getResourcesByAssortmentList(db, assortmentList, startDate, endDate, studentID, batchID) {
    try {
        const totalResource = [];
        if (studentID) {
            return await getResourcesByAssortmentListRecursivelyV1(db, assortmentList, totalResource, startDate, endDate, studentID, batchID);
        }
        return await getResourcesByAssortmentListRecursively(db, assortmentList, totalResource, startDate, endDate, batchID);
    } catch (e) {
        throw new Error(e);
    }
}

async function getResourcesForTimeline(db, assortmentID, studentID, batchID, page, assortmentType) {
    try {
        const offset = (page - 1) * 30;
        const videoAssortments = await CourseMysqlv2.getAssortmentsByAssortmentListForTimeline(db.mysql.read, assortmentID, offset, batchID, assortmentType);
        const assortmentList = [];
        videoAssortments.map((item) => assortmentList.push(item.course_resource_id));
        const results = assortmentList.length ? await CourseMysqlv2.getResourcesByAssortmentListForTimeline(db.mysql.read, assortmentList, studentID, batchID) : [];
        return results;
    } catch (e) {
        throw new Error(e);
    }
}

async function getParentAssortmentListRecursivelyV1(db, assortmentList, totalResource = [], studentClass) {
    try {
        const results = await CourseMysqlv2.getAllParentAssortments(db.mysql.read, assortmentList, studentClass);
        if (results.length > 0) {
            totalResource = [...totalResource, ...results];
            const assortmentListArr = results.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            return getParentAssortmentListRecursivelyV1(db, assortmentListArr, totalResource, studentClass);
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}

async function getParentAssortmentListV1(db, assortmentList, studentClass) {
    try {
        const totalResource = [];
        const totalMapppings = await getParentAssortmentListRecursivelyV1(db, assortmentList, totalResource, studentClass);
        // divide it into resources and assortment ids

        return totalMapppings;
    } catch (e) {
        throw new Error(e);
    }
}

async function getFlagrResponseByFlagKey(xAuthToken, keys) {
    const flagData = { xAuthToken, body: { capabilities: {} } };
    for (let i = 0; i < keys.length; i++) {
        flagData.body.capabilities[keys[i]] = {};
    }
    const data = await UtilityFlagr.getFlagrResp(flagData);
    return data;
}

async function generateFlagrResponse(db, arr, studentId) {
    const flagIds = await PackageContainer.getFlagIDKeysFromAssortmentId(db, arr);
    const flagrArr = [];
    let variantAttachment = {};
    if (flagIds.length) {
        flagIds.forEach((e) => flagrArr.push(e.flag_key));
        variantAttachment = await Flagr.evaluateServiceWrapperPricing({
            db,
            studentId,
            flagrArr,
        });
        const promises = [];
        const missingKeys = [];
        for (let i = 0; i < flagrArr.length; i++) {
            if (!variantAttachment || _.isEmpty(variantAttachment) || _.isNull(variantAttachment[flagrArr[i]]) || !variantAttachment[flagrArr[i]]) {
                promises.push(Package.getDefaultVariants(db.mysql.read, flagrArr[i]));
                missingKeys.push(flagrArr[i]);
            } else {
                variantAttachment[flagrArr[i]].assortment = flagIds[i].assortment_id;
            }
        }
        const result = await Promise.all(promises);
        for (let i = 0; i < result.length; i++) {
            let obj;
            if (result[i].length > 1) {
                obj = {
                    payload: {
                        package_variant: result[i][0].id,
                        is_emi: true,
                        emi_variant: result[i][1].id,
                    },
                    assortment: flagIds[flagrArr.indexOf(missingKeys[i])].assortment_id,
                };
            } else {
                obj = {
                    payload: {
                        package_variant: result[i][0].id,
                        is_emi: false,
                    },
                    assortment: flagIds[flagrArr.indexOf(missingKeys[i])].assortment_id,
                };
            }
            variantAttachment[missingKeys[i]] = obj;
        }
    }
    return variantAttachment;
}

async function getBatchByAssortmentListAndStudentId(db, studentID, assortmentList) {
    const obj = {};
    const promise = [];
    if (assortmentList && assortmentList.length) {
        const [
            checkPurchaseHistory,
            checkActiveSubscriptions,
        ] = await Promise.all([
            CourseContainerv2.getUserExpiredPackages(db, studentID),
            CourseContainerv2.getUserActivePackages(db, studentID),
        ]);
        for (let i = 0; i < assortmentList.length; i++) {
            const currentAssortmentPurchaseHistory = _.find(checkPurchaseHistory, ['assortment_id', +assortmentList[i]]) || _.find(checkActiveSubscriptions, ['assortment_id', +assortmentList[i]]);
            if (currentAssortmentPurchaseHistory && assortmentList[i]) {
                obj[assortmentList[i]] = currentAssortmentPurchaseHistory.batch_id;
            } else if (assortmentList[i]) {
                promise.push(CourseContainerv2.getLastestBatchByAssortment(db, assortmentList[i]));
            }
        }
        const latestBatch = await Promise.all(promise);
        for (let i = 0; i < latestBatch.length; i++) {
            if (latestBatch[i].length) {
                obj[latestBatch[i][0].assortment_id] = latestBatch[i][0].batch_id;
            }
        }
    }
    return obj;
}

async function getBatchDetailsByAssortmentListAndStudentId(db, studentID, assortmentList) {
    const obj = {};
    const promise = [];
    if (assortmentList && assortmentList.length) {
        const [
            checkPurchaseHistory,
            checkActiveSubscriptions,
        ] = await Promise.all([
            CourseContainerv2.getUserExpiredPackages(db, studentID),
            CourseContainerv2.getUserActivePackages(db, studentID),
        ]);
        for (let i = 0; i < assortmentList.length; i++) {
            const currentAssortmentPurchaseHistory = _.find(checkPurchaseHistory, ['assortment_id', +assortmentList[i]]) || _.find(checkActiveSubscriptions, ['assortment_id', +assortmentList[i]]);
            if (currentAssortmentPurchaseHistory && assortmentList[i]) {
                obj[assortmentList[i]] = currentAssortmentPurchaseHistory.batch_id;
            } else if (assortmentList[i]) {
                promise.push(CourseContainerv2.getLastestBatchByAssortment(db, assortmentList[i]));
            }
        }
        const latestBatch = await Promise.all(promise);
        for (let i = 0; i < latestBatch.length; i++) {
            if (latestBatch[i].length) {
                obj[latestBatch[i][0].assortment_id] = {
                    batch_id: latestBatch[i][0].batch_id,
                    display_name: latestBatch[i][0].display_name,
                    display_description: latestBatch[i][0].display_description,
                    demo_video_thumbnail: latestBatch[i][0].demo_video_thumbnail,
                };
            }
        }
    }
    return obj;
}

async function getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID) {
    if (assortmentID) {
        const [
            checkPurchaseHistory,
            checkActiveSubscriptions,
        ] = await Promise.all([
            CourseContainerv2.getUserExpiredPackages(db, studentID),
            CourseContainerv2.getUserActivePackages(db, studentID),
        ]);
        const currentAssortmentPurchaseHistory = _.find(checkActiveSubscriptions, ['assortment_id', +assortmentID]) || _.find(checkPurchaseHistory, ['assortment_id', +assortmentID]);
        if (currentAssortmentPurchaseHistory) {
            return currentAssortmentPurchaseHistory.batch_id;
        }
        const latestBatch = await CourseContainerv2.getLastestBatchByAssortment(db, assortmentID);
        return latestBatch.length ? latestBatch[0].batch_id : 1;
    }
    return 1;
}

async function pricingExperiment(db, experimentPackages, studentId) {
    const flagData = { body: { capabilities: {}, entityId: studentId.toString() } };
    const promises = [];
    for (let i = 0; i < experimentPackages.length; i++) {
        // Check If Package Already Shown to user (once shown mapped in db)
        if (config.flagrMysql) {
            promises.push(FlagrMySQL.getFlagrConfigUsingFlagKey(db.mysql.read, studentId, experimentPackages[i].flag_key));
        } else {
            flagData.body.capabilities[experimentPackages[i].flag_key] = { assortment_id: experimentPackages[i].flag_key };
        }
    }
    let pricingExperimentFlagrResponse = {};
    if (config.flagrMysql) {
        const resolvedPromises = await Promise.all(promises);
        for (let i = 0; i < resolvedPromises.length; i++) {
            if (resolvedPromises[i].length > 0) {
                try {
                    // Try parsing the flar data stored in db, if fails use flagr
                    pricingExperimentFlagrResponse[experimentPackages[i].flag_key] = JSON.parse(resolvedPromises[i][0].data);
                } catch (e) {
                    flagData.body.capabilities[experimentPackages[i].flag_key] = { assortment_id: experimentPackages[i].flag_key };
                }
            } else {
                flagData.body.capabilities[experimentPackages[i].flag_key] = { assortment_id: experimentPackages[i].flag_key };
            }
        }
    }
    const flagrResponse = await UtilityFlagr.getFlagrResp(flagData);
    const promise = [];
    for (const key in flagrResponse) {
        if (flagrResponse[key].enabled) {
            FlagrMySQL.setFlagrConfigUsingFlagKey(db.mysql.write, {
                flag_key: key,
                variant_id: flagrResponse[key].variantId,
                student_id: studentId,
                data: JSON.stringify({ payload: flagrResponse[key].payload }),
            });
        }
    }
    pricingExperimentFlagrResponse = { ...pricingExperimentFlagrResponse, ...flagrResponse };
    for (const key in pricingExperimentFlagrResponse) {
        if (pricingExperimentFlagrResponse[key]) {
            const keyId = _.get(pricingExperimentFlagrResponse, `${key}.payload.key`, null) || 1;
            promise.push(CourseContainerv2.getAllVariantFromAssortmentIdHome(db, key, keyId));
        }
    }
    const result = await Promise.all(promise);
    let pricing = [];
    for (let i = 0; i < result.length; i++) {
        if (result[i].length) {
            pricing = [...pricing, ...result[i]];
        }
    }
    return pricing;
}

// eslint-disable-next-line no-unused-vars
async function generateAssortmentVariantMapping(db, assortments, studentId, home, xAuthToken) {
    let experimentPricing = [];
    let promise = [];
    const checkExperiment = [];
    for (let i = 0; i < assortments.length; i++) {
        promise.push(CourseContainerv2.getDefaultVariantFromAssortmentIdHome(db, assortments[i]));
    }
    const allPackages = await Promise.all(promise);
    for (let i = 0; i < allPackages.length; i++) {
        for (let j = 0; j < allPackages[i].length; j++) {
            if (allPackages[i][j].flag_key && allPackages[i][j].flag_key !== '' && checkExperiment.indexOf({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id }) < 0) {
                checkExperiment.push({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id });
            }
        }
    }
    const assortmentPriceMapping = {};
    if (checkExperiment.length && studentId) {
        experimentPricing = await pricingExperiment(db, checkExperiment, studentId);
    }
    if (!experimentPricing.length) {
        let i = 0;
        while (i < allPackages.length) {
            if (allPackages[i].length) {
                const value = await CourseRedisv2.getAssortmentPriceMapping(db.redis.read, allPackages[i][0].assortment_id);
                if (!_.isEmpty(value)) {
                    assortmentPriceMapping[allPackages[i][0].assortment_id] = JSON.parse(value);
                    allPackages.splice(i, 1);
                    i -= 1;
                }
            }
            i += 1;
        }
    }
    if (!_.isEmpty(allPackages)) {
        const enabled = true;
        let assortmentList = [];
        const emiPromise = [];
        assortmentList = [];
        promise = [];
        const userBatches = await getBatchByAssortmentListAndStudentId(db, studentId, assortments);
        for (let i = 0; i < allPackages.length; i++) {
            if (allPackages[i].length) {
                allPackages[i] = allPackages[i].filter((item) => !item.flag_key);
                const experiementObj = experimentPricing.filter((item) => item.assortment_id === allPackages[i][0].assortment_id);
                if (experiementObj.length) {
                    allPackages[i] = [...allPackages[i], ...experiementObj];
                    allPackages[i] = _.orderBy(allPackages[i], 'duration_in_days');
                }
                if (userBatches[allPackages[i][0].assortment_id]) {
                    const latestBatch = allPackages[i].filter((item) => item.batch_id === userBatches[allPackages[i][0].assortment_id]);
                    allPackages[i] = latestBatch.length ? latestBatch : allPackages[i];
                }
                const len = allPackages[i].length;
                const priceObj = allPackages[i][len - 1]; // enabled ? allPackages[i][0] : allPackages[i][len - 1];
                if (priceObj) {
                    assortmentPriceMapping[+(priceObj.assortment_id)] = {
                        package_variant: priceObj.variant_id,
                        base_price: priceObj.base_price,
                        display_price: priceObj.display_price,
                        duration: priceObj.duration_in_days,
                        monthly_price: allPackages[i][len - 1] ? Math.floor(allPackages[i][len - 1].display_price / Math.floor(allPackages[i][len - 1].duration_in_days / 30)) : 0,
                    };
                }
                // if (!home) {
                //     emiPromise.push(CourseContainerv2.getEmiVariantOfPackage(db, allPackages[i][0].variant_id));
                // }
                assortmentList.push(allPackages[i][0].assortment_id);
                if (allPackages[i].length > 1) {
                    assortmentPriceMapping[+(allPackages[i][0].assortment_id)].multiple = true;
                    assortmentPriceMapping[+(allPackages[i][0].assortment_id)].enabled = enabled;
                }
            // }
            }
        }
        // const prices = await Promise.all(promise);
        const emivariants = await Promise.all(emiPromise);
        for (let i = 0; i < assortmentList.length; i++) {
            if (emivariants[i] && emivariants[i].length) {
                assortmentPriceMapping[+(assortmentList[i])].is_emi = true;
                assortmentPriceMapping[+(assortmentList[i])].emi_variant = emivariants[i][0].id;
            } else {
                assortmentPriceMapping[+(assortmentList[i])].is_emi = false;
            }
        // }
        }
        await CourseRedisv2.setAssortmentPriceMapping(db.redis.write, assortmentPriceMapping);
    }
    return assortmentPriceMapping;
}

async function generateAssortmentVariantMappingForReferral(db, assortments, studentId, getNonReferralPackages = false) {
    let promise = [];
    const promise2 = [];
    const checkExperiment = [];
    for (let i = 0; i < assortments.length; i++) {
        promise.push(CourseContainerv2.getDefaultVariantFromAssortmentReferral(db, assortments[i]));
        if (getNonReferralPackages) {
            promise2.push(CourseContainerv2.getDefaultVariantFromAssortmentIdHome(db, assortments[i]));
        }
    }
    let allPackages = [];
    let allPackages2 = [];

    if (getNonReferralPackages) {
        [allPackages, allPackages2] = await Promise.all([Promise.all(promise), Promise.all(promise2)]);
        for (let i = 0; i < allPackages.length; i++) {
            allPackages[i].push(...allPackages2[i]);
        }
    } else {
        allPackages = await Promise.all(promise);
    }
    for (let i = 0; i < allPackages.length; i++) {
        for (let j = 0; j < allPackages[i].length; j++) {
            if (allPackages[i][j].flag_key && allPackages[i][j].flag_key !== '' && checkExperiment.indexOf({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id }) < 0) {
                checkExperiment.push({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id });
            }
        }
    }
    let experimentPricing = [];
    if (checkExperiment.length && studentId) {
        experimentPricing = await pricingExperiment(db, checkExperiment, studentId);
    }
    const enabled = true;
    const assortmentPriceMapping = {};
    let assortmentList = [];
    const emiPromise = [];
    assortmentList = [];
    promise = [];
    const userBatches = await getBatchByAssortmentListAndStudentId(db, studentId, assortments);
    for (let i = 0; i < allPackages.length; i++) {
        if (allPackages[i].length) {
            allPackages[i] = allPackages[i].filter((item) => !item.flag_key);
            const experiementObj = experimentPricing.filter((item) => item.assortment_id === allPackages[i][0].assortment_id);
            if (experiementObj.length) {
                allPackages[i] = [...allPackages[i], ...experiementObj];
                allPackages[i] = _.orderBy(allPackages[i], 'duration_in_days');
            }
            if (userBatches[allPackages[i][0].assortment_id]) {
                const latestBatch = allPackages[i].filter((item) => item.batch_id === userBatches[allPackages[i][0].assortment_id]);
                allPackages[i] = latestBatch.length ? latestBatch : allPackages[i];
            }
            const len = allPackages[i].length;
            const priceObj = allPackages[i][len - 1]; // enabled ? allPackages[i][0] : allPackages[i][len - 1];
            if (priceObj) {
                assortmentPriceMapping[parseInt(priceObj.assortment_id)] = {
                    package_variant: priceObj.variant_id,
                    base_price: priceObj.base_price,
                    display_price: priceObj.display_price,
                    duration: priceObj.duration_in_days,
                    monthly_price: allPackages[i][len - 1] ? Math.floor(allPackages[i][len - 1].display_price / Math.floor(allPackages[i][len - 1].duration_in_days / 30)) : 0,
                };
            }
            // if (!home) {
            //     emiPromise.push(CourseContainerv2.getEmiVariantOfPackage(db, allPackages[i][0].variant_id));
            // }
            assortmentList.push(allPackages[i][0].assortment_id);
            if (allPackages[i].length > 1) {
                assortmentPriceMapping[parseInt(allPackages[i][0].assortment_id)].multiple = true;
                assortmentPriceMapping[parseInt(allPackages[i][0].assortment_id)].enabled = enabled;
            }
            // }
        }
    }
    // const prices = await Promise.all(promise);
    const emivariants = await Promise.all(emiPromise);
    for (let i = 0; i < assortmentList.length; i++) {
        if (emivariants[i] && emivariants[i].length) {
            assortmentPriceMapping[parseInt(assortmentList[i])].is_emi = true;
            assortmentPriceMapping[parseInt(assortmentList[i])].emi_variant = emivariants[i][0].id;
        } else {
            assortmentPriceMapping[parseInt(assortmentList[i])].is_emi = false;
        }
        // }
    }
    return assortmentPriceMapping;
}

async function generateAssortmentVariantMappingForAutosalesCampaign(db, assortments, studentId, getNonCampaignPackages = false) {
    let promise = [];
    const promise2 = [];
    const checkExperiment = [];
    for (let i = 0; i < assortments.length; i++) {
        promise.push(CourseContainerv2.getDefaultVariantFromAssortmentAutosalesCampaign(db, assortments[i]));
        if (getNonCampaignPackages) {
            promise2.push(CourseContainerv2.getDefaultVariantFromAssortmentIdHome(db, assortments[i]));
        }
    }
    let allPackages = [];
    let allPackages2 = [];

    if (getNonCampaignPackages) {
        [allPackages, allPackages2] = await Promise.all([Promise.all(promise), Promise.all(promise2)]);
        for (let i = 0; i < allPackages.length; i++) {
            allPackages[i].push(...allPackages2[i]);
        }
    } else {
        allPackages = await Promise.all(promise);
    }
    for (let i = 0; i < allPackages.length; i++) {
        for (let j = 0; j < allPackages[i].length; j++) {
            if (allPackages[i][j].flag_key && allPackages[i][j].flag_key !== '' && checkExperiment.indexOf({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id }) < 0) {
                checkExperiment.push({ flag_key: allPackages[i][j].flag_key, assortment_id: allPackages[i][j].assortment_id });
            }
        }
    }
    let experimentPricing = [];
    if (checkExperiment.length && studentId) {
        experimentPricing = await pricingExperiment(db, checkExperiment, studentId);
    }
    const enabled = true;
    const assortmentPriceMapping = {};
    let assortmentList = [];
    const emiPromise = [];
    assortmentList = [];
    promise = [];
    const userBatches = await getBatchByAssortmentListAndStudentId(db, studentId, assortments);
    for (let i = 0; i < allPackages.length; i++) {
        if (allPackages[i].length) {
            allPackages[i] = allPackages[i].filter((item) => !item.flag_key);
            const experiementObj = experimentPricing.filter((item) => item.assortment_id === allPackages[i][0].assortment_id);
            if (experiementObj.length) {
                allPackages[i] = [...allPackages[i], ...experiementObj];
                allPackages[i] = _.orderBy(allPackages[i], 'duration_in_days');
            }
            if (userBatches[allPackages[i][0].assortment_id]) {
                const latestBatch = allPackages[i].filter((item) => item.batch_id === userBatches[allPackages[i][0].assortment_id]);
                allPackages[i] = latestBatch.length ? latestBatch : allPackages[i];
            }
            const len = allPackages[i].length;
            const priceObj = allPackages[i][len - 1]; // enabled ? allPackages[i][0] : allPackages[i][len - 1];
            if (priceObj) {
                assortmentPriceMapping[parseInt(priceObj.assortment_id)] = {
                    package_variant: priceObj.variant_id,
                    base_price: priceObj.base_price,
                    display_price: priceObj.display_price,
                    duration: priceObj.duration_in_days,
                    monthly_price: allPackages[i][len - 1] ? Math.floor(allPackages[i][len - 1].display_price / Math.floor(allPackages[i][len - 1].duration_in_days / 30)) : 0,
                };
            }
            // if (!home) {
            //     emiPromise.push(CourseContainerv2.getEmiVariantOfPackage(db, allPackages[i][0].variant_id));
            // }
            assortmentList.push(allPackages[i][0].assortment_id);
            if (allPackages[i].length > 1) {
                assortmentPriceMapping[parseInt(allPackages[i][0].assortment_id)].multiple = true;
                assortmentPriceMapping[parseInt(allPackages[i][0].assortment_id)].enabled = enabled;
            }
            // }
        }
    }
    // const prices = await Promise.all(promise);
    const emivariants = await Promise.all(emiPromise);
    for (let i = 0; i < assortmentList.length; i++) {
        if (emivariants[i] && emivariants[i].length) {
            assortmentPriceMapping[parseInt(assortmentList[i])].is_emi = true;
            assortmentPriceMapping[parseInt(assortmentList[i])].emi_variant = emivariants[i][0].id;
        } else {
            assortmentPriceMapping[parseInt(assortmentList[i])].is_emi = false;
        }
        // }
    }
    return assortmentPriceMapping;
}

function createEmiObject(childPackages, emiDetails, locale) {
    const obj = {
        title: (locale === 'hi') ? `किश्त उपलब्ध @ ₹${childPackages[0].display_price}/प्रति माह` : `EMI Available @ ₹${childPackages[0].display_price}/Month`,
        sub_title: 'EMI Details & Schedule',
        description: 'Payment karo asaan kishto mein',
        month_label: 'MONTH',
        installment_label: 'INSTALLMENTS',
        total_label: 'Total',
        total_amount: `₹${emiDetails[0].display_price}`,
        installments: [
            {
                title: 'Payable Now',
                amount: `₹${childPackages[0].display_price}`,
            },
        ],
    };
    let duration = 0;
    for (let j = 1; j < childPackages.length; j++) {
        duration += childPackages[j - 1].emi_duration;
        const o = {
            title: `After ${duration / 30} month`,
            amount: `₹${childPackages[j].display_price}`,
        };
        obj.installments.push(o);
    }
    return obj;
}

const numberMap = {
    opt_1: '1',
    opt_2: '2',
    opt_3: '3',
    opt_4: '4',
};

const stringMap = {
    opt_1: 'A',
    opt_2: 'B',
    opt_3: 'C',
    opt_4: 'D',
};

function modifyObj(result) {
    for (let i = 0; i < result.length; i++) {
        if (result[i].answer.trim().includes('::')) {
            result[i].type = 1;
        }
        if (/\d/g.test(result[i].answer.trim())) {
            // contain numberic
            result[i].opt_1 = { key: numberMap.opt_1, value: LiveclassHelper.handleOptions(result[i].opt_1) };
            result[i].opt_2 = { key: numberMap.opt_2, value: LiveclassHelper.handleOptions(result[i].opt_2) };
            result[i].opt_3 = { key: numberMap.opt_3, value: LiveclassHelper.handleOptions(result[i].opt_3) };
            result[i].opt_4 = { key: numberMap.opt_4, value: LiveclassHelper.handleOptions(result[i].opt_4) };
        } else {
            result[i].opt_1 = { key: stringMap.opt_1, value: LiveclassHelper.handleOptions(result[i].opt_1) };
            result[i].opt_2 = { key: stringMap.opt_2, value: LiveclassHelper.handleOptions(result[i].opt_2) };
            result[i].opt_3 = { key: stringMap.opt_3, value: LiveclassHelper.handleOptions(result[i].opt_3) };
            result[i].opt_4 = { key: stringMap.opt_4, value: LiveclassHelper.handleOptions(result[i].opt_4) };
        }
    }
    return result;
}

async function getAllAssortmentsRecursively(db, assortmentList, totalAssortments = []) {
    try {
        const results = await CourseMysqlv2.getChildAssortments(db.mysql.read, assortmentList);
        // results = results.filter((e) => e.class == studentClass);
        if (results.length) {
            const assortmentListArr = results.reduce((acc, obj) => acc.concat(obj.course_resource_id), []);
            totalAssortments = [...totalAssortments, ...assortmentListArr];
            return getAllAssortmentsRecursively(db, assortmentListArr, totalAssortments);
        }
        return { totalAssortments, assortmentList };
    } catch (e) {
        throw new Error(e);
    }
}

async function getAllAssortments(db, assortmentList) {
    try {
        const totalAssortments = [];
        const totalMapppings = await getAllAssortmentsRecursively(db, assortmentList, totalAssortments);
        return totalMapppings;
    } catch (e) {
        throw new Error(e);
    }
}

async function updatePostPurchaseExplainer(db, studentId, totalMapppings) {
    try {
        const res = await PackageRedis.getBoughtAssortments(db.redis.read, studentId);
        if (!_.isNull(res)) {
            const assortmentArray = JSON.parse(res);
            if (assortmentArray && assortmentArray.length > 0) {
                const intersectionArray = _.intersection(assortmentArray, totalMapppings);
                if (intersectionArray.length > 0) {
                    const difference = assortmentArray.filter((x) => !intersectionArray.includes(x));
                    await PackageRedis.setBoughtAssortments(db.redis.write, studentId, difference);
                }
            }
        }
    } catch (e) {
        throw new Error(e);
    }
}

async function checkVipByResourceReference(db, data, studentId, resourceReference) {
    try {
        // data is list of objects which have resource level assortmentIds.
        const totalAssortments = [];
        let isVip = false;
        let userPackages = [];
        let totalMapppings = [];
        let batchId = 1;
        // const data = await CourseMysqlv2.getAssortmentsByResourceReference(db.mysql.read, resourceReference);
        const totalMapppingsRedis = resourceReference ? await CourseRedisv2.getAllAssortmentsByQuestionId(db.redis.read, resourceReference) : [];
        if (totalMapppingsRedis) {
            totalMapppings = JSON.parse(totalMapppingsRedis);
        } else {
            const assortmentList = data.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            const result = await getParentAssortmentListV1(db, assortmentList, totalAssortments);
            if (result.length) {
                totalMapppings = result.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
                totalMapppings.push(result[0].course_resource_id);
                CourseRedisv2.setAllAssortmentsByQuestionId(db.redis.write, resourceReference, totalMapppings);
            }
        }
        if (totalMapppings.length) {
            const allUserActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
            userPackages = allUserActivePackages.filter((item) => totalMapppings.indexOf(item.assortment_id) >= 0);
            userPackages = _.orderBy(userPackages, ['batch_id'], ['desc']);
            if (userPackages.length) {
                isVip = true;
                if (userPackages.some((item) => item.amount >= 0)) {
                    updatePostPurchaseExplainer(db, studentId, totalMapppings);
                } else {
                    PackageRedis.setBoughtAssortments(db.redis.write, studentId, []);
                }
                batchId = userPackages[0].batch_id;
            } else {
                // find batch id
                const courseAssortmentBatchMapping = await CourseMysqlv2.getCourseAssortmentBatchMappings(db.mysql.read, totalMapppings);
                if (courseAssortmentBatchMapping.length > 0) {
                    batchId = courseAssortmentBatchMapping[0].batch_id;
                }
            }
        }
        return {
            isVip, userPackages, totalMapppings, batchId,
        };
    } catch (e) {
        throw new Error(e);
    }
}

async function checkVipByQuestionIdForVideoPage(db, data, studentId, resourceReference) {
    try {
        const {
            isVip, totalMapppings = [], batchId, userPackages,
        } = await checkVipByResourceReference(db, data, studentId, resourceReference);
        return {
            isVip, totalMapppings, batchId, userPackages,
        };
    } catch (e) {
        throw new Error(e);
    }
}

async function updateUserLastWatchedVideoInAssortmentProgress(db, data, studentId, resourceReference, subject, engageTime, viewID) {
    try {
        const { userPackages = [] } = await checkVipByResourceReference(db, data, studentId, resourceReference);
        const viewCheck = await CourseMysqlv2.videoViewCheck(db.mysql.read, resourceReference, studentId, viewID);
        if (!viewCheck.length || (!data[0].is_chapter_free && data[0].is_free)) {
            for (let i = 0; i < userPackages.length; i++) {
                const progressDetails = await CourseMysqlv2.getUserProgress(db.mysql.read, studentId, userPackages[i].assortment_id);
                let subjectObj = {};
                subjectObj[subject.toUpperCase()] = resourceReference;
                if (progressDetails.length) {
                    if (progressDetails[0].video_history) {
                        subjectObj = JSON.parse(progressDetails[0].video_history);
                        subjectObj[subject.toUpperCase()] = resourceReference;
                    }
                    if (engageTime >= 60) {
                        CourseMysqlv2.updateVideoWatched(db.mysql.write, studentId, userPackages[i].assortment_id, JSON.stringify(subjectObj), engageTime);
                    } else {
                        CourseMysqlv2.updateVideoCount(db.mysql.write, studentId, userPackages[i].assortment_id, engageTime);
                    }
                } else {
                    const obj = {
                        student_id: studentId,
                        assortment_id: userPackages[i].assortment_id,
                        pdf_count: 0,
                        videos_count: 1,
                        test_count: 0,
                        total_count: 1,
                        videos_engage_time: engageTime,
                        package_id: userPackages[i].new_package_id,
                    };
                    if (engageTime >= 60) {
                        obj.video_history = JSON.stringify(subjectObj);
                    }
                    CourseMysqlv2.setVideoCount(db.mysql.write, obj);
                }
                // const now = moment().add(5, 'hours').add(30, 'minutes');
                // const monthStart = moment().add(5, 'hours').add(30, 'minutes').startOf('month');
                // if (userPackages[i].assortment_type === 'course' && moment(now).startOf('day').diff(moment(monthStart), 'days') > 15) {
                //     kafka.publish(kafka.topics.championshipCoupon, 8, {
                //         studentId,
                //         batchId: userPackages[i].batch_id,
                //         assortmentId: userPackages[i].assortment_id,
                //     });
                // }
            }
        } else if (engageTime >= 60) {
            for (let i = 0; i < userPackages.length; i++) {
                const progressDetails = await CourseMysqlv2.getUserProgress(db.mysql.read, studentId, userPackages[i].assortment_id);
                let subjectObj = {};
                subjectObj[subject.toUpperCase()] = resourceReference;
                if (progressDetails.length) {
                    if (progressDetails[0].video_history) {
                        subjectObj = JSON.parse(progressDetails[0].video_history);
                        subjectObj[subject.toUpperCase()] = resourceReference;
                    }
                    CourseMysqlv2.updateVideoWatched(db.mysql.write, studentId, userPackages[i].assortment_id, JSON.stringify(subjectObj), engageTime);
                }
            }
        }
        // for (let i = 0; i < userPackages.length; i++) {
        //     let liveAtTime = await PaidUserChampionshipMysql.getLiveAtFromQuestionId(db.mysql.read, resourceReference);
        //     liveAtTime = liveAtTime[0].live_at;
        //     PaidUserChampionshipHelper.updateCountInLeaderboard(db, 'total_time_class_attended', engageTime, studentId, userPackages[i].assortment_id, liveAtTime);
        //     if (viewCheck.length <= 1) {
        //         PaidUserChampionshipHelper.updateCountInLeaderboard(db, 'class_attended', 1, studentId, userPackages[i].assortment_id, liveAtTime);
        //     }
        // }
    } catch (e) {
        throw new Error(e);
    }
}

function getCourseTabs(tabDetails, locale) {
    // const obj = {
    //     type: 'course_sub_filters',
    //     data: {
    const arr = [];
    const items = [
        {
            id: 'recent',
            text: (locale === 'hi') ? 'हाल की कक्षाएं' : 'Recent Classes',
        },
        {
            id: 'upcoming',
            text: (locale === 'hi') ? 'आगामी कक्षाएं' : 'Upcoming Classes',
        },
        {
            id: 'topics',
            text: (locale === 'hi') ? 'सभी अध्याय' : 'All Topics',
        },
        {
            id: 'previous_year_papers',
            text: (locale === 'hi') ? 'पिछले साल के पेपर' : 'Previous Year Papers',
        },
        {
            id: 'notes',
            text: (locale === 'hi') ? 'नोट्स' : 'Notes',
        },
        {
            id: 'chat',
            text: (locale === 'hi') ? 'चैट' : 'Chat',
        },
    ];

    for (let i = 0; i < items.length; i++) {
        if (tabDetails[i] > 0) {
            arr.push(items[i]);
        }
    }

    return arr;
}

async function getParentAssortmentsByAssortmentListRecursively(db, assortmentList, totalAssortments = []) {
    try {
        const results = await CourseMysqlv2.getAssortmentsByResourceID(db.mysql.read, assortmentList);
        if (results.length > 0) {
            const assortmentListArr = results.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            totalAssortments = [...totalAssortments, ...assortmentListArr];
            return getParentAssortmentsByAssortmentListRecursively(db, assortmentListArr, totalAssortments);
        }
        return totalAssortments;
    } catch (e) {
        throw new Error(e);
    }
}

async function getAssortmentsByResourceList(db, resourceList) {
    try {
        const totalAssortments = [];
        const data = await CourseMysqlv2.getParentAssortmentByResourceList(db.mysql.read, resourceList);
        const assortmentListArr = data.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
        const result = await getParentAssortmentsByAssortmentListRecursively(db, assortmentListArr, totalAssortments);
        return [...assortmentListArr, ...result];
    } catch (e) {
        throw new Error(e);
    }
}

async function getQuiz(db, liveclassResourceID, quizResourceID) {
    try {
        const [liveclassResourceDetails, quizResourceDetails] = await Promise.all([
            CourseMysqlv2.getResourceByID(db.mysql.read, liveclassResourceID),
            CourseMysqlv2.getResourceByID(db.mysql.read, quizResourceID),
        ]);
        const oldQuizResource = await Liveclass.getQuizResource(db.mysql.read, liveclassResourceDetails[0].old_detail_id, quizResourceDetails[0].resource_reference);
        const masterObj = {};
        const dataArr = [];
        const { topic } = quizResourceDetails.topic;
        masterObj.quiz_resource_id = quizResourceID;
        masterObj.liveclass_resource_id = liveclassResourceID;
        masterObj.detail_id = liveclassResourceDetails[0].old_detail_id;
        masterObj.resource_detail_id = (oldQuizResource.length > 0) ? oldQuizResource[0].id : '';
        const quizQuestionIDArr = quizResourceDetails[0].resource_reference.split('|');
        const expiryTimeArr = quizResourceDetails[0].meta_info.split('|');
        for (let j = 0; j < quizQuestionIDArr.length; j++) {
            let quizDetail = await Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionIDArr[j]);
            quizDetail = modifyObj(quizDetail);
            const obj = {};
            obj.question = LiveclassHelper.quotesEscape(quizDetail[0].ocr_text);
            obj.question_id = quizDetail[0].question_id;
            obj.quiz_question_id = quizQuestionIDArr[j];
            obj.topic = topic;
            obj.expiry = (expiryTimeArr[j] === undefined) ? 30 : expiryTimeArr[j];
            obj.type = 0;
            obj.options = [];
            obj.options.push(quizDetail[0].opt_1);
            obj.options.push(quizDetail[0].opt_2);
            obj.options.push(quizDetail[0].opt_3);
            obj.options.push(quizDetail[0].opt_4);
            obj.answer = quizDetail[0].answer.trim();
            dataArr.push(obj);
            masterObj.quiz_list = dataArr;
        }
        return masterObj;
    } catch (e) {
        throw new Error(e);
    }
}

async function postTasks(db, resourceReference) {
    try {
        const resourceList = await CourseMysqlv2.getAllStreamResourceByResourceReference(db.mysql.read, resourceReference);
        const groupedResources = _.groupBy(resourceList, 'liveclass_course_detail_id');
        const promise = [];
        for (const key in groupedResources) {
            if (Object.prototype.hasOwnProperty.call(groupedResources, key)) {
                const detailID = key;
                let updateTime = true;
                const streamD = await await Liveclass.getStreamDetails(db.mysql.read, detailID);
                if (streamD.length > 0 && !_.isEmpty(streamD[0].end_time)) {
                    updateTime = false;
                }
                const item = groupedResources[key];
                let createResource = true;
                let courseID = 0;
                let subject = '';
                let topic = '';
                let resourceClass = '';
                let expertName = '';
                let expertImage = '';
                for (let i = 0; i < item.length; i++) {
                    courseID = item[0].liveclass_course_id;
                    subject = item[0].subject;
                    resourceClass = item[0].class;
                    if (item[i].resource_type == 8) createResource = false;
                    if (item[i].resource_type == 4) {
                        topic = item[i].topic;
                        expertName = item[i].expert_name;
                        expertImage = item[i].expert_image;
                    }
                }
                const data = {};
                data.liveclass_course_id = courseID;
                data.liveclass_course_detail_id = detailID;
                data.resource_reference = resourceReference;
                data.topic = topic;
                data.expert_name = expertName;
                data.expert_image = expertImage;
                data.resource_type = 8;
                data.subject = subject;
                data.class = resourceClass;
                data.player_type = 'liveclass';
                data.is_processed = 1;
                data.is_resource_created = 1;
                // console.log("notificationObject[key]")
                // console.log(199777)
                // console.log(notificationObject[199777])
                // await notificationWrapper(notificationObject[199777].studentTokens, notificationObject[199777].payload);
                promise.push((updateTime) ? Liveclass.updateLiveClassInfoEndTime(db.mysql.write, detailID) : '');
                if (createResource) promise.push(Liveclass.addResource(db.mysql.write, data));
            }
        }
        await Promise.all(promise);
    } catch (e) {
        throw new Error(e);
    }
}

async function resourcesToBundlePageExperiment(db, xAuthToken, studentId, flagId) {
    const flagrResponse = await Flagr.evaluateServiceWrapper({
        db,
        xAuthToken,
        entityContext: { studentId: studentId.toString() },
        flagID: flagId || 201,
        timeout: 300,
    });
    console.log(flagrResponse);
    return flagrResponse;
}

async function emiReminderData(db, emiDetails, config) {
    try {
        const lastEmi = emiDetails[emiDetails.length - 1];
        const masterPackage = await Package.getPackageDetailsFromVariant(db.mysql.read, [lastEmi.master_variant_id]);
        const packages = await Package.getChildPackagesFromVariant(db.mysql.read, lastEmi.master_variant_id);
        const obj = {
            id: masterPackage[0].id,
            type: 'emi',
            title: masterPackage[0].name,
            amount_to_pay: '',
            amount_strike_through: '',
            amount_saving: '',
            pay_text: 'Pay in Full',
            bg_color: '#f7fff1',
            bg_image: '',
            upfront_variant: '',
            paid: emiDetails[0].amount_paid,
            remaining: `₹${lastEmi.pending_amount}`,
            amount_due: `₹${lastEmi.next_part_payment_amount}`,
            pay_installment_text: 'Pay in Installments',
            emi: {
                total_amount: `₹${lastEmi.package_amount}`,
                title: '',
                sub_title: 'EMI Details & Schedule',
                description: 'Payment karo asaan kishto mein',
                month_label: 'MONTH',
                installment_label: 'INSTALLMENTS',
                total_label: 'Total',
                installments: [
                    {
                        title: `${moment(emiDetails[0].subscription_start).format('Do MMM YYYY')}`,
                        amount: `₹${packages[0].display_price}`,
                        is_completed: true,
                        image_url: `${config.staticCDN}engagement_framework/00CB1B43-25BA-F418-B410-505CE7A56AF0.webp`,
                    },
                ],
            },
        };
        let months = 0;
        for (let j = 1; j < packages.length; j++) {
            months += packages[j - 1].emi_duration / 30;
            const o = {
                title: packages[j].emi_order <= lastEmi.emi_order ? `${moment(emiDetails[j].subscription_start).format('Do MMM YYYY')}` : `After ${months} month`,
                amount: `₹${packages[j].display_price}`,
                is_completed: packages[j].emi_order <= lastEmi.emi_order,
                image_url: packages[j].emi_order <= lastEmi.emi_order ? `${config.staticCDN}engagement_framework/00CB1B43-25BA-F418-B410-505CE7A56AF0.webp` : `${config.staticCDN}engagement_framework/B13726A6-2C0C-1B12-8307-297CB733DACE.webp`,
            };
            if (packages[j].emi_order <= lastEmi.emi_order) {
                obj.paid += emiDetails[j].amount_paid;
            }
            if (packages[j].emi_order == lastEmi.emi_order + 1) {
                obj.emi_variant = packages[j].id;
            }
            obj.emi.installments.push(o);
        }
        obj.paid = `₹${obj.paid}`;
        if (lastEmi.emi_order !== lastEmi.total_emi) {
            const variantIdToBePaid = await Package.getnextVariantId(db.mysql.read, lastEmi.emi_order + 1, masterPackage[0].package_id);
            obj.deeplink = `doubtnutapp://vip?variant_id=${variantIdToBePaid[0].variant_id}`;
        }
        return obj;
    } catch (e) {
        throw new Error(e);
    }
}

async function generateResourceVideoViewData(data) {
    const {
        db,
        paymentCardState,
        config,
        result,
        flagrResponse,
        setWidth,
        assortmentPriceMapping,
        masterAssortment,
        page,
        locale,
        versionCode,
    } = data;
    if (result.is_active) {
        result.is_active = result.is_active === 'ACTIVE' ? 1 : 0;
    }
    const obj = LiveclassHelper.generateStreamObjectResourcePage(result, db, config, paymentCardState.isVip, page || 'COURSE_LANDING', 'home');
    let items = {};
    if (versionCode > 866) {
        obj.button = {
            text: liveclassData.freeClassButtonText,
            deeplink: parseInt(masterAssortment.split(',')) === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${parseInt(masterAssortment.split(','))}`,
        };
    } else {
        obj.button = {
            text: liveclassData.freeClassButtonText,
            action: {
                action_data: {
                    id: parseInt(masterAssortment.split(',')),
                },
            },
        };
    }
    obj.deeplink = `doubtnutapp://course_details?id=${parseInt(masterAssortment.split(','))}`;
    if (!parseInt(masterAssortment.split(','))) {
        const chapterAssortment = await CourseContainerv2.getChapterAssortment(db, result.assortment_id);
        obj.button.text = 'GO TO CHAPTER';
        if (versionCode > 866) {
            obj.button.deeplink = `doubtnutapp://course_details?id=${chapterAssortment[0] ? chapterAssortment[0].assortment_id : result.assortment_id}`;
        } else {
            obj.button.action.action_data.id = chapterAssortment[0] ? chapterAssortment[0].assortment_id : result.assortment_id;
        }
    }
    obj.show_emi_dialog = paymentCardState.emiDialog;
    obj.title1 = result.display ? result.display : obj.title1;
    // eslint-disable-next-line no-nested-ternary
    obj.lock_state = obj.is_premium ? (paymentCardState.isVip ? 2 : 1) : 0;
    obj.assortment_id = result.assortment_id;
    obj.payment_deeplink = getPaymentDeeplink(flagrResponse, result, assortmentPriceMapping);
    obj.is_free = result.is_free;
    obj.set_width = setWidth != null;
    if (!result.live_at) {
        const hours = Math.round(result.duration / 3600);
        const minutes = Math.round((result.duration % 3600) / 60);
        obj.top_title = `${hours > 0 ? `${hours} hr ` : ''}${minutes > 0 ? `${minutes} mins ` : ''}`;
        if (!hours && !minutes) {
            obj.top_title = 'Recorded';
        }
    }
    if (result.is_vdo_ready === 2 && result.vdo_cipher_id) {
        obj.is_downloadable = true;
    }
    if (!result.is_free && !paymentCardState.isVip) {
        const basePrice = assortmentPriceMapping && assortmentPriceMapping[parseInt(result.assortment_id)] ? assortmentPriceMapping[parseInt(result.assortment_id)].base_price : 0;
        const displayPrice = assortmentPriceMapping && assortmentPriceMapping[parseInt(result.assortment_id)] ? assortmentPriceMapping[parseInt(result.assortment_id)].display_price : 0;
        obj.amount_to_pay = displayPrice > 0 ? `₹${displayPrice}` : '';
        obj.display_price = displayPrice;
        obj.amount_strike_through = basePrice > 0 && (basePrice !== displayPrice) ? `₹${basePrice}` : '';
        obj.buy_text = (locale === 'hi') ? 'अभी खरीदें' : 'BUY NOW';
        obj.discount = basePrice - displayPrice > 0 ? `(${Math.round(((basePrice - displayPrice) / basePrice) * 100)}% OFF)` : '';
    }
    if (moment().add(5, 'hours').add(30, 'minutes').isAfter(result.live_at) || !result.live_at) {
        obj.show_reminder = false;
        obj.button_state = (!result.is_free && !paymentCardState.isVip) ? 'payment' : 'multiple';
        if (!(result.resource_type === 4 && !result.is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(result.live_at))) {
            items = obj;
        }
    } else {
        obj.show_reminder = true;
        obj.button_state = (!result.is_free && !paymentCardState.isVip) ? 'payment' : 'multiple';
        items = obj;
    }
    if (result.parent === 4 && result.is_free && versionCode <= 866) {
        obj.button_state = 'payment';
        obj.amount_to_pay = '';
        obj.display_price = '';
        obj.amount_strike_through = '';
        obj.buy_text = '';
        obj.discount = '';
        obj.payment_deeplink = '';
    } else if (result.parent === 4 && result.masterAssortment) {
        obj.button.text = 'GO TO CHAPTER';
    } else if (result.parent === 4 && result.is_free) {
        obj.button.text = 'WATCH VIDEO';
        obj.button.deeplink = `doubtnutapp://video?qid=${result.resource_reference}&page=COURSE_LANDING`;
    }

    if (!_.isEmpty(items)) {
        const dataToReturn = {
            type: 'widget_course_carousel',
            data: items,
        };
        return dataToReturn;
    }
    return 0;
}

async function getLiveclassCarouselLatest(db, config, courses, studentId, studentClass, userLocale, versionCode, home_page_experiment) {
    try {
        // let ecmId = [13];
        // get assortment ids from ccm ids or class
        // let courses = [];
        // let promises = [];
        // if (ccmArray.length > 0) {
        //     courses = await CourseContainer.getAssortmentIDFromCcm(db, ccmArray, studentClass, userLocale);
        //     if (courses.length === 0) {
        //         courses = await CourseContainer.getAssortmentIDFromClass(db, studentClass, userLocale);
        //     }
        // } else {
        //     courses = await CourseContainer.getAssortmentIDFromClass(db, studentClass, userLocale);
        // }
        // console.log('courses')
        // console.log(courses)
        const internalUserDetails = await CourseMysqlv2.getInternalSubscriptions(db.mysql.read, studentId);
        const isInternalUser = internalUserDetails.length > 0;
        const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
        // console.log('userActivePackages')
        // console.log(userActivePackages)
        // group by assortment id
        const groupedUserActivePackages = _.groupBy(userActivePackages, 'assortment_id');
        const userCourseAssortments = [];
        userActivePackages.map((item) => userCourseAssortments.push(item.assortment_id));
        // const groupedCarouselCourse = _.groupBy(courses, 'assortment_id');
        let userActiveAssortments = [];
        let allAssortments = [];
        // create a list of all vip assortments of user
        for (let i = 0; i < userActivePackages.length; i++) {
            const studentClassToUse = isInternalUser ? studentClass : userActivePackages[i].class || studentClass;
            allAssortments = await CourseContainerv2.getAllAssortments(db, [parseInt(userActivePackages[i].assortment_id)], studentClassToUse);
            const { assortmentList } = allAssortments;
            userActiveAssortments = [...userActiveAssortments, ...assortmentList];
        }
        const caraousel = [];
        if (versionCode > 840 && home_page_experiment === 'true') {
            if (versionCode < 843) {
                courses = courses.filter((e) => e.is_free === 0);
            } else {
                courses = [];
                for (let i = 0; i < userCourseAssortments.length; i++) {
                    const title = userActivePackages.filter((e) => userCourseAssortments[i] === parseInt(e.assortment_id));
                    if (title.length) {
                        courses.push({
                            assortment_id: userCourseAssortments[i],
                            is_free: 0,
                            title: title[0].display_name,
                            class: title[0].class,
                            batch_id: title[0].batch_id,
                        });
                    }
                }
            }
        }
        for (let i = 0; i < courses.length; i++) {
            // get all child assortments of assortment
            const promises = [];
            let paymentCardState = {};
            const studentClassToUse = isInternalUser ? studentClass : courses[i].class || studentClass;
            allAssortments = await CourseContainerv2.getAllAssortments(db, [parseInt(courses[i].assortment_id)], studentClassToUse);
            const { assortmentList } = allAssortments;
            allAssortments = allAssortments.totalAssortments;
            if (assortmentList.indexOf(courses[i].assortment_id) < 0) {
                assortmentList.push(parseInt(courses[i].assortment_id));
            }
            // console.log('assortments')
            // console.log(assortmentList)
            // get live section data using assortment list
            // let liveSectionData = await CourseContainerv2.getLiveSectionFromAssortmentHome(db, courses[i].assortment_id, assortmentList, studentClassToUse, null, courses[i].batch_id);
            let liveSectionData = await CourseRedisv2.getLiveSectionFromAssortmentHome(db.redis.read, courses[i].assortment_id, studentClassToUse, null, courses[i].batch_id);
            if (!liveSectionData) {
                // console.log(`not found cache ${courses[i].assortment_id} - ${courses[i].batch_id}`);
                liveSectionData = [];
            } else {
                liveSectionData = JSON.parse(liveSectionData);
            }
            // console.log('live section')
            // console.log(result)
            liveSectionData = liveSectionData.map((liveSection) => {
                liveSection.expert_image = buildStaticCdnUrl(liveSection.expert_image);
                liveSection.image_bg_liveclass = buildStaticCdnUrl(liveSection.image_bg_liveclass);
                liveSection.image_url = buildStaticCdnUrl(liveSection.image_url);
                return liveSection;
            });
            const liveSectionAssortments = [];
            // if (!_.isNull(courses[i].end_date)) {
            if (typeof groupedUserActivePackages[courses[i].assortment_id] !== 'undefined') {
                paymentCardState = {
                    isVip: true,
                    emiDialog: false,
                };
                const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
                const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
                    .endOf('day');
                if (typeof groupedUserActivePackages[courses[i].assortment_id] !== 'undefined' && groupedUserActivePackages[courses[i].assortment_id][0].type === 'emi' && groupedUserActivePackages[courses[i].assortment_id][0].end_date >= now && groupedUserActivePackages[courses[i].assortment_id][0].end_date <= end) {
                    const [nextEmiPaid, emiCheck] = await Promise.all([CourseContainerv2.checkNextEmiPaid(db, studentId, groupedUserActivePackages[courses[i].assortment_id][0].new_package_id), LiveclassHelper.checkEmiCounter(db, studentId)]);
                    if (!nextEmiPaid.length && emiCheck) {
                        paymentCardState.emiDialog = true;
                    }
                }
            }
            let assortmentPriceMapping = {};
            if (!courses[i].is_free && userCourseAssortments.indexOf(+courses[i].assortment_id) < 0) {
                // make assortment list from livesection data
                liveSectionData.map((item) => liveSectionAssortments.push(item.assortment_id));
                assortmentPriceMapping = await generateAssortmentVariantMapping(db, liveSectionAssortments, studentId, true);
            }
            for (let j = 0; j < liveSectionData.length; j++) {
                if (userActiveAssortments.length && userActiveAssortments.indexOf(liveSectionData[j].assortment_id) >= 0) {
                    paymentCardState.isVip = true;
                } else {
                    paymentCardState.isVip = false;
                }
                promises.push(generateResourceVideoViewData({
                    db,
                    paymentCardState,
                    config,
                    result: liveSectionData[j],
                    setWidth: true,
                    assortmentPriceMapping,
                    masterAssortment: `${courses[i].assortment_id}`,
                    page: 'HOME_FEED_LIVE',
                    versionCode,
                }));
            }
            let items = await Promise.all(promises);
            items = items.filter((item) => item !== 0);
            if (liveSectionData.length) {
                caraousel.push({
                    title: (!_.isNull(courses[i].title)) ? courses[i].title : courses[i].display_name,
                    is_vip: !courses[i].is_free,
                    assortment_id: courses[i].assortment_id,
                    items,
                });
            }
        }
        // const final = [];
        const cloned = _.clone(caraousel);
        // re-order based on purchased course
        // for (let i = 0; i < caraousel.length; i++) {
        //     if (typeof groupedUserActivePackages[caraousel[i].assortment_id] !== 'undefined') {
        //         final.push(caraousel[i]);
        //         // splice
        //         cloned.splice(i, 1);
        //         console.log(final.length)
        //         console.log(cloned.length)
        //     }
        // }
        // eslint-disable-next-line no-nested-ternary
        cloned.sort((x, y) => (typeof groupedUserActivePackages[x.assortment_id] !== 'undefined' ? -1 : typeof groupedUserActivePackages[y.assortment_id] !== 'undefined' ? 1 : 0));
        return cloned;
        // return caraousel;
    } catch (e) {
        console.log(e);
        // TODO: set datadog trigger
        // Set this empty incase of liveclass carousel module crashes. It won't crash whole api
        // return [];
        console.log(e);
        throw new Error(e);
    }
}

async function generateHomeworkTriggerWidget(db, isSubmitted, lectureName, pdfUrl, questionID, locale, config, isBrowser) {
    // console.log('isSubmitted')
    // console.log(isSubmitted)
    const branchDeeplink = await QuestionContainer.getVideoPageBranchDeeplinkFromAppDeeplink(db, questionID);
    let deeplink = (isSubmitted) ? `doubtnutapp://homework_solution?qid=${questionID}` : `doubtnutapp://homework?qid=${questionID}`;
    deeplink = isBrowser ? branchDeeplink : deeplink;
    if (isSubmitted) {
        return {
            type: 'homework_trigger',
            data: {
                title1: lectureName,
                title2: (locale === 'hi') ? 'अगली क्लास से पहले होमवर्क पूरा करें' : 'Complete you homework before your next class',
                image_url: `${config.staticCDN}engagement_framework/2AF1874F-5459-D50F-6493-77092B1A9482.webp`,
                status: isSubmitted,
                status_message: (locale === 'hi') ? 'समाप्त' : 'Completed',
                color: '#228B22',
                tick_image_url: `${config.staticCDN}engagement_framework/258785AD-2D50-B605-C44F-FC8C6443CE87.webp`,
                pdf_url: pdfUrl,
                button: {
                    title: (locale === 'hi') ? 'परिणाम देखें' : 'View result',
                    deeplink,
                },
            },
        };
    }
    return {
        type: 'homework_trigger',
        data: {
            title1: lectureName,
            title2: (locale === 'hi') ? 'अगली क्लास से पहले होमवर्क पूरा करें' : 'Complete you homework before your next class',
            image_url: `${config.staticCDN}engagement_framework/258785AD-2D50-B605-C44F-FC8C6443CE87.webp`,
            status: isSubmitted,
            color: '#FF6347',
            status_message: 'Pending',
            tick_image_url: `${config.staticCDN}engagement_framework/8ED7B8A3-375A-8FC1-6456-1E52882E9AAC.webp`,
            pdf_url: pdfUrl,
            button: {
                title: (locale === 'hi') ? 'होमवर्क शुरु करें' : 'Start Homework',
                deeplink,
            },
        },
    };
}

async function getNotesWidget(db, questionID, isBrowser) {
    try {
        const branchDeeplink = await QuestionContainer.getVideoPageBranchDeeplinkFromAppDeeplink(db, questionID);
        const notesDetail = await CourseContainerv2.getNotesByQuestionID(db, questionID);
        const widget = {};
        if (notesDetail.length > 0) {
            widget.type = 'resource_notes';
            widget.data = {};
            widget.data.title = `${notesDetail[0].chapter} - ${notesDetail[0].subject}`;
            widget.data.showsearch = false;
            widget.data.items = [];
            notesDetail.map((item) => widget.data.items.push({
                id: item.id,
                resource_type: item.resource_type,
                title: 'PDF',
                text: item.name,
                link: item.resource_reference,
                is_premium: false,
                is_vip: true,
                show_emi_dialog: false,
                subject: item.subject,
                master_chapter: item.chapter,
                payment_details: '',
                assortment_id: 0,
                payment_deeplink: '',
                deeplink: isBrowser ? branchDeeplink : '',
            }));
        }
        return widget;
    } catch (e) {
        throw new Error(e);
    }
}

/*
async function getBooksForClassLocaleAndSubjects(db, studentClass, userLocale) {
    let courses = [];
    if (ccmArray.length > 0) {
        courses = await CourseContainer.getAssortmentIDFromCcm(db, ccmArray, studentClass, userLocale);
        if (courses.length === 0) {
            courses = await CourseContainer.getAssortmentIDFromClass(db, studentClass, userLocale);
        }
    } else {
        courses = await CourseContainer.getAssortmentIDFromClass(db, studentClass, userLocale);
    }
    return courses;
}
*/

async function getCoursesFromCcmArray(db, ccmArray, studentClass, userLocale) {
    let courses = [];
    if (ccmArray.length > 0) {
        courses = await CourseContainer.getAssortmentIDFromCcm(db, ccmArray, studentClass, userLocale);
        if (courses.length !== 0) {
            return courses;
        }
    }
    courses = await CourseContainer.getAssortmentIDFromClass(db, studentClass, userLocale);
    return courses;
}

// eslint-disable-next-line no-unused-vars
async function getVideosDataByScheduleType(db, courses, studentClass, userLocale, type, carousel, _ccmTitle = 'default') {
    let assortmentList = [];
    courses.map((item) => assortmentList.push(item.assortment_id));
    assortmentList = _.uniq(assortmentList);
    const now = moment().add(5, 'hours').add(30, 'minutes');
    let data;
    if (carousel && carousel.secondary_data) {
        data = await db.mysql.read.query(`${carousel.secondary_data}`);
    } else if (type === 'live') {
        // data = await CourseContainerv2.getLiveNowLecturesByClass(db, assortmentList, studentClass);
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'live_now', assortmentList);
    } else if (type === 'replay') {
        // data = await CourseContainerv2.getReplayLecturesByClass(db, assortmentList, studentClass);
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'replay', assortmentList);
        _.forEach(data, (item) => {
            if (_.isNull(item.duration)) {
                item.duration = 3600;
            }
        });
        if (userLocale === 'hi') {
            data = data.filter((item) => item.course_language === 'HINDI' && moment(item.live_at).add(item.duration, 'seconds') > now);
        } else {
            data = data.filter((item) => item.course_language === 'ENGLISH' && moment(item.live_at).add(item.duration, 'seconds') > now);
        }
    } else if (type === 'upcoming') {
        // data = await CourseContainerv2.getUpcomingLecturesByClass(db, assortmentList, studentClass);
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'upcoming', assortmentList);
    } else if (type === 'recent') {
        // const startTime = moment().add(5, 'hours').add(30, 'minutes').subtract(1, 'days')
        //     .startOf('hour')
        //     .format('YYYY-MM-DD HH:mm:ss');
        // const endTime = moment().add(5, 'hours').add(30, 'minutes').startOf('hour')
        //     .format('YYYY-MM-DD HH:mm:ss');
        // data = await CourseContainerv2.getRecentLecturesByClass(db, assortmentList, studentClass, startTime, endTime, 'boards', 'board');
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_boards', assortmentList);
    } else if (type === 'iit_neet_past') {
        // const startTime = moment().add(5, 'hours').add(30, 'minutes').subtract(3, 'days')
        //     .startOf('hour')
        //     .format('YYYY-MM-DD HH:mm:ss');
        // const endTime = moment().add(5, 'hours').add(30, 'minutes').startOf('hour')
        //     .format('YYYY-MM-DD HH:mm:ss');
        // data = await CourseContainerv2.getRecentLecturesByClass(db, assortmentList, studentClass, startTime, endTime, 'iit_neet', ccmTitle);
        data = await CourseContainerv2.getLiveclassTvCarouselData(db, 'recent_iit_neet', assortmentList);
    }
    return data;
}

async function generateHomeworkListWidget(db, studentID, config, locale) {
    const userDetails = await CourseContainerv2.getUserActivePackages(db, studentID);
    const userDetailsByClass = userDetails.filter((e) => e.assortment_type === 'course');
    const promises = [];
    const limit = 20;
    const offset = 0;
    // userDetailsByClass.map((item) => promises.push(CourseContainerv2.getHomeworkByAssortmentIDNew(db, item.assortment_id, limit, offset, null, item.batch_id || 1)));
    userDetailsByClass.map((item) => promises.push(CourseContainerv2.getHomeworkByAssortmentIDHomepage(db, item.assortment_id, item.batch_id || 1, limit, offset)));
    // get homework response of user
    promises.push(CourseContainerv2.getFullHomeworkResponse(db, studentID));
    const resolvedPromises = await Promise.all(promises);
    // console.log('resolvedPromises');
    // console.log(resolvedPromises);
    const userResponse = resolvedPromises.splice(-1, 1);
    const groupedUserResponse = _.groupBy(userResponse[0], 'resource_reference');
    let pending = 0;
    const homeworkData = [].concat(...resolvedPromises);
    let items = [];
    homeworkData.forEach((item) => {
        const obj = {};
        obj.id = item.question_id;
        if (typeof groupedUserResponse[item.question_id] !== 'undefined') {
            obj.done = true;
        } else {
            pending += 1;
            obj.done = false;
        }
        obj.status_message = (obj.done) ? 'Completed' : 'Pending';
        obj.status = obj.done;
        obj.status_value = obj.done ? 1 : 0;
        obj.color = (obj.done) ? '#228B22' : '#FF6347';
        obj.status_image = (obj.done) ? `${config.staticCDN}engagement_framework/8ED7B8A3-375A-8FC1-6456-1E52882E9AAC.webp` : `${config.staticCDN}engagement_framework/7F718914-181A-431C-E121-7C674EC6F12B.webp`;
        obj.title = item.name;
        obj.question_count_text = '';
        if (item.question_list) {
            obj.question_count_text = (locale === 'hi') ? `${item.question_list.split('|').length} प्रश्न` : `${item.question_list.split('|').length} Questions`;
        }
        obj.due_data = moment(item.live_at).add(1, 'days').format('DD-MM-YYYY');
        obj.liveAt = !_.isNull(item.live_at) ? moment().add(5, 'hours').add(30, 'minutes').isAfter(item.live_at) : true;
        if (obj.liveAt) {
            items.push(obj);
        } else if (!obj.liveAt && !obj.done) {
            pending -= 1;
        }
    });
    items = _.sortBy(items, 'status_value');
    const widgets = [];
    const listWidget = {};
    listWidget.type = 'homework_list';
    listWidget.data = {};
    listWidget.data.title = 'My Homework';
    listWidget.data.status = `${items.length - pending} / ${items.length} Completed`;
    listWidget.data.items = items;
    if (items.length) {
        widgets.push(listWidget);
    }
    return widgets;
}

async function getPaidCoursesByClass(db, studentID) {
    const assortmentID = 138829;
    const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentID);
    let paidCourses = [];
    const purchaseCourse = userActivePackages.filter((item) => item.amount > -1);
    if (!userActivePackages.length || !purchaseCourse.length) {
        paidCourses = await CourseContainerv2.getPaidCoursesExcludingUsersPurchased(db, assortmentID);
    }
    return paidCourses;
}

function getNewCourseThumbnailv2(params) {
    const {
        data, o: object, locale, paymentCardState, config, page,
    } = params;
    const obj = {};
    obj.image_bg = data.image_thumbnail;
    obj.amount_to_pay = object.display_price && !object.free ? `₹${numberWithCommas(object.monthly_price)}/Mo` : '';
    obj.amount_to_pay_color = '#efefef';
    obj.amount_strike_through = object.base_price && !object.free ? `₹${numberWithCommas(object.base_price)}` : '';
    obj.strikethrough_text_color = '#d9d7d7';
    obj.strikethrough_color = '#d9d7d7';
    if (object.multiple_package) {
        if (locale !== 'hi') {
            obj.starting_at = 'From';
            obj.starting_at_color = '#efefef';
        } else {
            obj.text = 'से शुरू';
            obj.text_color = '#efefef';
        }
    } else {
        obj.text = object.discount;
        obj.text_color = '#efefef';
    }
    obj.deeplink_banner = object.deeplink;
    obj.assortment_id = data.assortment_id;
    if (data.is_free) {
        obj.button_cta = (locale === 'hi') ? 'कोर्स पर जाएं' : 'Go to Course';
    } else if (paymentCardState.isVip) {
        obj.button_cta = (locale === 'hi') ? 'अभी पढ़ो' : 'STUDY NOW';
        obj.banner_text = locale === 'hi' ? 'वीडियो, नोट्स और टेस्ट देखो' : 'See classes, notes and tests';
        obj.banner_text_color = '#ffffff';
        obj.banner_type = 2;
    } else if (paymentCardState.isTrial) {
        obj.button_cta = (locale === 'hi') ? 'अभी पढ़ो' : 'STUDY NOW';
        obj.trial_image = buildStaticCdnUrl(`${config.staticCDN}engagement_framework/0CA4D5BA-30B6-596F-54C5-170BBCBD8A7F.webp`);
        obj.banner_text = (locale === 'hi') ? 'ट्रायल चल रहा है' : 'Trial Activated';
        obj.banner_text_color = '#ffffff';
        obj.banner_type = 1;
    } else {
        if (page === 'HOMEPAGE_V1' || page === 'EXPLORE_TRENDING' || page === 'HOME_TRENDING') {
            obj.button_cta = (locale === 'hi') ? 'अभी खरीदें' : 'Buy Now';
        } else {
            obj.button_cta = (locale === 'hi') ? 'और देखें' : 'See Details';
        }
        obj.banner_type = 0;
    }
    obj.button_cta = object.free ? '' : obj.button_cta;
    if (!paymentCardState.isTrial) {
        obj.button_background_color = '#ea532c';
        obj.button_text_color = '#ffffff';
    } else {
        obj.button_text_color = '#ea532c';
        obj.button_background_color = '#ffffff';
    }
    if (page === 'HOMEPAGE_V1' || page === 'EXPLORE_TRENDING' || page === 'HOME_TRENDING') {
        obj.deeplink_button = object.buy_deeplink;
    } else {
        obj.deeplink_button = object.deeplink;
    }
    return obj;
}

async function getNewCourseThumbnail(data, object, locale, paymentCardState, config, bundleEnabled, displayPrice) {
    const duration = paymentCardState.isVip ? Math.ceil(moment(data.subscription_end_date).diff(moment().add(5, 'hours').add(30, 'minutes'), 'months', true)) : Math.ceil(moment(data.end_date).diff(moment(data.start_date), 'months', true));
    object.title = data.display_name ? data.display_name : '';
    if (data.assortment_type === 'subject') {
        object.title = data.display_description;
    }
    object.powered_by_text = data.subtitle;
    object.powered_by_text_color = '#000000';
    object.powered_by_text_size = '13';
    object.image_bg = paymentCardState.isTrial && data.assortment_id === 138829 ? buildStaticCdnUrl(`${config.staticCDN}engagement_framework/804794A5-AE3B-42DE-AEE2-6755A93E08FE.webp`) : buildStaticCdnUrl(data.demo_video_thumbnail);
    object.video_deeplink = data.demo_video_qid;
    object.title_color = '#273de9';
    object.title_color_size = '18';
    object.medium_text = Data.getCourseMediumByLocale(locale)[data.meta_info] || data.meta_info;
    object.medium_text_color = '#504949';
    object.medium_text_size = '14';
    object.rating_text = data.rating ? data.rating : (Math.random() * (5 - 4.7) + 4.7).toFixed(1);
    object.rating_text_color = '#808080';
    object.rating_text_size = '14';
    object.amount_to_pay_text_size = '18';
    object.amount_to_pay_text_color = '#000000';
    object.is_buy_now_enable = true;
    object.rating_icon_url = buildStaticCdnUrl(`${config.staticCDN}engagement_framework/82B56AE0-70DC-37D1-5695-BE8D23E14246.webp`);
    object.duration_icon_url = buildStaticCdnUrl(`${config.staticCDN}engagement_framework/D8023187-E4B5-13FC-A037-C99198A73A60.webp`);
    object.duration_text = locale === 'hi' ? `${duration} महीने के लिए` : `${duration} Mahine ke liye`;
    if (!paymentCardState.isVip && data.liveclass_course_id) {
        object.duration_icon_url = '';
        object.duration_text = locale === 'hi' ? `कोर्स ID #${data.liveclass_course_id}` : `Course ID #${data.liveclass_course_id}`;
    }
    if (duration === 1 && paymentCardState.isVip) {
        const daysdiff = Math.ceil(moment(data.subscription_end_date).diff(moment().add(5, 'hours').add(30, 'minutes'), 'days', true));
        object.duration_text = locale === 'hi' ? `${daysdiff} दिन बचे हैं` : `${daysdiff} din bache hain`;
    } else if (paymentCardState.isVip) {
        object.duration_text = locale === 'hi' ? `${duration} महीने बचे हैं` : `${duration} mahine bache hain`;
    }
    object.duration_text_color = '#808080';
    object.duration_text_size = '14';
    if (data.is_free) {
        object.buy_text = (locale === 'hi') ? 'कोर्स पर जाएं' : 'Go to Course';
        object.buy_deeplink = `doubtnutapp://course_details?id=${data.assortment_id}`;
    } else if (paymentCardState.isVip || paymentCardState.isTrial) {
        object.buy_text = (locale === 'hi') ? 'पढ़ना चालू रखें' : 'Continue Studying';
        // object.buy_deeplink = `doubtnutapp://course_details?id=${data.assortment_id}`;
    } else {
        object.buy_text = (locale === 'hi') ? 'एडमिशन लें' : 'Get Admission';
        if (bundleEnabled && bundleEnabled.enabled && bundleEnabled.price) {
            object.buy_text = locale === 'hi' ? `₹${numberWithCommas(displayPrice / 10)} अधिक बचत, अभी खरीदें` : `Buy Now to Save ₹${numberWithCommas(displayPrice / 10)} More`;
        } else if (bundleEnabled && bundleEnabled.enabled) {
            object.buy_text = locale === 'hi' ? '10% अधिक बचत के लिए अभी खरीदें' : 'Buy Now to Save 10% More';
        }
        object.video_icon_url = buildStaticCdnUrl(`${config.staticCDN}engagement_framework/38F31752-0875-3174-AF05-D9559D4F4ECB.webp`);
        object.discount = ''; // locale === 'hi' ? 'से शुरू' : 'Starting';
        object.discount_color = '#808080';
        object.discount_text_size = '13';
    }
    if (paymentCardState.isTrial && +paymentCardState.timeLeft > 0) {
        object.trial_text = locale === 'hi' ? `ट्रायल के ${paymentCardState.timeLeft} घंटे बाकी है` : `${paymentCardState.timeLeft} hrs Remaining in Trial`;
        object.trial_image = buildStaticCdnUrl(`${config.staticCDN}engagement_framework/06789241-7A3B-695B-B322-61ECF4AB0614.webp`);
        object.trial_background_color = '#daf8db';
        object.trial_text_color = '#3b8700';
    }
    return object;
}

function getStudentBatch(year) {
    if (year) {
        const startYear = +year - 1;
        return `${startYear}-${+year.toString().slice(-2)}`;
    }
    return '';
}

function setUpcomingClassesText({
    data,
    locale,
    obj,
}) {
    let subject;
    let day;
    let nextClass;
    const currentTime = moment().add(5, 'hours').add(30, 'minutes');
    if (data.upcoming_classes && data.upcoming_classes.length) {
        const pastClasses = data.upcoming_classes.filter((item) => moment(item.live_at) < currentTime);
        const currentClasses = pastClasses.filter((item) => moment(item.live_at).add(item.class_duration, 'minutes') > currentTime);
        if (currentClasses.length) {
            subject = locale === 'hi' ? Data.subjectHindi[currentClasses[0].subject.toUpperCase()] || currentClasses[0].subject.toUpperCase() : currentClasses[0].subject.toUpperCase();
            obj.bullet_point = locale === 'hi' ? `आपकी <font color='#000000'>${subject}</font> की क्लास अभी चल रही है` : `Aapki <font color='#000000'>${subject}</font> ki class abhi chal rahi hai`;
            return true;
        }
        // * Get the upcoming class from upcoming_classes array
        const nextClasses = data.upcoming_classes.filter((item) => moment(item.live_at) > currentTime);
        nextClass = nextClasses[0];
    }
    if (!nextClass) return false; // * If no upcoming class is scheduled, return false to set other details
    const classTime = moment(nextClass.live_at);
    if (classTime < currentTime) return false;
    const nextClassDate = classTime.format('YYYY-MM-DD');
    const today = currentTime.format('YYYY-MM-DD');
    let diff = 2;
    if (moment(today).isSame(nextClassDate, 'day')) diff = 0;
    else if (moment(moment(today).add(1, 'days')).isSame(nextClassDate, 'day')) diff = 1;
    const time = moment(nextClass.live_at).format('h:mm A');
    // * Upcoming class should be scheduled today or tomorrow, or else return false
    if (diff > 1) return false;
    if (diff === 0) {
        day = locale === 'hi' ? 'आज' : 'aaj';
    } else if (diff === 1) {
        day = locale === 'hi' ? 'कल' : 'kal';
    }
    if (nextClass.subject === 'WEEKLY TEST') {
        obj.bullet_point = locale === 'hi' ? `आपका <font color='#000000'>टेस्ट ${day} ${time}</font> पर है` : `Aapka <font color='#000000'>Test ${day} ${time}</font> par hai`;
    } else if (locale === 'hi') {
        subject = Data.subjectHindi[nextClass.subject.toUpperCase()] || nextClass.subject.toUpperCase();
        obj.bullet_point = `आपकी <font color='#000000'>${subject}</font> की क्लास <font color='#000000'>${day} ${time}</font> पर है`;
    } else {
        subject = nextClass.subject;
        obj.bullet_point = `Aapki <font color='#000000'>${subject}</font> ki class <font color='#000000'> ${day} ${time}</font> par hai`;
    }
    return true; // * Return true to not set any other details
}

function setBulletPointForMyCoursesScheduled({
    obj,
    data,
    paymentCardState,
    locale,
}) {
    let flag = false;
    if (paymentCardState.isExpired) {
        obj.bullet_point = locale === 'hi' ? 'आपके कोर्स की वैलिडिटी ख़तम हो गयी. पढ़ने के लिए रिचार्ज करें' : 'Aapke course ki validity expire ho gayi. Padhne ke liye course renew karein';
        flag = true;
    } else if (data.upcoming_classes) {
        flag = setUpcomingClassesText({ data, locale, obj });
    }
    if (!flag && data.missed_tests_count) {
        obj.bullet_point = locale === 'hi' ? `आपने <font color='#000000'>${data.missed_tests_count} ${data.missed_tests_count > 1 ? 'टेस्ट्स' : 'टेस्ट'}</font> मिस किया है` : `Aapne <font color='#000000'>${data.missed_tests_count} ${data.missed_tests_count > 1 ? 'tests' : 'test'}</font> miss kiya hai`;
        flag = true;
    }
    if (!flag && data.missed_homework_count) {
        obj.bullet_point = locale === 'hi' ? `<font color='#000000'>${data.missed_homework_count} होमवर्क</font> पेंडिंग है` : `<font color='#000000'>${data.missed_homework_count} homework</font> pending hai`;
        flag = true;
    }
    if (!flag) {
        obj.bullet_point = locale === 'hi' ? 'आज/कल कोई क्लासेज नहीं' : 'No upcoming classes today or tomorrow';
    }
}

async function getMyCoursesThumbnail({
    db,
    studentId,
    data,
    locale,
    o,
    config,
    paymentCardState,
}) {
    const obj = {};
    const batch = getStudentBatch(data.year_exam);
    obj.title = data.assortment_type === 'subject' ? data.display_description : data.display_name;
    obj.deeplink = o.deeplink;
    obj.assortment_id = data.assortment_id;
    obj.title_color = '#2a52d1';
    obj.title_size = '20';
    if (batch) {
        obj.sub_title = `${batch} ${locale === 'hi' ? 'बैच' : 'batch'}`;
    }
    obj.sub_title_color = '#000000';
    obj.sub_title_size = '16';
    if (data.schedule_type !== 'scheduled') {
        obj.bullet_point = locale === 'hi' ? 'पढ़ाई जारी रखने के लिए यहां क्लिक करें' : 'Click here to continue studying';
    } else {
        setBulletPointForMyCoursesScheduled({
            obj,
            data,
            paymentCardState,
            locale,
        });
    }
    obj.bullet_point_color = '#000000';
    obj.bullet_point_size = '12';
    obj.bullet_image_color = '#fa7d5d';
    obj.progress = `${Math.round(data.assortment_progress * 100)}%`;
    obj.progress_color = '#1eb56e';
    obj.progress_size = '12';
    let score = await PaidUserChampionshipHelper.getStudentScoreForMyCourses(db, studentId, data.assortment_id);
    score = score || 0;

    let bulletPointTwo;
    if (locale === 'hi') {
        if (score > 90) {
            bulletPointTwo = moment().add(5, 'hours').add(30, 'minutes').format('DD') >= 15 ? `आप कूपन कोड प्राप्त करने के लिए ${90 - Math.round(Math.round(score))}% दूर हैं। अभी क्लास अटेंड करें` : '';
        } else {
            bulletPointTwo = `आप कूपन कोड प्राप्त करने के लिए ${90 - Math.round(Math.round(score))} % दूर हैं। अभी क्लास अटेंड करें`;
        }
    } else if (score > 90) {
        bulletPointTwo = moment().add(5, 'hours').add(30, 'minutes').format('DD') >= 15 ? 'Aapke pass 7 days k liye 20% off coupon code hai' : '';
    } else {
        bulletPointTwo = `You are ${90 - Math.round(Math.round(score))}% away to get the coupon code. Attend class now`;
    }
    if (!paymentCardState.isExpired && !data.is_free && data.assortment_type === 'course' && data.sub_assortment_type === null) {
        obj.bullet_point_two = bulletPointTwo;
    }
    obj.progress_text_color = '#969696';
    if (paymentCardState.isTrial) {
        obj.trial_title_size = '';
        obj.trial_title_color = '#000000';
        obj.time = moment(paymentCardState.end_time).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
        obj.time_text_color = '#ff0000';
        obj.time_text_size = '';
        obj.image_url = `${config.cdn_url}engagement_framework/trial_timer_new.gif`;
        obj.trial_title_expired = 'Trial Expired';
        obj.bg_color_one_expired = '#ff6262';
        obj.bg_color_two_expired = '#f6b2b2';
        obj.trial_title = 'Trial Activated';
        obj.bg_color_one = '#ffca62';
        obj.bg_color_two = '#fff3c7';
        obj.trial_title2 = `${obj.title} Trial Active`;
        obj.trial_title_expired2 = `${obj.title} Trial Expired`;
        if (!paymentCardState.timeLeft) {
            obj.trial_title = 'Trial Expired';
            obj.bg_color_one = '#ff6262';
            obj.bg_color_two = '#f6b2b2';
        }
    }
    return obj;
}

async function generateAssortmentObject({
    data,
    config,
    paymentCardState,
    assortmentPriceMapping,
    db,
    setWidth,
    versionCode,
    assortmentFlagrResponse,
    locale,
    category,
    page,
    eventPage,
    studentId,
}) {
    const o = {};
    const paidTextColor = '#ffffff';
    const freeTextColor = '#504949';
    const bundleEnabled = _.get(assortmentFlagrResponse, 'bnb_cta_experiment.payload.enabled', null) ? assortmentFlagrResponse.bnb_cta_experiment.payload : {};
    o.id = data.assortment_id;
    o.assortment_id = data.assortment_id;
    o.title = data.display_name;
    if (data.assortment_type === 'subject') {
        o.title = data.display_description;
    } else if (data.assortment_type !== 'course' && data.assortment_type !== 'class') {
        if (data.meta_info === 'ENGLISH') {
            o.title = `${o.title} for ${data.category}`;
        } else if (data.meta_info === 'HINDI' && data.assortment_type === 'subject') {
            o.title = `${Data.categoriesHindi[data.category] || data.category} के लिए ${Data.subjectHindi[o.title] || o.title}`;
        } else if (data.meta_info === 'HINDI') {
            o.title = `${Data.categoriesHindi[data.category] || data.category} के लिए ${o.title}`;
        }
    }
    o.subtitle = data.image_subtitle;
    o.set_width = setWidth != null;
    o.buy_deeplink = `doubtnutapp://course_details?id=${data.assortment_id}`;
    o.image_bg = data.is_free ? buildStaticCdnUrl(`${config.staticCDN}liveclass/COURSE_FREE.png`) : buildStaticCdnUrl(`${config.staticCDN}liveclass/COURSE_VIP.png`);
    if (versionCode > 845) {
        o.image_bg = data.is_free ? buildStaticCdnUrl(`${config.staticCDN}liveclass/COURSE_FREE.png`) : _.sample(liveclassData.courseThumnails);
    }
    o.bottom_left_bg_color = data.is_free ? '#dcf4c4' : '#FFFFFF';
    o.bottom_left_bg_color = paymentCardState.isVip ? '#FFFFFF' : o.bottom_left_bg_color;
    o.bottom_left_text1_color = '#808080';
    o.starting_at_text = '';
    o.bottom_left_text1_size = 11;
    o.bottom_left_text2_color = '#000000';
    o.bottom_left_text2_size = 16;
    o.bottom_right_bg_color = data.is_free ? '#dcf4c4' : '#eb532c';
    o.bottom_right_bg_color = paymentCardState.isVip ? '#FFFFFF' : o.bottom_right_bg_color;
    o.bottom_right_text_color = '#FFFFFF';
    o.bottom_right_text_size = 16;
    o.strikethrough_text_color = '#A8B3BA';
    o.strikethrough_text_size = 10;
    o.discount_color = '#273DE9';
    o.bottom_payment_text = locale === 'hi' ? 'पढ़ना चालू रखें' : 'Continue Studying';
    o.bottom_payment_text_color = '#FFA500';
    o.bottom_payment_text_size = 16;
    o.discount_text_size = 11;
    o.title_one_color = freeTextColor;
    o.title_two_color = freeTextColor;
    o.course_type = data.is_live === 1 ? 'LIVE' : 'VIDEOS';
    o.faculty = data.faculty_avatars ? data.faculty_avatars.split('|') : [`${config.staticCDN}etoos/faculty/raw_vmc_203.webp`,
        `${config.staticCDN}etoos/faculty/raw_vmc_201.webp`,
        `${config.staticCDN}etoos/faculty/raw_vmc_202.webp`];
    o.deeplink = `doubtnutapp://course_details?id=${data.assortment_id}`;
    if (+data.assortment_id === 138829) {
        o.deeplink = 'doubtnutapp://course_category?category_id=Kota%20Classes';
    }
    if (page === 'HOMEPAGE') {
        o.deeplink = `${o.deeplink}&source=HOMEPAGE`;
    }
    o.is_premium = !data.is_free;
    o.icon_url = data.is_free ? '' : buildStaticCdnUrl(`${config.staticCDN}liveclass/VIP_ICON.png`);
    o.title_top = data.is_free ? 'Free Course' : 'VIP';
    o.title_top_color = data.is_free ? '#378e07' : '#fec29d';
    o.tag = 'BESTSELLER';
    o.tag_bg_color = '#378e07';
    o.tag_text_color = '#FFFFFF';
    o.tag_text_size = 11;
    o.rating = data.rating;
    o.lock_state = 0;
    o.display_price = 0;
    o.resources = [];

    const displayPrice = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].display_price : 0;
    if (!data.is_free) {
        o.lock_state = paymentCardState.isVip ? 2 : 1;
        o.title_one_color = paidTextColor;
        o.title_two_color = paidTextColor;
        o.registered_text_color = paidTextColor;
        const basePrice = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].base_price : 0;
        const multiple = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] && assortmentPriceMapping[data.assortment_id].multiple && assortmentPriceMapping[data.assortment_id].enabled; // ? assortmentPriceMapping[data.assortment_id].multiple : false;
        // const duration = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].duration : 0;
        if (!paymentCardState.isVip) {
            o.multiple_package = multiple;
            o.amount_to_pay = displayPrice > 0 ? `₹${numberWithCommas(assortmentPriceMapping[data.assortment_id].display_price)}` : '';
            o.amount_strike_through = '';
            o.monthly_price = assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].monthly_price : 0;
            o.buy_text = locale === 'hi' ? 'एडमिशन लें' : 'Get Admission';
            o.buy_deeplink = versionCode >= 861 ? `doubtnutapp://bundle_dialog?id=${data.assortment_id}&source=${page}` : `doubtnutapp://vip?assortment_id=${data.assortment_id}`;
            if (data.parent === 4) {
                o.buy_deeplink = versionCode >= 861 ? `doubtnutapp://bundle_dialog?id=138829&source=${page}` : 'doubtnutapp://vip?assortment_id=138829';
            }
            if (assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] && !assortmentPriceMapping[data.assortment_id].multiple) {
                o.buy_deeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[data.assortment_id].package_variant}`;
            }
            o.buy_text = data.is_free ? '' : o.buy_text;
            o.discount = basePrice - displayPrice > 0 ? `(${Math.round(((basePrice - displayPrice) / basePrice) * 100)}% OFF)` : '';
            o.display_price = displayPrice;
        }
        if (data.display_image_square && _.includes(['course', 'class', 'subject'], data.assortment_type)) {
            o.lock_state = paymentCardState.isVip ? 2 : 0;
            o.image_bg = paymentCardState.isTrial && data.assortment_id === 138829 ? buildStaticCdnUrl(`${config.staticCDN}engagement_framework/3CBD9934-0E65-089A-F043-638DA99AE67D.webp`) : buildStaticCdnUrl(data.display_image_square);
            o.icon_url = '';
            o.title_top = '';
            o.title = '';
            if (!paymentCardState.isVip) {
                o.discount = locale === 'hi' ? 'में पूरा सिलेबस' : 'For Full Syllabus';
                if (multiple) {
                    o.amount_to_pay = locale === 'hi' ? `₹${numberWithCommas(assortmentPriceMapping[data.assortment_id].monthly_price)}/Mo से शुरू` : `From ₹${numberWithCommas(assortmentPriceMapping[data.assortment_id].monthly_price)}/Mo`;
                    // const monthText = Math.round(duration / 30) === 1 ? 'month' : 'months';
                    o.discount = '';
                } else if (data.sub_assortment_type === 'mock_test') {
                    o.amount_to_pay = `₹${numberWithCommas(assortmentPriceMapping[data.assortment_id].display_price)}`;
                    o.discount = '';
                } else {
                    o.amount_to_pay = locale === 'hi' ? `₹${numberWithCommas(assortmentPriceMapping[data.assortment_id].monthly_price)}/Mo` : `₹${numberWithCommas(assortmentPriceMapping[data.assortment_id].monthly_price)}/Mo`;
                    o.discount = '';
                }
            }
        }
        if (data.demo_video_thumbnail && data.assortment_type === 'subject') {
            o.lock_state = paymentCardState.isVip ? 2 : 0;
            o.image_bg = buildStaticCdnUrl(data.demo_video_thumbnail);
            o.icon_url = '';
            o.title_top = '';
            o.title = '';
        }
    }
    if (data.assortment_id === 138829) {
        o.buy_deeplink = versionCode >= 861 ? `doubtnutapp://bundle_dialog?id=138829&source=${page}` : 'doubtnutapp://vip?assortment_id=138829';
        if (paymentCardState.isVip) {
            o.buy_deeplink = 'doubtnutapp://course_category?category_id=Kota%20Classes';
        }
    }
    if (data.is_free) {
        let resources = [];
        if (data.assortment_type === 'course' || data.assortment_type === 'class') {
            resources = await CourseContainerv2.getResourcesCountFromCourseAssortment(db, data.assortment_id, 1);
        } else if (data.assortment_type === 'chapter') {
            resources = await CourseContainerv2.getResourcesCountFromChapterAssortment(db, data.assortment_id, 1);
        } else {
            resources = await CourseContainerv2.getResourcesCountFromSubjectAssortment(db, data.assortment_id, 1);
        }
        const videoCount = resources.filter((e) => e.assortment_type === 'resource_video');
        const pdfCount = resources.filter((e) => e.assortment_type === 'resource_pdf');
        const testCount = resources.filter((e) => e.assortment_type === 'resource_test');
        if (videoCount[0]) {
            o.resources.push({
                count: videoCount[0].count,
                text: `${videoCount[0].count} Videos`,
                icon_url: liveclassData.videoIconUrl(data.is_free, config),
                text_color: data.is_free ? freeTextColor : paidTextColor,
            });
        }
        if (pdfCount[0]) {
            o.resources.push({
                count: pdfCount[0].count,
                icon_url: liveclassData.pdfIconUrl(data.is_free, config),
                text: `${pdfCount[0].count} PDF's`,
                text_color: data.is_free ? freeTextColor : paidTextColor,
            });
        }
        if (testCount[0]) {
            o.resources.push({
                count: testCount[0].count,
                icon_url: liveclassData.testIconUrl(data.is_free, config),
                text: `${testCount[0].count} Tests`,
                text_color: data.is_free ? freeTextColor : paidTextColor,
            });
        }
    }

    o.button_state = 'payment';
    o.demo_video_thumbnail = data.demo_video_thumbnail;
    let assortmentBatchDetails;
    if (studentId) {
        const batchId = await getBatchByAssortmentIdAndStudentId(db, studentId, data.assortment_id);
        assortmentBatchDetails = await CourseContainerv2.getBatchDetailsByAssortment(db, data.assortment_id, batchId);
    } else {
        assortmentBatchDetails = await CourseContainerv2.getLastestBatchByAssortment(db, data.assortment_id);
    }
    const now = moment();
    const courseStartDate = assortmentBatchDetails && assortmentBatchDetails.length && assortmentBatchDetails[0].start_date ? moment(assortmentBatchDetails[0].start_date) : moment(data.start_date);
    const showTagUntil = await CourseContainerv2.getAppConfigurationContent(db, 'new_course_tag_duration');
    const showTags = await CourseContainerv2.getAppConfigurationContent(db, 'new_course_tag');
    const diffBetweenDates = now.diff(courseStartDate, 'days');
    if (diffBetweenDates >= 0 && showTagUntil && showTagUntil.length && diffBetweenDates <= +showTagUntil[0].key_value) {
        const tag = showTags && showTags.length ? showTags[0].key_value : null;
        if (tag) {
            const splitTag = tag.split('#!#');
            const courseTag = locale === 'hi' ? splitTag[1] || splitTag[0] : splitTag[0];
            o.course_tag = courseTag;
            o.course_tag_color = '#61000000';
        }
    }
    const courseTargetGroups = await CourseContainerv2.getCourseTargetGroupsForThumbnailTags(db, data.assortment_id);
    for (let i = 0; i < courseTargetGroups.length; i++) {
        const isPresent = await CourseRedisv2.getStudentIdTargetGroupCourseTag(db.redis.read, courseTargetGroups[i].target_group, studentId);
        if (+isPresent === 1 || !courseTargetGroups[i].target_group) {
            const splitTag = courseTargetGroups[i].course_tag.split('#!#');
            const courseTag = locale === 'hi' ? splitTag[1] || splitTag[0] : splitTag[0];
            o.course_tag = courseTag;
            o.course_tag_color = '#61000000';
            break;
        }
    }

    // if (paymentCardState.isTrial && versionCode > 872) {
    //     o.trial_text = locale === 'hi' ? `${paymentCardState.timeLeft}` : `${paymentCardState.timeLeft} hrs Remaining in Trial`;
    //     o.trial_image = `${config.staticCDN}engagement_framework/0CA4D5BA-30B6-596F-54C5-170BBCBD8A7F.webp`;
    //     o.trial_background_color = '#daf8db';
    //     o.trial_text_color = '#3b8700';
    // }
    const widgetTypes = {
        793: 'widget_course_v1',
        853: 'widget_course_v2',
        792: 'widget_course',
        873: 'widget_popular_course',
        893: 'widget_my_courses',
    };

    let widgetType;
    let popularCourseDesign = false;
    if (_.get(assortmentFlagrResponse, 'similar_popular_course_carousel.payload.enabled', null)) {
        popularCourseDesign = _.get(assortmentFlagrResponse, 'similar_popular_course_carousel.payload.widget_type', 0) !== 0;
    }
    const srpPopularCourseDesign = _.get(assortmentFlagrResponse, 'suggested_courses_for_you.payload.enabled', null);
    if (versionCode >= 893 && (page === 'MY_COURSES' || page === 'MY_COURSES_EXPLORE')) {
        widgetType = 893;
    } else if (versionCode >= 873 && (popularCourseDesign || page === 'EXPLORE_TRENDING' || srpPopularCourseDesign || page === 'HOME_TRENDING')) {
        widgetType = 873;
    } else if (versionCode >= 853) {
        widgetType = 853;
    } else if (versionCode >= 793) {
        widgetType = 793;
    } else {
        widgetType = 792;
    }

    // eslint-disable-next-line no-nested-ternary
    const source = (eventPage === 'SRP') ? 'MPVP' : (eventPage === 'MPVP') ? 'SIMILAR' : page;

    let obj;
    if (versionCode >= 893 && (page === 'MY_COURSES' || page === 'MY_COURSES_EXPLORE')) {
        obj = await getMyCoursesThumbnail({
            db,
            studentId,
            data,
            locale,
            config,
            o,
            paymentCardState,
        });
    } else if (versionCode >= 873 && (popularCourseDesign || page === 'EXPLORE_TRENDING' || srpPopularCourseDesign || page === 'HOME_TRENDING')) {
        obj = getNewCourseThumbnailv2({
            data,
            o,
            locale,
            paymentCardState,
            config,
            page,
        });
    } else if (versionCode >= 853 && !category) {
        obj = {
            type: widgetTypes[widgetType],
            data: await getNewCourseThumbnail(data, o, locale, paymentCardState, config, bundleEnabled, displayPrice),
            extra_params: {
                be_source: source,
                widget_type: widgetTypes[widgetType],
            },
        };
    } else {
        obj = {
            type: versionCode >= 793 ? 'widget_course_v1' : 'widget_course',
            data: o,
            extra_params: {
                be_source: source,
                widget_type: versionCode >= 793 ? 'widget_course_v1' : 'widget_course',
            },
        };
    }
    if (versionCode > 926 && page === 'RECOMMENDATION') {
        const addition = `&source=${page}`;
        const newDeeplink = obj.data.deeplink.concat(addition);
        obj.data.deeplink = newDeeplink;
    }
    return obj;
}
/*
async function getPznMostWatchedLocale(studentId, pznElasticSearchInstance) {
    const pznResponse = await pznElasticSearchInstance.getMostWatchedLocales(studentId);
    const bucketsArray = _.get(pznResponse, 'aggregations.most_watched.buckets', null);
    if (bucketsArray && bucketsArray.length) {
        const totalWatchedCount = bucketsArray.reduce((acc, item) => (acc + +item.total_watched.value), 0);
        if (totalWatchedCount >= 50) {
            // * Reduce to new object with distinct locale as key
            const localeWatchedCountMapping = bucketsArray.reduce((acc, item) => {
                if (!acc[Data.pznLanguagesToLocaleMapping[item.key]]) {
                    acc[Data.pznLanguagesToLocaleMapping[item.key]] = 0;
                }
                acc[Data.pznLanguagesToLocaleMapping[item.key]] += item.total_watched.value;
                return acc;
            }, {});
            // * Store in array to sort and get top watched languages
            const localeWatchedArray = [];
            for (const key in localeWatchedCountMapping) {
                if (localeWatchedCountMapping[key]) {
                    localeWatchedArray.push({
                        locale: key,
                        val: localeWatchedCountMapping[key],
                    });
                }
            }
            localeWatchedArray.sort((item1, item2) => item2.val - item1.val);
            // * Check if top two languages watched count is same
            const isWatchedCountSame = localeWatchedArray.length >= 2 ? localeWatchedArray[0] === localeWatchedArray[1] : false;
            if (isWatchedCountSame) {
                const getLatestWatchedVideo = await pznElasticSearchInstance.getLatestWatchedVideoDetails(studentId);
                const latestWatchedVideoLanguage = _.get(getLatestWatchedVideo, 'hits.hits', null);
                if (latestWatchedVideoLanguage && latestWatchedVideoLanguage.length) {
                    return Data.pznLanguagesToLocaleMapping[latestWatchedVideoLanguage[0]._source.language];
                }
            }
            return localeWatchedArray[0].locale;
        }
    }
    return null;
}
*/
function move(input, from, to) {
    let numberOfDeletedElm = 1;

    const elm = input.splice(from, numberOfDeletedElm)[0];

    numberOfDeletedElm = 0;

    input.splice(to, numberOfDeletedElm, elm);
}
async function getDataForPopularCourseCarousel({
    db,
    studentClass,
    versionCode,
    studentId,
    studentLocale,
    xAuthToken,
    page,
    questionID,
    hitFlagr = true,
    prevFlagrResponse,
    userCourseAssortments,
}) {
    try {
        let carouselTitle = null;
        let studentCcmAssortments = [];
        let assortmentList = [];
        const flagrData = { xAuthToken, body: { capabilities: { pricing_experiment_78895: {} } } };
        if (page === 'SIMILAR') {
            flagrData.body.capabilities.similar_popular_course_carousel = {};
        }
        if (page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') {
            flagrData.body.capabilities.suggested_courses_for_you = {};
        }
        flagrData.body.capabilities.popular_course_exp_ccmid_locale = {};
        let flagrResponse;
        if (page !== 'SCHOLARSHIP_PAGE' && hitFlagr) {
            flagrResponse = await UtilityFlagr.getFlagrResp(flagrData);
        }
        if (page === 'CATEGORY_LIST' && flagrResponse) {
            flagrResponse.popular_courses_algo = { payload: { enabled: false, locale: false } };
        }
        if (!hitFlagr) {
            flagrResponse = prevFlagrResponse;
        }

        const studentCcmData = await ClassCourseMappingContainer.getCoursesClassCourseMappingExtraMarks(db, studentId);
        let data = [];
        // get data from db here based on class value
        if ((page === 'SIMILAR' && _.get(flagrResponse, 'similar_popular_course_carousel.payload.enabled', null) && _.get(flagrResponse, 'similar_popular_course_carousel.payload.widget_type', null) !== 0) || page === 'HOMEPAGE_V1' || ((page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') && _.get(flagrResponse, 'suggested_courses_for_you.payload.enabled', null))) {
            data = await CourseMysqlv2.getCoursesForHomepageWithThumbnailsByCategory(db.mysql.read, studentClass, studentLocale, 'widget_popular_course', +versionCode);
        } else {
            data = await CourseContainerv2.getCoursesForHomepageByCategory(db, studentClass, studentLocale);
            if (studentLocale === 'en') {
                data = data.filter((item) => item.course_language === 'ENGLISH');
            } else if (studentLocale === 'hi') {
                data = data.filter((item) => item.course_language === 'HINDI');
            }
        }
        data = data.filter((e) => userCourseAssortments.indexOf(e.assortment_id) < 0);
        const otherAssortments = [];

        let checkFlagr = false;
        if (+studentClass === 14) {
            studentCcmAssortments = data;
        } else {
            data.forEach((item) => {
                if (_.find(studentCcmData, ['category', item.category]) && studentCcmData.length) {
                    studentCcmAssortments.push(item);
                } else if ((_.find(studentCcmData, ['category', 'IIT JEE']) || _.find(studentCcmData, ['category', 'NEET'])) && item.category === 'IIT JEE|NEET|FOUNDATION') {
                    studentCcmAssortments.push(item);
                } else if (_.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA', 'BOARDS', 'For All', 'IIT JEE|NEET|FOUNDATION'], item.category)) {
                    otherAssortments.push(item);
                }
            });
        }
        if (!studentCcmAssortments.length || !studentCcmData.length) {
            studentCcmAssortments = otherAssortments;
        }
        studentCcmAssortments.sort((x, y) => x.priority - y.priority);
        // ordering courses based on qid only for video page
        if (page === 'VIDEO_PAGE') {
            let courseDetailsOfVideo = await CourseContainerv2.getCourseDetailsFromQuestionId(db, questionID);
            courseDetailsOfVideo = courseDetailsOfVideo.filter((item) => item.class === +studentClass && item.is_active === 1);
            let ccmRelatedCourse = [];
            if (courseDetailsOfVideo.length && !courseDetailsOfVideo[0].is_free) {
                if (courseDetailsOfVideo.length > 1) {
                    for (let i = 0; i < studentCcmData.length && !ccmRelatedCourse.length; i++) {
                        ccmRelatedCourse = courseDetailsOfVideo.filter((item) => item.category === studentCcmData[i].category);
                    }
                } else if (courseDetailsOfVideo[0].parent === 4) {
                    ccmRelatedCourse = await CourseContainerv2.getAssortmentDetailsFromId(db, 138829, null);
                } else {
                    ccmRelatedCourse = courseDetailsOfVideo;
                }
            } else if (courseDetailsOfVideo.length) {
                checkFlagr = true;
                carouselTitle = studentLocale === 'hi' ? 'संबंधित कोर्स' : 'Related Courses';
                ccmRelatedCourse = data.filter((item) => item.category.includes(courseDetailsOfVideo[0].category));
                if (!ccmRelatedCourse.length && courseDetailsOfVideo[0].category.includes('State Board') && studentCcmAssortments.length) {
                    ccmRelatedCourse = studentCcmAssortments.filter((item) => !_.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'IIT JEE|NEET|FOUNDATION'], item.category));
                }
            }
            if (ccmRelatedCourse.length) {
                for (let i = 0; i < ccmRelatedCourse.length; i++) {
                    if (_.find(studentCcmAssortments, ['assortment_id', ccmRelatedCourse[i].assortment_id])) {
                        for (let j = 0; j < studentCcmAssortments.length; j++) {
                            if (studentCcmAssortments[j].assortment_id === ccmRelatedCourse[i].assortment_id) {
                                studentCcmAssortments.splice(j, 1);
                                break;
                            }
                        }
                    }
                }
                studentCcmAssortments = [...ccmRelatedCourse, ...studentCcmAssortments];
            }
            if (checkFlagr) {
                studentCcmAssortments = courseDetailsOfVideo.length && courseDetailsOfVideo[0].meta_info === 'HINDI' ? _.orderBy(studentCcmAssortments, ['meta_info'], ['desc']) : _.orderBy(studentCcmAssortments, ['meta_info']);
            }
        }
        studentCcmAssortments.forEach((item) => assortmentList.push(item.assortment_id));
        const assortmentPriceMapping = await generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
        // fetch name, thumbnail of courses from batch table
        if (assortmentList.length) {
            const batchDetails = await getBatchDetailsByAssortmentListAndStudentId(db, studentId, assortmentList);
            for (let i = 0; i < studentCcmAssortments.length; i++) {
                const batchDetail = batchDetails[studentCcmAssortments[i].assortment_id];
                if (batchDetail) {
                    studentCcmAssortments[i].display_name = batchDetail.display_name || studentCcmAssortments[i].display_name;
                    studentCcmAssortments[i].display_description = batchDetail.display_description || studentCcmAssortments[i].display_description;
                    studentCcmAssortments[i].demo_video_thumbnail = batchDetail.demo_video_thumbnail || studentCcmAssortments[i].demo_video_thumbnail;
                }
            }
        }
        // check if class locale, assortment id exist in table , then move it to first position
        const priorityAssortmentList = await CourseContainerv2.getClassLocaleAssortments(db, studentClass, studentLocale);
        const groupedByAssortment = _.groupBy(priorityAssortmentList, 'assortment_id');

        for (let i = 0; i < studentCcmAssortments.length; i++) {
            if (typeof groupedByAssortment[studentCcmAssortments[i].assortment_id] !== 'undefined' && i !== 0) {
                // splice now
                // cloned.splice(0, 0, cloned.slice(i - 1, i));
                move(studentCcmAssortments, i, 0);
            }
        }
        // return [];

        // UP board hindi courses first resurfacing
        if (studentLocale !== 'hi') {
            const upCCM = await StudentContainer.getUpActiveCCMData(db);
            let changeOrdering = false;
            for (let i = 0; i < studentCcmData.length; i++) {
                if (upCCM.includes(studentCcmData[i].id)) {
                    changeOrdering = true;
                    break;
                }
            }
            const newAssortmentList = [];
            let newstudentCcmAssortments;
            if (changeOrdering) {
                const hindiCourses = studentCcmAssortments.filter((item) => item.meta_info === 'HINDI');
                const hinglishCourses = studentCcmAssortments.filter((item) => item.meta_info === 'HINGLISH');
                const englishCourses = studentCcmAssortments.filter((item) => item.meta_info === 'ENGLISH');
                const otherCourses = studentCcmAssortments.filter((item) => item.meta_info !== 'HINDI' && item.meta_info !== 'HINGLISH' && item.meta_info !== 'ENGLISH');
                newstudentCcmAssortments = [...hindiCourses, ...hinglishCourses, ...englishCourses, ...otherCourses];
                for (let i = 0; i < newstudentCcmAssortments.length; i++) {
                    newAssortmentList.push(newstudentCcmAssortments[i].assortment_id);
                }
                if (newstudentCcmAssortments.length) {
                    studentCcmAssortments = newstudentCcmAssortments;
                    assortmentList = newAssortmentList;
                }
            }
        }
        return {
            studentCcmAssortments,
            carouselTitle,
            flagrResponse,
            assortmentList,
            assortmentPriceMapping,
        };
    } catch (e) {
        console.log(e);
    }
}

async function getPaidAssortmentsData({
    db,
    studentClass,
    config,
    versionCode,
    studentId,
    studentLocale,
    xAuthToken,
    page,
    eventPage,
    questionID,
    pznElasticSearchInstance,
    hitFlagr = true,
    prevFlagrResponse,
    data,
}) {
    try {
        const variantInfo = [];
        const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
        // * User assortment mapping to payment state
        const userCourseAssortments = [];
        userActivePackages.map((item) => userCourseAssortments.push(item.assortment_id));
        const userAssortmentPaymentState = userActivePackages.reduce((acc, item) => ({
            ...acc,
            [item.assortment_id]: {
                isTrial: item.amount === -1,
                isVip: item.amount !== -1,
                timeLeft: moment(item.end_date).diff(new Date(), 'hours'),
            },
        }), {});
        let {
            // eslint-disable-next-line prefer-const
            studentCcmAssortments, carouselTitle, flagrResponse, assortmentPriceMapping, assortmentList,
        } = await getDataForPopularCourseCarousel({
            db,
            studentClass,
            versionCode,
            studentId,
            studentLocale,
            xAuthToken,
            page,
            questionID,
            pznElasticSearchInstance,
            hitFlagr,
            prevFlagrResponse,
            userCourseAssortments,
        });
        if (!_.isNull(data) && !_.isEmpty(data)) {
            studentCcmAssortments = data;
        }
        const promises = [];
        // const assortmentFlagrResponse = await getFlagrResponseByFlagKey(xAuthToken, 'popular_courses_thumbnails');
        for (let i = 0; i < studentCcmAssortments.length; i++) {
            const paymentCardState = {
                isVip: false,
                isTrial: false,
            };
            if (userCourseAssortments.indexOf(studentCcmAssortments[i].assortment_id) >= 0) {
                if (versionCode <= 872) {
                    paymentCardState.isVip = true;
                } else {
                    paymentCardState.isVip = userAssortmentPaymentState[studentCcmAssortments[i].assortment_id].isVip;
                    paymentCardState.isTrial = userAssortmentPaymentState[studentCcmAssortments[i].assortment_id].isTrial;
                    paymentCardState.timeLeft = userAssortmentPaymentState[studentCcmAssortments[i].assortment_id].timeLeft;
                }
            }
            if (_.includes(['course', 'class', 'course_bundle'], studentCcmAssortments[i].assortment_type)) {
                const setWidth = page && !page.includes('CATEGORY_LIST') ? true : null;
                let priceFilter = true;
                if (page && page.includes('CATEGORY_LIST_DEEPLINK') && page.split('_').length > 3) {
                    priceFilter = assortmentPriceMapping[studentCcmAssortments[i].assortment_id].display_price >= page.split('_')[3];
                }
                if (priceFilter) {
                    promises.push(generateAssortmentObject({
                        data: studentCcmAssortments[i],
                        config,
                        paymentCardState,
                        assortmentPriceMapping,
                        db,
                        setWidth,
                        versionCode,
                        assortmentFlagrResponse: flagrResponse,
                        locale: studentLocale,
                        category: page && page.includes('CATEGORY_LIST_DEEPLINK') ? studentCcmAssortments[i].category : null,
                        page,
                        eventPage,
                        studentId,
                    }));
                }
            }
        }
        if (_.get(flagrResponse, 'similar_popular_course_carousel.enabled', null)) {
            variantInfo.push({
                flag_name: 'similar_popular_course_carousel',
                variant_id: flagrResponse.similar_popular_course_carousel.variantId,
            });
        }
        if (_.get(flagrResponse, 'suggested_courses_for_you.enabled', null)) {
            variantInfo.push({
                flag_name: 'suggested_courses_for_you',
                variant_id: flagrResponse.suggested_courses_for_you.variantId,
            });
        }
        if (_.get(flagrResponse, 'pricing_experiment_78895.enabled', null)) {
            variantInfo.push({
                flag_name: 'pricing_experiment_78895',
                variant_id: flagrResponse.pricing_experiment_78895.variantId,
            });
        }
        const items = await Promise.all(promises);
        let newWidgetType = false;
        let widgetPosition = 0;
        let disabled = false;
        let widgetPlacement; // * on which page the experiment should work
        if (page === 'SIMILAR') {
            if (_.get(flagrResponse, 'similar_popular_course_carousel.payload.enabled', null)) {
                newWidgetType = _.get(flagrResponse, 'similar_popular_course_carousel.payload.widget_type', 0) !== 0;
                widgetPosition = _.get(flagrResponse, 'similar_popular_course_carousel.payload.position', null) || 0;
            }
            disabled = _.get(flagrResponse, 'similar_popular_course_carousel.payload.enabled', false) === false;
        } else if (page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') {
            newWidgetType = _.get(flagrResponse, 'suggested_courses_for_you.payload.enabled', null) || false;
            widgetPosition = _.get(flagrResponse, 'suggested_courses_for_you.payload.position', null) || 0;
            widgetPlacement = _.get(flagrResponse, 'suggested_courses_for_you.payload.placement', null);
        } else if (page === 'HOMEPAGE_V1') {
            newWidgetType = true;
            widgetPosition = 0;
        }
        return {
            items,
            assortmentList,
            variantInfo,
            new_widget_type: newWidgetType,
            widget_position: widgetPosition,
            disabled,
            carouselTitle,
            widget_placement: widgetPlacement,
        };
    } catch (e) {
        console.log(e);
    }
}

async function tgCheckOnStudent(db, studentClass, tgID, studentId, locale) {
    let tgCheck = false;
    if (tgID) {
        tgCheck = await TGHelper.targetGroupCheck({
            db, studentId, locale, tgID, studentClass,
        });
    }
    return tgCheck;
}

function getTimerExtraMarks(title, endTime, config) {
    return {
        data: {
            trial_title: title,
            trial_title_size: '12',
            trial_title_color: '#000000',
            time: moment(endTime).subtract(5, 'hours').subtract(30, 'minutes').valueOf(),
            time_text_color: '#ff0000',
            time_text_size: '13',
            image_url: `${config.cdn_url}engagement_framework/trial_timer_new.gif`,
            bg_color_one: '#daf8db',
            bg_color_two: '#daf8db',
        },
        type: 'widget_timer',
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
        },
    };
}

async function getReferralMessage(data) {
    const {
        db,
        studentData,
        // type,
    } = data;
    const locale = [];
    // let referralMessages;
    if (studentData.locale == 'en') {
        locale.push('en');
        locale.push('en-hi');
    } else {
        locale.push('hi');
    }
    const referralMessages = await CourseMysqlv2.getAllReferralMessagesUsingLocale(db.mysql.read, locale, 'referral_ceo');

    // const checkUserForCEOReferralTg = await CouponMySQL.getUserForCEOReferralProgramWithStudentId(db.mysql.read, studentData.student_id, 2049);
    // if (checkUserForCEOReferralTg.length > 0) {
    //     referralMessages = await CourseMysqlv2.getAllReferralMessagesUsingLocale(db.mysql.read, locale, 'referral_ceo');
    // } else if (studentData.student_id % 2 == 0) {
    //     referralMessages = await CourseMysqlv2.getAllReferralMessagesUsingLocale(db.mysql.read, locale, 'referral_paytm');
    // } else {
    //     referralMessages = await CourseMysqlv2.getAllReferralMessagesUsingLocale(db.mysql.read, locale, 'referral_doubt');
    // }
    return referralMessages[studentData.student_id % referralMessages.length];
}

function getCategoryFilters(categoryMasterFilters, categoryChildFilters, filters = [], versionCode) {
    const items = [];
    for (let i = 0; i < categoryMasterFilters.length; i++) {
        const childFilters = categoryChildFilters.filter((e) => e.master_filter === categoryMasterFilters[i].master_filter);
        const filterItems = [];
        for (let j = 0; j < childFilters.length; j++) {
            const isSelected = (filters.indexOf(childFilters[j].id.toString()) >= 0) || (!filters.length && childFilters[j].is_default === 1 && versionCode > 850);
            filterItems.push({
                filter_id: childFilters[j].id.toString(),
                text: childFilters[j].child_filter,
                is_selected: isSelected,
            });
        }
        const o = {
            filter_title: categoryMasterFilters[i].master_filter,
            filter_items: filterItems,
            is_selected: filterItems.filter((e) => e.is_selected).length > 0,
        };
        items.push(o);
    }
    const obj = {
        type: 'category_filters',
        data: {
            items,
        },
    };
    return obj;
}

async function generateBannerData(data) {
    const {
        db,
        carouselsData,
        result,
        studentID,
        locale,
        studentClass,
        xAuthToken,
        versionCode,
    } = data;
    const items = [];
    const studentData = await StudentContainer.getById(studentID, db);
    // console.log(result)
    for (let i = 0; i < result.length; i++) {
        result[i].deeplink = result[i].action_activity ? `doubtnutapp://${result[i].action_activity}?` : '';
        const tgCheck = await tgCheckOnStudent(db, studentClass, result[i].target_group_id, studentID, locale);
        if (tgCheck || !result[i].target_group_id) {
            const action_data = JSON.parse(result[i].action_data);
            // eslint-disable-next-line guard-for-in
            for (const action in action_data) {
                if (result[i].description == 'leaderboard' && action == 'url') {
                    const base64StudentId = Buffer.from(studentID.toString()).toString('base64');
                    result[i].deeplink = `${result[i].deeplink}${action}=${action_data[action]}?student_id=${base64StudentId}&`;
                } else if ((result[i].id === 320 || result[i].id === 321) && action === 'external_url') {
                    const referralCodeInfo = await CouponMySQL.getInfoByStudentId(db.mysql.read, studentID);
                    let referralCode = '';
                    if (referralCodeInfo.length) {
                        referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
                    }
                    let shareMessage = Data.referralInfo.invite_message;
                    shareMessage = shareMessage.replace(/<link_to_explore>/g, Data.referralInfo.deeplink_to_explore_url);
                    shareMessage = shareMessage.replace(/<amount>/g, Data.referralInfo.couponData.value);
                    shareMessage = shareMessage.replace(/<referral_code>/g, referralCode);
                    result[i].deeplink = `${result[i].deeplink}${action}=${action_data[action]}${shareMessage}`;
                } else if ((result[i].id === 331 || result[i].id === 332) && action === 'external_url') {
                    const referralCodeInfo = await CouponMySQL.getInfoByStudentId(db.mysql.read, studentID);
                    let referralCode = '';
                    if (referralCodeInfo.length) {
                        referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
                    }
                    const referralMessage = await getReferralMessage({
                        db,
                        studentData: studentData[0],
                    });
                    let shareMessage = referralMessage.message;
                    const branchLink = await StudentContainer.getBranchDeeplink(db, studentID, referralMessage.campaign_id, referralCode);
                    shareMessage = shareMessage.replace(/<link_to_explore>/g, branchLink.url);
                    shareMessage = shareMessage.replace(/<amount>/g, Data.referralInfo.couponData.value);
                    shareMessage = shareMessage.replace(/<referral_code>/g, referralCode);
                    result[i].deeplink = `${result[i].deeplink}${action}=${action_data[action]}${shareMessage}`;
                } else {
                    result[i].deeplink = `${result[i].deeplink}${action}=${action_data[action]}&`;
                }
            }
            let keepBanner = true;
            if (result[i].description.includes('Scholarship')) {
                let dataTest = await CourseContainerv2.getScholarshipExams(db);
                let progressID = await CourseMysqlv2.getScholarshipTestProgress(db.mysql.read, studentID);
                let isProgressOfTypeDnst = 1;
                let thisType;
                if (dataTest && dataTest[0]) {
                    const uniqueTypes = [...new Set(dataTest.map((item) => item.type))];
                    thisType = uniqueTypes.filter((e) => result[i].description.includes(e));
                    if (thisType && thisType[0]) {
                        dataTest = dataTest.filter((e) => e.type.includes(thisType[0]));
                        if (progressID && progressID[0] && dataTest && dataTest[0]) {
                            for (let j = 0; j < progressID.length; j++) {
                                // eslint-disable-next-line no-loop-func
                                if (dataTest.filter((e) => e.test_id === progressID[j].test_id && e.type.includes(thisType[0])).length > 0) {
                                    // eslint-disable-next-line no-loop-func
                                    dataTest = dataTest.filter((e) => e.test_id === progressID[j].test_id);
                                    progressID = [progressID[j]];
                                    isProgressOfTypeDnst = 2;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (isProgressOfTypeDnst === 1) {
                    progressID = [];
                }
                let subscriptionId;
                if (progressID && progressID[0]) {
                    subscriptionId = await TestSeries.getTestSeriesData(db.mysql.read, studentID, progressID[0].test_id);
                }
                if (subscriptionId && subscriptionId[0]) {
                    for (let j = 0; j < subscriptionId.length; j++) {
                        if (subscriptionId && subscriptionId[j] && subscriptionId[j].status === 'COMPLETED') {
                            subscriptionId = [subscriptionId[j]];
                            break;
                        }
                    }
                }
                let type;
                if (thisType && thisType[0]) {
                    type = thisType[0];
                }
                result[i].deeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentID, progressID, subscriptionId);
                let progress;
                let banner;
                const timeEnd = moment.duration('05:30:00');
                const endtime = moment(dataTest[0].explorepage_banner_date).subtract(timeEnd).format();
                if ((!progressID || !progressID.length) && moment().isAfter(endtime)) {
                    keepBanner = false;
                } else {
                    keepBanner = true;
                }
                let haveToChange = false;
                if (progressID && progressID[0] && progressID[0].progress_id == 2 && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
                    progress = 2;
                    keepBanner = true;
                    haveToChange = true;
                } else if (progressID && progressID[0] && progressID[0].progress_id == 2 && subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
                    progress = 3;
                    keepBanner = true;
                    haveToChange = true;
                } else if (progressID && progressID[0] && progressID[0].progress_id == 4) {
                    progress = 4;
                    keepBanner = true;
                    haveToChange = true;
                }
                if (haveToChange) {
                    if (result[i].description.includes('strip')) {
                        banner = await CourseContainerv2.getScholarshipAppStripBanner(db, progressID[0].test_id, locale, progress);
                    } else {
                        banner = await CourseContainerv2.getScholarshipAppGeneralBanner(db, progressID[0].test_id, locale, progress);
                    }
                    if (banner && banner[0] && banner[0].url) {
                        result[i].image_url = banner[0].url;
                    }
                }
            }
            if (keepBanner) {
                const o = {
                    id: result[i].id,
                    image_url: buildStaticCdnUrl(result[i].image_url),
                    deeplink: result[i].deeplink, // `doubtnutapp://${result[i].deeplink}`,
                };
                items.push(o);
            }
        }
    }

    const obj = {
        type: carouselsData.carousel_type,
        data: {
            items,
            margin: true,
            ratio: carouselsData.resource_types,
        },
    };
    if (carouselsData.view_type === 'banner_with_title') {
        obj.data.title = carouselsData.title;
    }
    if (carouselsData.banner_source) {
        obj.extra_params = {
            banner_source: carouselsData.banner_source,
        };
    }
    if (obj.type === 'promo_list') {
        obj.data.auto_scroll_time_in_sec = autoScrollTime;
    }
    return obj;
}

async function generateBannerDataV2(data) {
    const {
        db,
        carouselsData,
        result,
        studentID,
        locale,
        studentClass,
    } = data;
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const tgCheck = result[i].target_group_id ? await tgCheckOnStudent(db, studentClass, result[i].target_group_id, studentID, locale) : true;
        if (tgCheck || !result[i].target_group_id) {
            // eslint-disable-next-line no-template-curly-in-string
            if (_.get(result[i], 'action_data', 0) != 0 && result[i].action_data.includes('${studentId}')) {
                result[i].action_data = result[i].action_data.replace(/\${studentId}/g, studentID);
            }
            const o = {
                id: result[i].id,
                image_url: buildStaticCdnUrl(result[i].image_url),
                deeplink: result[i].action_data, // `doubtnutapp://${result[i].deeplink}`,
            };
            items.push(o);
        }
    }

    const obj = {
        type: carouselsData.carousel_type,
        data: {
            items,
            margin: true,
            ratio: carouselsData.resource_types,
        },
    };
    obj.extra_params = {
        banner_source: 'course_details_banners',
    };
    if (obj.type === 'promo_list') {
        obj.data.auto_scroll_time_in_sec = autoScrollTime;
    }
    return obj;
}

async function getLeaderBoardCard(db, courseDetail, batchID) {
    // checking if there are tests and redis leaderboard corresponding to an assortment
    const tests = await CourseMysqlv2.getTestsByCourseId(db.mysql.read, courseDetail[0].assortment_id);
    let leaderBoard;
    let results;
    if (tests && tests[0] && tests.length > 0) {
        let newId;
        if (batchID) {
            newId = `${courseDetail[0].assortment_id}_${batchID}`;
        }
        leaderBoard = await CourseRedisv2.getCourseLeaderboardAll(db.redis.read, newId, 0, 0);
        if (leaderBoard && leaderBoard.length) {
            results = [1];
        } else {
            results = -1;
        }
    } else {
        results = -1;
    }
    return results;
}

async function getCourseDataByCardId(data) {
    const {
        db,
        page,
        cardID,
        offset,
        subject,
        batchID,
        notesType,
        studentID,
        courseDetail,
        chapterAssortmentList,
        assortmentId,
        versionCode,
        isPostPurchaseHome,
        subTabId,
    } = data;
    let result = [];
    const isResourceAssortment = courseDetail ? courseDetail[0].assortment_type.includes('resource') : null;
    if (chapterAssortmentList && !chapterAssortmentList.length && !isResourceAssortment && !_.includes(['faq', 'ncert', 'books', 'previousYears', 'timetable', 'leaderboard', 'magazine'], cardID)) {
        if (cardID === 'tests' && courseDetail[0].schedule_type === 'recorded') {
            return -1;
        }
        return result;
    }
    if (cardID === 'recent') {
        if (isPostPurchaseHome && courseDetail[0].assortment_type !== 'resource_pdf') {
            result = [1];
        } else if (courseDetail[0].assortment_type === 'resource_pdf') {
            result = -1;
        } else if (isResourceAssortment) {
            result = await CourseMysqlv2.getResourceDetailsFromId(db.mysql.read, [courseDetail[0].assortment_id], [1, 4], courseDetail[0].class, batchID);
            if (result.length) {
                result[0].is_free = 1;
            }
        } else {
            // result = +page === 1 ? await CourseContainerv2.getPastVideoResourcesOfChapter(db, chapterAssortmentList, batchID, courseDetail[0].assortment_id, subject) : await CourseMysqlv2.getPastVideoResourcesOfChapter(db.mysql.read, chapterAssortmentList, batchID);
            result = await CourseMysqlv2.getPastVideoResourcesOfChapter(db.mysql.read, chapterAssortmentList, batchID);
        }
        if (result !== -1) {
            const qIdList = [];
            result.forEach((e) => {
                if (e.resource_reference) {
                    qIdList.push(e.resource_reference);
                }
            });
            if (qIdList.length) {
                const resolvedPromises = await CourseMysqlv2.getVideoProgressOfStudent(db.mysql.read, studentID, qIdList);
                for (let i = 0; i < result.length; i++) {
                    const qid = result[i].resource_reference;
                    const vvsData = resolvedPromises.filter((e) => e.question_id == qid);
                    result[i].progress_status = vvsData.length ? (vvsData[0].video_time / vvsData[0].duration) * 100 : 0;
                    result[i].video_time = vvsData.length ? vvsData[0].video_time : 0;
                }
            }
        }
    } else if (cardID === 'upcoming') {
        if (offset > 0) {
            result = [];
        } else {
            const currentDate = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            const startDate = currentDate.format('YYYY-MM-DD HH:mm:ss');
            const endDate = currentDate.add(1, 'month').endOf('day').format('YYYY-MM-DD HH:mm:ss');
            let assortment = courseDetail[0].assortment_id;
            if (courseDetail[0].assortment_type === 'subject') {
                const parentMappings = await CourseMysqlv2.getAllParentAssortments(db.mysql.read, [assortment]);
                assortment = parentMappings[0].assortment_id;
            }
            result = await getResourcesByAssortmentList(db, [assortment], startDate, endDate, studentID, batchID);
            result = result.reverse();
            if (subject) {
                result = result.filter((item) => item.subject === subject);
            } else if (courseDetail[0].assortment_type === 'subject') {
                result = result.filter((item) => (item.subject === courseDetail[0].display_name) || item.resource_type === 9);
            }
        }
    } else if (cardID === 'previous_year_papers') {
        result = await CourseMysqlv2.getPreviousYearPapersResourcesOfChapter(db.mysql.read, chapterAssortmentList);
    } else if (cardID === 'notes') {
        if (courseDetail[0].assortment_type === 'resource_video') {
            result = -1;
        } else if (isResourceAssortment) {
            result = await CourseMysqlv2.getResourceDetailsFromId(db.mysql.read, [courseDetail[0].assortment_id], [2], courseDetail[0].class, batchID);
            if (result.length) {
                result[0].is_free = 1;
            }
        } else {
            result = await CourseMysqlv2.getNotesResourcesOfChapter(db.mysql.read, chapterAssortmentList, notesType, batchID, 2);
        }
        if (!isPostPurchaseHome && versionCode > 961) {
            const bookmarkedResources = await CourseMysqlv2.getBookMarkedResourcesOfStudent(db.mysql.read, studentID, courseDetail[0].assortment_id);
            result.forEach((item) => {
                item.isbookmarked = _.find(bookmarkedResources, ['course_resource_id', item.id]) ? 1 : 0;
            });
        }
    } else if (cardID === 'tests') {
        result = await CourseMysqlv2.getTestResourcesOfChapter(db.mysql.read, chapterAssortmentList, studentID, batchID);
    } else if (cardID === 'upcoming_tests') {
        result = await CourseMysqlv2.getUpcomingTestResourcesOfChapter(db.mysql.read, chapterAssortmentList, studentID, batchID);
    } else if (cardID === 'previous_tests') {
        result = await CourseMysqlv2.getPastTestResourcesOfChapter(db.mysql.read, chapterAssortmentList, studentID, batchID);
    } else if (cardID === 'homework') {
        if (notesType === 'completed' || notesType === 'pending') {
            if (courseDetail[0].assortment_type === 'course') {
                // result = await CourseMysqlv2.getHomeworkByAssortmentID(db.mysql.read, courseDetail[0].assortment_id, 20, (page - 1) * 20 || 0, subject, notesType, studentID, batchID);
                result = await CourseMysqlv2.getHomeworkByAssortmentIDNew(db.mysql.read, courseDetail[0].assortment_id, subject, notesType, studentID, batchID);
            } else if (courseDetail[0].assortment_type === 'subject') {
                // result = await CourseMysqlv2.getHomeworkBySubjectAssortmentID(db.mysql.read, courseDetail[0].assortment_id, 20, (page - 1) * 20 || 0, notesType, studentID, batchID);
                result = await CourseMysqlv2.getHomeworkBySubjectAssortmentIDNew(db.mysql.read, courseDetail[0].assortment_id, notesType, studentID, batchID);
            }
            result.forEach((e) => {
                e.status = notesType === 'completed' ? 1 : 0;
            });
            const temp = [];
            for (let i = 0; i < result.length; i++) {
                const condition = !_.isNull(result[i].live_at) ? moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at) : true;
                if (condition) {
                    temp.push(result[i]);
                }
            }
            result = temp;
        } else {
            // result = await CourseMysqlv2.getHomeworkByChapterAssortmentID(db.mysql.read, chapterAssortmentList, batchID);
            result = await CourseMysqlv2.getHomeworkByChapterAssortmentIDNew(db.mysql.read, chapterAssortmentList, batchID);
            const temp = [];
            for (let i = 0; i < result.length; i++) {
                const condition = !_.isNull(result[i].live_at) ? moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at) : true;
                if (condition) {
                    temp.push(result[i]);
                }
            }
            result = temp;
            if (!isPostPurchaseHome) {
                const userResponses = await CourseMysqlv2.getFullHomeworkResponse(db.mysql.read, studentID);
                const groupedUserResponse = _.groupBy(userResponses, 'resource_reference');
                result.forEach((e) => {
                    e.status = typeof groupedUserResponse[e.question_id] !== 'undefined' ? 1 : 0;
                });
            }
        }
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'books' || cardID === 'previousYears' || cardID === 'ncert') {
        const bookType = cardID === 'books' ? 'Reference Book' : `${cardID === 'ncert' ? 'NCERT' : 'Previous Year'}`;
        result = await CourseMysqlv2.getBooksResourcesOfAssortment(db.mysql.read, courseDetail[0].assortment_id, bookType, offset || 0, subject);
        if (!result.length && !courseDetail[0].is_free) {
            result = -1;
        }
    } else if (cardID === 'ncert') {
        const playlist = await CourseMysqlv2.getNcertPlaylistId(db.mysql.read, courseDetail[0].class);
        result = playlist.length ? [playlist[0].id] : -1;
    } else if (cardID === 'faq') {
        result = [1];
    } else if (cardID === 'dictionary') {
        result = versionCode < 940 ? -1 : [1];
    } else if (cardID === 'feedback') {
        result = versionCode < 850 ? -1 : [1];
    } else if (cardID === 'study_group') {
        result = versionCode < 898 ? -1 : [1];
    } else if (cardID === 'missed_classes') {
        if (courseDetail[0].parent === 4) {
            result = await CourseMysqlv2.getEtoosContinueWatchingVideosByAssortmentID(db.mysql.read, courseDetail[0].assortment_id, studentID, offset);
            if (result.length || (!result.length && offset)) {
                const offsetFactor = offset ? (offset / 10) : 1;
                const userRelatedLectures = await CourseMysqlv2.getRelatedVideosOfChapter(db.mysql.read, result[result.length - offsetFactor].assortment_id);
                result = [...result, ...userRelatedLectures];
            } else {
                result = await CourseMysqlv2.getFreeResourceDetailsFromAssortmentId(db.mysql.read, courseDetail[0].assortment_id, courseDetail[0].class, offset);
            }
        } else {
            result = await CourseMysqlv2.getMissedClassesForPastDays(db.mysql.read, courseDetail[0].assortment_id, studentID, courseDetail[0].assortment_type, offset, batchID);
        }
    } else if (cardID === 'timetable') {
        let courseAssortment = courseDetail[0].assortment_id;
        let subjectFilter = null;
        if (courseDetail[0].assortment_type === 'subject') {
            subjectFilter = courseDetail[0].display_name;
            const parentMappings = await CourseMysqlv2.getAllParentAssortments(db.mysql.read, [courseAssortment]);
            courseAssortment = parentMappings[0].assortment_id;
        }
        result = versionCode > 910 ? await CourseMysqlv2.getCourseSchedule(db.mysql.read, courseAssortment, subjectFilter, batchID) : await CourseMysqlv2.getBanners(db.mysql.read, courseDetail[0].assortment_id, batchID, 'timetable');
        if (!result.length) {
            result = -1;
        }
        if (page > 1) {
            result = [];
        }
    } else if (cardID === 'missed_tests') {
        result = await CourseMysqlv2.getPastMissedWeeklyTestsResourcesOfChapter(db.mysql.read, assortmentId, studentID, batchID);
    } else if (cardID === 'leaderboard') {
        result = await getLeaderBoardCard(db, courseDetail, batchID);
    } else if (cardID === 'revision') {
        result = await CourseMysqlv2.getRevisionContentOfCourse(db.mysql.read, courseDetail[0].assortment_id, batchID);
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'sample_paper') {
        result = await CourseMysqlv2.getSamplePapersOfCourse(db.mysql.read, courseDetail[0].assortment_id, batchID, subject, (page - 1) * 10);
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'imp_ques_objective') {
        result = await CourseMysqlv2.getImpQuestionsObjectiveOfCourse(db.mysql.read, courseDetail[0].assortment_id, batchID, subject, (page - 1) * 10);
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'imp_ques_subjective') {
        result = await CourseMysqlv2.getImpQuestionsSubjectiveOfCourse(db.mysql.read, courseDetail[0].assortment_id, batchID, subject, (page - 1) * 10);
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'one_shot_classes') {
        result = await CourseMysqlv2.getOneShotClassesOfCourse(db.mysql.read, courseDetail[0].assortment_id, batchID, subject, (page - 1) * 10, 'Revision-One ShotClasses');
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'revision_course') {
        result = await CourseMysqlv2.getOneShotClassesOfCourse(db.mysql.read, courseDetail[0].assortment_id, batchID, subject, (page - 1) * 10, 'Revision-Course');
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'revision_mock_test') {
        result = await CourseMysqlv2.getRevisionMockTestOfCourses(db.mysql.read, courseDetail[0].assortment_id, studentID, batchID, subject, (page - 1) * 10);
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'revision_chapter_test') {
        result = await CourseMysqlv2.getRevisionChapterTestOfCourses(db.mysql.read, courseDetail[0].assortment_id, studentID, batchID, subject, (page - 1) * 10);
        if (!result.length) {
            result = -1;
        }
    } else if (cardID === 'bookmark') {
        const bookmarkedResources = versionCode < 962 ? [] : await CourseMysqlv2.getBookMarkedResourcesOfStudent(db.mysql.read, studentID, courseDetail[0].assortment_id);
        if (!bookmarkedResources.length) {
            result = -1;
        } else if (subTabId === 'notes') {
            result = await CourseMysqlv2.getBookMarkedResourcesOfStudentByResouceType(db.mysql.read, studentID, courseDetail[0].assortment_id, [2], batchID, (page - 1) * 10);
        } else if (subTabId === 'bookmarked_classes') {
            result = await CourseMysqlv2.getBookMarkedResourcesOfStudentByResouceType(db.mysql.read, studentID, courseDetail[0].assortment_id, [1, 8], batchID, (page - 1) * 10);
        } else if (subTabId === 'doubts') {
            const bookmarkedDoubts = await CourseMysqlv2.getBookMarkedDoubtsOfStudent(db.mysql.read, studentID, courseDetail[0].assortment_id, (page - 1) * 5);
            const chapterList = [];
            bookmarkedDoubts.map((item) => chapterList.push(item.chapter));
            if (chapterList.length) {
                const lectures = await CourseMysqlv2.getBookMarkedDoubtsByChapterNames(db.mysql.read, chapterList, studentID, courseDetail[0].assortment_id);
                const resourcesList = [];
                lectures.map((item) => resourcesList.push(ObjectId(item.comment_id)));
                const doubtsData = await db.mongo.read.collection('comments').find({ _id: { $in: resourcesList } }).limit(10)
                    .toArray();
                result = [doubtsData];
                result.push(lectures);
            } else {
                result = bookmarkedDoubts;
            }
        } else {
            result = bookmarkedResources;
        }
    } else if (cardID === 'magazine') {
        result = chapterAssortmentList.length ? await CourseMysqlv2.getNotesResourcesOfChapter(db.mysql.read, chapterAssortmentList, null, batchID, 12) : -1;
        if (!result.length) {
            result = -1;
        }
    }
    return result;
}

function getNotesData(resourceListNotes, studentPackageAssortments = [], studentEmiPackageAssortments = [], flagrResponse, paymentState, config) {
    const notes = [];
    if (!paymentState) {
        paymentState = { isVip: false };
    }
    for (let i = 0; i < resourceListNotes.length; i++) {
        const paymentCardState = {
            isVip: studentPackageAssortments.indexOf(resourceListNotes[i].assortment_id) >= 0 || paymentState.isVip,
            emiDialog: studentEmiPackageAssortments.indexOf(resourceListNotes[i].assortment_id) >= 0,
        };

        const payDetails = {
            page_ref: 'detail',
        };
        let deeplink = `doubtnutapp://vip?assortment_id=${resourceListNotes[i].assortment_id}`;
        if (flagrResponse && flagrResponse.variantAttachment && flagrResponse.variantAttachment.enabled) {
            deeplink = `doubtnutapp://vip?variant_id=${resourceListNotes[i].variant_id}`;
        }
        const obj = {
            id: resourceListNotes[i].id,
            resource_type: 2,
            title: resourceListNotes[i].meta_info,
            text: resourceListNotes[i].topic,
            border_color: LiveclassHelper.getBarColorForLiveclassHomepage(resourceListNotes[i].subject.toUpperCase()),
            link: resourceListNotes[i].resource_reference,
            resource_location: resourceListNotes[i].resource_location,
            is_premium: !resourceListNotes[i].is_free,
            is_vip: paymentCardState.isVip,
            show_emi_dialog: paymentCardState.emiDialog,
            subject: resourceListNotes[i].subject,
            master_chapter: resourceListNotes[i].chapter,
            payment_details: JSON.stringify(payDetails),
            assortment_id: resourceListNotes[i].assortment_id,
            payment_deeplink: deeplink,
            course_assortment_id: resourceListNotes[i].course_assortment_id,
            icon_url: resourceListNotes[i].isbookmarked !== 0 ? `${config.staticCDN}engagement_framework/icon_small_bookmark_filled.webp` : `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`,
            source: resourceListNotes[i].isbookmarked === 0 ? 'video_page' : 'bookmark',
        };
        if (resourceListNotes[i].isbookmarked !== undefined) {
            obj.is_bookmark = resourceListNotes[i].isbookmarked !== 0;
        }
        notes.push(obj);
    }
    return notes;
}

function getTimetableData(db, config, resourceList, widget, locale, currentYear, branchDeeplinkForWeb) {
    const { monthArr, monthArrHi } = liveclassData;
    const { week } = liveclassData;
    const widgets = [];
    // group by month
    let finalResources = [];
    for (let i = 0; i < resourceList.length; i++) {
        let obj = {};
        const now = moment().add(5, 'hours').add(30, 'minutes');
        if (resourceList[i].is_active) {
            resourceList[i].is_active = resourceList[i].is_active === 'ACTIVE' ? 1 : 0;
        }
        if (_.includes([1, 4, 8], resourceList[i].resource_type)) {
            obj = LiveclassHelper.generateStreamObjectResourcePage(resourceList[i], db, config, true);
            obj.duration = `${moment(resourceList[i].live_at).format('hh:mm A')} - ${moment(resourceList[i].live_at).add(1, 'hour').format('hh:mm A')}`;
            obj.description = resourceList[i].description;
            obj.month = resourceList[i].month;
            obj.week = resourceList[i].week;
            obj.day = resourceList[i].day;
            obj.year = resourceList[i].year;
            obj.title = resourceList[i].title;
            obj.subject = resourceList[i].subject;
            obj.title1 = widget ? `${locale === 'hi' && Data.subjectHindi[resourceList[i].subject.toUpperCase()] ? Data.subjectHindi[resourceList[i].subject.toUpperCase()] : resourceList[i].subject}` : obj.title1;
            if ((moment(resourceList[i].live_at).add(resourceList[i].duration, 'seconds') > now || resourceList[i].stream_status === 'ACTIVE') && moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[i].live_at)) {
                obj.title1 = `${obj.title1} ${locale === 'hi' ? '\n(क्लास चल रही है)' : '\n(Streaming Now)'}`;
            }
            obj.title2 = widget ? resourceList[i].display : obj.title2;
            obj.image_url = resourceList[i].image_bg_liveclass ? resourceList[i].image_bg_liveclass : '';
            obj.is_viewed = !!resourceList[i].is_view;
            obj.resource_type = 'video';
            obj.is_downloadable = !!(!resourceList[i].is_free && resourceList[i].vdo_cipher_id && resourceList[i].is_vdo_ready === 2 && moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[i].live_at));
            obj.live_at_date = obj.state === 0 ? moment(resourceList[i].live_at).format('DD MMM, hh:mm A') : moment(resourceList[i].live_at).format('hh:mm A');
            obj.reminder_message = locale === 'hi' ? 'आपको क्लास शुरू होने से 2 मिनट पहले नोटिफिकेशन भेज दिया जाएगा' : 'Aapko class shuru hone se 2 mins pehle notify kar diya jaega';
            obj.widget_type = 'widget_course_classes';
        } else if (_.includes([2, 3], resourceList[i].resource_type)) {
            obj = resourceList[i];
            obj.text = resourceList[i].display;
            obj.pdf_url = resourceList[i].resource_reference;
            obj.border_color = '#c31292';
            obj.link = resourceList[i].resource_reference;
            obj.image_url = resourceList[i].image_bg_liveclass ? resourceList[i].image_bg_liveclass : '';
            obj.color = LiveclassHelper.getBarColorHomepage(resourceList[i].subject);
            obj.resource_type = 'pdf';
            obj.widget_type = 'resource_notes';
            if (branchDeeplinkForWeb) {
                obj.deeplink = branchDeeplinkForWeb;
            }
        } else {
            obj = resourceList[i];
            obj.margin = false;
            obj.subject = resourceList[i].subject;
            obj.id = resourceList[i].resource_reference;
            obj.test_id = resourceList[i].resource_reference;
            obj.image_url = resourceList[i].image_bg_liveclass ? resourceList[i].image_bg_liveclass : '';
            obj.color = LiveclassHelper.getBarColorHomepage(resourceList[i].subject);
            obj.questions_count = `${resourceList[i].no_of_questions} ${locale === 'hi' ? 'प्रश्न' : 'questions'}`;
            const hr = Math.floor(resourceList[i].duration_in_min / 60);
            const mins = resourceList[i].duration_in_min % 60;
            obj.duration = resourceList[i].duration_in_min ? `${hr > 0 ? `${hr} hr` : ''}${mins > 0 ? `${mins} mins` : ''}` : '';
            let actionText = locale === 'hi' ? 'शुरू करो' : 'Start Test';
            if (resourceList[i].status && resourceList[i].status !== 'SUBSCRIBED') {
                actionText = locale === 'hi' ? 'परिणाम देखो' : 'See Result';
            }
            obj.action_text = actionText;
            obj.is_completed = !!(resourceList[i].status && resourceList[i].status !== 'SUBSCRIBED');
            obj.status = resourceList[i].status && resourceList[i].status !== 'SUBSCRIBED' ? liveclassData.completedText(locale) : liveclassData.pendingText(locale);
            obj.resource_type = 'test';
            obj.widget_type = 'widget_course_test';
            obj.submit_date = resourceList[i].completed_at ? moment(resourceList[i].completed_at).format('DD MMM') : '';
            if (widget) {
                obj.title = resourceList[i].test_title;
            }
            if (moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[i].live_at)) {
                obj.state = 1;
            }
            if (branchDeeplinkForWeb) {
                obj.deeplink = branchDeeplinkForWeb;
            }
        }
        if (!(resourceList[i].resource_type === 4 && !resourceList[i].is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[i].live_at))) {
            finalResources.push(obj);
        }
    }
    if (currentYear) {
        const showReverse = _.find(finalResources, ['month', 1]) && _.find(finalResources, ['month', 12]);
        if (showReverse) {
            finalResources = _.orderBy(finalResources, 'month', 'desc');
        } else {
            finalResources = _.orderBy(finalResources, 'month', 'asc');
        }
    }
    const groupedMonth = widget ? _.groupBy(finalResources, (item) => `${item.month}$${item.year}`) : _.groupBy(finalResources, 'month');
    // eslint-disable-next-line guard-for-in
    for (const key in groupedMonth) {
        if (!widget) {
            const obj = {
                type: 'schedule_header',
                data: {
                    id: '1',
                    title: `${monthArr[parseInt(key) - 1]}`,
                },
            };
            widgets.push(obj);
        }
        const dayWiseresources = _.groupBy(groupedMonth[key], 'day');
        // eslint-disable-next-line guard-for-in
        for (const i in dayWiseresources) {
            let dayWiseResourcesWidget = [];
            if (widget) {
                const source = moment().add(5, 'hours').add(30, 'minutes').isAfter(dayWiseresources[i][0].live_at) ? 'course_page_timeline' : 'course_page_upcoming_card';
                if (dayWiseresources[i].length > 20) {
                    while (dayWiseresources[i].length) {
                        const dayWiseresourcesSubset = dayWiseresources[i].splice(0, 20);
                        dayWiseResourcesWidget = [];
                        for (let j = 0; j < dayWiseresourcesSubset.length; j++) {
                            dayWiseresourcesSubset[j].is_premium = false;
                            dayWiseresourcesSubset[j].color = LiveclassHelper.getBarColorForLiveclassHomepage(dayWiseresourcesSubset[j].subject.toUpperCase());
                            if (dayWiseresourcesSubset[j].widget_type !== 'resource_notes') {
                                dayWiseResourcesWidget.push({
                                    type: dayWiseresourcesSubset[j].widget_type,
                                    data: dayWiseresourcesSubset[j],
                                    extra_params: {
                                        source: moment().add(5, 'hours').add(30, 'minutes').isAfter(dayWiseresourcesSubset[j].live_at) ? 'course_page_timeline' : 'course_page_upcoming_card',
                                    },
                                });
                            }
                        }
                        if (dayWiseResourcesWidget.length && dayWiseresources[i].length) {
                            const o = {
                                type: 'schedule_v2',
                                data: {
                                    id: '2',
                                    tag: locale === 'hi' ? `${monthArrHi[parseInt(key) - 1]} ${dayWiseresources[i][0].year}` : `${monthArr[parseInt(key) - 1]} ${dayWiseresources[i][0].year}`,
                                    day: dayWiseresources[i].length <= 20 ? `${week[dayWiseresourcesSubset[0].week - 1]}` : '  ',
                                    date: dayWiseresources[i].length <= 20 ? `${i}` : '  ',
                                    resources: dayWiseResourcesWidget,
                                },
                            };
                            if (source === 'course_page_upcoming_card') {
                                widgets.push(o);
                            } else {
                                widgets.unshift(o);
                            }
                        }
                    }
                } else {
                    for (let j = 0; j < dayWiseresources[i].length; j++) {
                        dayWiseresources[i][j].is_premium = false;
                        dayWiseresources[i][j].color = LiveclassHelper.getBarColorForLiveclassHomepage(dayWiseresources[i][j].subject.toUpperCase());
                        if (dayWiseresources[i][j].widget_type !== 'resource_notes') {
                            dayWiseResourcesWidget.push({
                                type: dayWiseresources[i][j].widget_type,
                                data: dayWiseresources[i][j],
                                extra_params: {
                                    source: moment().add(5, 'hours').add(30, 'minutes').isAfter(dayWiseresources[i][j].live_at) ? 'course_page_timeline' : 'course_page_upcoming_card',
                                },
                            });
                        }
                    }
                    if (dayWiseResourcesWidget.length) {
                        const o = {
                            type: 'schedule_v2',
                            data: {
                                id: '2',
                                tag: locale === 'hi' ? `${monthArrHi[parseInt(key) - 1]} ${dayWiseresources[i][0].year}` : `${monthArr[parseInt(key) - 1]} ${dayWiseresources[i][0].year}`,
                                day: `${week[dayWiseresources[i][0].week - 1]}`,
                                date: `${i}`,
                                resources: dayWiseResourcesWidget,
                            },
                        };
                        if (source === 'course_page_upcoming_card') {
                            widgets.push(o);
                        } else {
                            widgets.unshift(o);
                        }
                    }
                }
            } else {
                const o = {
                    type: 'schedule',
                    data: {
                        id: '2',
                        tag: `${monthArr[parseInt(key) - 1]}`,
                        day: `${week[dayWiseresources[i][0].week - 1]}`,
                        date: `${i}`,
                        resources: dayWiseresources[i],
                    },
                };
                widgets.push(o);
            }
        }
    }

    return widgets;
}

async function getCourseDemoVideoData(db, config, courseDetail, checkTrialEligibility, locale, assortmentPriceMapping, scholarship, progressID, textData, subscriptionId) {
    let demoQuestionId;
    let assortmentId;
    if (scholarship.includes('scholarship_test')) {
        demoQuestionId = courseDetail[0].demo_video_qid;
    } else {
        assortmentId = courseDetail[0].assortment_id;
        demoQuestionId = courseDetail[0].demo_video_qid;
    }
    const obj = {
        image_url: courseDetail[0].demo_video_thumbnail ? courseDetail[0].demo_video_thumbnail : `${config.staticCDN}engagement_framework/138802C0-774C-BB7B-BD3F-C6ED9ABDC755.webp`,
        image_url_two: `${config.staticCDN}engagement_framework/29CE84F4-0646-66F1-6510-46E5F55BDD8C.webp`,
        delay: '2',
        call_us_text: locale === 'hi' ? 'हमें कॉल करें' : 'Call us',
        call_us_number: '',
        is_trial: true,
        text_color: '#000000',
        bottom_title: locale === 'hi' ? 'आज से शुरू करो तैयारी!' : 'Aaj se shuru karo taiyari!',
        bottom_sub_title: locale === 'hi' ? 'अभी खरीदो और क्लासें लगाना शुरू करो!' : 'Abhi khareedo or classes shuru karo!',
        button_text: locale === 'hi' ? 'अभी खरीदें' : 'Buy Now',
        button_color: '#eb532c',
        button_text_color: '#ffffff',
    };
    if (scholarship.includes('scholarship_test')) {
        obj.bottom_title = locale === 'hi' ? `${textData[0].coursepage_subheading.split('||')[0]}` : `${textData[0].coursepage_subheading.split('||')[1]}`;
        obj.button_deeplink = courseDetail[0].deeplink;
        if (progressID && progressID[0] && progressID[0].progress_id == 2 && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
            if (textData[0].type.includes('TALENT')) {
                obj.bottom_sub_title = Data.scholarship3registeredText2(locale, textData[0].test_name).TALENT;
            } else {
                obj.bottom_sub_title = Data.scholarship3registeredText2(locale, textData[0].test_name).DNST;
            }
            obj.button_text = locale === 'hi' ? 'टेस्ट शुरू करें' : 'Start Test';
        } else if (progressID && progressID[0] && progressID[0].progress_id == 2 && subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
            if (textData[0].type.includes('TALENT')) {
                obj.bottom_sub_title = Data.scholarshipcourseText(locale, textData[0].test_name).TALENT;
            } else {
                obj.bottom_sub_title = Data.scholarshipcourseText(locale, textData[0].test_name).DNST;
            }
            obj.button_text = locale === 'hi' ? 'परिणाम देखें' : 'View Results';
        } else if (progressID && progressID[0] && progressID[0].progress_id == 4) {
            obj.bottom_sub_title = locale === 'hi' ? 'खत्म हुआ इंतजार आ गया है रिजल्ट !' : 'Khatam hua intezaar aa gya hai result !';
            obj.button_text = locale === 'hi' ? 'परिणाम देखें।' : 'Check Results';
        } else if (progressID && progressID[0] && progressID[0].progress_id == 5) {
            obj.bottom_sub_title = locale === 'hi' ? 'मुबारक हो !\nआप Doubtnut सुपर 100 के दूसरे चरण के लिए चुने गए हैं' : 'Congratualtion\nAap Doubtnut Super 100 ke Round 2 ke liye select ho gaye hain';
            obj.button_text = (locale === 'hi') ? 'दूसरे चरण की ओर बढ़ें' : 'Proceed to round 2';
        } else {
            obj.bottom_sub_title = locale === 'hi' ? 'आज ही रेजिस्टर करें।' : 'Aaj hi register karein.';
            obj.button_text = locale === 'hi' ? 'रजिस्टर करें' : 'Register karein';
        }
    } else if (!checkTrialEligibility.length) {
        obj.bottom_title = locale === 'hi' ? 'आज से शुरू करो तैयारी!' : 'Aaj se shuru karo taiyari!';
        obj.button_text = locale === 'hi' ? 'डेमो देखो' : 'Demo dekho';
        // obj.bottom_sub_title = locale === 'hi' ? 'कोर्स खरीदने से पहले एक दिन मुफ़्त में ट्राई करो' : 'Course khareedne se pehle 1 din muft me try karo';
        obj.bottom_sub_title = locale === 'hi' ? 'कोर्स में एडमिशन लेने से पहले 1 दिन मुफ़्त में ट्राई करो' : 'Course me admission lene se pehle 1 din muft me try karo';
    } else if (assortmentPriceMapping[assortmentId].is_emi) {
        obj.button_deeplink = `doubtnutapp://vip?assortment_id=${assortmentId}`;
    } else {
        obj.button_deeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentId].package_variant}`;
    }

    if (demoQuestionId) {
        obj.qid = demoQuestionId;
        obj.page = 'COURSE_DETAIL';
    }
    return obj;
}

function getPrePurchaseCourseInfo(courseDetail, assortmentPriceMapping, locale, liveclassCourseDetails) {
    const assortmentId = courseDetail[0].assortment_id;
    let title = courseDetail.length ? courseDetail[0].display_name : '';
    if (courseDetail[0].assortment_type === 'subject') {
        title = courseDetail[0].display_description;
    }
    let duration = `${moment(courseDetail[0].start_date).format('MMMM YYYY')} - ${moment(courseDetail[0].end_date).format('MMMM YYYY')}`;
    if (liveclassCourseDetails && liveclassCourseDetails.length) {
        duration = locale === 'hi' ? `कोर्स ID #${liveclassCourseDetails[0].liveclass_course_id}` : `Course ID #${liveclassCourseDetails[0].liveclass_course_id}`;
    }
    return {
        type: 'course_info_v1',
        data: {
            title,
            description: courseDetail[0].display_description,
            duration,
            starting_at_text: assortmentPriceMapping[assortmentId].multiple && assortmentPriceMapping[assortmentId].enabled && locale !== 'hi' ? 'From' : '',
            starting_at_text_hi: assortmentPriceMapping[assortmentId].multiple && assortmentPriceMapping[assortmentId].enabled && locale === 'hi' ? 'से शुरू' : '',
            amount_to_pay: courseDetail[0].sub_assortment_type === 'mock_test' || courseDetail[0].assortment_type === 'chapter' ? `₹${numberWithCommas(assortmentPriceMapping[assortmentId].display_price)}` : `₹${numberWithCommas(assortmentPriceMapping[assortmentId].monthly_price)}/Mo`,
            amount_strike_through: '',
            rating: courseDetail[0].rating ? courseDetail[0].rating : `${parseFloat((Math.random()).toFixed(1)) + 4}`,
            tag: Data.getCourseMediumByLocale(locale)[courseDetail[0].meta_info] || courseDetail[0].meta_info,
        },
    };
}

async function getPrePurchaseCourseEmiDetails(db, config, assortmentPriceMapping, assortmentId, locale) {
    if (assortmentPriceMapping[assortmentId] && assortmentPriceMapping[assortmentId].emi_variant) {
        const emiDetails = await Package.getChildPackagesFromVariant(db.mysql.read, assortmentPriceMapping[assortmentId].emi_variant);
        return {
            type: 'course_emi_info_v1',
            data: {
                title: locale === 'hi' ? `किश्त उपलब्ध @ ₹${emiDetails[0].display_price}/प्रति माह` : `EMI Available @ ₹${emiDetails[0].display_price}/Month`,
                icon: `${config.staticCDN}engagement_framework/B6D30AC1-D3D8-F072-20ED-484B2C83F64F.webp`,
            },
        };
    }
}

async function getPrePurchaseCourseFeatures(db, locale, assortmentId, isNew) {
    let items = [];
    const [
        coursePrePurchaseDetails,
        defaultCoursePrePurchaseDetails,
    ] = await Promise.all([
        CourseContainerv2.getPrePurchaseCourseHighlights(db, assortmentId, locale, 20),
        CourseContainerv2.getPrePurchaseCourseHighlights(db, 0, locale, 20),
    ]);
    const featuresData = !coursePrePurchaseDetails.length && isNew ? defaultCoursePrePurchaseDetails : coursePrePurchaseDetails;
    if (featuresData.length) {
        items = featuresData.map((item) => ({
            title: item.title,
            subtitle: item.subtitle,
        }));
    }
    const courseFeatureItems = [
        {
            title: locale === 'hi' ? 'डेली' : 'Daily',
            subtitle: locale === 'hi' ? 'क्लासेस' : 'Classes',
        },
        {
            title: locale === 'hi' ? 'टेस्ट' : 'Tests',
            subtitle: locale === 'hi' ? '(साप्ताहिक)' : '(Weekly)',
        },
        {
            title: locale === 'hi' ? 'डेली' : 'Daily',
            subtitle: locale === 'hi' ? 'होमवर्क' : 'Homework',
        },
        {
            title: locale === 'hi' ? 'पूरा' : 'Full',
            subtitle: locale === 'hi' ? 'सिलेबस' : 'Syllabus',
        },
    ];
    items = items.length > 0 ? items : courseFeatureItems;
    return {
        type: isNew ? 'widget_course_details' : 'course_features',
        data: {
            title: locale === 'hi' ? 'इस कोर्स में क्या क्या मिलेगा' : 'Is Course Mein Kya Kya Milega',
            items,
        },
    };
}

function getPrePurchaseCourseTimetable(timetableData, locale) {
    const items = [];
    const subjectTopicsMapping = {};
    for (let i = 0; i < timetableData.length; i++) {
        if (subjectTopicsMapping[timetableData[i].subject]) {
            subjectTopicsMapping[timetableData[i].subject].push(timetableData[i].topic_covered);
        } else {
            subjectTopicsMapping[timetableData[i].subject] = [timetableData[i].topic_covered];
        }
    }
    // eslint-disable-next-line guard-for-in
    for (const key in subjectTopicsMapping) {
        items.push({
            subject_title: key,
            subject_color: LiveclassHelper.getBarColorHomepage(key),
            list: subjectTopicsMapping[key],
        });
    }
    if (items.length) {
        items[0].toggle = true;
        return {
            type: 'course_timetable',
            data: {
                title: locale === 'hi' ? 'आप यहाँ क्या सीखेंगे?' : 'What Will I Learn?',
                toggle: true,
                items,
            },
        };
    }
}

function getPrePurchaseCourseFAQs(data, locale, videoResource, newDemoVideoExperiment, demo, versionCode, qId) {
    let textSee;
    if (newDemoVideoExperiment && versionCode > 869) {
        textSee = locale === 'hi' ? 'इसकी वीडियो देखें  ' : 'Play Video for this';
    } else {
        textSee = locale === 'hi' ? 'देखें कैसे ' : 'See How';
    }
    const items = data.map((item) => {
        const itemObj = {};
        itemObj.title = item.question;
        // itemObj.description = (newDemoVideoExperiment && item.offset_time && versionCode > 869) ? '' : item.value;
        itemObj.description = item.answer;
        if (item.offset_time) {
            if (newDemoVideoExperiment && !demo && versionCode > 869) {
                itemObj.video_info = {
                    qid: qId,
                    page: 'COURSE_DETAIL',
                    text: textSee,
                };
                itemObj.video_info.video_resources = [...videoResource];
                itemObj.video_info.video_resources[0] = { ...itemObj.video_info.video_resources[0], offset: item.offset_time };
            } else {
                itemObj.video_info = {
                    position: `${item.offset_time}`,
                    text: locale === 'hi' ? 'देखें कैसे ' : 'See How',
                };
            }
        }
        return itemObj;
    });
    if (items.length > 0) {
        items[0].toggle = true;
    }
    return {
        type: 'course_faqs',
        data: {
            title: locale === 'hi' ? 'कोर्स की विस्तृत जानकारी' : 'FAQs',
            description: locale === 'hi' ? 'इस कोर्स के बारे में अधिक जानें ' : 'Learn More about this course',
            bottom_text: locale === 'hi' ? 'और जानकारी चाहिए?' : 'More Questions?',
            toggle: true,
            see_more_text: locale === 'hi' ? 'देखें सारे सवाल' : 'See all FAQ\'s',
            items,
        },
    };
}

function getPrePurchaseCourseTeachers(data, locale, versionCode) {
    const items = [];
    for (let i = 0; i < data.length; i++) {
        let experience = '';
        if (data[i].experience) {
            experience = data[i].experience > 1 ? `${data[i].experience} yrs ` : `${data[i].experience} yr `;
        }
        const degree = data[i].degree ? `${data[i].degree} | ` : '';
        items.push({
            faculty_name: data[i].expert_name,
            imageUrl: data[i].expert_image,
            faculty_desc: `${degree}${experience}Experience in ${data[i].subject}`,
            bottom_title: `Mentored ${(data[i].students_mentored / 100000) || 1} Lakh+ Students`,
            rating: data[i].rating && versionCode > 925 ? parseFloat(data[i].rating.toFixed(1)) : 5.0,
            experience: data[i].experience_in_hours ? `${data[i].experience_in_hours}+ hours taught` : '5000+ hours taught',
            deeplink: data[i].demo_qid ? `doubtnutapp://video_dialog?question_id=${data[i].demo_qid}&orientation=landscape&page=WHATS_NEW_HOME` : '',
        });
    }
    return {
        type: 'course_teachers',
        data: {
            title: locale === 'hi' ? 'हमारे टीचर ' : 'Our Teachers',
            items,
        },
    };
}

async function getBuyButton(db, variantAttachment, assortmentId, versionCode, locale, assortmentType, gotCoupon, source, subAssortmentType) {
    const promises = [];
    if (variantAttachment[assortmentId].is_emi) {
        promises.push(Package.getVariantInfo(db.mysql.read, variantAttachment[assortmentId].package_variant));
        promises.push(Package.getVariantInfo(db.mysql.read, variantAttachment[assortmentId].emi_variant));
        promises.push(Package.getChildPackagesFromVariant(db.mysql.read, variantAttachment[assortmentId].emi_variant));
    } else {
        promises.push(Package.getVariantInfo(db.mysql.read, variantAttachment[assortmentId].package_variant));
    }
    const [
        packageDetails,
        emiDetails,
        childpackages,
    ] = await Promise.all(promises);

    let pointers = '';
    if (packageDetails[0] && packageDetails[0].description) {
        pointers = packageDetails[0].description.split('|').join('\n');
    }
    pointers = `${pointers}\nValidity - ${packageDetails[0].duration_in_days} days`;
    const priceObj = variantAttachment[assortmentId];
    const obj = {
        id: packageDetails[0].id,
        type: 'default',
        title: packageDetails[0].name,
        description: pointers,
        amount_to_pay: locale === 'hi' ? `₹${numberWithCommas(priceObj.monthly_price)}/Mo से शुरू` : `From ₹${numberWithCommas(priceObj.monthly_price)}/Mo`,
        amount_strike_through: '',
        know_more_text: '',
        amount_saving: '',
        // pay_text: (locale === 'hi') ? 'अभी खरीदें' : 'Buy Now',
        pay_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
        upfront_variant: variantAttachment[assortmentId].package_variant,
        deeplink: `doubtnutapp://vip?variant_id=${variantAttachment[assortmentId].package_variant}`,
    };
    if (subAssortmentType === 'mock_test') {
        obj.amount_to_pay = `₹${numberWithCommas(priceObj.display_price)}`;
    }
    if (assortmentId === 138829) {
        obj.pay_text = (locale === 'hi') ? 'कोटा क्लासेज का पूरा पैक अभी खरीदें' : 'Khareedo Kota classes ka full access';
    }
    if (variantAttachment[assortmentId].multiple && versionCode > 795 && !gotCoupon) {
        obj.multiple_package = false;
        if (versionCode < 861 || assortmentType !== 'course') {
            obj.deeplink = `doubtnutapp://vip?assortment_id=${assortmentId}`;
        } else {
            obj.deeplink = `doubtnutapp://bundle_dialog?id=${assortmentId}${typeof source !== 'undefined' ? `&source=${source}` : ''}`;
        }
        obj.pay_installment_text = (locale === 'hi') ? 'कोर्स प्लान चुनें' : 'Select Course Plan';
    }
    if (variantAttachment[assortmentId].is_emi) {
        obj.type = 'emi';
        obj.pay_installment_text = (locale === 'hi') ? 'किश्तों में भुगतान करें' : 'Pay in Installments';
        obj.know_more_text = locale === 'hi' ? 'और जानें' : 'Know More';
        obj.emi_variant = childpackages[0].id;
        obj.installment_deeplink = `doubtnutapp://vip?variant_id=${obj.emi_variant}`;
        obj.emi = createEmiObject(childpackages, emiDetails, locale);
    } else {
        obj.title = locale === 'hi' ? 'पूरा कोर्स उपलब्ध है मात्र' : 'Full Course Available at just';
    }
    return obj;
}

function getCategoryByStudentCCM(studentCcmData) {
    let finalCategory = null;
    let priority = 10000;
    for (let i = 0; i < studentCcmData.length; i++) {
        const examCategory = liveclassData.examCategoryMapping[studentCcmData[i].course];
        const examPriority = liveclassData.categoryPriority[examCategory] || 1;
        if (examCategory) {
            studentCcmData[i].category = examCategory;
        }
        if (examPriority < priority) {
            finalCategory = examCategory;
            priority = examPriority;
        }
    }
    return finalCategory;
}

async function getAssortmentByCategory(db, studentCcmData, studentClass, locale, assortmentID = '') {
    let defaultCategory = +studentClass === 14 ? 'SSC GD' : 'CBSE Boards';
    if (+studentClass === 14) {
        const fixedAssorment = 495273;
        return fixedAssorment;
    }
    if (+studentClass === 13) {
        defaultCategory = 'IIT JEE';
    }
    let category = getCategoryByStudentCCM(studentCcmData) || defaultCategory;
    if (category !== 'State Boards' && _.includes([6, 7, 8], parseInt(studentClass))) {
        category = 'CBSE Boards';
    }
    if (assortmentID.split('_')[2]) {
        category = assortmentID.split('_')[2];
    }
    let categoryAssortments = await CourseMysqlv2.getCoursesList(db.mysql.read, category, studentClass);
    categoryAssortments = categoryAssortments.filter((assortmentItem) => assortmentItem.assortment_id !== 138829 && assortmentItem.sub_assortment_type !== 'mock_test' && assortmentItem.assortment_id !== 268724);
    if (!categoryAssortments.length) {
        categoryAssortments = await CourseMysqlv2.getCoursesList(db.mysql.read, defaultCategory, studentClass);
    }
    let categoryAssortmentsByLocale = [];
    if (locale === 'hi') {
        categoryAssortmentsByLocale = categoryAssortments.filter((e) => e.meta_info === 'HINDI');
    } else {
        categoryAssortmentsByLocale = categoryAssortments.filter((e) => e.meta_info === 'ENGLISH');
    }
    categoryAssortments = categoryAssortmentsByLocale.length ? categoryAssortmentsByLocale : categoryAssortments;
    return categoryAssortments[0].assortment_id;
}

async function getTopicsData(db, data) {
    const topics = [];
    const promises = [];
    for (let i = 0; i < data.length; i++) {
        promises.push(CourseContainerv2.getChapterAssortment(db, data[i].assortment_id));
    }
    const chapterAssortment = await Promise.all(promises);
    for (let i = 0; i < data.length; i++) {
        const obj = generateTopicObject(data[i], true);
        obj.assortment_id = data[i].assortment_id;
        obj.deeplink = `doubtnutapp://course_details?id=${chapterAssortment[i][0].assortment_id}`;
        topics.push(obj);
    }
    return topics;
}

async function getCoursePageResponse({
    db,
    config,
    data,
    title,
    assortmentPriceMapping,
    studentPackageAssortments,
    locale,
    versionCode,
    paymentCardState,
}) {
    const promises = [];
    // console.log(data)
    for (let i = 0; i < data.length; i++) {
        if (data[i].is_replay !== 1) {
            if (studentPackageAssortments.length && studentPackageAssortments.indexOf(data[i].assortment_id) >= 0) {
                paymentCardState.isVip = true;
            }
            data[i].is_active = data[i].stream_status;
            if (!data[i].assortment_id) {
                data[i].assortment_id = data[i].video_assortment;
            }
            promises.push(generateResourceVideoViewData({
                db,
                paymentCardState,
                config,
                result: data[i],
                setWidth: true,
                assortmentPriceMapping,
                masterAssortment: '',
                page: 'COURSE_DETAIL',
                locale,
                versionCode,
            }));
        }
    }
    let items = await Promise.all(promises);
    items = items.filter((e) => e !== 0);
    const obj = {};
    obj.type = 'widget_parent';
    obj.data = {
        title,
        items,
    };
    return obj;
}

// eslint-disable-next-line no-unused-vars
function getTrialWidget(assortmentId, active, endTime, deeplink, studentClass, locale) {
    let data;
    if (active) {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const rem = moment.duration(moment(endTime).diff(now)).asHours();
        let mins = 0;
        if (rem < 1) {
            mins = moment.duration(moment(endTime).diff(now)).asMinutes();
        }
        data = {
            timer: locale === 'hi' ? `ट्रायल के ${mins > 0 ? Math.round(mins) : Math.round(rem)} ${mins > 0 ? 'मिनट' : 'घंटे'} बाकी है` : `${mins > 0 ? Math.round(mins) : Math.round(rem)} ${mins > 0 ? 'mins' : 'hr'} Remaining in Trial`,
        };
    } else {
        data = {
            state: 'inactive',
            call: {
                text: locale === 'hi' ? 'हमें कॉल करें' : 'Call Us',
                number: '01247158250',
            },
            trial: {
                text: locale === 'hi' ? 'मुफ्त ट्रायल लें' : 'Get Free Trial',
                assortment_id: assortmentId,
            },
        };
        if (deeplink) {
            data.trial.text = locale === 'hi' ? 'अभी खरीदें' : 'Buy Now';
            data.trial.deeplink = deeplink;
        }
    }
    const obj = {
        type: 'activate_trial_widget',
        data,
    };
    return obj;
}

async function getRelatedLectures(data, config, studentPackageAssortments, studentEmiPackageAssortments, db, studentID, play, flagrResponse, versionCode, paymentState) {
    const lectures = [];
    const assortmentList = [];
    data.forEach((item) => { if (item.assortment_id) { assortmentList.push(item.assortment_id); } });
    let variantsList = [];
    if (assortmentList.length) {
        variantsList = await Package.getDefaultVariantFromAssortmentId(db.mysql.read, assortmentList);
    }
    for (let i = 0; i < data.length; i++) {
        const paymentCardState = {
            isVip: studentPackageAssortments.indexOf(data[i].assortment_id) >= 0 || paymentState.isVip,
            emiDialog: studentEmiPackageAssortments.indexOf(data[i].assortment_id) >= 0,
        };
        if (data[i].is_active) {
            data[i].is_active = data[i].is_active === 'ACTIVE' ? 1 : 0;
        }
        const variant = variantsList.filter((e) => e.assortment_id == data[i].assortment_id);
        data[i].variant_id = variant.length ? variant[0].variant_id : null;
        const o = {};
        o.id = data[i].resource_reference;
        o.assortment_id = data[i].assortment_id;
        o.live_text_bg = '#cedeff';
        o.live_date = data[i].live_at ? moment(data[i].live_at).format('Do MMM') : '';
        o.is_premium = (data[i].is_free == 0);
        o.is_vip = paymentCardState.isVip;
        o.purchased_assortment = studentPackageAssortments[0];
        o.show_emi_dialog = paymentCardState.emiDialog;
        o.payment_deeplink = getPaymentDeeplink(flagrResponse, data[i]);
        if (data[i].parent === 4) {
            o.payment_deeplink = versionCode >= 861 ? 'doubtnutapp://bundle_dialog?id=138829&source=COURSE_DETAIL' : 'doubtnutapp://vip?assortment_id=138829';
        }
        const payDetails = {
            page_ref: 'detail',
        };
        o.payment_details = JSON.stringify(payDetails);
        if (data[i].resource_type == 9) {
            const mockTestDetails = await StructuredCourse.getMockTestDetails(data[i].resource_reference, studentID, db.mysql.read);
            o.subject = 'TEST';
            o.subject_color = LiveclassHelper.getBarColorHomepage(o.subject);
            o.image_url = `${config.staticCDN}liveclass/Exam_upcoming_3x.png`;
            o.type = 'mock-test';
            o.title = `${mockTestDetails[0].no_of_questions} Questions`;
            o.link = 'Start Exam';
            o.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
            o.state = o.is_live ? 1 : 0;
            o.live_at = moment(data[i].live_at).unix() * 1000;
            o.is_last_resource = play;
            data[i].duration = parseInt(mockTestDetails[0].duration_in_min) * 60;
        } else {
            o.image_url = `${config.staticCDN}liveclass/Play_Button.png`;
            o.subject = data[i].subject;
            o.subject_color = LiveclassHelper.getBarColorHomepage(o.subject);
            o.title = data[i].display;
            const faculty = data[i].mapped_faculty_name ? `by ${data[i].mapped_faculty_name}` : '';
            const degree = data[i].degree ? `, ${data[i].degree}` : '';
            o.subtitle = `${faculty}${degree}`;
            o.topics = `Topics: ${data[i].topic}`;
            o.is_live = !!data[i].is_active;
            o.live_at = moment(data[i].live_at).unix() * 1000;
            o.type = 'lecture';
            o.resource_reference = data[i].resource_reference;
            o.player_type = data[i].player_type ? data[i].player_type : 'video';
            o.is_last_resource = play;
            if (!play) {
                o.deeplink = `doubtnutapp://resource?id=${data[i].detail_id}&recorded=0`;
            }
            o.page = 'COURSE_RESOURCE';
            o.past = true;
            o.state = 2;
            const hr = Math.floor(data[i].duration / 3600);
            const mins = Math.floor((data[i].duration % 3600) / 60);
            o.duration = data[i].duration ? `${hr > 0 ? `${hr} hr` : ''}${mins > 0 ? `${mins} mins` : ''}` : '';
            if (data[i].resource_type === 4 && data[i].player_type === 'liveclass') {
                o.is_live = data[i].is_active === 0 && moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
                if (data[i].is_active === 1) {
                    o.is_live = true;
                    o.past = false;
                    o.topics = 'Now Playing';
                }
            }
            if (o.is_premium && data[i].vdo_cipher_id && data[i].is_vdo_ready === 2 && o.is_vip) {
                o.is_downloadable = true;
            }
            if (data[i].resource_type == 1 && data[i].player_type === 'livevideo') {
                if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at) && data[i].is_active) {
                    o.is_live = true;
                    o.state = 1;
                } else if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at) && !data[i].is_active) {
                    o.is_live = false;
                    o.player_type = 'video';
                }
            }
            if (data[i].resource_type === 1 && data[i].player_type === 'youtube' && !_.isNull(data[i].meta_info)) {
                o.id = data[i].meta_info;
                o.player_type = 'video';
            }

            if (moment().add(5, 'hours').add(30, 'minutes').isBefore(data[i].live_at)) {
                o.state = 0;
                o.image_url = `${config.staticCDN}liveclass/Play_Grey.png`;
                o.live_text = LiveclassHelper.getLiveclassStatus(data[i].live_at);
                o.reminderLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${data[i].topic}&dates=${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').format('YYYYMMDDTHHmmSS')}Z/${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').add(1, 'hours')
                    .format('YYYYMMDDTHHmmSS')}Z&sf=true&output=xml`;
                o.duration = '';
                o.live_date = '';
            }
        }
        if (!(data[i].resource_type === 4 && !data[i].is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at))) {
            lectures.push(o);
        }
    }
    return lectures;
}

async function getBanners(db, assortmentId, bannerArray, isVip, batchID) {
    const banners = await CourseMysqlv2.getBanners(db.mysql.read, assortmentId, batchID, isVip ? 'promo_post' : 'promo');
    for (let j = 0; j < banners.length; j++) {
        const deeplink = isVip ? banners[j].action_data : banners[j].prepurchase_action_data;
        bannerArray.push({
            id: `course_details_banners_${banners[j].id}`,
            image_url: banners[j].image_url,
            deeplink: deeplink || '',
        });
    }
    return bannerArray;
}

function getExplainerDeeplinkUsingLocale(locale, page) {
    if (locale == 'en') {
        return `doubtnutapp://video_dialog?question_id=643551500&orientation=portrait&page=${page}`;
    }
    return `doubtnutapp://video_dialog?question_id=643551485&orientation=portrait&page=${page}`;
}

async function setPostPurchaseExplainerVideo(db, studentID, sps_start_date, locale, page, assortmentID) {
    if (moment().diff(moment(sps_start_date), 'days') <= 30) {
        // get redisKey
        const res = await CourseRedisv2.getPostPurchaseExplainer(db.redis.read, studentID);
        if (_.isNull(res)) {
            // set the redis key, this is the first time student has come to this page after buying the course
            const explainerArray = { [assortmentID]: [moment().format('YYYY-MM-DD')] };
            await CourseRedisv2.setPostPurchaseExplainer(db.redis.write, studentID, explainerArray);
            return getExplainerDeeplinkUsingLocale(locale, page);
        }
        const response = JSON.parse(res);
        // * Check if the response is array, then handle old case
        if (_.isArray(response)) {
            if (response.length < 2 && response[0] != moment().format('YYYY-MM-DD')) {
                response.push(moment().format('YYYY-MM-DD'));
                await CourseRedisv2.setPostPurchaseExplainer(db.redis.write, studentID, response);
                return getExplainerDeeplinkUsingLocale(locale, page);
            }
        }
        if (!_.has(response, assortmentID) && !_.isArray(response)) {
            const explainerArray = {
                ...response,
                [assortmentID]: [moment().format('YYYY-MM-DD')],
            };
            await CourseRedisv2.setPostPurchaseExplainer(db.redis.write, studentID, explainerArray);
            return getExplainerDeeplinkUsingLocale(locale, page);
        }
        if (!_.isArray(response) && response[assortmentID] && response[assortmentID].length < 2) {
            if (response[assortmentID][0] != moment().format('YYYY-MM-DD')) {
                response[assortmentID].push(moment().format('YYYY-MM-DD'));
                await CourseRedisv2.setPostPurchaseExplainer(db.redis.write, studentID, response);
                return getExplainerDeeplinkUsingLocale(locale, page);
            }
        }
    }
    return 0;
}

async function setPlaylistOfUserForEtoos(db, studentID, assortmentID) {
    try {
        const res = await CourseRedisv2.getPlaylistForEtoos(db.redis.read, studentID);
        if (!_.isNull(res)) {
            const assortmentArray = JSON.parse(res);
            if (assortmentArray.length > 10) {
                assortmentArray.splice(0, 1);
            }
            assortmentArray.push(assortmentID);
            await CourseRedisv2.setPlaylistForEtoos(db.redis.write, studentID, assortmentArray);
        } else {
            await CourseRedisv2.setPlaylistForEtoos(db.redis.write, studentID, [assortmentID]);
        }
    } catch (e) {
        throw new Error(e);
    }
}

async function getAssortmentListByCCM(db, assortmentList, studentID, studentCcmData) {
    let assortmentIds = [];
    if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
        assortmentIds = assortmentList.iit.split('|');
    } else if (_.find(studentCcmData, ['category', 'NEET'])) {
        assortmentIds = assortmentList.neet.split('|');
    }
    return assortmentIds;
}

async function getEtoosFacultyByCCM(db, assortmentList, studentID, studentClass, studentCcmData) {
    const assortmentIds = await getAssortmentListByCCM(db, assortmentList, studentID, studentCcmData);
    if (!assortmentIds.length) {
        return { facultyGridData: [] };
    }
    const carouselID = assortmentIds.join('|') == assortmentList.iit ? 10001 : 10000;
    const data = await CourseContainerv2.getAssortmentDataForExploreCarousel(db, assortmentIds, studentClass, carouselID);
    const category = carouselID === 10001 ? 'JEE' : 'NEET';
    return { facultyGridData: data, category };
}

async function getDemoVideosForEtoosFacultyCourse(db, assortmentList, studentID, studentClass, studentCcmData) {
    const data = await getAssortmentListByCCM(db, assortmentList, studentID, studentCcmData);
    if (!data.length) {
        return { tabs: [] };
    }
    const category = data.join('|') == assortmentList.iit ? 'JEE' : 'NEET';
    const promises = [];
    for (let i = 0; i < data.length; i++) {
        promises.push(CourseContainerv2.getFreeResourceDetailsFromAssortmentId(db, data[i], studentClass, 0));
    }
    const resolvedPromises = await Promise.all(promises);
    const groupedData = {};
    for (let i = 0; i < data.length; i++) {
        groupedData[data[i]] = resolvedPromises[i];
    }
    const tabs = [];
    for (const key in groupedData) {
        if (groupedData[key]) {
            tabs.push({
                key: `${key}`,
                title: groupedData[key][0].nickname || groupedData[key][0].expert_name || '',
                is_selected: false,
            });
        }
    }
    if (tabs.length) {
        tabs[0].is_selected = true;
    }
    return { demoVideos: groupedData, tabs, category };
}

async function getStudentProgress(db, studentProgress, courseDetail, batchID) {
    let total = 0;
    let resources = [];
    if (courseDetail.assortment_type === 'resource_video') {
        total = 1;
    }
    if (courseDetail.assortment_type === 'resource_pdf') {
        total = 1;
    }
    if (courseDetail.assortment_type === 'resource_test') {
        total = 1;
    }
    if (courseDetail.assortment_type === 'chapter') {
        resources = await CourseMysqlv2.getResourcesCountFromChapterAssortment(db.mysql.read, courseDetail.assortment_id, batchID);
    }
    if (courseDetail.assortment_type === 'subject') {
        resources = await CourseMysqlv2.getResourcesCountFromSubjectAssortment(db.mysql.read, courseDetail.assortment_id, batchID);
    }
    if (courseDetail.assortment_type === 'course') {
        resources = await CourseContainerv2.getResourcesCountFromCourseAssortment(db, courseDetail.assortment_id, batchID);
    }
    for (let i = 0; i < resources.length; i++) {
        if (resources[i] && resources[i].count) {
            total += resources[i].count;
        }
    }
    let progress = 0;
    if (studentProgress.length) {
        progress = (studentProgress[0].total_count / total) > 1 ? 1 : studentProgress[0].total_count / total;
    }

    return progress;
}

async function getCoursePsudoSchedule({
    db,
    assortmentId,
    batchId,
    subject,
    courseDetail,
    locale,
}) {
    let courseAssortment = assortmentId;
    if (courseDetail.assortment_type === 'subject') {
        const parentMappings = await CourseMysqlv2.getAllParentAssortments(db.mysql.read, [courseAssortment]);
        courseAssortment = parentMappings.length ? parentMappings[0].assortment_id : courseAssortment;
        subject = courseDetail.display_name;
    }
    const courseSchedule = await CourseMysqlv2.getCourseSchedule(db.mysql.read, courseAssortment, subject, batchId || 1);
    const courseScheduleWithoutSubjects = await CourseMysqlv2.getCourseSchedule(db.mysql.read, courseAssortment, '', batchId || 1);
    const coursePsudoSchedule = [];
    const subjects = _.chain(courseScheduleWithoutSubjects)
        .groupBy('subject')
        .map((_value, key) => key)
        .value();
    const subReturn = subjects.map((subjectItem) => ({
        filter_id: subjectItem,
        text: locale === 'hi' && Data.subjectHindi[subjectItem.toUpperCase()] ? Data.subjectHindi[subjectItem.toUpperCase()] : subjectItem.toUpperCase(),
        color: LiveclassHelper.getBarColorForLiveclassHomepage(subjectItem.toUpperCase()),
        is_selected: subject === subjectItem.display_name,
    }));

    if (courseSchedule.length) {
        const courseStartDate = courseSchedule[0].batch_start_date ? moment(courseSchedule[0].batch_start_date).format('YYYY-MM-DD') : moment(courseDetail.start_date).format('YYYY-MM-DD');
        const courseEndDate = courseSchedule[0].batch_end_date ? moment(courseSchedule[0].batch_end_date).format('YYYY-MM-DD') : moment(courseDetail.end_date).format('YYYY-MM-DD');
        const current = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        // const current = moment();

        let daysToFill = 30;
        const courseScheduleGrouped = _.groupBy(courseSchedule, 'week_day');

        while (daysToFill > 0) {
            let live_at = moment(current).add(30 - daysToFill, 'day');
            const weekdayName = live_at.format('dddd').toUpperCase();
            if (courseScheduleGrouped[weekdayName]) {
                courseScheduleGrouped[weekdayName].forEach((schedule) => {
                    const time = moment(schedule.schedule_time, 'HH:mm:ss');
                    live_at = moment(live_at).set({
                        hour: time.get('hour'),
                        minute: time.get('minute'),
                        second: time.get('second'),
                    });
                    if (moment(current).add(15, 'min').isBefore(live_at) && moment(live_at).isAfter(courseStartDate) && moment(live_at).isBefore(courseEndDate)) {
                        coursePsudoSchedule.push({
                            live_at: live_at.format('YYYY-MM-DD HH:mm:ss'),
                            assortment_id: schedule.assortment_id,
                            course_resource_id: null,
                            assortment_type: 'resource',
                            is_free: 0,
                            id: null,
                            display: schedule.subject_display_name,
                            resource_type: 1,
                            resource_reference: '',
                            subject: schedule.subject,
                            player_type: 'liveclass',
                            title: schedule.subject,
                            description: schedule.subject,
                            is_active: null,
                            image_bg_liveclass: null,
                            resource_reference_id: '',
                            is_vdo_ready: 0,
                            vdo_cipher_id: null,
                            question_id: null,
                            is_view: null,
                            duration_in_min: null,
                            no_of_questions: null,
                            test_id: null,
                            test_title: null,
                            status: null,
                            completed_at: null,
                            week: live_at.day() + 1,
                            day: live_at.date(),
                            month: live_at.month() + 1,
                            year: live_at.year(),
                            class_duration: schedule.class_duration,
                        });
                    }
                });
            }
            daysToFill--;
        }
    }

    return {
        coursePsudoSchedule,
        subjectList: {
            type: 'subject_filters',
            data: {
                items: subReturn,
            },
            extra_params: {
                page_type: 'upcoming',
            },
        },
    };
}

async function getUserCoursesCarousel(data) {
    const {
        db,
        studentId,
        studentClass,
        studentLocale,
        studentCourseOrClassSubcriptionDetails,
        versionCode,
        setWidth,
        category,
        config,
        coursePage,
    } = data;
    let { assortmentDetails, caraouselData } = data;
    try {
        const currentTime = moment().add(5, 'hours').add(30, 'minutes');
        const userAssortments = studentCourseOrClassSubcriptionDetails.map((item) => item.assortment_id);
        // * Mapping of assortment to payment state
        const userAssortmentPaymentState = studentCourseOrClassSubcriptionDetails.reduce((acc, item) => ({
            ...acc,
            [item.assortment_id]: {
                isTrial: item.amount === -1,
                isVip: true, // item.amount !== -1,
                timeLeft: moment(item.end_date).diff(new Date(), 'hours'),
                isExpired: currentTime.isAfter(moment(item.end_date)),
                end_time: item.end_date,
            },
        }), {});
        if (_.isEmpty(caraouselData)) {
            caraouselData = {
                is_cod_carousel: false,
            };
        }
        if (!assortmentDetails && !caraouselData.is_cod_carousel) {
            assortmentDetails = versionCode > 872 && +studentClass !== 14 && coursePage === 'HOMEPAGE_V1' ? await CourseMysqlv2.getAssortmentDetailsFromIdWithCourseThumbnails(db.mysql.read, userAssortments, 'widget_popular_course', versionCode) : await CourseMysqlv2.getAssortmentDetailsFromIdForMyCoursesCarousel(db.mysql.read, userAssortments);
        }
        const promises = [];
        if (assortmentDetails) {
            for (let i = 0; i < assortmentDetails.length; i++) {
                let paymentCardState;
                if (versionCode <= 872) {
                    paymentCardState = {
                        isVip: true,
                    };
                } else {
                    paymentCardState = userAssortmentPaymentState[assortmentDetails[i].assortment_id];
                }
                if (!_.isUndefined(paymentCardState.timeLeft) && paymentCardState.timeLeft >= -72) {
                    const subscriptionDetails = _.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', assortmentDetails[i].assortment_id]);
                    assortmentDetails[i].subscription_start_date = subscriptionDetails.start_date;
                    assortmentDetails[i].subscription_end_date = subscriptionDetails.end_date;
                    if (versionCode >= 893 && (coursePage === 'MY_COURSES' || coursePage === 'MY_COURSES_EXPLORE')) {
                        let widgetMyCoursesDetails = await CourseRedisv2.getWidgetMyCoursesDetails(db.redis.read, studentId, assortmentDetails[i].assortment_id);
                        if (widgetMyCoursesDetails) {
                            widgetMyCoursesDetails = JSON.parse(widgetMyCoursesDetails);
                            assortmentDetails[i].assortment_progress = widgetMyCoursesDetails.assortment_progress;
                            assortmentDetails[i].upcoming_classes = widgetMyCoursesDetails.upcoming_classes;
                            assortmentDetails[i].missed_homework_count = widgetMyCoursesDetails.missed_homework_count;
                            assortmentDetails[i].missed_tests_count = widgetMyCoursesDetails.missed_tests_count;
                        } else {
                            const isVod = assortmentDetails[i].course_id !== null;
                            const chapterList = isVod ? await CourseContainerv2.getChapterListOfAssortmentVodWithoutOffset(db, assortmentDetails[i].assortment_id) : await CourseContainerv2.getChapterListOfAssortmentWithoutOffset(db, assortmentDetails[i].assortment_id);
                            const chapterAssortmentList = [];
                            chapterList.map((item) => chapterAssortmentList.push(item.course_resource_id));
                            const assortmentProgress = await CourseContainerv2.getStudentAssortmentProgress(db, studentId, assortmentDetails[i].assortment_id);
                            const { coursePsudoSchedule: upcomingClasses } = await getCoursePsudoSchedule({
                                db,
                                assortmentId: assortmentDetails[i].assortment_id,
                                batchId: subscriptionDetails.batch_id,
                                courseDetail: assortmentDetails[i],
                                locale: studentLocale,
                            });
                            let homework = [];
                            let previousTests = [];
                            const filterUpcomingClasses = upcomingClasses
                                .filter((upcomingClass) => moment(upcomingClass.live_at) > currentTime && moment(upcomingClass.live_at).diff(currentTime, 'days') < 2)
                                .sort((upcomingClass1, upcomingClass2) => moment(upcomingClass1.live_at).diff(moment(upcomingClass2.live_at)));
                            if (!filterUpcomingClasses.length) {
                                previousTests = await getCourseDataByCardId({
                                    db,
                                    cardID: 'missed_tests',
                                    studentID: studentId,
                                    batchID: subscriptionDetails.batch_id,
                                    courseDetail: [assortmentDetails[i]],
                                    chapterAssortmentList,
                                    assortmentId: assortmentDetails[i].assortment_id,
                                });
                                if (!previousTests.length) {
                                    homework = await getCourseDataByCardId({
                                        db,
                                        cardID: 'homework',
                                        studentID: studentId,
                                        batchID: subscriptionDetails.batch_id,
                                        courseDetail: [assortmentDetails[i]],
                                    });
                                    homework = homework === -1 ? [] : homework;
                                }
                            }
                            const missedHomeworkCount = homework.filter((homeworkItem) => homeworkItem.status === 0);
                            assortmentDetails[i].assortment_progress = await getStudentProgress(db, assortmentProgress, assortmentDetails[i], subscriptionDetails.batch_id);
                            assortmentDetails[i].upcoming_classes = filterUpcomingClasses;
                            assortmentDetails[i].missed_homework_count = missedHomeworkCount.length;
                            assortmentDetails[i].missed_tests_count = previousTests.length;
                            const upcomingClassesObj = filterUpcomingClasses.length ? filterUpcomingClasses.map((item) => ({
                                live_at: item.live_at,
                                subject: item.subject,
                                class_duration: item.class_duration,
                            })) : filterUpcomingClasses;
                            const widgetMyCoursesDetailsCache = {
                                assortment_progress: assortmentDetails[i].assortment_progress,
                                upcoming_classes: upcomingClassesObj,
                                missed_homework_count: assortmentDetails[i].missed_homework_count,
                                missed_tests_count: assortmentDetails[i].missed_tests_count,
                            };
                            await CourseRedisv2.setWidgetMyCoursesDetails(db.redis.write, studentId, assortmentDetails[i].assortment_id, widgetMyCoursesDetailsCache);
                        }
                    }
                    promises.push(generateAssortmentObject({
                        data: assortmentDetails[i],
                        config,
                        paymentCardState,
                        assortmentPriceMapping: {},
                        db,
                        setWidth,
                        versionCode,
                        assortmentFlagrResponse: {},
                        locale: studentLocale,
                        category,
                        page: coursePage || 'HOMEPAGE',
                        studentId,
                    }));
                }
            }
        }
        let items = await Promise.all(promises);
        items = items.filter((e) => e !== 0);

        // COD Order Tracking Widget
        let CODWidgetDetails;
        if (versionCode >= 913) {
            const shiprocketOrderInfo = await CourseMysqlv2.getActiveShiprocketOrderInfoByStudentId(db.mysql.read, studentId);
            // console.log(shiprocketOrderInfo);
            if (shiprocketOrderInfo.length) {
                const json_payload = {
                    course_name: '', coupon_code: '', variant_id: shiprocketOrderInfo[0].variant_id, mobile: '', version_code: versionCode, show_activation: ['DELIVERED'].includes(shiprocketOrderInfo[0].order_staus) ? 1 : 0, locale: studentLocale,
                };
                const batch = getStudentBatch(shiprocketOrderInfo[0].year_exam);
                let sub_title;
                if (batch) {
                    sub_title = `${batch} ${studentLocale === 'hi' ? 'बैच' : 'batch'}`;
                }
                const widgetDetials = {
                    title: shiprocketOrderInfo[0].display_name,
                    deeplink: `doubtnutapp://action_web_view?url=https://api.doubtnut.com/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=${data.xAuthToken}`,
                    assortment_id: shiprocketOrderInfo[0].assortment_id,
                    title_color: '#273de9',
                    title_size: '19',
                    sub_title,
                    sub_title_color: '#504949',
                    sub_title_size: '14',
                    // eslint-disable-next-line no-nested-ternary
                    bullet_point: ['UNDELIVERED', 'OUT FOR DELIVERY'].includes(shiprocketOrderInfo[0].order_status) ? UtilityTranslate.translate(shiprocketOrderInfo[0].order_status, studentLocale, PaymentConstants) : ['DELIVERED'].includes(shiprocketOrderInfo[0].order_status) ? UtilityTranslate.translate('Course Activation Pending', studentLocale, PaymentConstants) : UtilityTranslate.translate('TRACK MY ORDER', studentLocale, PaymentConstants),
                    bullet_point_color: '#eb532c',
                    bullet_point_size: '14',
                    progress: '',
                    progress_color: '#fafafa',
                    progress_size: '12',
                };
                CODWidgetDetails = widgetDetials;

                if (shiprocketOrderInfo[0].assortment_type === 'subject') {
                    CODWidgetDetails.title = shiprocketOrderInfo[0].display_description;
                } else if (shiprocketOrderInfo[0].assortment_type !== 'course' && shiprocketOrderInfo[0].assortment_type !== 'class') {
                    if (shiprocketOrderInfo[0].meta_info === 'ENGLISH') {
                        CODWidgetDetails.title = `${CODWidgetDetails.title} for ${shiprocketOrderInfo[0].category}`;
                    } else if (shiprocketOrderInfo[0].meta_info === 'HINDI' && shiprocketOrderInfo[0].assortment_type === 'subject') {
                        CODWidgetDetails.title = `${Data.categoriesHindi[shiprocketOrderInfo[0].category] || shiprocketOrderInfo[0].category} के लिए ${Data.subjectHindi[CODWidgetDetails.title] || CODWidgetDetails.title}`;
                    } else if (shiprocketOrderInfo[0].meta_info === 'HINDI') {
                        CODWidgetDetails.title = `${Data.categoriesHindi[shiprocketOrderInfo[0].category] || shiprocketOrderInfo[0].category} के लिए ${CODWidgetDetails.title}`;
                    }
                }
                _.remove(items, (n) => n.assortment_id == CODWidgetDetails.assortment_id && n.title == CODWidgetDetails.title);
                items.push(CODWidgetDetails);
            }
        }
        return items;
    } catch (e) {
        console.log(e);
    }
}

async function getFiltersForCategoryPage({
    db,
    locale,
    category,
    filters = [],
    studentClass,
    isBrowser,
}) {
    const classFilterData = [6, 7, 8, 9, 10, 11, 12, 13, 14];
    const isMultiSelect = !!isBrowser;
    const categoryItems = [];
    const mediumItems = [];
    const classItems = [];
    const yearItems = [];
    let filterClass = null;
    let currentClassIndex = -1;
    let currentCategoryIndex = -1;
    let class12Index = -1;
    for (let i = 0; i < classFilterData.length; i++) {
        if (filters.indexOf(classFilterData[i].toString()) >= 0) {
            filterClass = classFilterData[i];
        }
        currentClassIndex = classFilterData[i] === +studentClass ? i : currentClassIndex;
        if (classFilterData[i] === 12) {
            class12Index = i;
        }
        const classText = classFilterData[i] === 14 ? `${locale === 'hi' ? 'सरकारी परीक्षा' : 'Govt. Exams'}` : `${locale === 'hi' ? 'ड्रॉपर' : 'Dropper'}`;
        classItems.push({
            filter_id: classFilterData[i],
            text: classFilterData[i] === 14 || classFilterData[i] === 13 ? classText : `${locale === 'hi' ? 'कक्षा' : 'Class'} ${classFilterData[i]}`,
            is_selected: (filters.indexOf(classFilterData[i].toString()) >= 0),
        });
    }
    if (!filterClass && classItems[currentClassIndex] && !isBrowser) {
        classItems[currentClassIndex].is_selected = true;
    }
    if (!filterClass && isBrowser && classItems[class12Index]) {
        classItems[class12Index].is_selected = true;
    }
    filterClass = filterClass || (isBrowser ? 12 : studentClass);
    const categoryAndMediumData = await CourseContainerv2.getFiltersFromCourseDetails(db, filterClass);
    // added _CT for category_type values to differentiate from category values
    let filterCategory = null;
    for (let i = 0; i < categoryAndMediumData.length; i++) {
        currentCategoryIndex = category === categoryAndMediumData[i].category ? i : currentCategoryIndex;
        if (filters.indexOf(categoryAndMediumData[i].category) >= 0 || isBrowser) {
            filterCategory = categoryAndMediumData[i].category;
            if (!_.find(yearItems, ['filter_id', categoryAndMediumData[i].year_exam])) {
                yearItems.push({
                    filter_id: categoryAndMediumData[i].year_exam,
                    text: `${categoryAndMediumData[i].year_exam}`,
                    is_selected: filters.indexOf(categoryAndMediumData[i].year_exam.toString()) >= 0,
                });
            }
            if (!_.find(mediumItems, ['filter_id', `${categoryAndMediumData[i].meta_info} Med`])) {
                mediumItems.push({
                    filter_id: `${categoryAndMediumData[i].meta_info} Med`,
                    text: Data.getCourseMediumByLocale(locale)[categoryAndMediumData[i].meta_info] || categoryAndMediumData[i].meta_info,
                    is_selected: filters.indexOf(`${categoryAndMediumData[i].meta_info} Med`) >= 0,
                });
            }
        }
        if (!_.find(categoryItems, ['filter_id', categoryAndMediumData[i].category])) {
            categoryItems.push({
                filter_id: categoryAndMediumData[i].category,
                text: categoryAndMediumData[i].category.split('_')[0],
                is_selected: filters.indexOf(categoryAndMediumData[i].category) >= 0,
            });
        }
    }
    if (!filterCategory && !isBrowser) {
        let isClassAddedInFilters = false;
        const classArray = ['6', '7', '8', '9', '10', '11', '12', '13', '14'];
        filters.forEach((e) => {
            if (classArray.indexOf(e) > -1) {
                isClassAddedInFilters = true;
            }
        });
        let defaultSingleCategory = (+studentClass === 14 && !isClassAddedInFilters) || filters.indexOf('14') > -1 ? ['UPTET_CT'] : ['CBSE Boards'];
        if ((+studentClass === 13 && !isClassAddedInFilters) || filters.indexOf('13') > -1) {
            defaultSingleCategory = ['IIT JEE_CT'];
        }
        filterCategory = currentCategoryIndex !== -1 ? [category] : defaultSingleCategory;
        for (let i = 0; i < categoryItems.length; i++) {
            if (filterCategory.indexOf(categoryItems[i].filter_id) > -1) {
                categoryItems[i].is_selected = category !== 'others';
                const courseMediums = categoryAndMediumData.filter((e) => filterCategory.indexOf(e.category) > -1);
                courseMediums.forEach((e) => {
                    if (!_.find(mediumItems, ['filter_id', `${e.meta_info} Med`])) {
                        mediumItems.push({
                            filter_id: `${e.meta_info} Med`,
                            text: Data.getCourseMediumByLocale(locale)[e.meta_info] || e.meta_info,
                            is_selected: filters.indexOf(`${e.meta_info} Med`) >= 0,
                        });
                    }
                    if (!_.find(yearItems, ['filter_id', e.year_exam])) {
                        yearItems.push({
                            filter_id: e.year_exam,
                            text: `${e.year_exam}`,
                            is_selected: filters.indexOf(e.year_exam.toString()) >= 0,
                        });
                    }
                });
            }
        }
    }
    const items = [
        {
            filter_title: locale === 'hi' ? 'कक्षा' : 'Class',
            filter_items: classItems,
            is_multi_select: false,
            is_exam_filter: false,
            is_selected: false,
        },
        {
            filter_title: locale === 'hi' ? 'परीक्षा' : 'Exam',
            filter_items: categoryItems,
            is_multi_select: isMultiSelect,
            is_exam_filter: true,
            is_selected: false,
        },
        {
            filter_title: locale === 'hi' ? 'Year' : 'Year',
            filter_items: yearItems,
            is_multi_select: isMultiSelect,
            is_exam_filter: true,
            is_selected: false,
        },
        {
            filter_title: locale === 'hi' ? 'माध्यम' : 'Medium',
            filter_items: mediumItems,
            is_multi_select: isMultiSelect,
            is_exam_filter: false,
            is_selected: false,
        },
    ];
    return {
        type: 'category_filters_v2',
        is_sticky: true,
        data: {
            show_exam_bottom_sheet: false,
            exam_bottom_sheet_title: '',
            exam_bottom_sheet_action: '',
            items,
        },
    };
}

async function getResponseForCategoryListingPage({
    db, studentClass, filters = [], category, assortmentFlagrResponse, locale, config, studentID, versionCode, vipCourses, isBrowser, page, studentCcmData = [], campaignData = [],
}) {
    let categoryId = category;
    if (_.includes(['IIT JEE', 'NEET', 'NDA'], category)) {
        categoryId = category === 'NDA' ? 'DEFENCE/NDA/NAVY_CT' : category.concat('_CT');
    }
    const filtersData = await getFiltersForCategoryPage({
        db, studentClass, filters, category: categoryId, assortmentFlagrResponse, locale, isBrowser,
    });
    const widgets = [];
    if (+page === 1 || isBrowser) {
        widgets.push(filtersData);
        if (vipCourses && vipCourses.length) {
            const items = await getUserCoursesCarousel({
                db,
                studentId: studentID,
                studentClass,
                studentLocale: locale,
                studentCourseOrClassSubcriptionDetails: vipCourses,
                versionCode,
                config,
                setWidth: true,
                coursePage: 'MY_COURSES',
            });
            widgets.push({
                type: 'widget_my_courses',
                data: {
                    title: locale === 'hi' ? 'मेरे कोर्स' : 'My Courses',
                    items: items.filter(Boolean),
                },
            });
            const activeCourses = [];
            for (let i = 0; i < vipCourses.length; i++) {
                activeCourses.push(vipCourses[i].assortment_id);
            }
            if (activeCourses.length) {
                const subjectAssortments = await CourseMysqlv2.getAssortmentsByAssortmentList(db.mysql.read, activeCourses);
                for (let i = 0; i < subjectAssortments.length; i++) {
                    vipCourses.push({ assortment_id: subjectAssortments[i].course_resource_id });
                }
            }
        }
    }
    const filterClass = _.find(filtersData.data.items[0].filter_items, ['is_selected', true]) || (!isBrowser ? { filter_id: +studentClass === 14 ? 13 : studentClass } : { filter_id: 12 });
    const filterCategory = [];
    const filterMedium = [];
    const filterYear = [];
    filtersData.data.items[1].filter_items.forEach((e) => {
        if (e.is_selected) {
            filterCategory.push(e.filter_id);
        }
    });
    filtersData.data.items[2].filter_items.forEach((e) => {
        if (e.is_selected) {
            filterYear.push(e.filter_id);
        }
    });
    filtersData.data.items[3].filter_items.forEach((e) => {
        if (e.is_selected) {
            filterMedium.push(e.filter_id);
        }
    });
    if (!filterMedium.length) {
        filtersData.data.items[3].filter_items.forEach((e) => {
            filterMedium.push(e.filter_id);
        });
        if (filtersData.data.items[3].filter_items.length === 1) {
            filtersData.data.items.pop();
        }
    }
    let coursesList = [];
    const others = category === 'others';
    if (!isBrowser) {
        let subjectFilter = null;
        let subjectList = [];
        [
            coursesList,
            subjectList,
        ] = await Promise.all([
            +page > 1 ? [] : CourseMysqlv2.getCoursesList(db.mysql.read, others ? 'others' : filterCategory, filterClass.filter_id),
            CourseMysqlv2.getSubjectsForCategoryPage(db.mysql.read, others ? 'others' : filterCategory, filterClass.filter_id, (page - 1) * 20),
        ]);
        if (!(filterCategory.indexOf('IIT JEE') > -1 || filterCategory.indexOf('NEET') > -1)) {
            coursesList = coursesList.filter((item) => item.assortment_id !== 138829);
        }
        coursesList = coursesList.filter((item) => item.sub_assortment_type !== 'mock_test');
        subjectList = subjectList.filter((item) => !item.is_free && item.demo_video_thumbnail);
        const subjectFilterData = [];
        const uniqueFIlters = _.uniqBy(subjectList, 'display_name');
        for (let i = 0; i < uniqueFIlters.length; i++) {
            subjectFilter = subjectFilter || ((filters.indexOf(uniqueFIlters[i].display_name) >= 0) ? uniqueFIlters[i].display_name : null);
            subjectFilterData.push({
                filter_id: uniqueFIlters[i].display_name,
                text: locale === 'hi' ? Data.subjectHindi[uniqueFIlters[i].display_name.toUpperCase()] : uniqueFIlters[i].display_name,
                is_selected: (filters.indexOf(uniqueFIlters[i].display_name) >= 0),
            });
        }
        subjectFilterData.push({
            filter_id: 'ALL',
            text: locale === 'hi' ? 'सब' : 'ALL',
            is_selected: (filters.indexOf('ALL') >= 0),
        });
        filtersData.data.items.push({
            filter_title: locale === 'hi' ? 'विषय' : 'Subject',
            filter_items: subjectFilterData,
            is_multi_select: false,
            is_exam_filter: false,
            is_selected: false,
        });
        if (subjectFilter) {
            subjectList = subjectList.filter((item) => item.display_name === subjectFilter);
        }
        if (!subjectList.length) {
            const subjectListPrevPage = await CourseMysqlv2.getSubjectsForCategoryPage(db.mysql.read, others ? 'others' : filterCategory, filterClass.filter_id, (page - 1) * 20);
            if (subjectListPrevPage.length) {
                subjectList = await CourseMysqlv2.getCoursesList(db.mysql.read, others ? 'others' : filterCategory, filterClass.filter_id);
                subjectList = subjectList.filter((item) => item.sub_assortment_type === 'mock_test');
            }
        }
        coursesList = [...coursesList, ...subjectList];
    } else {
        coursesList = await CourseContainerv2.getCoursesListForWeb(db, filterCategory, filterClass.filter_id);
    }

    if (!filterYear.length && coursesList.length) {
        if (isBrowser) {
            coursesList.forEach((item) => {
                const index = filterYear.indexOf(item.year_exam);
                if (index < 0) {
                    filterYear.push(item.year_exam);
                }
            });
            filtersData.data.items[2].filter_items.forEach((e) => {
                const index = filterYear.indexOf(e.filter_id);
                if (index > -1) {
                    e.is_selected = true;
                }
            });
        } else {
            filterYear.push(coursesList[0].year_exam);
            filtersData.data.items[2].filter_items.forEach((e) => {
                if (e.filter_id === coursesList[0].year_exam) {
                    e.is_selected = true;
                }
            });
        }
    }
    if (vipCourses && vipCourses.length) {
        coursesList = coursesList.filter((item) => !_.find(vipCourses, ['assortment_id', item.assortment_id]));
    }
    coursesList = coursesList.filter((item) => filterYear.indexOf(item.year_exam) > -1 && (filterMedium.indexOf(`${item.meta_info} Med`) > -1 || !_.includes(['HINDI', 'ENGLISH'], item.meta_info)) && !item.is_free);
    const assortmentList = [];
    coursesList.map((item) => assortmentList.push(item.assortment_id));
    const assortmentPriceMapping = assortmentList.length ? await generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
    if (assortmentList.length) {
        const batchDetails = await getBatchDetailsByAssortmentListAndStudentId(db, studentID, assortmentList);
        for (let i = 0; i < coursesList.length; i++) {
            const batchDetail = batchDetails[coursesList[i].assortment_id];
            if (batchDetail) {
                coursesList[i].display_name = batchDetail.display_name || coursesList[i].display_name;
                coursesList[i].display_description = batchDetail.display_description || coursesList[i].display_description;
                coursesList[i].demo_video_thumbnail = batchDetail.demo_video_thumbnail || coursesList[i].demo_video_thumbnail;
            }
        }
    }
    const promises = [];
    const isNewDesign = !isBrowser;
    let flagUPorBihar = false;

    for (let i = 0; i < studentCcmData.length; i++) {
        if (studentCcmData[i].course === 'UP Board' || studentCcmData[i].course === 'Bihar Board') {
            flagUPorBihar = true;
        }
    }
    if (flagUPorBihar && campaignData && campaignData[0] && campaignData[0].description === 'bnb_campaign_vijay') {
        const orderArr = ['HINDI', 'HINGLISH', 'ENGLISH'];
        coursesList.sort((a, b) => ((orderArr.indexOf(a.meta_info) === -1 ? 1000000 : orderArr.indexOf(a.meta_info)) - (orderArr.indexOf(b.meta_info) === -1 ? 1000000 : orderArr.indexOf(b.meta_info))));
    }
    for (let i = 0; i < coursesList.length; i++) {
        if (assortmentPriceMapping[coursesList[i].assortment_id]) {
            promises.push(generateAssortmentObject({
                data: coursesList[i],
                config,
                paymentCardState: { isVip: false },
                assortmentPriceMapping,
                db,
                setWidth: null,
                versionCode,
                assortmentFlagrResponse,
                locale,
                category: !isNewDesign ? coursesList[i].category : null,
                page: 'CATEGORY_LISTING',
                studentId: studentID,
            }));
            if (isNewDesign) {
                promises.push({
                    type: 'promo_list',
                    data: {
                        items: [],
                        auto_scroll_time_in_sec: autoScrollTime,
                        ratio: '16:2',
                    },
                });
            }
        }
    }
    const courseWidget = await Promise.all(promises);

    if (courseWidget.length) {
        const obj = {
            type: 'widget_parent',
            data: {
                title: '',
                link_text: '',
                deeplink: '',
                items: courseWidget,
            },
        };
        obj.data.scroll_direction = 'vertical';
        widgets.push(obj);
    }
    if (+page === 1 && !courseWidget.length) {
        const carouselsData = {
            carousel_type: 'promo_list',
            resource_types: '16:9',
        };
        const bannerId = locale === 'hi' ? 1058 : 1057;
        const bannerDetails = await CourseContainerv2.getBannersFromId(db, bannerId);
        const bannerResponse = await generateBannerData({
            db,
            carouselsData,
            result: bannerDetails,
            studentID,
            locale,
            studentClass,
        });
        if (bannerResponse.data && bannerResponse.data.items && bannerResponse.data.items.length) {
            const activeCourses = vipCourses.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject');
            if (activeCourses.length === 1) {
                bannerResponse.data.items[0].deeplink = `doubtnutapp://course_details?id=${activeCourses[0].assortment_id}`;
            }
            const obj = {
                type: 'promo_list',
                data: bannerResponse.data,
            };
            widgets.push(obj);
        }
    }
    return widgets;
}

async function getDifferenceAmountForUpgradeSubscription({
    db,
    studentID,
    assortmentID,
    isPanel,
}) {
    let userActiveSubscriptions = [];
    let maxValidityPackage = [];
    let userAllSubscriptions = [];
    if (isPanel == 1) {
        [
            userActiveSubscriptions,
            maxValidityPackage,
            userAllSubscriptions,
        ] = await Promise.all([
            CourseMysqlv2.getUserPaymentSummaryDetailsByAssortmentV1Panel(db.mysql.read, assortmentID, studentID),
            Package.getMaxValidityPackageFromAssortmentIDPanel(db.mysql.read, assortmentID),
            CourseMysqlv2.getUserPaymentSummaryDetailsByAssortmentV1AllPurchases(db.mysql.read, assortmentID, studentID),
        ]);
    } else {
        [
            userActiveSubscriptions,
            maxValidityPackage,
            userAllSubscriptions,
        ] = await Promise.all([
            CourseMysqlv2.getUserPaymentSummaryDetailsByAssortmentV1(db.mysql.read, assortmentID, studentID),
            Package.getMaxValidityPackageFromAssortmentID(db.mysql.read, assortmentID),
            CourseMysqlv2.getUserPaymentSummaryDetailsByAssortmentV1AllPurchases(db.mysql.read, assortmentID, studentID),
        ]);
    }
    // sorting active subscription by ascending order and all subscriptions by descending order (failsafe)
    _.sortBy(userActiveSubscriptions, [(o) => o.ps_id]);
    _.sortBy(userAllSubscriptions, [(o) => !o.ps_id]);

    const resultLength = userActiveSubscriptions.length;
    if (resultLength && maxValidityPackage.length && userActiveSubscriptions[resultLength - 1].duration_in_days < maxValidityPackage[0].duration_in_days) {
        let totalAmountPaidTillNow = userActiveSubscriptions[resultLength - 1].amount_paid;

        // BackTracking All the payment_summary entries of userActiveSubscriptions[resultLength - 1]
        let backTracePaymentSummaryId = userActiveSubscriptions[resultLength - 1].ps_id;
        for (let i = 0; i < userAllSubscriptions.length; i++) {
            // include the previous payments of active subscription
            if (userAllSubscriptions[i].next_ps_id === backTracePaymentSummaryId) {
                totalAmountPaidTillNow += userAllSubscriptions[i].amount_paid;
                backTracePaymentSummaryId = userAllSubscriptions[i].ps_id;
            }
        }
        const groupdResponse = _.groupBy(userAllSubscriptions, 'ps_id');
        if (_.includes(groupdResponse[backTracePaymentSummaryId][0].payment_type.split('-'), 'switch')) {
            const previousPackage = await PayMySQL.getUserPaymentSummaryDetailsByNextPsId(db.mysql.read, backTracePaymentSummaryId, studentID);
            if (previousPackage.length) {
                totalAmountPaidTillNow += previousPackage[0].amount_paid;
            }
        }
        return {
            amount: totalAmountPaidTillNow, duration: userActiveSubscriptions[resultLength - 1].duration_in_days, assortment_id: assortmentID, subscription_id: userActiveSubscriptions[resultLength - 1].subscription_id,
        };
    }
    return {};
}

async function getDifferenceAmountForSwitchSubscription({
    db,
    studentID,
    activeAssortmentID,
    packageInfo,
    isPanel,
}) {
    let userActiveSubscriptions = [];
    if (isPanel == 1) {
        userActiveSubscriptions = await CourseMysqlv2.getUserPaymentSummaryDetailsByAssortmentV1Panel(db.mysql.read, activeAssortmentID, studentID);
    } else {
        userActiveSubscriptions = await CourseMysqlv2.getUserPaymentSummaryDetailsByAssortmentV1(db.mysql.read, activeAssortmentID, studentID);
    }
    if (userActiveSubscriptions.length && userActiveSubscriptions[0].package_amount <= packageInfo[0].total_amount && activeAssortmentID != packageInfo[0].assortment_id) {
        return {
            amount: userActiveSubscriptions[0].package_amount, duration: userActiveSubscriptions[0].duration_in_days, assortment_id: activeAssortmentID, subscription_id: userActiveSubscriptions[0].subscription_id, diff_amount: packageInfo[0].total_amount - userActiveSubscriptions[0].package_amount, package_id: userActiveSubscriptions[0].new_package_id,
        };
    }
    if (isPanel === 1 && userActiveSubscriptions.length && userActiveSubscriptions[0].package_amount > packageInfo[0].total_amount && activeAssortmentID != packageInfo[0].assortment_id && userActiveSubscriptions[0].amount_paid <= packageInfo[0].total_amount) {
        return {
            amount: userActiveSubscriptions[0].amount_paid, duration: userActiveSubscriptions[0].duration_in_days, assortment_id: activeAssortmentID, subscription_id: userActiveSubscriptions[0].subscription_id, diff_amount: packageInfo[0].total_amount - userActiveSubscriptions[0].amount_paid, package_id: userActiveSubscriptions[0].new_package_id,
        };
    }
    return {};
}

async function checkUserPackageRenewals({
    db,
    studentID,
    studentSubscriptionDetails,
}) {
    const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
    const renewalPackages = studentSubscriptionDetails.filter((e) => (moment(e.end_date).subtract(8, 'days') < now && moment(e.end_date) > now) && e.type.toLowerCase() === 'subscription' && e.amount > -1);
    let checkifRenewed = [];
    if (renewalPackages.length) {
        const [allSubscriptionsForAssortment, assortmentData] = await Promise.all([
            CourseMysqlv2.getUserPackagesByAssortment(db.mysql.read, studentID, renewalPackages[0].assortment_id),
            CourseContainerv2.getAssortmentDetails(db, renewalPackages[0].assortment_id),
        ]);
        checkifRenewed = allSubscriptionsForAssortment.filter((e) => e.subscription_id > renewalPackages[0].subscription_id && e.is_active === 1);
        if (checkifRenewed.length || !assortmentData.length) {
            return [];
        }
    }
    return renewalPackages;
}

async function checkUserPackageRenewalDueInMonth({
    db,
    studentID,
    studentSubscriptionDetails,
}) {
    const renewalPackages = studentSubscriptionDetails.filter((e) => (moment(e.end_date) < moment('2021-11-01')) && e.type.toLowerCase() === 'subscription' && e.amount > -1);
    let checkifRenewed = [];
    if (renewalPackages.length) {
        const allSubscriptionsForAssortment = await CourseMysqlv2.getUserPackagesByAssortment(db.mysql.read, studentID, renewalPackages[0].assortment_id);
        checkifRenewed = allSubscriptionsForAssortment.filter((e) => e.subscription_id > renewalPackages[0].subscription_id && e.is_active === 1 && (moment(e.end_date) >= moment('2021-11-01')));
    }
    return checkifRenewed.length ? [] : renewalPackages;
}

function getPrePurchaseSubjectFAQs(data, locale) {
    const items = data.map((item) => {
        const itemObj = {};
        itemObj.title = item.question;
        itemObj.description = item.answer;
        return itemObj;
    });
    if (items.length > 0) {
        items[0].toggle = true;
    }
    return {
        type: 'course_faqs',
        data: {
            title: locale === 'hi' ? 'कोर्स की विस्तृत जानकारी ' : 'Course Details',
            description: locale === 'hi' ? 'इस कोर्स के बारे में अधिक जानें ' : 'Learn More about this course',
            bottom_text: locale === 'hi' ? 'और जानकारी चाहिए?' : 'More Questions?',
            toggle: true,
            see_more_text: locale === 'hi' ? 'देखें सारे सवाल' : 'See all FAQ\'s',
            items,
        },
    };
}

function getSachetSeeAllDeeplink(sachets) {
    if (sachets.length >= 2) {
        return 'doubtnutapp://course_detail_info?assortment_id=sachet&tab=sachet';
    }
    if (sachets[0].id === 'chapters') {
        return 'doubtnutapp://course_detail_info?assortment_id=chapter&tab=chapter';
    }
    if (sachets[0].id === 'videos') {
        return 'doubtnutapp://course_detail_info?assortment_id=video&tab=video';
    }
    return 'doubtnutapp://course_detail_info?assortment_id=pdf&tab=pdf';
}

async function getUserChapterPDFSachetsCarousel({
    studentLocale,
    studentChapterPDFSachets,
}) {
    try {
        const chapters = studentChapterPDFSachets.filter((item) => item.assortment_type === 'chapter');
        const videos = studentChapterPDFSachets.filter((item) => item.assortment_type === 'resource_video');
        const pdfs = studentChapterPDFSachets.filter((item) => item.assortment_type === 'resource_pdf');
        const sachets = [];
        const chapterEnLocale = chapters.length > 1 ? 'Chapters' : 'Chapter';
        const videosEnLocale = videos.length > 1 ? 'Videos' : 'Video';
        const pdfEnLocale = pdfs.length > 1 ? 'PDFs' : 'PDF';
        if (chapters.length) {
            sachets.push({
                id: 'chapters',
                title: studentLocale === 'hi' ? `${chapters.length} अध्याय` : `${chapters.length} ${chapterEnLocale}`,
                deeplink: 'doubtnutapp://course_detail_info?assortment_id=chapter&tab=chapter',
                title_color: '#54138a',
                is_underlined: true,
            });
        }

        if (videos.length) {
            sachets.push({
                id: 'videos',
                title: studentLocale === 'hi' ? `${videos.length} वीडियो` : `${videos.length} ${videosEnLocale}`,
                deeplink: 'doubtnutapp://course_detail_info?assortment_id=video&tab=video',
                title_color: '#54138a',
                is_underlined: true,
            });
        }

        if (pdfs.length) {
            sachets.push({
                id: 'pdfs',
                title: studentLocale === 'hi' ? `${pdfs.length} ${pdfEnLocale}` : `${pdfs.length} ${pdfEnLocale}`,
                deeplink: 'doubtnutapp://course_detail_info?assortment_id=pdf&tab=pdf',
                title_color: '#54138a',
                is_underlined: true,
            });
        }
        const deeplink = getSachetSeeAllDeeplink(sachets);
        const button = {
            title: 'See All',
            title_color: '#eb532c',
            deeplink,
        };

        const widgetData = {
            title: studentLocale === 'hi' ? 'मेरे खरीदे हुए वीडियो और PDFs' : 'My Purchased Videos & PDFs',
            deeplink,
            title_color: '#504949',
            items: sachets,
            button,
            background_color: '#ffffff',
        };
        return widgetData;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getCallingCardStatic(db, studentId, details, order, assortmentId = '') {
    let widget = {};
    const exp = 'calling_card';
    let flagrResp = {
        calling_card: {
            enabled: true,
            payload: {
                WA: false,
                dialer: true,
                freshDeskChat: true,
                requestCallback: false,
                showCallingButton: true,
                showChatButton: false,
            },
            variantId: 1225,
        },
    };
    const data = await CourseContainerv2.getFlagrResp(db, exp, studentId);
    if (!_.isEmpty(data)) {
        flagrResp = data;
    }
    widget = {
        widget_data: {
            title: details.title,
            subtitle: 'Humse Connect Karen Abhi!',
            image_url: details.image_url,
            background_color: (details.image_url > 0) ? '' : '#ffffff',
            assortment_id: assortmentId,
            flag_id: 367,
            variant_id: flagrResp.calling_card.variantId,
            callback_btn_show: flagrResp.calling_card.payload.showCallingButton,
            chat_btn_show: flagrResp.calling_card.payload.showChatButton,
        },
        widget_type: 'widget_pre_purchase_call_card',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order,
    };
    let courseID;
    let deeplink;
    if (assortmentId) {
        courseID = await CourseMysqlv2.getCourseID(db.mysql.read, assortmentId);
        deeplink = `doubtnutapp://course_details?id=${assortmentId}`;
    } else {
        deeplink = 'doubtnutapp://course_explore';
    }
    const callbackDeeplink = (flagrResp.calling_card.payload.requestCallback) ? 'doubtnutapp://callback' : 'doubtnutapp://dialer?mobile=01247158250';
    const chatDeeplink = (flagrResp.calling_card.payload.WA && courseID && courseID[0]) ? `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Mujhe%20Course%20ID%20%23${courseID[0].liveclass_course_id}%20ki%20jaankari%20chahiye` : 'doubtnutapp://chat_support';
    widget.widget_data.callback_deeplink = callbackDeeplink;
    widget.widget_data.chat_deeplink = chatDeeplink;
    widget.widget_data.deeplink = deeplink;
    return widget;
}

function getCallingCardStaticV2(details, assortmentId = '', locale, config) {
    const widget = {
        widget_data: {
            title: locale === 'hi' ? 'कोर्स ढूंढने में मदद के लिए हमसे बात करें!' : 'Course dhundhne me madad ke lie humse bat karein!',
            title_text_size: 11,
            title_text_color: '#ba2a08',
            action: locale === 'hi' ? 'कॉल करें' : 'Call Now',
            action_text_size: 22,
            action_text_color: '#e95429',
            action_deeplink: 'doubtnutapp://dialer?mobile=01247158250',
            action_image_url: `${config.staticCDN}engagement_framework/4EF8EE6A-8090-DF5A-0DAF-F5E355CDBD08.webp`,
            background_color: (details.image_url > 0) ? '' : '#ffffff',
            assortment_id: assortmentId,
        },
        widget_type: 'widget_pre_purchase_call_card_v2',
    };
    let deeplink;
    let imageUrl;
    if (assortmentId) {
        deeplink = `doubtnutapp://course_details?id=${assortmentId}`;
        imageUrl = details.image_url;
    } else {
        deeplink = 'doubtnutapp://course_explore';
        imageUrl = `${config.staticCDN}engagement_framework/461FB905-BD72-2505-0686-5D376A5A28A0.webp`;
    }
    widget.widget_data.deeplink = deeplink;
    widget.widget_data.image_url = imageUrl;

    return widget;
}

async function getCallingCardWidget(db, studentId, order) {
    let widget = {};
    try {
        let details = await CourseRedisv2.getCallingCardWidgetData(db.redis.read, studentId);
        if (!_.isNull(details)) {
            details = JSON.parse(details);
            const { assortmentId } = details;
            // check if its not dismissed
            const isShow = await CourseRedisv2.getCallingCardDismissData(db.redis.read, studentId, assortmentId);
            if (_.isNull(isShow)) {
                // call flagr
                widget = await getCallingCardStatic(db, studentId, details, order, assortmentId);
            }
        }
        return widget;
    } catch (e) {
        return widget;
        // throw new Error(e);
    }
}

async function getCallingCardWidgetV2(db, studentId, locale, config) {
    let widget = {};
    try {
        let details = await CourseRedisv2.getCallingCardWidgetData(db.redis.read, studentId);
        if (!_.isNull(details)) {
            details = JSON.parse(details);
            const { assortmentId } = details;
            // check if its not dismissed
            const isShow = await CourseRedisv2.getCallingCardDismissData(db.redis.read, studentId, assortmentId);
            if (_.isNull(isShow)) {
                // call flagr
                widget = getCallingCardStaticV2(details, assortmentId, locale, config);
            }
        }
        return widget;
    } catch (e) {
        return widget;
        // throw new Error(e);
    }
}

async function getRewardBannerDeeplink(db, studentId, page) {
    const rewardBannerClasses = [11, 12];
    const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
    const activeCourses = userActivePackages.filter((item) => item.assortment_type === 'course' && rewardBannerClasses.includes(item.class) && item.amount !== -1);
    if (activeCourses.length !== 1 || activeCourses.length === 0) return null;
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const tendaysLaterOfStartDay = moment(activeCourses[0].start_date).add(10, 'days');
    const sevenDaysBeforeExpiry = moment(activeCourses[0].end_date).subtract(7, 'days');
    if (page === 'COURSE_PAGE') {
        if (!(now >= tendaysLaterOfStartDay && now < sevenDaysBeforeExpiry)) return null;
    }
    const examCourses = activeCourses.filter((item) => (item.category === 'IIT JEE' || item.category === 'NEET' || item.category === 'IIT JEE|NEET|FOUNDATION'));
    const boardCourses = activeCourses.filter((item) => _.findIndex(examCourses, (examItem) => examItem.assortment_id === item.assortment_id) === -1);
    const studentCcmData = await CourseMysqlv2.getCoursesClassCourseMapping(db.mysql.read, studentId);
    const examCategories = studentCcmData.filter((item) => item.course.includes('IIT JEE') || item.course.includes('NEET'));
    let examCategory;
    if (examCategories.length === 2 || examCategories.length === 0) {
        examCategory = 'IIT JEE';
    } else {
        examCategory = examCategories[0].course;
    }
    if (examCourses.length === 1) {
        return `doubtnutapp://course_details?id=xxxx_${Data.languageObjectNew[examCourses[0].meta_info.toLowerCase()]}`;
    }
    return `doubtnutapp://course_category?title=Apke liye Courses&filters=${examCategory},${boardCourses[0].class},${boardCourses[0].year_exam},${boardCourses[0].meta_info} Med`;
}

function isNumeric(num) {
    return (typeof (num) === 'number' || typeof (num) === 'string' && num.trim() !== '') && !isNaN(num);
}

async function getRecommendationSubjectAssorments(db, courses) {
    const assortmentListCourse = courses.map((item) => item.assortment_id);
    let subjectCourses = [];
    for (let i = 0; i < assortmentListCourse.length; i++) {
        if (assortmentListCourse[i] !== 248266 && assortmentListCourse[i] !== 248265 && !courses[i].created_by.includes('ETOOS')) {
            const subjects = await CourseMysqlv2.getSubjectsListByCourseAssortmentRecommendationWidget(db.mysql.read, assortmentListCourse[i]);
            subjectCourses = subjectCourses.concat(subjects);
        }
    }
    return subjectCourses;
}

async function generateRecommendedCourseWidget({
    db,
    config,
    versionCode,
    userLocale,
    studentId,
    userResponse,
    xAuthToken,
    isBrowser,
}) {
    let query = 'select * from course_details where ';
    // generate query from user response
    for (let i = 0; i < userResponse.length; i++) {
        if (userResponse[i].type === 'medium') {
            userResponse[i].type = 'meta_info';
        }
        if (userResponse[i].type === 'feedback') {
            continue;
        }
        if (isNumeric(userResponse[i].selected_option_key)) {
            query = `${query + userResponse[i].type}=${userResponse[i].selected_option_key} and `;
        } else {
            query = `${query + userResponse[i].type}='${userResponse[i].selected_option_key}' and `;
        }
    }
    if (query.includes('Maharashtra Board')) {
        query = query.replace('HINDI', 'ENGLISH');
    }
    query += 'is_active=1 and is_free <> 1 and assortment_type = \'course\' group by assortment_id';
    let courses = await db.mysql.read.query(query);
    if (isBrowser) {
        courses = courses.filter((course) => +course.assortment_id !== 138829);
    } else {
        const subject = await getRecommendationSubjectAssorments(db, courses);
        if (subject && subject[0]) {
            courses = subject.concat(courses);
        }
    }
    const assortmentList = courses.map((item) => item.assortment_id);
    const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
    const userAssortmentPaymentState = userActivePackages.reduce((acc, item) => ({
        ...acc,
        [item.assortment_id]: {
            isTrial: item.amount === -1,
            isVip: item.amount !== -1,
            timeLeft: moment(item.end_date).diff(new Date(), 'hours'),
        },
    }), {});
    const assortmentPriceMapping = await generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
    const trueCourses = [];
    for (let i = 0; i < courses.length; i++) {
        if (assortmentPriceMapping[courses[i].assortment_id]) {
            trueCourses.push(courses[i]);
        }
    }
    const flagrResponse = await getFlagrResponseByFlagKey(xAuthToken, ['course_assistant_courses_scroll_direction']);
    const scrollDirection = _.get(flagrResponse, 'course_assistant_courses_scroll_direction.payload.enabled', null) ? 'horizontal' : 'vertical';
    const flagrVariantId = _.get(flagrResponse, 'course_assistant_courses_scroll_direction.variantId', null);
    const courseWidget = {
        type: 'widget_parent',
        data: {
            title: 'Recommended courses',
            scroll_direction: scrollDirection,
            title_text_color: '#ffffff',
            items: [],
        },
    };
    const flagrVariants = [];
    if (flagrVariantId) {
        flagrVariants.push({
            flag_name: 'course_assistant_courses_scroll_direction',
            variant_id: flagrVariantId,
        });
    }
    for (let i = 0; i < trueCourses.length; i++) {
        const paymentCardState = {
            isVip: false,
            isTrial: false,
            timeLeft: 0,
        };
        if (userAssortmentPaymentState[trueCourses[i].assortment_id]) {
            paymentCardState.isVip = userAssortmentPaymentState[trueCourses[i].assortment_id].isVip;
            paymentCardState.isTrial = userAssortmentPaymentState[trueCourses[i].assortment_id].isTrial;
            paymentCardState.timeLeft = userAssortmentPaymentState[trueCourses[i].assortment_id].timeLeft;
        }
        const carouselItems = await generateAssortmentObject({
            data: trueCourses[i],
            config,
            paymentCardState,
            assortmentPriceMapping,
            db,
            setWidth: true,
            versionCode,
            assortmentFlagrResponse: {},
            locale: userLocale,
            category: trueCourses[i].category,
            page: 'RECOMMENDATION',
            eventPage: '',
            studentId,
        });
        courseWidget.data.items.push(carouselItems);
    }
    return {
        courseWidget,
        flagrVariants,
    };
}

async function getPackagesForAssortment(db, studentID, assortmentList) {
    const batchID = await getBatchByAssortmentIdAndStudentId(db, studentID, assortmentList[assortmentList.length - 1]);
    // get prices for packages having flag key not null (being experimented through flagr)
    const experimentPackages = await PackageContainer.getFlagIDKeysFromAssortmentIds(db, assortmentList, batchID);

    let experimentPricing = [];
    if (experimentPackages.length) {
        experimentPricing = await pricingExperiment(db, experimentPackages, studentID);
        experimentPricing = experimentPricing.filter((item) => assortmentList.indexOf(item.assortment_id) > -1);
    }
    // get prices for non experimental packages having default variants
    const defaultPackages = await Package.getDefaultVariantFromAssortmentId(db.mysql.read, assortmentList, batchID);
    let packageDetails = [];
    packageDetails = [...packageDetails, ...defaultPackages];
    if (experimentPricing.length) {
        packageDetails = [...packageDetails, ...experimentPricing];
    }
    packageDetails = _.orderBy(packageDetails, 'display_price', 'desc');
    if (packageDetails.length) {
        packageDetails[0].bestseller = true;
    }
    return packageDetails;
}

async function getPackagesForAssortmentReferral(db, studentID, assortmentList) {
    const batchID = await getBatchByAssortmentIdAndStudentId(db, studentID, assortmentList[assortmentList.length - 1]);
    // get prices for packages having flag key not null (being experimented through flagr)
    const experimentPackages = await PackageContainer.getFlagIDKeysFromAssortmentIdsWithReferralPackages(db, assortmentList, batchID);
    let experimentPricing = [];
    if (experimentPackages.length) {
        experimentPricing = await pricingExperiment(db, experimentPackages, studentID);
        experimentPricing = experimentPricing.filter((item) => assortmentList.indexOf(item.assortment_id) > -1);
    }
    // get prices for non experimental packages having default variants
    const [defaultPackages, referralPackages] = await Promise.all([Package.getDefaultVariantFromAssortmentId(db.mysql.read, assortmentList, batchID), Package.getDefaultVariantFromAssortmentReferral(db.mysql.read, assortmentList, batchID)]);
    let packageDetails = [...referralPackages];
    packageDetails = [...packageDetails, ...defaultPackages];

    /**
     * Add experimental packages to the list first as there will be default variants of same package in defaultPackages
     * Thus showing either both variants of the experiment or multiple entries of 1 variant
     * Which we will remove through lodash _.uniqWith (Keeps only first Occurence of the object)
    */
    if (experimentPricing.length) {
        packageDetails = [...experimentPricing, ...packageDetails];
    }
    packageDetails = _.uniqWith(packageDetails, (a, b) => a.package_id == b.package_id);
    packageDetails = _.orderBy(packageDetails, 'display_price', 'desc');
    if (packageDetails.length) {
        packageDetails[0].bestseller = true;
    }
    return packageDetails;
}

async function getPackagesForAssortmentAutosalesCampaign(db, studentID, assortmentList) {
    const batchID = await getBatchByAssortmentIdAndStudentId(db, studentID, assortmentList[assortmentList.length - 1]);
    // get prices for packages having flag key not null (being experimented through flagr)
    const experimentPackages = await PackageContainer.getFlagIDKeysFromAssortmentIdsWithAutosalesCampaign(db, assortmentList, batchID);

    let experimentPricing = [];
    if (experimentPackages.length) {
        experimentPricing = await pricingExperiment(db, experimentPackages, studentID);
        experimentPricing = experimentPricing.filter((item) => assortmentList.indexOf(item.assortment_id) > -1);
    }
    // get prices for non experimental packages having default variants
    const [defaultPackages, referralPackages] = await Promise.all([Package.getDefaultVariantFromAssortmentId(db.mysql.read, assortmentList, batchID), Package.getDefaultVariantFromAssortmentAutosalesCampaign(db.mysql.read, assortmentList, batchID)]);
    let packageDetails = [...referralPackages];
    packageDetails = [...packageDetails, ...defaultPackages];

    /**
     * Add experimental packages to the list first as there will be default variants of same package in defaultPackages
     * Thus showing either both variants of the experiment or multiple entries of 1 variant
     * Which we will remove through lodash _.uniqWith (Keeps only first Occurence of the object)
    */
    if (experimentPricing.length) {
        packageDetails = [...experimentPricing, ...packageDetails];
    }
    packageDetails = _.uniqWith(packageDetails, (a, b) => a.package_id == b.package_id);
    packageDetails = _.orderBy(packageDetails, 'display_price', 'desc');
    if (packageDetails.length) {
        packageDetails[0].bestseller = true;
    }
    return packageDetails;
}

function practiceEnglishBottomsheetNudge(data, config) {
    const widgets = [{
        type: 'text_widget',
        data: {
            title: data.title,
            text_color: '#541488',
            text_size: '20',
            background_color: '',
            isBold: 'true',
            alignment: '',
        },
        layout_config: {
            margin_top: 10,
            margin_left: 20,
            margin_right: 40,
        },

    }];
    data.subtitle.forEach((item, index) => {
        const items = [];
        data.bullets[index].split(';;;').forEach((newItem) => items.push({
            title: newItem,
            icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
            title_text_color: '#000000',
            title_text_size: '12',
            icon_size: '14',
        }));
        widgets.push({
            type: 'bullet_list_widget',
            data: {
                title: item,
                title_text_color: '#000000',
                title_text_size: '16',
                items,
            },
            layout_config: {
                margin_top: 20,
                margin_left: 20,
                margin_right: 20,
            },
        });
    });
    widgets.push(
        {
            data: {
                text_one: data.button,
                text_one_size: '16',
                text_one_color: '#ffffff',
                bg_color: '#541488',
                bg_stroke_color: '#541488',
                assortment_id: '',
                deep_link: 'doubtnutapp://daily_practice',
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '36',
            },
            type: 'widget_button_border',
            layout_config: {
                margin_top: 25,
                margin_left: 20,
                margin_right: 20,
                margin_bottom: 13,
            },

        },
    );
    return {
        title: '',
        title_text_size: '16',
        title_text_color: '#000000',
        show_close_btn: true,
        padding_bottom: 100,
        show_top_drag_icon: true,
        widgets,
    };
}
function paidUserChampionshipBottomNudge(locale, config) {
    return {
        title: '',
        title_text_size: '16',
        title_text_color: '#000000',
        show_close_btn: true,
        padding_bottom: 100,
        show_top_drag_icon: true,
        widgets: [
            {
                type: 'text_widget',
                data: {
                    title: locale !== 'hi' ? 'Learn and Earn scholarship and coupons & Rewards' : 'पढें और कमाएं छात्रवृत्ति, कूपन्स और रिवॉर्ड्स',
                    text_color: '#541488',
                    text_size: '20',
                    background_color: '',
                    isBold: 'true',
                    alignment: '',
                },
                layout_config: {
                    margin_top: 10,
                    margin_left: 20,
                    margin_right: 40,
                },

            },
            // {
            //     type: 'bullet_list_widget',
            //     data: {
            //         title: locale === 'hi' ? 'रिवॉर्ड्स' : 'Rewards',
            //         title_text_color: '#000000',
            //         title_text_size: '16',
            //         items: [
            //             {
            //                 title: locale === 'hi' ? 'वार्षिक, 90% से अधिक कक्षा में भाग लेने वाले टॉप 3 छात्रों को टी-शर्ट मिलेगी।' : 'Top 3 students <b>annually</b> will get a <b>T-shirt</b>, if they attend more than 90% class.',
            //                 icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
            //                 title_text_color: '#000000',
            //                 title_text_size: '12',
            //                 icon_size: '14',

            //             },
            //             {
            //                 title: locale === 'hi' ? 'प्रत्येक माह, 90% से अधिक कक्षा में भाग लेने वाले टॉप 3 छात्रों को टी-शर्ट मिलेगी।' : 'Top 3 students <b>monthly</b> will get a <b>T-shirt</b>, if they attend more than 90% class.',
            //                 icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
            //                 title_text_color: '#000000',
            //                 title_text_size: '12',
            //                 icon_size: '14',
            //             },
            //             {
            //                 title: locale === 'hi' ? 'साप्ताहिक, 90% से अधिक कक्षा में भाग लेने वाले टॉप 3 छात्रों को टी-शर्ट मिलेगी।' : 'Top 3 students <b>weekly</b> will get a <b>T-shirt</b>, if they attend more than 90% class.',
            //                 icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
            //                 title_text_color: '#000000',
            //                 title_text_size: '12',
            //                 icon_size: '14',
            //             },
            //         ],
            //     },
            //     layout_config: {
            //         margin_top: 20,
            //         margin_left: 20,
            //         margin_right: 20,
            //     },
            // },
            {
                type: 'bullet_list_widget',
                data: {
                    title: locale === 'hi' ? 'फीस वापस' : 'Fees Back',
                    title_text_color: '#000000',
                    title_text_size: '16',
                    items: [
                        {
                            title: locale === 'hi' ? 'टॉप 3 छात्रों को 90% से अधिक कक्षा में भाग लेने पर छात्रवृत्ति के रूप में भुगतान की गई कुल फीस का 25% <b>वार्षिक</b> शुल्क वापस मिलेगा।' : 'Top 3 students <b>annually</b> will get 25% fees back of total fees paid as scholarship, if they attend more than 90% class.',
                            icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
                            title_text_color: '#000000',
                            title_text_size: '12',
                            icon_size: '14',

                        },
                        {
                            title: locale === 'hi' ? '<b>प्रत्येक माह</b> में शीर्ष 3 छात्रों को 2.5% फीस छात्रवृत्ति के रूप में वापस मिलेगी, यदि वह 90% से अधिक कक्षा में भाग लेते हैं।' : 'Top 3 students in each <b>month</b> will get 2.5% fees back as scholarship, if they attend more than 90% class.',
                            icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
                            title_text_color: '#000000',
                            title_text_size: '12',
                            icon_size: '14',
                        },

                    ],
                },
                layout_config: {
                    margin_top: 20,
                    margin_left: 20,
                    margin_right: 20,
                },
            },
            {
                type: 'bullet_list_widget',
                data: {
                    title: locale === 'hi' ? 'कूपन्स' : 'Coupons',
                    title_text_color: '#000000',
                    title_text_size: '16',
                    items: [
                        {
                            title: locale === 'hi' ? 'अगले कोर्स की खरीद के लिए, 90-100% उपस्थिति पूरी करने पर 50% छूट कूपन कोड प्राप्त करें।' : '<b>Get 50% OFF</b> coupon code on completing<br><b>90-100% attendance,</b> for next course purchase.',
                            icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
                            title_text_color: '#000000',
                            title_text_size: '12',
                            icon_size: '14',
                        },
                        {
                            title: locale === 'hi' ? 'अगले कोर्स की खरीद के लिए, 75-90% उपस्थिति पूरी करने पर 25% छूट कूपन कोड प्राप्त करें।' : '<b>Get 25% OFF</b> coupon code on completing<br><b>75-90% attendance,</b> for next course purchase.',
                            icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
                            title_text_color: '#000000',
                            title_text_size: '12',
                            icon_size: '14',
                        },
                        {
                            title: locale === 'hi' ? 'अगले कोर्स की खरीद के लिए, 50-75% उपस्थिति पूरी करने पर 10% छूट कूपन कोड प्राप्त करें।' : '<b>Get 10% OFF</b> coupon code on completing<br><b>50-75% attendance,</b> for next course purchase.',
                            icon: `${config.staticCDN}/engagement_framework/390B5B2A-A041-6299-3A67-A844863815D2.webp`,
                            title_text_color: '#000000',
                            title_text_size: '12',
                            icon_size: '14',
                        },
                    ],

                },
                layout_config: {
                    margin_top: 20,
                    margin_left: 20,
                    margin_right: 20,
                },

            },
            {
                data: {
                    text_one: locale === 'hi' ? 'सीखना शुरू करें' : 'Start learning',
                    text_one_size: '16',
                    text_one_color: '#ffffff',
                    bg_color: '#541488',
                    bg_stroke_color: '#541488',
                    assortment_id: '',
                    deep_link: 'doubtnutapp://library_course',
                    corner_radius: '4.0',
                    elevation: '4.0',
                    min_height: '36',
                },
                type: 'widget_button_border',
                layout_config: {
                    margin_top: 25,
                    margin_left: 20,
                    margin_right: 20,
                    margin_bottom: 13,
                },

            },
        ],
    };
}

async function getTrendingCourses(db, type, studentCcmData, studentLocale, studentClass) {
    const widgetAttributes = {};
    let neetSelected = false;
    let arr = [];
    if (type === 'TRENDING_EXAM') {
        if (_.find(studentCcmData, ['category', 'NEET'])) {
            neetSelected = true;
            widgetAttributes.title = studentLocale === 'hi' ? 'ख़ास NEET छात्रों के लिए कोर्स' : 'Courses Popular with NEET Students';
            widgetAttributes.see_all_category = 'NEET_CT';
            arr = await CourseRedisv2.getTrendingCourses(db.redis.read, `${studentClass}_NEET`, 0, 9);
        }
        if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
            widgetAttributes.title = studentLocale === 'hi' ? 'ख़ास IIT JEE छात्रों के लिए कोर्स' : 'Courses Popular with IIT JEE Students';
            if (neetSelected) {
                widgetAttributes.title = studentLocale === 'hi' ? 'ख़ास IIT JEE & NEET छात्रों के लिए कोर्स' : 'Courses Popular with IIT JEE & NEET Students';
            }
            widgetAttributes.see_all_category = 'IIT JEE_CT';
            arr = [...arr, ...await CourseRedisv2.getTrendingCourses(db.redis.read, `${studentClass}_IIT JEE`, 0, 9)];
        }
    } else if (studentCcmData[0]) {
        widgetAttributes.title = studentLocale === 'hi' ? `ख़ास ${studentCcmData[0].category} छात्रों के लिए कोर्स` : `Courses Popular with ${studentCcmData[0].category} Students`;
        widgetAttributes.see_all_category = studentCcmData[0].category;
        arr = await CourseRedisv2.getTrendingCourses(db.redis.read, `${studentClass}_${studentCcmData[0].category}`, 0, 9);
    }
    return {
        widgetAttributes,
        assortmentIds: arr,
    };
}

async function getTrendingCoursesCarousel({
    db, config, studentId, versionCode, xAuthToken, arr, studentLocale,
}) {
    const data = await CourseMysqlv2.getCourseDetailsForHomepageWithThumbnailsByCategory(db.mysql.read, arr, 'widget_popular_course', +versionCode);
    const assortmentList = data.map((item) => item.assortment_id);
    const promises = [];
    const assortmentPriceMapping = await generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
    for (let i = 0; i < data.length; i++) {
        const priceObj = assortmentPriceMapping[data[i].assortment_id];
        if (priceObj) {
            priceObj.deeplink = versionCode >= 927 ? `doubtnutapp://course_details_bottom_sheet?ids=${assortmentList.join(',')}&position=${i}` : `doubtnutapp://course_details?id=${data[i].assortment_id}`;
            priceObj.buy_deeplink = assortmentPriceMapping[data[i].assortment_id] && !assortmentPriceMapping[data[i].assortment_id].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[data[i].assortment_id].package_variant}` : `doubtnutapp://bundle_dialog?id=${data[i].assortment_id}`;
            promises.push(getNewCourseThumbnailv2({
                data: data[i],
                config,
                paymentCardState: { isVip: false },
                o: priceObj,
                db,
                setWidth: true,
                versionCode,
                assortmentFlagrResponse: {},
                locale: studentLocale,
                category: null,
                page: 'HOME_TRENDING',
                studentId,
            }));
        }
    }
    const popularCourses = await Promise.all(promises);
    return popularCourses;
}

async function getLectureSeriesByQuestionID(db, questionID, subscriptionDetails, studentID) {
    let result = await CourseContainerv2.getChapterRelatedVideosFromResourceID(db, questionID);
    let batchID = 1;
    if (result.length) {
        const {
            subject_assortment_id: subjectAssortmentID,
            topic,
        } = result[0];
        let courseAssortment = result[0].course_assortment_id;
        if (!subscriptionDetails.length) {
            const latestCourse = result.filter((e) => e.is_active === 1);
            if (latestCourse.length) {
                courseAssortment = latestCourse[0].course_assortment_id;
                result = latestCourse;
            }
            const batchMapping = await getBatchByAssortmentListAndStudentId(db, studentID, [courseAssortment, subjectAssortmentID]);
            if (!_.isEmpty(batchMapping)) {
                batchID = batchMapping[courseAssortment] || batchMapping[subjectAssortmentID] || 1;
            }
        } else if (subscriptionDetails.length === 1) {
            batchID = subscriptionDetails[0].batch_id;
            courseAssortment = subscriptionDetails[0].assortment_id;
        } else {
            const data = await CourseContainerv2.getAssortmentsByResourceReferenceV1(db, questionID);
            const vipDetailsByQid = await checkVipByResourceReference(db, data, studentID, questionID);
            const { userPackages: filteredUserSubscription } = vipDetailsByQid;
            batchID = filteredUserSubscription.length ? filteredUserSubscription[0].batch_id : 1;
            courseAssortment = filteredUserSubscription.length ? filteredUserSubscription[0].assortment_id : courseAssortment;
        }
        result = result.filter((e) => e.batch_id === batchID && (e.course_assortment_id === courseAssortment || e.subject_assortment_id === courseAssortment || (courseAssortment === 16 && _.includes([35, 36], e.course_assortment_id)) || (courseAssortment === 15 && _.includes([33, 34], e.course_assortment_id)) || e.is_free));
        return {
            result, topic, batchID, subjectAssortmentID, courseAssortment,
        };
    }
    return { result };
}

async function getNextChapterQuestionID(db, subjectAssortmentID, topic) {
    const result = await CourseMysqlv2.getAllChaptersUsingSubjectAssortment(db.mysql.read, subjectAssortmentID);
    let isNextChapter = false;
    const chapterAssortmentList = [];
    for (let i = 0; i < result.length; i++) {
        const { name, course_resource_id: courseResourceID } = result[i];
        if (isNextChapter) {
            chapterAssortmentList.push(courseResourceID);
            break;
        }
        if (name === topic) {
            isNextChapter = true;
        }
    }
    if (isNextChapter && chapterAssortmentList.length) {
        const nextChapterDetails = await CourseMysqlv2.getPastVideoResourcesOfChapter(db.mysql.read, chapterAssortmentList);
        if (nextChapterDetails.length) {
            return nextChapterDetails[0].resource_reference;
        }
    }
    return '';
}

async function getliveClassForUserCourse(db, liveclassDetails, userPackages, studentClass) {
    let finalObj = liveclassDetails[0];
    liveclassDetails = liveclassDetails.reverse();
    for (let i = 0; i < liveclassDetails.length; i++) {
        let parentAssortmentsList = await CourseRedisv2.getParentAssortmentListV1(db.redis.read, liveclassDetails[i].assortment_id, studentClass);
        if (parentAssortmentsList) {
            parentAssortmentsList = JSON.parse(parentAssortmentsList);
        } else {
            parentAssortmentsList = await getParentAssortmentListV1(db, [liveclassDetails[i].assortment_id], studentClass);
            CourseRedisv2.setParentAssortmentListV1(db.redis.write, liveclassDetails[i].assortment_id, studentClass, parentAssortmentsList);
        }
        let found = false;
        if (userPackages && userPackages.length) {
            for (let j = 0; j < userPackages.length; j++) {
                if (_.find(parentAssortmentsList, ['assortment_id', userPackages[j].assortment_id])) {
                    found = true;
                }
            }
        }
        if (found) {
            finalObj = liveclassDetails[i];
            break;
        }
    }
    return finalObj;
}

async function getChildAssortmentListRecursivelyV1(db, assortmentList, totalResource = []) {
    try {
        const results = await CourseMysqlv2.getAllChildAssortments(db.mysql.read, assortmentList);
        const resourceIdList = results.map((x) => x.course_resource_id);
        if (results.length > 0) {
            totalResource = [...totalResource, ...resourceIdList];
            return getChildAssortmentListRecursivelyV1(db, resourceIdList, totalResource);
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}

function bottomSheetDataFormat(qidData, liveClassData, flag) {
    const subData = {};
    const data = {
        widget_type: 'widget_autoplay',
        widget_data: {
            title: '',
            is_live: true,
            live_text: 'LIVE',
            auto_play: true,
            auto_play_initiation: 500,
            auto_play_duration: 15000,
            scroll_direction: 'horizontal',
            title_text_size: '16',
            title_text_color: '#000000',
            bg_color: null,
            show_live_graphics: false,
        },
    };
    const items = [];
    for (let i = liveClassData.length - 1; i >= 0; i--) {
        if (liveClassData[i] && liveClassData[i].length) {
            const qid = flag ? qidData[i].question_id : qidData[i];
            const views = Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(qid)[0] / 100);
            const obj = {
                id: qid,
                assortment_id: liveClassData[i][0].assortment_id,
                page: 'LIVECLASS_FREE',
                top_title: '',
                title1: '',
                title2: liveClassData[i][0].display,
                image_url: liveClassData[i][0].expert_image,
                is_live: true,
                subject: liveClassData[i][0].subject,
                color: Data.askWidget.subjectWiseBgForFreeLiveLecture[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForFreeLiveLecture.default,
                player_type: 'liveclass',
                live_at: 1642442400000,
                image_bg_card: null,
                lock_state: 0,
                bottom_title: '',
                topic: '',
                students: 13822,
                interested: 13822,
                is_premium: false,
                state: 2,
                show_reminder: false,
                reminder_message: 'Reminder has been set',
                payment_deeplink: `doubtnutapp://vip?assortment_id=${liveClassData[i][0].assortment_id}`,
                card_width: '1.25',
                card_ratio: '16:9',
                text_color_primary: '#ffffff',
                text_color_secondary: '#ffffff',
                text_color_title: '#ffffff',
                set_width: true,
                button_state: 'multiple',
                image_vertical_bias: 1,
                bg_exam_tag: '#2376b2',
                text_color_exam_tag: '#ffffff',
                target_exam: '',
                deeplink: `doubtnutapp://course_details?id=${liveClassData[i][0].chapter_assortment}`,
                text_horizontal_bias: 0,
                title3: `By ${liveClassData[i][0].expert_name}`,
                text_vertical_bias: 0.15,
                title1_text_size: '12',
                title1_is_bold: false,
                title2_text_size: '20',
                title2_is_bold: true,
                title1_text_color: '#031269',
                title2_text_color: '#1a29a9',
                title3_text_size: '12',
                title3_text_color: '#031269',
                title3_is_bold: false,
                start_gd: Data.askWidget.subjectWiseBgForSubjectList[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForSubjectList.default,
                mid_gd: Data.askWidget.subjectWiseBgForSubjectList[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForSubjectList.default,
                end_gd: Data.askWidget.subjectWiseBgForSubjectList[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForSubjectList.default,
                views: `${views} students watched`,
                bottom_layout: {
                    title: '',
                    title_replace: liveClassData[i][0].chapter,
                    title_color: '#000000',
                    sub_title: '',
                    sub_title_replace: views,
                    sub_title_color: '#5b5b5b',
                    button: {
                        text: '',
                        text_color: '#ea532c',
                        background_color: '#00000000',
                        border_color: '#ea532c',
                        deeplink: `${liveClassData[i][0].chapter_assortment}`,
                        text_all_caps: false,
                        show_volume: false,
                    },
                    icon_subtitle: null,
                },
            };
            if (flag) {
                obj.popular_tag = 'Most Watched';
                obj.popular_tag_color = '#1a29a9';
            }
            const itemsData = { type: 'widget_child_autoplay', data: obj };
            if (flag === 0 && obj.subject) {
                subData[obj.subject.toLowerCase()] = true;
                itemsData.group_id = obj.subject.toLowerCase();
            }
            items.push(itemsData);
        }
    }
    data.widget_data.items = items;

    // add tabs
    const subjectList = Object.keys(subData);
    const tabs = [];
    if (subjectList.length) {
        for (let i = 0; i < subjectList.length; i++) {
            const obj = {
                key: subjectList[i],
                title: _.startCase(subjectList[i]),
                is_selected: false,
            };
            tabs.push(obj);
        }
        if (tabs.length) {
            tabs[0].is_selected = true;
            data.widget_data.tabs = tabs;
        }
    }
    return data;
}

function getLikesCountAndDurationOfQid(data, answerData, locale) {
    const views = Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(data.data.id)[0] / 100);
    let subText = views;
    if (data.group_id && data.group_id === 'upcoming') {
        subText = locale === 'hi' ? `${views + 2000} की रुचि है` : `${views + 2000} interested`;
    } else if (data.group_id && data.group_id === 'live') {
        subText = locale === 'hi' ? `${views - 2000} देख रहे हैं` : `${views - 2000} watching`;
    } else {
        subText = locale === 'hi' ? `${views + 20000} ने देखा` : `${views + 20000} attended`;
    }

    if (answerData.length && answerData[0].duration && answerData[0].duration !== '0' && answerData[0].duration !== 'NULL') {
        const duration = +answerData[0].duration;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration - (hours * 3600)) / 60);
        const seconds = duration - (hours * 3600) - (minutes * 60);

        if (subText.length) {
            if (hours) {
                subText = `${subText} | ${hours} hr + `;
            } else if (minutes) {
                subText = `${subText} | ${minutes} min + `;
            } else {
                subText = `${subText} | ${seconds} sec`;
            }
        } else {
            subText = `${answerData[0].duration} `;
        }
    }
    return subText;
}

function bottomSheetDataFormatVideoPage(qidData, liveClassData, flag, vertical, locale) {
    const data = {
        widget_type: 'widget_autoplay',
        widget_data: {
            title: '',
            auto_play: true,
            auto_play_initiation: 500,
            auto_play_duration: 15000,
            scroll_direction: vertical ? 'vertical' : 'horizontal',
            title_text_size: '16',
            title_text_color: '#000000',
            bg_color: null,
            link_text: locale === 'hi' ? 'सभी देखें' : 'View All',
            deeplink: 'doubtnutapp://library_tab?tag=free_classes',
        },
    };
    const items = [];
    for (let i = 0; i < liveClassData.length; i++) {
        if (liveClassData[i] && liveClassData[i].length) {
            const hours = liveClassData[i][0].duration ? Math.round(liveClassData[i][0].duration / 3600) : 0;
            const minutes = liveClassData[i][0].duration ? Math.round((liveClassData[i][0].duration % 3600) / 60) : 0;
            const time = liveClassData[i][0].live_at ? liveclassHelper.getLiveclassStatusRecorded(liveClassData[i][0].live_at) : '';
            const vidTime = `${hours > 0 ? `${hours} hr ` : ''}${minutes > 0 ? `${minutes} mins ` : ''}`;
            const qid = flag ? qidData[i].question_id : qidData[i];
            let views = Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(qid)[0] / 100);
            if (liveClassData[i][0].replace_live_bg) {
                views -= 2000;
            } else {
                views += 20000;
            }
            let backgroundBgImageLive;
            if (vertical) {
                backgroundBgImageLive = liveClassData[i][0].replace_live_bg ? liveclassData.bgImageLiveTrending(liveClassData[i][0].subject) : liveclassData.getBgImage(liveClassData[i][0].subject.toLowerCase());
            }
            let viewsWidget = liveClassData[i][0].duration ? `${views} attended | ${vidTime}` : `${views} attended`;
            if (liveClassData[i][0].replace_live_bg) {
                viewsWidget = liveClassData[i][0].duration ? `${views} watching | ${vidTime}` : `${views} watching`;
            }
            if (locale === 'hi') {
                viewsWidget = liveClassData[i][0].duration ? `${views} ने देखा | ${vidTime}` : `${views} ने देखा`;
                if (liveClassData[i][0].replace_live_bg) {
                    viewsWidget = liveClassData[i][0].duration ? `${views} देख रहे हैं | ${vidTime}` : `${views} देख रहे हैं`;
                }
            }
            const obj = {
                id: qid,
                assortment_id: liveClassData[i][0].assortment_id,
                page: 'MPVP_CLASSES_CAROUSEL',
                top_title: '',
                title1: vertical ? liveClassData[i][0].display : '',
                title2: vertical ? liveClassData[i][0].chapter.toUpperCase() : liveClassData[i][0].display,
                image_url: liveClassData[i][0].expert_image,
                is_live: true,
                subject: liveClassData[i][0].subject,
                color: Data.askWidget.subjectWiseBgForFreeLiveLecture[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForFreeLiveLecture.default,
                player_type: 'liveclass',
                live_at: 1642442400000,
                image_bg_card: vertical ? backgroundBgImageLive : null,
                lock_state: 0,
                bottom_title: '',
                topic: '',
                students: 13822,
                interested: 13822,
                is_premium: false,
                state: 2,
                show_reminder: false,
                reminder_message: 'Reminder has been set',
                payment_deeplink: `doubtnutapp://vip?assortment_id=${liveClassData[i][0].assortment_id}`,
                card_width: vertical ? '1' : '1.25',
                card_ratio: '16:9',
                text_color_primary: '#ffffff',
                text_color_secondary: '#ffffff',
                text_color_title: '#ffffff',
                set_width: true,
                button_state: 'multiple',
                image_vertical_bias: 1,
                bg_exam_tag: Data.askWidget.subjectWiseBgForFreeLiveLecture[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForFreeLiveLecture.default,
                text_color_exam_tag: '#ffffff',
                target_exam: vertical ? time : '',
                deeplink: `doubtnutapp://course_details?id=${liveClassData[i][0].chapter_assortment}`,
                text_horizontal_bias: 0,
                title3: `By ${liveClassData[i][0].expert_name}`,
                text_vertical_bias: 0.15,
                title1_text_size: vertical ? '20' : '12',
                title1_is_bold: vertical,
                title2_text_size: vertical ? '10' : '20',
                title2_is_bold: true,
                title1_text_color: '#031269',
                title2_text_color: '#1a29a9',
                title3_text_size: '10',
                title3_text_color: '#031269',
                title3_is_bold: false,
                start_gd: Data.askWidget.subjectWiseBgForSubjectList[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForSubjectList.default,
                mid_gd: Data.askWidget.subjectWiseBgForSubjectList[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForSubjectList.default,
                end_gd: Data.askWidget.subjectWiseBgForSubjectList[liveClassData[i][0].subject.toLowerCase()] || Data.askWidget.subjectWiseBgForSubjectList.default,
                views: viewsWidget,
                bottom_layout: {
                    title: '',
                    title_replace: liveClassData[i][0].chapter,
                    title_color: '#000000',
                    sub_title: '',
                    sub_title_replace: views,
                    sub_title_color: '#5b5b5b',
                    button: {
                        text: '',
                        text_color: '#ea532c',
                        background_color: '#00000000',
                        border_color: '#ea532c',
                        deeplink: `${liveClassData[i][0].chapter_assortment}`,
                        text_all_caps: false,
                        show_volume: false,
                    },
                    icon_subtitle: null,
                },
            };
            const itemsData = { type: 'widget_child_autoplay', data: obj };
            items.push(itemsData);
        }
    }
    data.widget_data.items = items;
    return data;
}

async function getDataForPopularCourseCarouselCampaign({
    db,
    studentClass,
    studentId,
    studentLocale,
    assortments,
}) {
    try {
        let studentCcmAssortments = [];
        let studentCcmData;
        if (+studentClass < 9) {
            studentCcmData = Data.defaultCCMCampaignExplore[studentClass];
        } else {
            studentCcmData = await CourseMysqlv2.getCoursesClassCourseMappingExtraMarks(db.mysql.read, studentId);
        }
        if (studentCcmData.length === 0) {
            studentCcmData = Data.defaultCCMCampaignExplore[studentClass];
        }
        // studentCcmData.forEach((item) => { item.category = liveclassData.examCategoryMapping[item.course]; });
        // eslint-disable-next-line prefer-const
        let [data, priorityAssortmentList] = await Promise.all([CourseMysqlv2.getAssortmentDetailsFromIdForExplorePageCampaign(db.mysql.read, assortments, studentClass, studentLocale), CourseContainerv2.getClassLocaleAssortments(db, studentClass, studentLocale)]);
        if (studentLocale === 'en') {
            const data1 = data.filter((item) => item.course_language === 'ENGLISH');
            const data2 = data.filter((item) => item.course_language === 'HINDI');
            const data3 = data.filter((item) => item.course_language !== 'ENGLISH' && item.course_language !== 'HINDI');
            data = [...data1, ...data2, ...data3];
        } else if (studentLocale === 'hi') {
            const data1 = data.filter((item) => item.course_language === 'HINDI');
            const data2 = data.filter((item) => item.course_language === 'ENGLISH');
            const data3 = data.filter((item) => item.course_language !== 'ENGLISH' && item.course_language !== 'HINDI');
            data = [...data1, ...data2, ...data3];
        }
        if (+studentClass === 14) {
            studentCcmAssortments = data;
        } else {
            data.forEach((item) => {
                if (_.find(studentCcmData, ['category', item.category]) || (_.includes(['NDA', 'BOARDS'], item.category) && studentCcmData.length && _.find(studentCcmData, (n) => { if (n.category.toLowerCase().includes('board')) { return true; } }))) {
                    studentCcmAssortments.push(item);
                } else if ((_.find(studentCcmData, ['category', 'IIT JEE']) || _.find(studentCcmData, ['category', 'NEET'])) && item.category === 'IIT JEE|NEET|FOUNDATION') {
                    studentCcmAssortments.push(item);
                }
            });
        }
        studentCcmAssortments.sort((x, y) => x.priority - y.priority);
        const groupedByAssortment = _.groupBy(priorityAssortmentList, 'assortment_id');

        for (let i = 0; i < studentCcmAssortments.length; i++) {
            if (typeof groupedByAssortment[studentCcmAssortments[i].assortment_id] !== 'undefined' && i !== 0) {
                move(studentCcmAssortments, i, 0);
            }
        }
        return studentCcmAssortments;
    } catch (e) {
        console.log(e);
        logger.error({
            tag: 'explorePageApi',
            source: 'courseCarouselCampaign',
            error: `error in getDataForPopularCourseCarouselCampaign for class- ${studentClass} and locale- ${studentLocale}`,
        });
    }
}

async function getFiltersForNewCategoryPage({
    db,
    locale,
    category,
    filters = [],
    studentClass,
}) {
    const isMultiSelect = false;
    const categoryItems = [];
    const mediumItems = [];
    const yearItems = [];
    let filterClass = null;
    let currentCategoryIndex = -1;
    filterClass = studentClass;
    const categoryAndMediumData = await CourseContainerv2.getFiltersFromCourseDetails(db, filterClass);
    // added _CT for category_type values to differentiate from category values
    let filterCategory = null;
    for (let i = 0; i < categoryAndMediumData.length; i++) {
        currentCategoryIndex = category === categoryAndMediumData[i].category ? i : currentCategoryIndex;
        if (filters.indexOf(categoryAndMediumData[i].category) >= 0) {
            filterCategory = categoryAndMediumData[i].category;
            if (!_.find(yearItems, ['filter_id', categoryAndMediumData[i].year_exam])) {
                yearItems.push({
                    filter_id: categoryAndMediumData[i].year_exam,
                    text: `${categoryAndMediumData[i].year_exam}`,
                    is_selected: filters.indexOf(categoryAndMediumData[i].year_exam.toString()) >= 0,
                    extra_params: {
                        selected_exam: categoryAndMediumData[i].year_exam.toString(),
                        display_name: categoryAndMediumData[i].year_exam.toString(),
                        option_position: categoryItems.length.toString(),
                        screen_name: 'category_listing_page',
                    },
                });
            }
            if (!_.find(mediumItems, ['filter_id', `${categoryAndMediumData[i].meta_info} Med`])) {
                mediumItems.push({
                    filter_id: `${categoryAndMediumData[i].meta_info} Med`,
                    text: Data.getCourseMediumByLocale(locale)[categoryAndMediumData[i].meta_info] || categoryAndMediumData[i].meta_info,
                    is_selected: filters.indexOf(`${categoryAndMediumData[i].meta_info} Med`) >= 0,
                    extra_params: {
                        selected_exam: `${categoryAndMediumData[i].meta_info} Med`,
                        display_name: Data.getCourseMediumByLocale(locale)[categoryAndMediumData[i].meta_info] || categoryAndMediumData[i].meta_info,
                        option_position: categoryItems.length.toString(),
                        screen_name: 'category_listing_page',
                    },
                });
            }
        }
        if (!_.find(categoryItems, ['filter_id', categoryAndMediumData[i].category])) {
            categoryItems.push({
                filter_id: categoryAndMediumData[i].category,
                text: categoryAndMediumData[i].category.split('_')[0],
                is_selected: filters.indexOf(categoryAndMediumData[i].category) >= 0,
                extra_params: {
                    selected_exam: categoryAndMediumData[i].category,
                    display_name: categoryAndMediumData[i].category.split('_')[0],
                    option_position: categoryItems.length.toString(),
                    screen_name: 'category_listing_page',
                },
            });
        }
    }
    if (!filterCategory) {
        let defaultSingleCategory = +studentClass === 14 > -1 ? ['UPTET_CT'] : ['CBSE Boards'];
        if (+studentClass === 13) {
            defaultSingleCategory = ['IIT JEE_CT'];
        }
        filterCategory = currentCategoryIndex !== -1 ? [category] : defaultSingleCategory;
        for (let i = 0; i < categoryItems.length; i++) {
            if (filterCategory.indexOf(categoryItems[i].filter_id) > -1) {
                categoryItems[i].is_selected = true;
                const courseMediums = categoryAndMediumData.filter((e) => filterCategory.indexOf(e.category) > -1);
                courseMediums.forEach((e) => {
                    if (!_.find(mediumItems, ['filter_id', `${e.meta_info} Med`])) {
                        mediumItems.push({
                            filter_id: `${e.meta_info} Med`,
                            text: Data.getCourseMediumByLocale(locale)[e.meta_info] || e.meta_info,
                            is_selected: filters.indexOf(`${e.meta_info} Med`) >= 0,
                            extra_params: {
                                selected_exam: `${categoryAndMediumData[i].meta_info} Med`,
                                display_name: Data.getCourseMediumByLocale(locale)[categoryAndMediumData[i].meta_info] || categoryAndMediumData[i].meta_info,
                                option_position: categoryItems.length.toString(),
                                screen_name: 'category_listing_page',
                            },
                        });
                    }
                    if (!_.find(yearItems, ['filter_id', e.year_exam])) {
                        yearItems.push({
                            filter_id: e.year_exam,
                            text: `${e.year_exam}`,
                            is_selected: filters.indexOf(e.year_exam.toString()) >= 0,
                            extra_params: {
                                selected_exam: categoryAndMediumData[i].year_exam.toString(),
                                display_name: categoryAndMediumData[i].year_exam.toString(),
                                option_position: categoryItems.length.toString(),
                                screen_name: 'category_listing_page',
                            },
                        });
                    }
                });
            }
        }
    }
    const items = [
        {
            filter_title: locale === 'hi' ? 'परीक्षा' : 'Exam',
            filter_items: categoryItems,
            is_multi_select: isMultiSelect,
            is_exam_filter: true,
            is_selected: false,
            extra_params: {
                selected_exam: 'Exam',
                widget_type: 'category_filter',
                screen_name: 'category_listing_page',
                parent_position: '0',
            },
        },
        {
            filter_title: locale === 'hi' ? 'Year' : 'Year',
            filter_items: yearItems,
            is_multi_select: isMultiSelect,
            is_exam_filter: true,
            is_selected: false,
            extra_params: {
                selected_exam: 'Year',
                widget_type: 'category_filter',
                screen_name: 'category_listing_page',
                parent_position: '1',
            },
        },
        {
            filter_title: locale === 'hi' ? 'माध्यम' : 'Medium',
            filter_items: mediumItems,
            is_multi_select: isMultiSelect,
            is_exam_filter: false,
            is_selected: false,
            extra_params: {
                selected_exam: 'Medium',
                widget_type: 'category_filter',
                screen_name: 'category_listing_page',
                parent_position: '2',
            },
        },
    ];
    return {
        type: 'category_filters_v2',
        is_sticky: true,
        data: {
            show_exam_bottom_sheet: false,
            exam_bottom_sheet_title: '',
            exam_bottom_sheet_action: '',
            items,
        },
    };
}

async function homeBanner(db, studentClass, locale, category) {
    try {
        let response = {};
        const bannerData = await CourseMysqlv2.getTopBannersNewClp(db.mysql.read, category, studentClass, locale);

        if (!_.isEmpty(bannerData)) {
            const bannerList = [];
            for (const banner of bannerData) {
                const data = {
                    id: banner.id.toString(),
                    image: banner.image_url,
                    deeplink: banner.action_data,
                    card_width: '1.3',
                    card_ratio: '5:3',
                };
                const obj = {
                    type: 'auto_scroll_home_banner',
                    data,
                    extra_params: {
                        source: 'category_listing_page',
                        position: bannerList.length.toString(),
                        widget_type: 'auto_scroll_category_banner',
                        id: banner.id.toString(),
                    },
                };
                bannerList.push(obj);
            }
            response = {
                widget_type: 'widget_parent',
                data_type: 'long_banner',
                widget_data: {
                    autoplay_duration: 2000,
                    remove_padding: true,
                    scroll_direction: 'horizontal',
                    items: bannerList,
                },
            };
        }
        return response;
    } catch (e) {
        console.error(e);
        return {};
    }
}

async function getTopVideosBySubject(db, studentId, stClass, locale, ccmIdList, versionCode, page = 'STUDENT_PROFILE') {
    const subjectStartDate = moment().subtract(10, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD hh:mm:ss');
    const subjectEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');
    const qidStartDate = moment().subtract(30, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD hh:mm:ss');
    const qidEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');

    const subjectList = await PznContainer.getSubjectListByTotalEt(studentId, subjectStartDate, subjectEndDate);

    if (+versionCode >= 967) {
        const profileMostWatchedSubjectOrder = {
            '6_10': ['MATHS', 'SCIENCE', 'ENGLISH', 'SOCIAL SCIENCE', 'ENGLISH GRAMMAR'],
            '11_12': ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH', 'ENGLISH GRAMMAR', 'COMPUTER'],
            14: ['MATHS', 'REASONING', 'ENGLISH', 'SCIENCE', 'POLITY', 'HISTORY', 'ECONOMICS', 'GEOGRAPHY', 'GENERAL AWARENESS', 'GENERAL STUDIES'],
        };
        const dataObj = {
            class: +stClass || 12,
            start_date: `${qidStartDate}`,
            end_date: `${qidEndDate}`,
            languages: locale === 'hi' ? ['HINDI'] : ['ENGLISH'],
        };
        if (ccmIdList.length) {
            dataObj.ccm_ids = ccmIdList;
        }
        dataObj.subjects = profileMostWatchedSubjectOrder['11_12'];
        if (_.includes([6, 7, 8, 9, 10], +stClass)) {
            dataObj.subjects = profileMostWatchedSubjectOrder['6_10'];
        } else if (+stClass === 14) {
            dataObj.subjects = profileMostWatchedSubjectOrder['14'];
        }

        const mostWatchedData = await PznContainer.getQuestionByMaxEngageTime(dataObj);
        if (mostWatchedData !== null) {
            const promise = [];
            for (let i = 0; i < mostWatchedData.length; i++) {
                promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(db, mostWatchedData[i]));
            }
            const liveClassData = await Promise.all(promise);
            const data = bottomSheetDataFormat(mostWatchedData, liveClassData, 0);
            for (let i = 0; i < data.widget_data.items.length; i++) {
                data.widget_data.items[i].extra_params = {
                    source: 'category_listing_page',
                    qid: data.widget_data.items[i].data.assortment_id.toString(),
                    ID: data.widget_data.items[i].group_id,
                };
            }
            if (data.widget_data.items.length) {
                data.widget_data.title = locale === 'hi' ? 'इस श्रेणी से संबंधित <font color="#e34c4c"><b>डेमो</b></font> क्लासेज' : '<font color="#e34c4c"><b>Demo</b></font> classes related to this category';
                const widgetTabs = {};
                for (let i = 0; i < data.widget_data.items.length; i++) {
                    data.widget_data.items[i].data.subject = locale === 'hi' ? Data.freeLiveClassTab.localisedData[data.widget_data.items[i].data.subject.toLowerCase()] : data.widget_data.items[i].data.subject;
                    data.widget_data.items[i].data.page = page;
                    data.widget_data.items[i].data.views = locale === 'hi' ? `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} स्टूडेंट्स ने देखा` : `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} students watched`;
                    if (+versionCode <= 971) {
                        data.widget_data.items[i].data.views = null;
                        data.widget_data.items[i].data.bottom_layout.title = data.widget_data.items[i].data.bottom_layout.title_replace || '';
                        data.widget_data.items[i].data.bottom_layout.sub_title = locale === 'hi' ? `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} स्टूडेंट्स ने देखा` : `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} students watched`;
                    }
                }
                data.widget_data.tabs.forEach((x) => {
                    widgetTabs[x.key] = x;
                });
                const finalTabs = [];
                const actions = [];

                if (subjectList && subjectList.length) {
                    for (let i = 0; i < subjectList.length; i++) {
                        if (widgetTabs[subjectList[i].toLowerCase()]) {
                            finalTabs.push({
                                key: widgetTabs[subjectList[i].toLowerCase()].key,
                                title: locale === 'hi' ? Data.freeLiveClassTab.localisedData[subjectList[i].toLowerCase()] : widgetTabs[subjectList[i].toLowerCase()].title,
                                is_selected: false,
                                extra_params: {
                                    widget: 'FilterSubjectWidget',
                                    page_type: 'demo_classes',
                                    source: 'category_listing_page',
                                    ID: widgetTabs[subjectList[i].toLowerCase()].key,
                                },
                            });
                            actions.push({
                                group_id: widgetTabs[subjectList[i].toLowerCase()].key,
                                text_one: locale === 'hi' ? 'फ्री क्लासेस देखें' : 'Explore Free classes  >',
                                text_one_size: '12',
                                text_one_color: '#eb532c',
                                bg_stroke_color: '#eb532c',
                                deeplink: 'doubtnutapp://library_tab?id=1&tag=free_classes',
                                extra_params: {
                                    parent_screen_name: 'category_listing_page',
                                    ID: widgetTabs[subjectList[i].toLowerCase()].key,
                                    cta_text: locale === 'hi' ? 'फ्री क्लासेस देखें' : 'Explore Free classes  >',
                                },
                            });
                            delete widgetTabs[subjectList[i].toLowerCase()];
                        }
                    }
                }
                for (let i = 0; i < dataObj.subjects.length; i++) {
                    if (widgetTabs[dataObj.subjects[i].toLowerCase()]) {
                        finalTabs.push({
                            key: widgetTabs[dataObj.subjects[i].toLowerCase()].key,
                            title: locale === 'hi' ? Data.freeLiveClassTab.localisedData[dataObj.subjects[i].toLowerCase()] : widgetTabs[dataObj.subjects[i].toLowerCase()].title,
                            is_selected: false,
                            extra_params: {
                                widget: 'FilterSubjectWidget',
                                page_type: 'demo_classes',
                                source: 'category_listing_page',
                                ID: widgetTabs[dataObj.subjects[i].toLowerCase()].key,
                            },
                        });
                        actions.push({
                            group_id: widgetTabs[dataObj.subjects[i].toLowerCase()].key,
                            text_one: locale === 'hi' ? 'फ्री क्लासेस देखें' : 'Explore Free classes  >',
                            text_one_size: '12',
                            text_one_color: '#eb532c',
                            bg_stroke_color: '#eb532c',
                            deeplink: 'doubtnutapp://library_tab?id=1&tag=free_classes',
                            extra_params: {
                                parent_screen_name: 'category_listing_page',
                                ID: widgetTabs[dataObj.subjects[i].toLowerCase()].key,
                                cta_text: locale === 'hi' ? 'फ्री क्लासेस देखें' : 'Explore Free classes  >',
                            },
                        });
                    }
                }
                finalTabs[0].is_selected = true;
                data.widget_data.tabs = finalTabs;
                data.widget_data.actions = actions;
                data.extra_params = { page_type: 'demo_classes', source: 'new_clp_continue_watching' };
                return [data];
            }
        }
    }
    return null;
}

async function getDataForPopularCourseCarouselNewCLP({
    db,
    studentClass,
    versionCode,
    studentId,
    xAuthToken,
    page,
    hitFlagr = true,
    prevFlagrResponse,
    userCourseAssortments,
    filterCategory,
    filterMedium,
}) {
    try {
        let studentCcmAssortments = [];
        const assortmentList = [];
        const flagrData = { xAuthToken, body: { capabilities: { pricing_experiment_78895: {} } } };
        if (page === 'SIMILAR') {
            flagrData.body.capabilities.similar_popular_course_carousel = {};
        }
        if (page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') {
            flagrData.body.capabilities.suggested_courses_for_you = {};
        }
        flagrData.body.capabilities.popular_course_exp_ccmid_locale = {};
        let flagrResponse;
        if (page !== 'SCHOLARSHIP_PAGE' && hitFlagr) {
            flagrResponse = await UtilityFlagr.getFlagrResp(flagrData);
        }
        if (page === 'CATEGORY_LIST' && flagrResponse) {
            flagrResponse.popular_courses_algo = { payload: { enabled: false, locale: false } };
        }
        if (!hitFlagr) {
            flagrResponse = prevFlagrResponse;
        }

        const studentCcmData = await ClassCourseMappingContainer.getCoursesClassCourseMappingExtraMarks(db, studentId);
        let data = [];
        // get data from db here based on class value
        if ((page === 'SIMILAR' && _.get(flagrResponse, 'similar_popular_course_carousel.payload.enabled', null) && _.get(flagrResponse, 'similar_popular_course_carousel.payload.widget_type', null) !== 0) || page === 'HOMEPAGE_V1' || ((page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') && _.get(flagrResponse, 'suggested_courses_for_you.payload.enabled', null))) {
            data = await CourseMysqlv2.getCoursesForHomepageWithThumbnailsByCategory(db.mysql.read, studentClass, filterMedium, 'widget_popular_course', +versionCode);
        } else {
            data = await CourseContainerv2.getCoursesForHomepageByCategory(db, studentClass, filterMedium);
            if (filterMedium === 'en') {
                data = data.filter((item) => item.course_language === 'ENGLISH');
            } else if (filterMedium === 'hi') {
                data = data.filter((item) => item.course_language === 'HINDI');
            }
        }
        data = data.filter((e) => userCourseAssortments.indexOf(e.assortment_id) < 0);
        const otherAssortments = [];

        if (+studentClass === 14) {
            studentCcmAssortments = data;
        } else {
            data.forEach((item) => {
                if (_.find(studentCcmData, ['category', item.category]) && studentCcmData.length) {
                    studentCcmAssortments.push(item);
                } else if ((_.find(studentCcmData, ['category', 'IIT JEE']) || _.find(studentCcmData, ['category', 'NEET'])) && item.category === 'IIT JEE|NEET|FOUNDATION') {
                    studentCcmAssortments.push(item);
                } else if (_.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA', 'BOARDS', 'For All', 'IIT JEE|NEET|FOUNDATION'], item.category)) {
                    otherAssortments.push(item);
                }
            });
        }
        if (!studentCcmAssortments.length || !studentCcmData.length) {
            studentCcmAssortments = otherAssortments;
        }
        studentCcmAssortments.sort((x, y) => x.priority - y.priority);
        studentCcmAssortments.forEach((item) => assortmentList.push(item.assortment_id));
        // fetch name, thumbnail of courses from batch table
        if (assortmentList.length) {
            const batchDetails = await getBatchDetailsByAssortmentListAndStudentId(db, studentId, assortmentList);
            for (let i = 0; i < studentCcmAssortments.length; i++) {
                const batchDetail = batchDetails[studentCcmAssortments[i].assortment_id];
                if (batchDetail) {
                    studentCcmAssortments[i].display_name = batchDetail.display_name || studentCcmAssortments[i].display_name;
                    studentCcmAssortments[i].display_description = batchDetail.display_description || studentCcmAssortments[i].display_description;
                    studentCcmAssortments[i].demo_video_thumbnail = batchDetail.demo_video_thumbnail || studentCcmAssortments[i].demo_video_thumbnail;
                }
            }
        }
        // check if class locale, assortment id exist in table , then move it to first position
        const priorityAssortmentList = await CourseContainerv2.getClassLocaleAssortments(db, studentClass, filterMedium);
        const groupedByAssortment = _.groupBy(priorityAssortmentList, 'assortment_id');

        for (let i = 0; i < studentCcmAssortments.length; i++) {
            if (typeof groupedByAssortment[studentCcmAssortments[i].assortment_id] !== 'undefined' && i !== 0) {
                move(studentCcmAssortments, i, 0);
            }
        }

        const selectedCategoryData = data.filter((e) => e.category === filterCategory);
        for (let i = 0; i < selectedCategoryData.length; i++) {
            assortmentList.push(selectedCategoryData[i].assortment_id);
            if (typeof groupedByAssortment[selectedCategoryData[i].assortment_id] !== 'undefined' && i !== 0) {
                move(selectedCategoryData, i, 0);
            }
        }

        studentCcmAssortments = [...selectedCategoryData, ...studentCcmAssortments];
        studentCcmAssortments = studentCcmAssortments.filter((value, index, self) => index === self.findIndex((t) => (t.assortment_id === value.assortment_id)));
        const assortmentPriceMapping = await generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
        return {
            studentCcmAssortments,
            flagrResponse,
            assortmentList,
            assortmentPriceMapping,
        };
    } catch (e) {
        console.log(e);
    }
}

async function getPaidAssortmentsDataNewCLP({
    db,
    studentClass,
    config,
    versionCode,
    studentId,
    studentLocale,
    xAuthToken,
    page,
    eventPage,
    pznElasticSearchInstance,
    hitFlagr = true,
    prevFlagrResponse,
    data,
    filterCategory,
    filterMedium,
}) {
    try {
        filterMedium = filterMedium.replace(' Med', '');
        filterMedium = filterMedium === 'HINDI' ? 'hi' : 'en';
        const variantInfo = [];
        const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
        // * User assortment mapping to payment state
        const userCourseAssortments = [];
        userActivePackages.map((item) => userCourseAssortments.push(item.assortment_id));
        const userAssortmentPaymentState = userActivePackages.reduce((acc, item) => ({
            ...acc,
            [item.assortment_id]: {
                isTrial: item.amount === -1,
                isVip: item.amount !== -1,
                timeLeft: moment(item.end_date).diff(new Date(), 'hours'),
            },
        }), {});
        let {
            // eslint-disable-next-line prefer-const
            studentCcmAssortments, flagrResponse, assortmentPriceMapping, assortmentList,
        } = await getDataForPopularCourseCarouselNewCLP({
            db,
            studentClass,
            versionCode,
            studentId,
            xAuthToken,
            page,
            pznElasticSearchInstance,
            hitFlagr,
            prevFlagrResponse,
            userCourseAssortments,
            filterCategory,
            filterMedium,
        });
        if (!_.isNull(data) && !_.isEmpty(data)) {
            studentCcmAssortments = data;
        }
        const promises = [];
        // const assortmentFlagrResponse = await getFlagrResponseByFlagKey(xAuthToken, 'popular_courses_thumbnails');
        for (let i = 0; i < studentCcmAssortments.length; i++) {
            const paymentCardState = {
                isVip: false,
                isTrial: false,
            };
            if (userCourseAssortments.indexOf(studentCcmAssortments[i].assortment_id) >= 0) {
                if (versionCode <= 872) {
                    paymentCardState.isVip = true;
                } else {
                    paymentCardState.isVip = userAssortmentPaymentState[studentCcmAssortments[i].assortment_id].isVip;
                    paymentCardState.isTrial = userAssortmentPaymentState[studentCcmAssortments[i].assortment_id].isTrial;
                    paymentCardState.timeLeft = userAssortmentPaymentState[studentCcmAssortments[i].assortment_id].timeLeft;
                }
            }
            if (_.includes(['course', 'class', 'course_bundle'], studentCcmAssortments[i].assortment_type)) {
                const setWidth = page && !page.includes('CATEGORY_LIST') ? true : null;
                let priceFilter = true;
                if (page && page.includes('CATEGORY_LIST_DEEPLINK') && page.split('_').length > 3) {
                    priceFilter = assortmentPriceMapping[studentCcmAssortments[i].assortment_id].display_price >= page.split('_')[3];
                }
                if (priceFilter) {
                    promises.push(generateAssortmentObject({
                        data: studentCcmAssortments[i],
                        config,
                        paymentCardState,
                        assortmentPriceMapping,
                        db,
                        setWidth,
                        versionCode,
                        assortmentFlagrResponse: flagrResponse,
                        locale: studentLocale,
                        category: page && page.includes('CATEGORY_LIST_DEEPLINK') ? studentCcmAssortments[i].category : null,
                        page,
                        eventPage,
                        studentId,
                    }));
                }
            }
        }
        if (_.get(flagrResponse, 'similar_popular_course_carousel.enabled', null)) {
            variantInfo.push({
                flag_name: 'similar_popular_course_carousel',
                variant_id: flagrResponse.similar_popular_course_carousel.variantId,
            });
        }
        if (_.get(flagrResponse, 'suggested_courses_for_you.enabled', null)) {
            variantInfo.push({
                flag_name: 'suggested_courses_for_you',
                variant_id: flagrResponse.suggested_courses_for_you.variantId,
            });
        }
        if (_.get(flagrResponse, 'pricing_experiment_78895.enabled', null)) {
            variantInfo.push({
                flag_name: 'pricing_experiment_78895',
                variant_id: flagrResponse.pricing_experiment_78895.variantId,
            });
        }
        const items = await Promise.all(promises);
        let newWidgetType = false;
        let widgetPosition = 0;
        let disabled = false;
        let widgetPlacement; // * on which page the experiment should work
        if (page === 'SIMILAR') {
            if (_.get(flagrResponse, 'similar_popular_course_carousel.payload.enabled', null)) {
                newWidgetType = _.get(flagrResponse, 'similar_popular_course_carousel.payload.widget_type', 0) !== 0;
                widgetPosition = _.get(flagrResponse, 'similar_popular_course_carousel.payload.position', null) || 0;
            }
            disabled = _.get(flagrResponse, 'similar_popular_course_carousel.payload.enabled', false) === false;
        } else if (page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') {
            newWidgetType = _.get(flagrResponse, 'suggested_courses_for_you.payload.enabled', null) || false;
            widgetPosition = _.get(flagrResponse, 'suggested_courses_for_you.payload.position', null) || 0;
            widgetPlacement = _.get(flagrResponse, 'suggested_courses_for_you.payload.placement', null);
        } else if (page === 'HOMEPAGE_V1') {
            newWidgetType = true;
            widgetPosition = 0;
        }
        return {
            items,
            assortmentList,
            variantInfo,
            new_widget_type: newWidgetType,
            widget_position: widgetPosition,
            disabled,
            widget_placement: widgetPlacement,
        };
    } catch (e) {
        console.log(e);
    }
}

function getTopperTestimonialWidget({
    carouselsData,
    result,
    locale,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            deeplink: result[i].question_id ? `doubtnutapp://video_dialog?question_id=${result[i].question_id}&orientation=portrait&page=WHATS_NEW_HOME` : '',
            image_url: result[i].image_url,
            extra_params: {
                Source: 'category_listing_page',
                QID: result[i].question_id ? result[i].question_id.toString() : '',
            },
        });
    }
    return {
        type: 'testimonial_v2',
        data: {
            title: carouselsData.title,
            course_data: [{
                count_text: '200k+',
                benefit_text: locale === 'hi' ? 'छात्रों को पढ़ाया' : 'Students taught',
            }, {
                count_text: '50k+',
                benefit_text: locale === 'hi' ? 'छात्रों ने 90%+ स्कोर किया' : 'Students scored 90%+',
            }, {
                count_text: '200+',
                benefit_text: locale === 'hi' ? 'हर रोज लाइव क्लास' : 'Live classes everyday',
            }],
            items,
        },
    };
}

function getTopTeachersCategory(category) {
    let categoryName = '';
    if (category.toLowerCase().includes('board')) {
        categoryName = 'BOARDS';
    } else if (category.toLowerCase().includes('iit')) {
        categoryName = 'IIT';
    } else if (category.toLowerCase().includes('neet')) {
        categoryName = 'NEET';
    } else if (category.toLowerCase().includes('nda')) {
        categoryName = 'NDA';
    }
    return categoryName;
}

async function getLiveClassTopTeachersData(db, stClass, locale, carouselData, versionCode, category) {
    const language = (locale && locale === 'hi') ? 'HINDI' : 'ENGLISH';
    const categoryfinal = getTopTeachersCategory(category);
    const facultyData = await CourseContainerv2.getLiveClassTopTeachersDataNewClp(db, stClass, language, categoryfinal) || [];
    const localisedData = _.cloneDeep(Data.freeLiveClassTab.localisedData);

    const promises = [];
    for (let i = 0; i < facultyData.length; i++) {
        promises.push(facultyData[i].faculty_id ? CourseContainerv2.getLiveClassTeachersLatestVideo(db, facultyData[i].faculty_id) : []);
    }
    const facultyLatestVideo = await Promise.all(promises);
    const dataList = [];
    for (let i = 0; i < facultyLatestVideo.length; i++) {
        if (facultyLatestVideo[i].length && facultyLatestVideo[i][0].faculty_id === facultyData[i].faculty_id) {
            let title = _.startCase(facultyData[i].faculty_name);
            if (facultyData[i].faculty_name) {
                title = _.startCase(facultyData[i].faculty_name);
                title = title.replace('Maam', "Ma'am");
            }
            const obj = {
                bg_color: _.sample(Data.freeLiveClassTab[carouselData.carousel_type].cardBgColor),
                deeplink: +versionCode >= 973 ? `doubtnutapp://teacher_channel?teacher_id=${facultyData[i].faculty_id}&type=internal` : `doubtnutapp://video?qid=${facultyLatestVideo[i][0].resource_reference}&page=LIVECLASS_FREE&playlist_id=null&video_start_position=0`,
                image_url: facultyData[i].image_url,
                title,
                title_text_size: '12',
                title_text_color: '#000000',
                bottom_title_text_size: '12',
                bottom_title_text_color: '#273de9',
                bottom_title: facultyData[i].subject_name_localised,
                extra_params: {
                    screen_category_id: 'category_listing_page',
                    position: dataList.length.toString(),
                    id: facultyData[i].faculty_id.toString(),
                },
            };
            if (carouselData.locale === 'hi' && obj.bottom_title) {
                obj.bottom_title = localisedData[facultyData[i].subject_name_localised.toLowerCase()] || facultyData[i].subject_name_localised;
            }
            const bottomItem = [];
            bottomItem.push({ title: carouselData.locale === 'hi' ? 'छात्रों को पढ़ाया' : 'Mentored', title_text_size: '10', title_text_color: '#504e4e' });
            bottomItem.push({ title: facultyData[i].students_mentored ? `${facultyData[i].students_mentored}+` : '---', title_text_size: '10', title_text_color: '#504e4e' });

            bottomItem.push({ title: carouselData.locale === 'hi' ? 'घंटे पढ़ाया' : 'Hours Taught', title_text_size: '10', title_text_color: '#504e4e' });
            bottomItem.push({ title: facultyData[i].experience_in_hours ? `${facultyData[i].experience_in_hours}+` : '---', title_text_size: '10', title_text_color: '#504e4e' });

            obj.items = bottomItem;
            dataList.push(obj);
        }
    }
    if (dataList.length) {
        const teacherData = {
            widget_type: carouselData.carousel_type,
            data: {
                title: carouselData.title,
                title_text_size: '16',
                title_text_color: '#000000',
                items: dataList,
            },
            extra_params: { screen_category_id: 'category_listing_page' },
            layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
        };
        return [teacherData];
    }
    return [];
}

function getCategoryIconsForNewClpPage({
    allCategories,
    studentClass,
    versionCode,
    studentCategoryData,
}) {
    const items = [];
    const studentCategory = studentCategoryData.length ? studentCategoryData[0].category : '';
    const requiredCategories = [];
    for (let i = 0; i < allCategories.length; i++) {
        if (_.includes(['IIT JEE', 'NEET'], allCategories[i].id)) {
            requiredCategories.push(allCategories[i]);
        } else if (_.includes([studentCategory, 'CBSE Boards'], allCategories[i].id)) {
            requiredCategories.push(allCategories[i]);
        }
    }
    allCategories = requiredCategories;
    for (let i = 0; i < allCategories.length; i++) {
        const obj = {
            type: 'image_card',
            data: {
                id: allCategories[i].id,
                card_width: '4.1',
                image_url: versionCode > 934 ? liveclassData.getcategoryIcons(allCategories[i].id, versionCode) : allCategories[i].image_url || liveclassData.getcategoryIcons(allCategories[i].id, versionCode),
                deeplink: `doubtnutapp://course_category?category_id=new_clp||${allCategories[i].id === 'NDA' ? 'DEFENCE/NDA/NAVY_CT' : allCategories[i].id}&title=Category Page`,
            },
            extra_params: {
                be_source: 'HOMEPAGE',
                widget_type: 'widget_course_v2',
            },
        };
        if (allCategories[i].id === 'Kota Classes' && !_.includes([6, 7, 8], +studentClass) && allCategories[i].id !== 'State Boards') {
            items.push(obj);
        } else if (!(_.includes([6, 7, 8], +studentClass) && allCategories[i].id === 'Kota Classes') && allCategories[i].id !== 'State Boards') {
            items.push(obj);
        }
    }
    items.push({
        type: 'image_card',
        data: {
            id: 'others',
            card_width: '4.1',
            deeplink: 'doubtnutapp://course_category?category_id=new_clp||others&title=Category Page',
            image_url: liveclassData.getcategoryIcons('Other Boards', versionCode),
        },
        extra_params: {
            be_source: 'HOMEPAGE',
            widget_type: 'widget_course_v2',
        },
    });
    items.push({
        type: 'image_card',
        data: {
            id: 'Spoken English',
            card_width: '4.1',
            deeplink: 'doubtnutapp://course_category?category_id=new_clp||SPOKEN ENGLISH_CT&title=Category Page',
            image_url: liveclassData.getcategoryIcons('Spoken English', versionCode),
        },
        extra_params: {
            be_source: 'HOMEPAGE',
            widget_type: 'widget_course_v2',
        },
    });
    return items;
}

function getListIconsForNewClpPage({
    freeAssortments,
    vipCourses,
}) {
    const items = [];
    items.push({
        type: 'image_card',
        data: {
            id: 'classes',
            card_width: '4.1',
            deeplink: `doubtnutapp://course_detail_info?tab=recent&assortment_id=${freeAssortments}`,
            image_url: liveclassData.newClpClasses,
        },
    });
    items.push({
        type: 'image_card',
        data: {
            id: 'mock_tests',
            card_width: '4.1',
            deeplink: vipCourses.length ? 'doubtnutapp://library_tab?library_screen_selected_Tab=5&tag=mock_test' : 'doubtnutapp://library_tab?library_screen_selected_Tab=4&tag=mock_test',
            image_url: liveclassData.newClpMock,
        },
    });
    items.push({
        type: 'image_card',
        data: {
            id: 'pdf_notes',
            card_width: '4.1',
            deeplink: `doubtnutapp://course_detail_info?tab=notes&assortment_id=${freeAssortments}`,
            image_url: liveclassData.newClpPdf,
        },
    });
    return items;
}

function getNewClpFAQs(data, locale, videoResource, newDemoVideoExperiment, demo, versionCode, qId) {
    let textSee;
    if (newDemoVideoExperiment && versionCode > 869) {
        textSee = locale === 'hi' ? 'इसकी वीडियो देखें  ' : 'Play Video for this';
    } else {
        textSee = locale === 'hi' ? 'देखें कैसे ' : 'See How';
    }
    const items = data.map((item) => {
        const itemObj = {};
        itemObj.title = item.question;
        itemObj.description = item.answer;
        if (item.offset_time) {
            if (newDemoVideoExperiment && !demo && versionCode > 869) {
                itemObj.video_info = {
                    qid: qId,
                    page: 'COURSE_DETAIL',
                    text: textSee,
                };
                itemObj.video_info.video_resources = [...videoResource];
                itemObj.video_info.video_resources[0] = { ...itemObj.video_info.video_resources[0], offset: item.offset_time };
            } else {
                itemObj.video_info = {
                    position: `${item.offset_time}`,
                    text: locale === 'hi' ? 'देखें कैसे ' : 'See How',
                };
            }
        }
        return itemObj;
    });
    if (items.length > 0) {
        items[0].toggle = true;
    }
    return {
        type: 'course_faqs',
        data: {
            title: locale === 'hi' ? 'कोर्स की विस्तृत जानकारी' : 'FAQs',
            description: locale === 'hi' ? 'इस कोर्स के बारे में अधिक जानें ' : 'Learn More about this course',
            toggle: false,
            items,
        },
    };
}

async function getResponseForNewCategoryListingPage({
    db, studentClass, filters = [], category, assortmentFlagrResponse, locale, config, studentID, versionCode, vipCourses, page, studentCcmData = [], xAuthToken, pznElasticSearchInstance,
}) {
    let categoryId = category;
    if (_.includes(['IIT JEE', 'NEET', 'NDA'], category)) {
        categoryId = category === 'NDA' ? 'DEFENCE/NDA/NAVY_CT' : category.concat('_CT');
    }
    const filtersData = await getFiltersForNewCategoryPage({
        db, studentClass, filters, category: categoryId, assortmentFlagrResponse, locale,
    });
    const widgets = [];
    if (+page === 1) {
        widgets.push(filtersData);
        const filterCategory = [];
        const filterMedium = [];
        const filterYear = [];
        filtersData.data.items[0].filter_items.forEach((e) => {
            if (e.is_selected) {
                filterCategory.push(e.filter_id);
            }
        });
        filtersData.data.items[1].filter_items.forEach((e) => {
            if (e.is_selected) {
                filterYear.push(e.filter_id);
            }
        });
        filtersData.data.items[2].filter_items.forEach((e) => {
            if (e.is_selected) {
                filterMedium.push(e.filter_id);
            }
        });
        if (filterMedium.length > 0) {
            locale = filterMedium[0] === 'HINDI Med' ? 'hi' : 'en';
        }
        if (!filterMedium.length) {
            const temp = locale === 'hi' ? 'HINDI Med' : 'ENGLISH Med';
            filterMedium.push(temp);
        }
        const course = await CourseMysqlv2.getCourseListForNewCategoryPage(db.mysql.read, studentClass, locale === 'hi' ? 'HINDI' : 'ENGLISH');
        const freeAssortmentsList = course.map((item) => item.assortment_id);
        if (filterCategory.length && filterCategory[0].includes('_CT')) {
            filterCategory[0] = filterCategory[0].replace('_CT', '');
        }
        const ccmIdList = [];
        studentCcmData.forEach((element) => {
            ccmIdList.push(element.id);
        });
        // new clp banner
        const bannerData = await homeBanner(db, studentClass, locale, filterCategory[0]);
        if (bannerData && bannerData.widget_data && bannerData.widget_data.items && bannerData.widget_data.items.length) {
            widgets.push(bannerData);
        }
        // new clp demo classes
        const demoClasses = await getTopVideosBySubject(db, studentID, studentClass || 12, locale || 'en', ccmIdList, versionCode);
        if (demoClasses && demoClasses.length && demoClasses[0].widget_data && demoClasses[0].widget_data.items && demoClasses[0].widget_data.items.length) {
            widgets.push(demoClasses[0]);
        }
        // best selling courses
        let paidCourses = await getPaidAssortmentsDataNewCLP({
            db,
            studentClass,
            studentLocale: locale,
            config,
            versionCode,
            studentId: studentID,
            xAuthToken,
            page: 'HOMEPAGE',
            pznElasticSearchInstance,
            filterCategory: filterCategory[0],
            filterMedium: filterMedium[0],
        });
        paidCourses = paidCourses ? paidCourses.items : [];
        if (paidCourses.length) {
            for (let i = 0; i < paidCourses.length; i++) {
                let text = paidCourses[i].data.duration_text.split('#');
                text = text[text.length - 1];
                paidCourses[i].extra_params = {
                    parent_screen_name: 'RESULT_PAGE',
                    position: i.toString(),
                    assortment_id: paidCourses[i].data.assortment_id.toString(),
                    course_id: text,
                };
            }
            const finalWidget = {
                widget_data: {
                    title: locale === 'hi' ? 'सबसे ज्यादा बिकने वाले कोर्स' : 'Best Selling Courses',
                    items: paidCourses,
                    is_title_bold: true,
                    is_et_reorder: true,
                },
                widget_type: 'widget_parent',
                layout_config: {
                    margin_top: 0,
                    margin_right: 0,
                    bg_color: '#ffffff',
                },
            };
            widgets.push(finalWidget);
        }
        // Study material related to this course
        const studyMaterial = getListIconsForNewClpPage({
            freeAssortments: freeAssortmentsList.join(','),
            vipCourses,
        });

        for (let i = 0; i < studyMaterial.length; i++) {
            studyMaterial[i].extra_params = {
                widget_type: 'study_material_filter',
                source: 'category_listing_page',
                category: studyMaterial[i].data.id.toString(),
                position: i.toString(),
            };
        }
        if (studyMaterial.length) {
            widgets.push({
                type: 'widget_parent',
                data: {
                    title: locale === 'hi' ? 'इस पाठ्यक्रम से संबंधित अध्ययन सामग्री' : 'Study material related to this course',
                    items: studyMaterial,
                    is_title_bold: true,
                },
            });
        }
        // most popular teachers
        const carouselData = {
            carousel_type: 'widget_classes_by_teacher',
            title: locale === 'hi' ? 'डाउटनट के बेस्ट टीचर्स' : 'Doubtnut ke Best teachers',
            locale,
        };
        const mostPopularTeachers = await getLiveClassTopTeachersData(db, studentClass, locale, carouselData, versionCode, filterCategory[0]);
        if (mostPopularTeachers.length && mostPopularTeachers[0].data && mostPopularTeachers[0].data.items && mostPopularTeachers[0].data.items.length) {
            widgets.push(mostPopularTeachers[0]);
        }
        // topper banner
        const bannerDetails = await CourseMysqlv2.getBannersForNewClp(db.mysql.read, filterCategory[0], studentClass, locale);
        if (bannerDetails.length) {
            const obj = {
                type: 'promo_list',
                data: {
                    items: [
                        {
                            image_url: buildStaticCdnUrl(bannerDetails[0].image_url),
                            scale_type: 'FIT_XY',
                        },
                    ],
                    ratio: '1:1',
                },
                layout_config: {
                    margin_top: 10,
                    margin_left: 12,
                    margin_right: 12,
                },
            };
            widgets.push(obj);
        }
        // hear from our toppers
        const result = await CourseMysqlv2.getTopperTestimonialNewClp(db.mysql.read);
        if ([9, 10].includes(+studentClass)) {
            result.sort((a, b) => parseInt(a.class) - parseInt(b.class));
        } else {
            result.sort((a, b) => parseInt(b.class) - parseInt(a.class));
        }
        if (result.length) {
            const carouselsDataNew = {
                title: locale === 'hi' ? 'हमारे टॉपर्स से सुनें' : 'Hear from our toppers',
            };
            const hearTopper = getTopperTestimonialWidget({
                carouselsData: carouselsDataNew,
                result,
                locale,
            });
            widgets.push(hearTopper);
        }
        // faq widget
        const newBucket = `new_clp_${studentClass} ${filterCategory}`;
        const faqsData = await CourseMysqlv2.getFAQsForClp(db.mysql.read, newBucket, locale === 'hi' ? locale : 'en');
        if (faqsData.length) {
            const widgetData = getNewClpFAQs(faqsData, locale, [], true, false, versionCode, null);
            widgetData.extra_params = {
                source: 'category_listing_page',
            };
            widgets.push(widgetData);
        }
        // button
        widgets.push({
            data: {
                text_one: locale === 'hi' ? 'मुझे इस कोर्स में दिलचस्पी है' : 'I am interested in courses',
                text_one_size: '14',
                text_one_color: '#ffffff',
                bg_color: '#eb532c',
                bg_stroke_color: '#eb532c',
                assortment_id: '',
                deep_link: '',
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '36',
                deeplink: 'doubtnutapp://dialer?mobile=01247158250',
            },
            type: 'widget_button_border',
            layout_config: {
                margin_top: 0,
                margin_left: 0,
                margin_right: 0,
                margin_bottom: 0,
            },
            extra_params: {
                source: 'category_listing_page',
            },
        });
        return widgets;
    }
    return widgets;
}

async function getTeacherSubscription({ db, teacherList, isInternal }) {
    const subsTotalPromises = [];
    for (let i = 0; i < teacherList.length; i++) {
        if (isInternal) {
            subsTotalPromises.push(TeacherContainer.getSubsTotalInternal(db, teacherList[i].faculty_id));
        } else {
            subsTotalPromises.push(TeacherContainer.getSubsTotal(db, teacherList[i].teacher_id));
        }
    }
    const setteledPromise2 = await Promise.allSettled(subsTotalPromises);
    const subsTotal = setteledPromise2.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
    return subsTotal;
}

module.exports = {
    getLikesCountAndDurationOfQid,
    getNextChapterQuestionID,
    getLectureSeriesByQuestionID,
    getliveClassForUserCourse,
    getPackagesForAssortment,
    getBatchByAssortmentIdAndStudentId,
    getBatchByAssortmentListAndStudentId,
    getFiltersForCategoryPage,
    checkUserPackageRenewals,
    getEtoosFacultyByCCM,
    setPlaylistOfUserForEtoos,
    getCoursePageResponse,
    getBuyButton,
    numberWithCommas,
    generateStructuredCourseDataV1,
    generateStructuredCourseDataV2,
    generateTopicObject,
    getPaymentCardStateV2,
    getResourcesByAssortmentList,
    modifyObj,
    generateFlagrResponse,
    createEmiObject,
    getAllAssortmentsRecursively,
    checkVipByResourceReference,
    getParentAssortmentListV1,
    generateAssortmentVariantMapping,
    getCourseTabs,
    getAssortmentsByResourceList,
    getQuiz,
    postTasks,
    getNotesData,
    emiReminderData,
    getTimetableData,
    getPaidAssortmentsData,
    resourcesToBundlePageExperiment,
    getLiveclassCarouselLatest,
    generateResourceVideoViewData,
    getAllAssortments,
    getPaymentDeeplink,
    checkVipByQuestionIdForVideoPage,
    generateHomeworkTriggerWidget,
    getNotesWidget,
    getPaidCoursesByClass,
    getVideosDataByScheduleType,
    generateHomeworkListWidget,
    generateAssortmentObject,
    getCoursesFromCcmArray,
    tgCheckOnStudent,
    getReferralMessage,
    getFlagrResponseByFlagKey,
    getNewCourseThumbnail,
    getCategoryFilters,
    generateBannerData,
    getCourseDataByCardId,
    getCourseDemoVideoData,
    getPrePurchaseCourseInfo,
    getPrePurchaseCourseFAQs,
    getPrePurchaseCourseFeatures,
    getPrePurchaseCourseTeachers,
    getPrePurchaseCourseTimetable,
    getPrePurchaseCourseEmiDetails,
    getAssortmentByCategory,
    getCategoryByStudentCCM,
    getTopicsData,
    getTrialWidget,
    getRelatedLectures,
    getBanners,
    setPostPurchaseExplainerVideo,
    getDemoVideosForEtoosFacultyCourse,
    getUserCoursesCarousel,
    pricingExperiment,
    getResponseForCategoryListingPage,
    getDifferenceAmountForUpgradeSubscription,
    getPrePurchaseSubjectFAQs,
    getUserChapterPDFSachetsCarousel,
    getDifferenceAmountForSwitchSubscription,
    getCallingCardWidget,
    getRewardBannerDeeplink,
    getCallingCardStatic,
    updateUserLastWatchedVideoInAssortmentProgress,
    checkUserPackageRenewalDueInMonth,
    generateRecommendedCourseWidget,
    getCoursePsudoSchedule,
    getNewCourseThumbnailv2,
    getDataForPopularCourseCarousel,
    paidUserChampionshipBottomNudge,
    getTrendingCourses,
    getTrendingCoursesCarousel,
    generateBannerDataV2,
    getResourcesForTimeline,
    practiceEnglishBottomsheetNudge,
    getChildAssortmentListRecursivelyV1,
    bottomSheetDataFormat,
    getCallingCardStaticV2,
    getCallingCardWidgetV2,
    bottomSheetDataFormatVideoPage,
    generateAssortmentVariantMappingForReferral,
    getPackagesForAssortmentReferral,
    getTimerExtraMarks,
    getDataForPopularCourseCarouselCampaign,
    generateAssortmentVariantMappingForAutosalesCampaign,
    getPackagesForAssortmentAutosalesCampaign,
    getResponseForNewCategoryListingPage,
    getCategoryIconsForNewClpPage,
    getTeacherSubscription,
};
