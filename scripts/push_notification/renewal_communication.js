require('dotenv').config({ path: `${__dirname  }/../../api_server/.env` });
const config = require(`${__dirname}/../../api_server/config/config`);

const _ = require('lodash');
const Redis = require('ioredis');
const bluebird = require('bluebird');
const rp = require('request-promise');
const Database = require('./database');
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);

bluebird.promisifyAll(Redis);
const conWrite = config.write_mysql;
const conRead = config.mysql_analytics;

function generateDeeplinkFromAppDeeplink(branchKey, channel, campaign, deeplink) {
    const splitted = deeplink.split('?');
    const featureSplitted = splitted[0].split('//');
    const dataSplitted = splitted[1].split('&');
    const feature = featureSplitted[1];
    const data = {};
    for (let i = 0; i < dataSplitted.length; i++) {
        const s = dataSplitted[i].split('=');
        data[s[0]] = s[1];
    }
    const myJSONObject = {
        branch_key: branchKey,
        channel,
        feature,
        campaign,
    };
    if (!_.isEmpty(data)) {
        myJSONObject.data = data;
    }
    const options = {
        url: 'https://api.branch.io/v1/url',
        method: 'POST',
        json: true,
        body: myJSONObject,
    };
    return rp(options);
}

const smsParams = {
    7: {
        HINDI: {
            message: "प्रिय छात्र, रुकने मत दो अपनी पढ़ाई📚 करो अपना कोर्स रीचार्ज और पाओ ख़ास डिस्काउंट - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Rukne mat do apni padhai📚, Karo apna course recharge abhi aur pao khaas discount! - {1} - Team Doubtnut",
        },
    },
    6: {
        HINDI: {
            message: "प्रिय छात्र, रुकने मत दो अपनी पढ़ाई📚 करो अपना कोर्स रीचार्ज और पाओ ख़ास डिस्काउंट - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Rukne mat do apni padhai📚, Karo apna course recharge abhi aur pao khaas discount! - {1} - Team Doubtnut",
        },
    },
    5: {
        HINDI: {
            message: "प्रिय छात्र, रुकने मत दो अपनी पढ़ाई📚 करो अपना कोर्स रीचार्ज और पाओ ख़ास डिस्काउंट - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Rukne mat do apni padhai📚, Karo apna course recharge abhi aur pao khaas discount! - {1} - Team Doubtnut",
        },
    },
    4: {
        HINDI: {
            message: "प्रिय छात्र, रुकने मत दो अपनी पढ़ाई📚 करो अपना कोर्स रीचार्ज और पाओ ख़ास डिस्काउंट - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Rukne mat do apni padhai📚, Karo apna course recharge abhi aur pao khaas discount! - {1} - Team Doubtnut",
        },
    },
    3: {
        HINDI: {
            message: "प्रिय छात्र, रुकने मत दो अपनी पढ़ाई📚 करो अपना कोर्स रीचार्ज और पाओ ख़ास डिस्काउंट - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Rukne mat do apni padhai📚, Karo apna course recharge abhi aur pao khaas discount! - {1} - Team Doubtnut",
        },
    },
    2: {
        HINDI: {
            message: "प्रिय छात्र, सोचना छोड़ो🤔, जारी रखो अपनी पढ़ाई 📖 Doubtnut पर। अभी रीचार्ज करो और पाओ ख़ास डिस्काउंट|{1}",
        },
        ENGLISH: {
            message: "Dear student, Sochna choro🤔, Jari rakho apni padhai 📖 Doubtnut par. Abhi recharge karo aur pao special discount - {1}",
        },
    },
    1: {
        HINDI: {
            message: "प्रिय छात्र, जल्दी करो!! Doubtnut पर अपना कोर्स रिचार्ज करो और रुकने मत दो अपनी पढ़ाई📒 ख़ास डिस्काउंट ऑफर केवल आज के लिये! - {1}",
        },
        ENGLISH: {
            message: "Dear student, Jaldi Karo!! Doubtnut par apna course recharge karo aur rukne mat do apni padhai📒. Khaas discount offer keval aaj ke liye - {1}",
        },
    },
    0: {
        HINDI: {
            message: "प्रिय छात्र, जल्दी करो!! Doubtnut पर अपना कोर्स रिचार्ज करो और रुकने मत दो अपनी पढ़ाई📒 ख़ास डिस्काउंट ऑफर केवल आज के लिये! - {1}",
        },
        ENGLISH: {
            message: "Dear student, Jaldi Karo!! Doubtnut par apna course recharge karo aur rukne mat do apni padhai📒. Khaas discount offer keval aaj ke liye - {1}",
        },
    },
    "-1": {
        HINDI: {
            message: "प्रिय छात्र, जल्दी करो!! Doubtnut पर अपना कोर्स रिचार्ज करो और रुकने मत दो अपनी पढ़ाई📒 ख़ास डिस्काउंट ऑफर केवल आज के लिये! - {1}",
        },
        ENGLISH: {
            message: "Dear student, Jaldi Karo!! Doubtnut par apna course recharge karo aur rukne mat do apni padhai📒. Khaas discount offer keval aaj ke liye - {1}",
        },
    },
    "-2": {
        HINDI: {
            message: "प्रिय छात्र, सोच क्या रहे हो❓ Doubtnut पर पढ़ाई जारी रखो 📖 हमारे डिस्काउंट ऑफर🏷️ का फ़ायदा उठाकर अपना कोर्स फिरसे चालू करो! - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Soch kya rahe ho❓ Doubtnut par padhai jaari rakho 📖 Hamare discount🏷️ offer ka faida utha ke apna course firse chalu karo! - {1}",
        },
    },
    "-3": {
        HINDI: {
            message: "प्रिय छात्र, Doubtnut पर आपके कोर्स को ख़तम हुए 7️⃣ दिन हो गए हैं। आज ही करो अपना कोर्स रिचार्ज क्योंकि आज है डिस्काउंट ऑफर का आखरी दिन❗ - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Doubtnut par aapke course ko khatam huye 7️⃣ din ho gaye hain. Aaj hi karo apna course recharge kyuki aaj hai discount offer ka aakhri din❗ - {1}",
        },
    },
    "-4": {
        HINDI: {
            message: "प्रिय छात्र, Doubtnut पर आपके कोर्स को ख़तम हुए 7️⃣ दिन हो गए हैं। आज ही करो अपना कोर्स रिचार्ज क्योंकि आज है डिस्काउंट ऑफर का आखरी दिन❗ - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Doubtnut par aapke course ko khatam huye 7️⃣ din ho gaye hain. Aaj hi karo apna course recharge kyuki aaj hai discount offer ka aakhri din❗ - {1}",
        },
    },
    "-5": {
        HINDI: {
            message: "प्रिय छात्र, Doubtnut पर आपके कोर्स को ख़तम हुए 7️⃣ दिन हो गए हैं। आज ही करो अपना कोर्स रिचार्ज क्योंकि आज है डिस्काउंट ऑफर का आखरी दिन❗ - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Doubtnut par aapke course ko khatam huye 7️⃣ din ho gaye hain. Aaj hi karo apna course recharge kyuki aaj hai discount offer ka aakhri din❗ - {1}",
        },
    },
    "-6": {
        HINDI: {
            message: "प्रिय छात्र, Doubtnut पर आपके कोर्स को ख़तम हुए 7️⃣ दिन हो गए हैं। आज ही करो अपना कोर्स रिचार्ज क्योंकि आज है डिस्काउंट ऑफर का आखरी दिन❗ - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Doubtnut par aapke course ko khatam huye 7️⃣ din ho gaye hain. Aaj hi karo apna course recharge kyuki aaj hai discount offer ka aakhri din❗ - {1}",
        },
    },
    "-7": {
        HINDI: {
            message: "प्रिय छात्र, Doubtnut पर आपके कोर्स को ख़तम हुए 7️⃣ दिन हो गए हैं। आज ही करो अपना कोर्स रिचार्ज क्योंकि आज है डिस्काउंट ऑफर का आखरी दिन❗ - {1}",
        },
        ENGLISH: {
            message: "Dear Student, Doubtnut par aapke course ko khatam huye 7️⃣ din ho gaye hain. Aaj hi karo apna course recharge kyuki aaj hai discount offer ka aakhri din❗ - {1}",
        },
    },
};
async function getNotificationData(locale, remainingDays, imageUrl, variantId) {
    let title = `Course validity ke bas ${remainingDays} din baaki`;
    let message = "Padhaayi jaari rakhne ke liye subscribe karein";
    let couponCode = "";
    let smsMessage = smsParams[remainingDays][locale].message;
    if (locale === "HINDI") {
        title = `कोर्स वैलिडिटी के बस ${remainingDays} दिन बाकी`;
        message = "पढ़ाई जारी रखने के लिए पैक अभी खरीदें";
    }
    if (_.includes([7, 6, 5, 4, 3], remainingDays)) {
        title = `Course validity ke bas ${remainingDays} din baaki`;
        message = "Padhaayi jaari rakhne ke liye subscribe karein";
        couponCode = "";
        if (locale === "HINDI") {
            title = `कोर्स वैलिडिटी के बस ${remainingDays} दिन बाकी`;
            message = "पढ़ाई जारी रखने के लिए पैक अभी खरीदें";
        }
    }

    if (remainingDays === 2) {
        imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF0905B5-8DFB-CC30-F359-3DD19CF56CA7.webp";
        title = "Course validity ke bas 2 din baaki";
        message = "Discount valid for only two days!";
        if (locale === "HINDI") {
            imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71370C6E-0B5C-4740-28A0-17B84406D7EC.webp";
            title = "कोर्स वैलिडिटी के बस 2 दिन बाकी ";
            message = "डिस्काउंट केवल दो दिन के लिए उपलब्ध ";
        }
        couponCode = "LUCKY250";
    }
    if (remainingDays === 1) {
        imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF0905B5-8DFB-CC30-F359-3DD19CF56CA7.webp";
        title = "Course validity expires tomorrow";
        message = "Discount valid for only for today!!";
        if (locale === "HINDI") {
            imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71370C6E-0B5C-4740-28A0-17B84406D7EC.webp";
            title = "कोर्स वैलिडिटी कल ख़तम हो रही है";
            message = "डिस्काउंट केवल आज के लिए उपलब्ध ";
        }
        couponCode = "LUCKY250";
    }
    if (remainingDays === 0) {
        imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF0905B5-8DFB-CC30-F359-3DD19CF56CA7.webp";
        title = "Course validity expires today";
        message = "Discount valid for only for today!!";
        if (locale === "HINDI") {
            imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71370C6E-0B5C-4740-28A0-17B84406D7EC.webp";
            title = "कोर्स वैलिडिटी कल ख़तम हो रही है";
            message = "डिस्काउंट केवल आज के लिए उपलब्ध ";
        }
        couponCode = "LUCKY250";
    }
    if (_.includes([-2, -1], remainingDays)) {
        imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF0905B5-8DFB-CC30-F359-3DD19CF56CA7.webp";
        title = "Soch kya rahe ho❓ Doubtnut par padhai jaari rakho 📖";
        message = "Hamare discount🏷️ offer ka faida utha ke apna course firse chalu karo!";
        if (locale === "HINDI") {
            imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71370C6E-0B5C-4740-28A0-17B84406D7EC.webp";
            title = "सोच क्या रहे हो❓ Doubtnut पर पढ़ाई जारी रखो 📖";
            message = "हमारे डिस्काउंट ऑफर🏷️ का फ़ायदा उठाकर अपना कोर्स फिरसे चालू करो!";
        }
        couponCode = "LUCKY250";
    }
    if (_.includes([-7, -6, -5, -4, -3], remainingDays)) {
        title = `Aapke course ko khatam huye ${remainingDays} din ho gaye hain`;
        message = "Recharge kare kyuki aaj hai discount offer ka aakhri din❗";
        couponCode = "LUCKY250";
        imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CF0905B5-8DFB-CC30-F359-3DD19CF56CA7.webp";
        if (locale === "HINDI") {
            title = `कोर्स को ख़तम हुए ${remainingDays} दिन हो गए हैं`;
            message = "करो अपना कोर्स रिचार्ज क्योंकि आज है डिस्काउंट ऑफर का आखरी दिन❗";
            imageUrl = "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/71370C6E-0B5C-4740-28A0-17B84406D7EC.webp";
        }
    }

    const data = { variant_id: variantId };
    if (couponCode.length > 0) data.coupon_code = couponCode;
    const appDeeplink = `doubtnutapp://vip?variant_id=${variantId}&coupon_code=${couponCode}`;
    const branchDeeplink = await generateDeeplinkFromAppDeeplink(config.branch_key, "SMS", "RENEWAL", appDeeplink);
    smsMessage = smsMessage.replace("{1}", branchDeeplink.url);
    return {
        notificationData: {
            event: "vip",
            title,
            message,
            image: imageUrl,
            firebase_eventtag: "RENEWAL_MESSAGE",
            data: JSON.stringify(data),
        },
        smsData: {
            message: smsMessage,
            locale,
        },
    };
}

function getUserPackagesByAssortment(database, studentID, assortmentId) {
    const sql = `select * from (select *,id as subscription_id from student_package_subscription where student_id=${studentID}) as a inner join (select id,assortment_id from package where reference_type in ('v3', 'onlyPanel', 'default') and assortment_id=${assortmentId}) as b on a.new_package_id=b.id`;
    return database.query(sql);
}

async function sendNotification(user, notificationInfo) {
    const options = {
        method: 'POST',
        url: config.NEWTON_NOTIFICATION_URL,
        headers:
    { 'Content-Type': 'application/json' },
        body:
    { notificationInfo, user },
        json: true,
    };
    return rp(options);
}

async function sendSms(params) {
    try {
        const options = {
            method: 'POST',
            url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
            form: {
                method: 'SendMessage',
                send_to: params.phone,
                msg: params.msg,
                msg_type: (params.locale && params.locale == 'hi') ? 'Unicode_Text' : 'TEXT',
                userid: config.gupshup.userid,
                auth_scheme: 'plain',
                data_encoding: 'Unicode_text',
                password: config.gupshup.password,
                v: '1.1',
                format: (params.locale && params.locale == 'hi') ? 'Text' : 'JSON',
            },
        };
        return rp(options);
    } catch (e) {
        console.log(e);
    }
}

async function sendMessage(readClient, data) {
    try {
        // check if its renewal case or not
        const {
            assortment_id: assortmentID, student_id: studentId, remaining_days: remainingDays, meta_info: locale, gcm_reg_id: gcmId, subscription_id: subscriptionID, mobile,
        } = data;
        const allSubscriptionsForAssortment = await getUserPackagesByAssortment(readClient, studentId, assortmentID);
        const checkifRenewed = allSubscriptionsForAssortment.filter((e) => e.subscription_id > subscriptionID && e.is_active === 1);
        if (checkifRenewed.length === 0) {
            const { variant_id: variantId, demo_video_thumbnail: imageUrl } = data;
            const payload = await getNotificationData(locale, remainingDays, imageUrl, variantId);
            // console.log(payload);
            const notificationPayload = payload.notificationData;
            const smsPayload = payload.smsData;
            await sendNotification([{ id: studentId, gcmId }], notificationPayload);
            // console.log({ phone: mobile, msg: smsPayload.message, locale: smsPayload.locale === "HINDI" ? "hi" : "en" });
            await sendSms({ phone: mobile, msg: smsPayload.message, locale: smsPayload.locale === "HINDI" ? "hi" : "en" });
        }
    } catch (e) {
        console.error(e);
        throw new Error(e);
    }
}
function getData(database) {
    const sql = "select a.*, b.*, d.meta_info, d.demo_video_thumbnail, d.assortment_id from (select id as subscription_id, student_id, new_package_id, start_date, end_date, variant_id, datediff(end_date, now()) as remaining_days from student_package_subscription where (end_date <= now() and end_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) OR (end_date >= now() and end_date <= DATE_ADD(NOW(), INTERVAL 8 DAY) and is_active=1)  and amount > 1 and start_date < now()) as a left join (select student_id, gcm_reg_id, locale, mobile from students) as b on a.student_id=b.student_id left join (select * from package) as c on a.new_package_id=c.id left join (select * from course_details) as d on c.assortment_id=d.assortment_id group by a.student_id";

    // const sql = "select * from (select *, id as subscription_id from student_package_subscription where start_date < now() and end_date > now() and is_active=1 order by id desc) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default')) as b on a.new_package_id=b.id left join (select class,assortment_id, assortment_type,display_name, year_exam, meta_info from course_details) as cd on cd.assortment_id=b.assortment_id group by cd.assortment_id order by a.id desc";
    return database.query(sql);
}

(async () => {
    let writeClient = '';
    let readClient = '';
    try {
        writeClient = new Database(conWrite);
        readClient = new Database(conRead);
        const data = await getData(readClient);
        await Promise.all(data.map(async (item) => {
            await sendMessage(readClient, item);
        // await sendMessage({
        //     student_id: 2524641, remaining_days: 2, meta_info: "ENGLISH", gcm_reg_id: "fGLfnLMfSSmzo17jBCArTl:APA91bHfAIeD4eFNfh9coFEaHAsZg1cHiJkTF5QYQN-ASLuINGyMPfy99Yi_4JtPgYhMd57FmKkRlcy5EANuzPeQmveKx20nb7TgkK_JQIyICqx-bRbKwXJuIJSuxubPkmn2LCkRRutK", variant_id: 28675, demo_video_thumbnail: "https://d10lpgp6xz60nq.cloudfront.net/images/20210323_demo_video_thumbnail_101047.webp", assortment_id: 101047, mobile: "9873434911",
        // });
        }));
        console.log(`the script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
        const title = 'Issue in renewal communication script';
        const from = 'vivek@doubtnut.com';
        const cronServerServiceID = 'P9T0CZU';
        await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
        writeClient.connection.end();
        readClient.connection.end();
    }
})();
