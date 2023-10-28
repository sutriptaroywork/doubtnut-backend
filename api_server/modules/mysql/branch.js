module.exports = class Branch {
    static getByCampaign(database, campaign) {
        const sql = 'select * from campaign_redirection_mapping where campaign=? and is_active=1';
        console.log(sql);
        console.log(campaign);
        return database.query(sql, [campaign]);
    }

    static getWalletCreditCampaigns(database) {
        const sql = 'select campaign from campaign_redirection_mapping where wallet_credit=1';
        return database.query(sql);
    }

    static getScreenTypeByCampaign(database, campaign) { // 37.3ms
        const sql = 'select b.screen_type from campaign_screen_mapping b join campaign_redirection_mapping a on a.id = b.campaign_id where a.campaign = ? and a.is_active = 1 and b.is_active = 1';
        return database.query(sql, [campaign]);
    }

    static addCampaignSidMapping(database, data) {
        const sql = 'insert ignore into campaign_sid_mapping set ?';
        return database.query(sql, [data]);
    }
};
