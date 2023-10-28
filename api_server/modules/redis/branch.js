module.exports = class Branch {
    static setByCampaign(client, campaign, data) {
        return client.setAsync(`campaign_redirection:${campaign}`, JSON.stringify(data), 'Ex', 60 * 60); // 6 hour
    }

    static getByCampaign(client, campaign) {
        return client.getAsync(`campaign_redirection:${campaign}`);
    }

    static getScreenTypeByCampaign(client, campaign) {
        return client.getAsync(`screen_redirection:${campaign}`);
    }

    static setScreenTypeByCampaign(client, campaign, data) {
        return client.setAsync(`screen_redirection:${campaign}`, JSON.stringify(data), 'Ex', 60 * 60 * 6); // 6 hour
    }
};
