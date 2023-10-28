const keys = require('./keys');

module.exports = class ReferAndEarn {
    static getBranchDeeplinkForReferAndEarn(client, studentId) {
        return client.hgetAsync(`${keys.branchDeeplink}:${studentId}`, 'REFER_AND_EARN_PAGE');
    }

    static setBranchDeeplinkForReferAndEarn(client, studentId, data) {
        return client.hsetAsync(`${keys.branchDeeplink}:${studentId}`, 'REFER_AND_EARN_PAGE', JSON.stringify(data));
    }
};
