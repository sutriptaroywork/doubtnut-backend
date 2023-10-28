const _ = require('lodash');
const Student = require('./student');
const kafka = require('../config/kafka');

module.exports = class NewtonNotifications {
    static isValidNotificationInfo(notificationInfo) {
        if ('title' in notificationInfo && 'message' in notificationInfo && 'event' in notificationInfo) return true;

        return false;
    }

    static async sendNotification(student_id, notificationInfo, database) {
        try {
            if (!('data' in notificationInfo)) notificationInfo.data = {};
            if (!('firebase_eventtag' in notificationInfo) || notificationInfo.firebase_eventtag == '') notificationInfo.firebase_eventtag = 'user_journey';

            if (!this.isValidNotificationInfo(notificationInfo)) return;

            let gcm = await Student.getGcmByStudentId(student_id, database);

            if (_.isEmpty(gcm) || _.isEmpty(gcm[0].gcm_reg_id)) return;

            gcm = gcm[0].gcm_reg_id;

            const kafkaMsgData = {
                data: notificationInfo,
                to: [gcm],
                studentId: [student_id],
            };

            kafka.newtonNotification(kafkaMsgData);
        } catch (e) {
            console.log(e);
        }
    }

    static async sendNotificationByFCM(userInfo, notificationInfo) {
        try {
            if (!('data' in notificationInfo)) notificationInfo.data = {};
            if (!('firebase_eventtag' in notificationInfo) || notificationInfo.firebase_eventtag == '') notificationInfo.firebase_eventtag = 'user_journey';

            if (!this.isValidNotificationInfo(notificationInfo)) return;

            const kafkaMsgData = {
                data: notificationInfo,
                to: _.map(userInfo, 'gcmId'),
                studentId: _.map(userInfo, 'id'),
            };

            kafka.newtonNotification(kafkaMsgData);
        } catch (e) {
            console.log(e);
        }
    }
};
