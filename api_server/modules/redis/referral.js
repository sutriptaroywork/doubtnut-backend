const keys = require('./keys');

const expiry = 2 * 60 * 60 * 24; // 2 day
module.exports = class Referral {
    static getReferralBranchLink(client, studentID) {
        return client.getAsync(`referral_branch_link_${studentID}`);
    }

    static setReferralBranchLink(client, studentID, data) {
        return client.setAsync(`referral_branch_link_${studentID}`, JSON.stringify(data), 'EX', expiry);
    }

    static getReferralBranchLinkWA(client, studentID) {
        return client.getAsync(`${keys.referralWABranchLink}${studentID}`);
    }

    static setReferralBranchLinkWA(client, studentID, data) {
        return client.setAsync(`${keys.referralWABranchLink}${studentID}`, JSON.stringify(data), 'EX', expiry);
    }
};
