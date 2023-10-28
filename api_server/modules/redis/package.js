const hashExpiry = 60 * 60 * 24; // 1 day
const keys = require('./keys');

module.exports = class Package {
    static getActiveEmiPackageAndRemainingDays(client, studentID) {
        return client.getAsync(`user_emi_package:${studentID}`);
    }

    static setActiveEmiPackageAndRemainingDays(client, studentID, data) {
        return client.setAsync(`user_emi_package:${studentID}`, JSON.stringify(data), 'Ex', hashExpiry);
    }

    static getNextPackageVariant(client, masterParent, emiOrder) {
        return client.getAsync(`user_emi_next_package:${masterParent}_${emiOrder}`);
    }

    static setNextPackageVariant(client, masterParent, emiOrder, data) {
        return client.setAsync(`user_emi_next_package:${masterParent}_${emiOrder}`, JSON.stringify(data), 'Ex', hashExpiry);
    }

    static deleteActiveEmiPackageAndRemainingDays(client, studentID) {
        return client.delAsync(`user_emi_package:${studentID}`);
    }

    static getBoughtAssortments(client, studentID) {
        return client.hgetAsync(`${keys.userProfileData}:${studentID}`, 'POST_PURCHASE_EXPLAINER_VIDEO_HOME_PAGE_NEW');
    }

    static setBoughtAssortments(client, studentID, assortmentArray) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentID}`, 'POST_PURCHASE_EXPLAINER_VIDEO_HOME_PAGE_NEW', JSON.stringify(assortmentArray))
            .execAsync();
    }

    static getFlagIDKeysFromAssortmentId(client, assortmentId, batchID) {
        return client.getAsync(`${keys.flagIDKeysFromAssortmentId}:${assortmentId}:${batchID}`);
    }

    static setFlagIDKeysFromAssortmentId(client, assortmentId, batchID, data) {
        return client.setAsync(`${keys.flagIDKeysFromAssortmentId}:${assortmentId}:${batchID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getFlagIDKeysFromAssortmentIdWithReferralPackages(client, assortmentId, batchID) {
        return client.getAsync(`${keys.flagIDKeysFromAssortmentIdWithReferralPackages}:${assortmentId}:${batchID}`);
    }

    static setFlagIDKeysFromAssortmentIdWithReferralPackages(client, assortmentId, batchID, data) {
        return client.setAsync(`${keys.flagIDKeysFromAssortmentIdWithReferralPackages}:${assortmentId}:${batchID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getFlagIDKeysFromAssortmentIdWithAutosalesCampaign(client, assortmentId, batchID) {
        return client.getAsync(`${keys.flagIDKeysFromAssortmentIdWithAutosalesCampaign}:${assortmentId}:${batchID}`);
    }

    static setFlagIDKeysFromAssortmentIdWithAutosalesCampaign(client, assortmentId, batchID, data) {
        return client.setAsync(`${keys.flagIDKeysFromAssortmentIdWithAutosalesCampaign}:${assortmentId}:${batchID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }
};
