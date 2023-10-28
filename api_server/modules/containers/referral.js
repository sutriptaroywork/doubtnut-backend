const _ = require('lodash');
const config = require('../../config/config');
const redis = require('../redis/referral');
const Utility = require('../utility');

module.exports = class Referral {
    static async getReferralBranchLink(db, studentID) {
        let data;
        if (config.caching) {
            data = await redis.getReferralBranchLink(db.redis.read, studentID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'whatsapp_refer', `CEO_REFERRAL;;;${studentID}`, 'doubtnutapp://library_tab?tag=check_all_courses');
            redis.setReferralBranchLink(db.redis.write, studentID, data);
            return data;
        }
        return Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'whatsapp_refer', `CEO_REFERRAL;;;${studentID}`, 'doubtnutapp://library_tab?tag=check_all_courses');
    }

    static async getReferralBranchLinkWA(db, studentID) {
        let data;
        if (config.caching) {
            data = await redis.getReferralBranchLinkWA(db.redis.read, studentID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'whatsapp_refer', `CEO_REFERRAL_WA;;;${studentID}`, 'doubtnutapp://library_tab?tag=check_all_courses');
            redis.setReferralBranchLinkWA(db.redis.write, studentID, data);
            return data;
        }
        return Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'whatsapp_refer', `CEO_REFERRAL_WA;;;${studentID}`, 'doubtnutapp://library_tab?tag=check_all_courses');
    }
};
