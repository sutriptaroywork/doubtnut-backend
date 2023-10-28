const _ = require('lodash');
const moment = require('moment');
const StudentRedis = require('../../modules/redis/student');
const CourseMysql = require('../../modules/mysql/coursev2');
const BranchMysql = require('../../modules/mysql/branch');
const Data = require('../../data/data');
const WalletUtil = require('../../modules/wallet/Utility.wallet');
const Utility = require('../../modules/utility');
const StudentContainer = require('../../modules/containers/student');
const smsData = require('../../data/sms.data');
const notificationData = require('../../data/notification.data');
const newtonNotifications = require('../../modules/newtonNotifications');
const QuestionMySql = require('../../modules/mysql/question');
const UtilityFlagr = require('../../modules/Utility.flagr');
const UtilityIP = require('../../modules/Utility.IP');
const CourseContainer = require('../../modules/containers/coursev2');
const Property = require('../../modules/mysql/property');
const StudentMysql = require('../../modules/student');
const altAppData = require('../../data/alt-app');
const CourseContainerv2 = require('../../modules/containers/coursev2');

async function trackStudentActiveDeviceIds(db, student_id, udid) {
    try {
        const promises = [];
        promises.push(StudentRedis.getActiveDeviceIds(db.redis.write, student_id));
        promises.push(CourseMysql.getDistinctClassWiseCoursesPurchasedByStudent(db.mysql.read, student_id));
        const resolvedPromises = await Promise.all(promises);
        if (_.isNull(resolvedPromises[0])) {
            StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udid);
        } else {
            const devicesAvailableCounter = resolvedPromises[1][0].class_count > 1 ? resolvedPromises[1][0].class_count : 1;
            const currentActiveDevices = resolvedPromises[0].split('#');
            if (currentActiveDevices.length < devicesAvailableCounter && !currentActiveDevices.includes(udid)) {
                currentActiveDevices.push(udid);
                const udids = currentActiveDevices.join('#');
                StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
            } else if (!currentActiveDevices.includes(udid)) {
                currentActiveDevices.shift();
                currentActiveDevices.push(udid);
                const udids = currentActiveDevices.join('#');
                StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
            }
        }
        return true;
    } catch (e) {
        console.log(e);
        return true;
    }
}

function getFirebaseAuthDecodedToken(token, headers, admins) {
    if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(headers)) {
        return admins.brainly_clone.auth().verifyIdToken(token);
    }
    if (Utility.isDnBiologyNeetCloneAppRequestOrigin(headers)) {
        return admins.biology_neet_clone.auth().verifyIdToken(token);
    }
    if (Utility.isDnIITJEECloneAppRequestOrigin(headers)) {
        return admins.maths_iitjee_clone.auth().verifyIdToken(token);
    }
    return admins.default.auth().verifyIdToken(token);
}

async function getStudentName(db, studentId) {
    const studentData = await StudentContainer.getById(studentId, db);
    let userName;
    const sli = studentData[0].mobile.slice(0, 6);
    const phone = studentData[0].mobile.replace(sli, 'xxxxxx');
    if (studentData[0].student_fname !== null) {
        userName = `${studentData[0].student_fname}`;
        userName = userName.replace(/\n/g, ' ');
    } else {
        userName = phone;
    }
    return userName;
}

/**
 * @param {string} versionCode
 * @param {string} sessionId
 * @param {Number} otp
 * @param {Object} responseData
 * @description sets verify api esponse for 30s in redis ( only for app versions with an issue of double login api calls)
 * @returns null
 */
async function setStudentVerifyPersistedResponse(db, versionCode, sessionId, otp, responseData) {
    if (versionCode >= 995 && versionCode <= 1017) {
        StudentRedis.setStudentVerifiedResponse(db.redis.write, sessionId, otp, responseData);
    }
}

function getUserDaysOnApp(registeredDate) {
    const given = moment(registeredDate, 'YYYY-MM-DD');
    const current = moment().startOf('day');
    const days = Math.floor(moment.duration(current.diff(given)).asDays());
    return days;
}
function getDataBasisOfUserDays(data, userDays) {
    data = _.filter(data, (x) => {
        if (x.user_days == -1 || userDays <= x.user_days) {
            return true;
        }
    });
    return data;
}
function sendOptinMsg(config, contact, language, student_id, db) {
    const smsPayload = {
        mobile: contact,
        message: (smsData.optin[language] || smsData.optin.en),
        locale: language,
    };
    const notificationPayload = {
        event: 'external_url',
        title: notificationData.optin[language] ? notificationData.optin[language].title : notificationData.optin.en.title,
        message: notificationData.optin[language] ? notificationData.optin[language].text : notificationData.optin.en.text,
        s_n_id: notificationData.optin[language] ? notificationData.optin[language].s_n_id : notificationData.optin.en.s_n_id,
        firebase_eventtag: notificationData.optin[language] ? notificationData.optin[language].s_n_id : notificationData.optin.en.s_n_id,
        data: {
            url: notificationData.optin.encodedDeepLink,
        },
    };
    console.log('######## smsPayload', smsPayload, '\n notificationPayload', notificationPayload);
    Utility.OptIn(contact, config, language);
    // Utility.sendSMSToReferral(config, smsPayload);
    newtonNotifications.sendNotification(student_id, notificationPayload, db.mysql.read);
}

async function storeUserConsent(mongoClient, studentId, isAccepted) {
    const query = { student_id: studentId };
    const update = {
        $set: { whatsapp_sms_consent: isAccepted, updated_at: new Date(new Date().getTime() + 1000 * 60 * 330) },
        $setOnInsert: { student_id: studentId, created_at: new Date(new Date().getTime() + 1000 * 60 * 330) },
    };
    const options = { upsert: true };
    mongoClient.write.collection('user_consent').updateOne(query, update, options);
    // .then(result => {
    //     const { matchedCount, modifiedCount } = result;
    //     if(matchedCount && modifiedCount) {
    //     console.log(`Successfully added a new review.`)
    //     }
    // })
    // .catch(err => console.error(`Failed to add review: ${err}`))
}

async function creditWalletUsingCampaignData(db, data) {
    try {
        const { aaid, student_id } = data;
        if (!_.isEmpty(aaid)) {
            const [campaignData, campaignList, studentDetails] = await Promise.all([db.redis.read.hgetAsync('branch_data', `aaid_${aaid}`), BranchMysql.getWalletCreditCampaigns(db.mysql.read), StudentContainer.getById(student_id, db)]);
            // campaign = 'UAC_InApp_D3VV_Spoken_English';
            // campaign = 'UAC_InApp_Buy_Now_NDA';
            if (!_.isNull(campaignData) && campaignList.length > 0) {
                const [campaign, campaignDate] = campaignData.split(':_:');
                const campaignArray = [];
                campaignList.map((e) => campaignArray.push(e.campaign));
                // campaignDate is in utc
                if (campaignArray.includes(campaign) && moment(campaignDate).isSame(moment().format('YYYY-MM-DD'))) {
                    // credit amount in the wallet
                    await WalletUtil.makeWalletTransaction({
                        student_id,
                        reward_amount: Data.branch_campaign_signup_credit,
                        type: 'CREDIT',
                        payment_info_id: 'dedsorupiyadega',
                        reason: 'branch_campaign_signup_credit',
                        expiry: null,
                    });
                    if (['UAC_InApp_Buy_Now_Spoken_English', 'UAC_InApp_Buy_Now_Spoken_English_HomePage'].includes(campaign)) {
                        const notificationPayload = {
                            event: 'wallet',
                            title: 'Doubtnut पे आपका स्वागत  है!',
                            message: 'वॉलेट में मिले रु100 कैश से करे Spoken English कोर्स पे बचत।',
                            firebase_eventtag: `WALLET_CREDIT_${campaign}`,
                            s_n_id: `WALLET_CREDIT_${campaign}`,
                            data: JSON.stringify({
                                random: 1,
                            }),
                        };
                        Utility.sendFcm(student_id, studentDetails[0].gcm_reg_id, notificationPayload);
                    } else if (['UAC_InApp_Buy_Now_NDA'].includes(campaign)) {
                        const notificationPayload = {
                            event: 'wallet',
                            title: 'Doubtnut पे आपका स्वागत  है!',
                            message: 'वॉलेट में मिले रु100 कैश से करे NDA कोर्स पे बचत।',
                            firebase_eventtag: `WALLET_CREDIT_${campaign}`,
                            s_n_id: `WALLET_CREDIT_${campaign}`,
                            data: JSON.stringify({
                                random: 1,
                            }),
                        };
                        Utility.sendFcm(student_id, studentDetails[0].gcm_reg_id, notificationPayload);
                    } else if (['UAC_InApp_Buy_Now_SSC', 'UAC_InApp_Buy_Now_SSC_GD_HomePage'].includes(campaign)) {
                        const notificationPayload = {
                            event: 'wallet',
                            title: 'Doubtnut पे आपका स्वागत  है!',
                            message: 'वॉलेट में मिले रु100 कैश से करे SSC GD कोर्स पे बचत।',
                            firebase_eventtag: `WALLET_CREDIT_${campaign}`,
                            s_n_id: `WALLET_CREDIT_${campaign}`,
                            data: JSON.stringify({
                                random: 1,
                            }),
                        };
                        Utility.sendFcm(student_id, studentDetails[0].gcm_reg_id, notificationPayload);
                    }
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function getstudentSubscriptionDetailsLikeV13(db, studentId) {
    let userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
    userActivePackages = userActivePackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.amount !== -1);
    if (!userActivePackages.length) {
        return true;
    }
    return false;
}

async function getLandingDeeplink(db, studentId, timestamp) {
    let defaultOnboardingDeeplink = 'doubtnutapp://camera';
    // const flagrResp = await CourseContainer.getFlagrResp(db, 'homepage_revamp', studentId);
    // const flagStat = _.get(flagrResp, 'homepage_revamp.payload.enabled', false);
    // if (!flagStat) {
    let flag = false;
    const userAskedResult = await QuestionMySql.getLast10QuestionsAskedData(db.mysql.read, studentId, true);
    if (userAskedResult && userAskedResult.length > 7) {
        flag = true;
    }

    if (!flag) {
        const regTime = moment(timestamp);
        const nowTime = moment();
        const diff = nowTime.diff(regTime, 'days');

        if (diff > 14) {
            const last14DaysAsked = await QuestionMySql.getLast14DaysAskedQuestions(db.mysql.read, studentId);
            if (last14DaysAsked.length === 0) {
                flag = true;
            }
        }
    }
    if (flag) {
        const flgrData = { body: { capabilities: { home_page_first_screen: {} }, entityId: studentId } };
        const flgrResp = await UtilityFlagr.getFlagrResp(flgrData);

        if (flgrResp != undefined && flgrResp.home_page_first_screen.enabled && flgrResp.home_page_first_screen.payload.enabled) {
            defaultOnboardingDeeplink = '';
        }
    }
    // }
    return defaultOnboardingDeeplink;
}

function isAltApp(packageName) {
    if (packageName && Data.altAppsPackageNames.includes(packageName)) {
        return true;
    }
    return false;
}

// eslint-disable-next-line no-unused-vars
async function getUserCountryAndCurrency(db, studentId) {
    // Switch of UAE Paywall
    return {
        country: 'IN',
        currency_symbol: '₹',
        currency: 'INR',
    };

    /**
     * Old Code
     * let country = 'IN';
     * try {
     *     const locationDetailsCache = await StudentRedis.getStudentTrueCountry(db.redis.read, studentId);
     *     if (locationDetailsCache != null && locationDetailsCache.length) {
     *         country = JSON.parse(locationDetailsCache);
     *     } else {
     *         const locationDetails = await StudentMysql.getStudentLocationDetails(db.mysql.read, studentId);
     *         await StudentRedis.setStudentTrueCountry(db.redis.write, studentId, locationDetails[0].true_country);
     *         country = locationDetails[0].true_country;
     *     }
     * } catch (e) {
     *     console.log(e);
     * }
     * let currencySymbol = '₹';
     * let currency = 'INR';
     * if (DataPayment.country_currency_symbol_mapping[country] != undefined) {
     *     currencySymbol = DataPayment.country_currency_symbol_mapping[country];
     * }
     * if (DataPayment.country_currency_mapping[country] != undefined) {
     *     currency = DataPayment.country_currency_mapping[country];
     * }
     * return {
     *     country,
     *     currency_symbol: currencySymbol,
     *     currency,
     * };
     */
}

async function getTrueCountryFromIPAddressAndCountryCode(req, studentDetails) {
    const geoBasedCountry = await UtilityIP.getCountryFromIPAddress(req);
    let country = 'IN';
    console.log(geoBasedCountry, 'geoBasedCountry');
    const countryCodeBasedCountry = studentDetails.length ? Data.country_code_country_name_mapping[studentDetails[0].country_code] || 'IN' : 'IN';
    console.log(countryCodeBasedCountry, 'countryCodeBasedCountry');
    if (geoBasedCountry == countryCodeBasedCountry) {
        country = geoBasedCountry;
    } else if (_.includes(['AE'], geoBasedCountry)) {
        country = geoBasedCountry;
    } else if (_.includes(['AE'], countryCodeBasedCountry)) {
        country = countryCodeBasedCountry;
    } else {
        country = countryCodeBasedCountry != 'IN' ? countryCodeBasedCountry : geoBasedCountry;
    }
    return country;
}

async function doubtnutPayWallSegmentation(obj) {
    const { db, student_id: studentId, req } = obj;
    let [getActiveSegmentationBuckets, studentBucketMapping, studentDetails, studentLocationDetails] = [];
    [getActiveSegmentationBuckets, studentBucketMapping, studentDetails, studentLocationDetails] = await Promise.all([
        Property.getValueByBucketAndName(db.mysql.read, 'doubtnut_paywall', 'active_buckets'),
        StudentMysql.checkStudentDoubtnutPayWallBucketMappingData(db.mysql.write, studentId),
        // StudentMysql.getStudent(studentId, db.mysql.write),
        StudentContainer.getById(studentId, db),
        StudentMysql.getStudentLocationDetails(db.mysql.read, studentId),
    ]);
    const country = await getTrueCountryFromIPAddressAndCountryCode(req, studentDetails);
    if (!studentLocationDetails.length && country == 'AE') {
        await StudentMysql.setStudentLocation(db.mysql.write, { student_id: studentId, true_country: country });
    } else if (!studentLocationDetails.length) {
        await StudentMysql.setStudentLocation(db.mysql.write, { student_id: studentId, true_country: 'IN' });
    } else if (studentLocationDetails.length && studentLocationDetails[0].true_country == 'IN' && country == 'AE') {
        await StudentMysql.updateStudentLocation(db.mysql.write, { true_country: country }, studentId);
    }

    if (country != 'AE') {
        return true;
    }
    studentDetails[0].package_name = 'com.doubtnut.app';
    await Promise.all([
        StudentMysql.updateAltAppLoginStudent(db.mysql.write, studentDetails[0]),
        StudentMysql.updateUserProfile(studentId, { gcm_reg_id: null }, db.mysql.write),
    ]);
    if (!_.isEmpty(studentBucketMapping)) {
        return true;
    }
    const redisStudentCount = await StudentRedis.increaseDoubtnutPaywallStudentCount(db.redis.write);
    getActiveSegmentationBuckets = JSON.parse(getActiveSegmentationBuckets[0].value);
    let studentBucketId = 0;
    if (getActiveSegmentationBuckets.length > 0) {
        const studentBucketIndex = (redisStudentCount % getActiveSegmentationBuckets.length);
        studentBucketId = getActiveSegmentationBuckets[studentBucketIndex];
    }
    // const studentBucket = Math.floor(Math.random() * getActiveSegmentationBuckets.length);
    await Promise.all([
        StudentMysql.insertStudentDoubtnutPayWallBucketMappingData(db.mysql.write, {
            student_id: studentId,
            dn_property_bucket_id: studentBucketId,
        }),
        StudentMysql.insertStudentDoubtnutPaywallQuestionAskCount(db.mysql.write, {
            student_id: studentId,
            date: moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD'),
            count: 0,
        }),
    ]);
}

function showDnrExp(studentId, packageValue) {
    return (studentId < Data.dnrExpStartingSid || (studentId >= Data.dnrExpStartingSid && studentId % 2 !== 0)) && (packageValue !== altAppData.freeAppPackageName);
}

function dataParse(data) {
    try {
        if (data) {
            return JSON.parse(data);
        }
        return {};
    } catch (e) {
        console.log(e);
        return {};
    }
}

function getExamBoards(data) {
    const examBoardData = { board: 'Others', exam: 'Others' };
    const examOrder = ['IIT JEE', 'NEET', 'Others'];
    const boardOrder = ['CBSE', 'UP Board', 'Bihar Board', 'Others'];
    const exams = {};
    for (let i = 0; i < data.length; i++) {
        if (data[i].category === 'board' && _.includes(boardOrder, data[i].course)) {
            examBoardData.board = data[i].course;
        } else if (data[i].category === 'exam') {
            exams[data[i].course] = 1;
        }
    }
    for (let i = 0; i < examOrder.length; i++) {
        if (exams[examOrder[i]]) {
            examBoardData.exam = examOrder[i];
            break;
        }
    }
    return examBoardData;
}

async function checkUserVip(db, studentId) {
    const allUserActivePackages = await CourseContainerv2.getUserActivePackages(db, studentId);
    for (let i = 0; i < allUserActivePackages.length; i++) {
        if (allUserActivePackages[i].assortment_type === 'course') {
            return 1;
        }
    }
    return 0;
}

// eslint-disable-next-line object-curly-newline
async function getGoogleAdsInfo({ db, studentId, page, stClass, ocrText, questionId, isVip, ccmData }) {
    try {
        const webUrl = ocrText ? `https://www.doubtnut.com/question-answer/${Utility.ocrToUrl(ocrText)}-${questionId}` : null;
        const [googleAdsInfo, userVip] = await Promise.all([
            StudentContainer.getGoogleAdsData(db, page),
            (isVip === 1 || isVip === 0) ? isVip : checkUserVip(db, studentId),
        ]);
        const examsBoardsInfo = ccmData || [];
        const adsData = [];
        for (let i = 0; i < googleAdsInfo.length; i++) {
            if (googleAdsInfo[i].ads_url) {
                let adsPreFixUrl = webUrl ? `${googleAdsInfo[i].ads_url}&description_url=${encodeURIComponent(webUrl)}` : googleAdsInfo[i].ads_url;
                const examBoardData = getExamBoards(examsBoardsInfo);
                const extraParams = dataParse(googleAdsInfo[i].cust_params);
                const extraParamsKeys = Object.keys(extraParams);
                let custmParams = '';
                for (let j = 0; j < extraParamsKeys.length; j++) {
                    if (extraParamsKeys[j] === 'student_class') {
                        custmParams = `${custmParams}&student_class=${stClass}`;
                    } else if (extraParamsKeys[j] === 'board' && examBoardData.board) {
                        custmParams = `${custmParams}&board=${examBoardData.board}`;
                    } else if (extraParamsKeys[j] === 'exam' && examBoardData.exam) {
                        custmParams = `${custmParams}&exam=${examBoardData.exam}`;
                    } else if (extraParamsKeys[j] === 'is_vip') {
                        custmParams = `${custmParams}&is_vip=${userVip}`;
                    } else {
                        custmParams = extraParams[extraParamsKeys[j]] !== '##' ? `${custmParams}&${extraParamsKeys[j]}=${extraParams[extraParamsKeys[j]]}` : custmParams;
                    }
                }
                adsPreFixUrl = custmParams.length > 1 ? `${adsPreFixUrl}&cust_params=${encodeURIComponent(custmParams.slice(1))}` : adsPreFixUrl;
                adsData.push({ adTag: adsPreFixUrl, ad_timeout: 3000 });
            }
        }
        return adsData;
    } catch (err) {
        console.log(err);
        return [];
    }
}

module.exports = {
    trackStudentActiveDeviceIds,
    getUserDaysOnApp,
    getDataBasisOfUserDays,
    storeUserConsent,
    creditWalletUsingCampaignData,
    sendOptinMsg,
    getFirebaseAuthDecodedToken,
    getstudentSubscriptionDetailsLikeV13,
    getLandingDeeplink,
    isAltApp,
    getUserCountryAndCurrency,
    doubtnutPayWallSegmentation,
    getStudentName,
    setStudentVerifyPersistedResponse,
    showDnrExp,
    getGoogleAdsInfo,
};
