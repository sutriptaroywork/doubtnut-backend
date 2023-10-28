// const _ = require('lodash');
const hashExpiry = 60 * 60; // 1 hr

module.exports = class Nudge {
    static checkActive(client, studentID) {
        return client.getAsync(`nudge_active:${studentID}`);
    }

    static setActive(client, studentID) {
        return client.setAsync(`nudge_active:${studentID}`, '1');
    }

    static setUserSessionByNudgeID(client, studentID, nudgeID, ttl) {
        return client.setAsync(`user_nudge_session:${studentID}_${nudgeID}`, '1', 'Ex', 60 * ttl);
    }

    static getUserSessionByNudgeID(client, studentID, nudgeID) {
        return client.getAsync(`user_nudge_session:${studentID}_${nudgeID}`);
    }

    static setUserSessionByAssortmentID(client, studentID, assortmentID) {
        return client.setAsync(`user_nudge_session_renewal:${studentID}_${assortmentID}`, '1', 'Ex', 60 * 60 * 4);
    }

    static getUserSessionByAssortmentID(client, studentID, assortmentID) {
        return client.getAsync(`user_nudge_session_renewal:${studentID}_${assortmentID}`);
    }

    static getUserViewCountByNudgeID(client, studentID, nudgeID) {
        return client.getAsync(`user_nudge_view_count:${studentID}_${nudgeID}`);
    }

    static setUserViewCountByNudgeID(client, studentID, nudgeID) {
        return client.setAsync(`user_nudge_view_count:${studentID}_${nudgeID}`, '1', 'Ex', 60 * 60 * 24 * 10);
    }

    static updateUserViewCountByNudgeID(client, studentID, nudgeID) {
        return client.incr(`user_nudge_view_count:${studentID}_${nudgeID}`);
    }

    static setUserSessionBySurveyID(client, studentID, nudgeID, ttl) {
        return client.setAsync(`user_survey_session:${studentID}_${nudgeID}`, '1', 'Ex', 60 * ttl);
    }

    static getUserSessionBySurveyID(client, studentID, nudgeID) {
        return client.getAsync(`user_survey_session:${studentID}_${nudgeID}`);
    }

    static getInAppPopUpData(client, page, studentClass, versionCode) {
        return client.getAsync(`INAPP_ALL_POPUP:${page}_${studentClass}_${versionCode}`);
    }

    static setInAppPopUpData(client, page, studentClass, versionCode, data) {
        return client.setAsync(`INAPP_ALL_POPUP:${page}_${studentClass}_${versionCode}`, JSON.stringify(data), 'Ex', hashExpiry); // set for 1 hr
    }

    static setUserPopupWatchedData(client, studentId, hashField, data) {
        const hashKey = `INAPP_ALL_POPUP:${studentId}`;
        return client.hsetAsync(hashKey, hashField, JSON.stringify(data), 'Ex', hashExpiry * 24); // set for 1 days
    }

    static getUserPopupWatchedData(client, studentId, hashField) {
        const hashKey = `INAPP_ALL_POPUP:${studentId}`;
        return client.hgetAsync(hashKey, hashField);
    }

    static setInAppPopUpPropertyData(client, redisKey, data, exTime) {
        return client.setAsync(redisKey, JSON.stringify(data), 'Ex', exTime);
    }

    static getInAppPopUpPropertyData(client, redisKey) {
        return client.getAsync(redisKey);
    }
};
