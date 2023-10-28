const keys = require('./keys');

module.exports = class Recommendation {
    static getNotificationData(ccm, featureId, client) {
        return client.getAsync(`quiz_notif:${ccm}_${featureId}`);
    }

    static getNotificationDefaultData(client, day) {
        return client.getAsync(`${keys.quiz_notif_default}:${day}`);
    }

    static getNotificationDefaultFinalData(client) {
        return client.getAsync(`${keys.quiz_notif_default}:last`);
    }
};
