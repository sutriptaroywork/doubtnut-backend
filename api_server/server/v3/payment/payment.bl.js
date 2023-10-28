const CourseRedisV2 = require('../../../modules/redis/coursev2');
const newtonNotifications = require('../../../modules/newtonNotifications');
const CourseContainer = require('../../../modules/containers/coursev2');
const altAppData = require('../../../data/alt-app');

async function setCourseNotificationData(db, variantDetails, studentID, studentName, packageName) {
    const [ccNotifData, checkoutNotifCount] = await Promise.all([
        CourseContainer.getCourseCampNotifData(db, studentID),
        CourseRedisV2.getCourseNotificationData(db.redis.read, `COURSE_NOTIFICATION:${studentID}`, 'checkout_notif_count'),
    ]);

    if (variantDetails.length && variantDetails[0].assortment_id && ccNotifData && ccNotifData.length && !checkoutNotifCount && packageName !== altAppData.freeAppPackageName) {
        CourseRedisV2.deleteCourseNotificationData(db.redis.write, 'REFREE_PREPURCHASE_PAGE_VISITED', studentID); // priority to checkout notif, so deleting notif 1
        CourseRedisV2.setCourseNotificationData(db.redis.write, 'REFREE_CHECKOUT_PAGE_VISITED', +studentID, `${variantDetails[0].assortment_id}`, 60 * 60 * 24);
    }

    if (ccNotifData.length && packageName !== altAppData.freeAppPackageName) {
        let referrerSId = ccNotifData[0].campaign.split(';;;');
        referrerSId = referrerSId[1].split('::')[0];
        const isNotifSent = await CourseRedisV2.sismember(db.redis.read, 'REFERRER_SID_LIST', referrerSId);
        if (!isNotifSent) {
            const notifPayload = {
                title: `Aapke dost ${studentName} ne courses dekhna shuru kar diya hai!👍 `,
                message: 'Toh jaldi se unka Admission karwayein 😇',
                data: {
                    url: 'https://forms.gle/AepjXrQHQsUnGxpJ9',
                },
                event: 'external_url',
                s_n_id: 'course_refree_referrer_notification_4',
            };
            newtonNotifications.sendNotification(referrerSId, notifPayload, db.mysql.read);
            CourseRedisV2.sadd(db.redis.write, 'REFERRER_SID_LIST', referrerSId);
        }
    }
}

module.exports = {
    setCourseNotificationData,
};
