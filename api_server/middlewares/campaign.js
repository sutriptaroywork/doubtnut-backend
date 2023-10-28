const _ = require('lodash');
const RedisUtility = require('../modules/redis/utility.redis');
const StudentRedis = require('../modules/redis/student');
const BranchContainer = require('../modules/containers/branch');
const campaignHelper = require('../server/helpers/campaign');
const BranchMysql = require('../modules/mysql/branch');

async function campaignDataSet(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user ? req.user : {};
        const { gaid: aaid } = req.user ? req.user : {};
        if (studentId) {
            let campaignData = '';
            let campaignDataId = '';
            if (!_.isEmpty(aaid) && aaid !== '00000000-0000-0000-0000-000000000000') {
                campaignData = await db.redis.read.hgetAsync('branch_data', `aaid_${aaid}`);
                if (campaignData) {
                    campaignDataId = campaignData.split(':_:')[0].split(';;;')[0];
                }
            }
            const campaignDataStoredInStudent = await StudentRedis.getCampaignData(db.redis.read, studentId);

            // campaign = 'UAC_InApp_Buy_Now_IBPS';
            let campaign = '';
            if (!campaignDataStoredInStudent || !campaignData || campaignDataStoredInStudent === campaignDataId) {
                campaign = campaignDataStoredInStudent || campaignDataId;
            } else {
                campaign = await campaignHelper.getCampaignWithHigherPriority(db, campaignDataId, campaignDataStoredInStudent);
            }
            const deeplink = await BranchContainer.getByCampaign(db, campaign);
            if ((campaign && campaign !== campaignDataStoredInStudent && !_.isEmpty(deeplink)) || (campaignData && campaignData.includes('CEO_REFERRAL') && !_.isEmpty(deeplink))) {
                if (campaignData && campaignData.includes('CEO_REFERRAL')) {
                    // Add real time Referee Campaign Users to TG 2274
                    await RedisUtility.saddWithExpiry(db.redis.write, 'target_group_2274', studentId, 24 * 60 * 60);
                }
                await StudentRedis.setCampaignData(db.redis.write, studentId, campaignDataId);
                const hookTimestamp = _.get(campaignData.split(':_:'), '[1]', undefined);
                const eventTimestamp = _.get(campaignData.split(':_:'), '[2]', undefined);

                BranchMysql.addCampaignSidMapping(db.mysql.write, {
                    campaign: campaignData.split(':_:')[0], student_id: studentId, hook_timestamp: hookTimestamp, event_timestamp: eventTimestamp,
                });
            }
        }
        return next();
    } catch (err) {
        next({ err });
    }
}

module.exports = campaignDataSet;
