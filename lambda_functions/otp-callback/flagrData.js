const axios = require('axios');
const _ = require('lodash');
const flagrEnabled = true;
const evaluation = 'https://flagr.internal.doubtnut.com/api/v1/evaluation';

module.exports = class FlagrUtility {
    /** *
     * default function for variable attachement
     */
    static async getVariantAttachment(entityID, entityContext = {}, flagID, timeout = 500) {
        const flagrResponse = await axios({
            method: 'POST',
            url: evaluation,
            data: {
                entityID,
                entityContext,
                flagID,
            },
            timeout,
        });
        
        if (!_.isEmpty(flagrResponse) && !_.isEmpty(flagrResponse.data) && !_.isEmpty(flagrResponse.data.variantAttachment)) {
            return flagrResponse.data.variantAttachment;
        }

        return {};
    }
};
