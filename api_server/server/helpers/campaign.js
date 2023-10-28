const _ = require('lodash');
const BranchContainer = require('../../modules/containers/branch');
const CourseRedisV2 = require('../../modules/redis/coursev2');

async function getCampaignWithHigherPriority(db, campaign1, campaign2) {
    const promises = [];
    promises.push(BranchContainer.getByCampaign(db, campaign1));
    promises.push(BranchContainer.getByCampaign(db, campaign2));

    const resolvedPromises = await Promise.all(promises);

    let newCapaignPriorityOrder = _.get(resolvedPromises, '[0][0].priority_order', 1000000);
    if (_.isNull(newCapaignPriorityOrder)) {
        newCapaignPriorityOrder = 1000000;
    }
    let oldCampaignPriorityOrder = _.get(resolvedPromises, '[1][0].priority_order', 1000000);
    if (_.isNull(oldCampaignPriorityOrder)) {
        oldCampaignPriorityOrder = 1000000;
    }
    if ((newCapaignPriorityOrder < oldCampaignPriorityOrder) || (campaign1.includes('CEO_REFERRAL') && campaign2.includes('CEO_REFERRAL'))) {
        return campaign1;
    }
    return campaign2;
}

function deleteCourseRefreeNotification(db, studentID) {
    CourseRedisV2.deleteCourseNotificationData(db.redis.write, 'REFREE_PREPURCHASE_PAGE_VISITED', studentID);
    CourseRedisV2.deleteCourseNotificationData(db.redis.write, 'REFREE_CHECKOUT_PAGE_VISITED', studentID);
}

module.exports = { getCampaignWithHigherPriority, deleteCourseRefreeNotification };
