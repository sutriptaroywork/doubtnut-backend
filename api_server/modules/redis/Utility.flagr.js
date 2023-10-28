module.exports = class UtilityFlagr {
    static setVariantList(client, flagID, data) {
        return client.setAsync(`flagr_variant_list_${flagID}`, JSON.stringify(data), 'Ex', 60 * 15);
    }

    static getVariantList(client, flagID) {
        return client.getAsync(`flagr_variant_list_${flagID}`);
    }

    static getEtoosVariantsAB(client, studentID) {
        return client.getAsync(`etoos_variants_ab_${studentID}`);
    }

    static setEtoosVariantsAB(client, studentID, flagrResponse) {
        return client.setAsync(`etoos_variants_ab_${studentID}`, JSON.stringify(flagrResponse), 'Ex', 60 * 60 * 3); // * 3 hours
    }
};
