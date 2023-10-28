const _ = require('lodash');

module.exports = class Campaign {
    static getCampaignByName(database, campaignName, screen) {
        const sql = 'SELECT crm.id, crm.campaign, crm.deeplink, crm.sticky_notification_id, crm.assortment_id, crm.assortment_id_arr FROM campaign_redirection_mapping crm LEFT JOIN campaign_screen_mapping csm ON crm.id = csm.campaign_id WHERE crm.campaign = ? AND csm.screen_type = ? AND csm.is_active = 1';
        return database.query(sql, [campaignName, screen]);
    }

    static getCampaignScreenType(database, campaignName) {
        const sql = 'select a.*, b.* from campaign_redirection_mapping  as a left join campaign_screen_mapping as b on a.id = b.campaign_id where a.campaign = ? ';
        return database.query(sql, [campaignName]);
    }
 
    static getFeedCarouselCampaign(database, campaign) {
        const sql = ' select * from feed_caraousel where campaign = ?';
        return database.query(sql, [campaign])
    }

};
