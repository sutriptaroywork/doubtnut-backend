const _ = require('lodash');
const config = require('../config/config');
const Data = require('../data/data');
const inst = require('./axiosInstances');

module.exports = class FlagrUtility {
    /** *
     * default function for variable attachement
     */
    static async getVariantAttachment(entityID, entityContext = {}, flagID, timeout = 100) {
        const flagrResponse = await this.evaluate(entityID, entityContext, flagID, timeout);

        if (!_.isEmpty(flagrResponse) && !_.isEmpty(flagrResponse.variantAttachment)) {
            return flagrResponse.variantAttachment;
        }

        return {};
    }

    static async callFlagr(xAuthToken, flagName, nestedPayload) {
        const flgrData = {
            xAuthToken,
            body: {
                capabilities: {
                    [`${flagName}`]: {},
                },
            },
        };
        const flgrResp = await this.getFlagrResp(flgrData, 150);
        const attachment = _.get(flgrResp, nestedPayload, null);
        return attachment;
    }

    static async evaluate(entityID, entityContext = {}, flagID, timeout = 100) {
        if (!config.flagr.enabled) {
            return {};
        }
        try {
            const { data } = await inst.configFlagrInst({
                method: 'POST',
                url: config.flagr.evaluation,
                data: {
                    entityID,
                    entityContext,
                    flagID,
                },
                timeout,
            });
            if (!data) {
                return {};
            }
            return data;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
            return {};
        }
    }

    static async getFlagrResp(flgrData, timeout = 150) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (flgrData.xAuthToken) {
                headers['x-auth-token'] = flgrData.xAuthToken;
            }

            const { data } = await inst.configMicroInst({
                method: 'POST',
                url: `${config.microUrl}/api/app-config/flagr`,
                timeout,
                headers,
                data: flgrData.body,
            });
            return data;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr-service timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
        }
    }

    static getFlagrRespService(xauthToken, body, timeout = 100) {
        return inst.configMicroInst({
            method: 'POST',
            url: `${config.microUrl}/api/app-config/flagr`,
            timeout,
            headers: { 'Content-Type': 'application/json', 'x-auth-token': xauthToken },
            data: body,
        }).then((response) => response.data).catch((error) => {
            if (error.code === 'ECONNABORTED') {
                console.log(`Flagr-service timeout after ${timeout}ms`);
            } else {
                console.error(error);
            }
        });
    }

    static async getBooleanFlag(xAuthToken, flagName) {
        let result = false;
        const obj = {};
        obj[flagName] = {};
        const flgrData = { xAuthToken, body: { capabilities: obj } };
        const flagResponse = await this.getFlagrResp(flgrData);
        if (flagResponse && flagResponse[flagName] && flagResponse[flagName].payload && flagResponse[flagName].payload.enabled) {
            result = true;
        }
        return result;
    }

    static async evaluateServiceWrapper(xAuthToken, entityContext = {}, flagID, timeout = 100) {
        try {
            const fladIdNameMap = Data.flagIdNameMap[flagID];
            const { key } = fladIdNameMap;
            const capabilities = {};
            capabilities[key] = entityContext;
            const result = await this.getFlagrRespService(xAuthToken, { capabilities }, timeout);
            // map it
            console.log(result);
            const obj = {};
            obj.variantID = result[key].variantId;
            obj.flagID = flagID;
            obj.variantAttachment = result[key].payload;
            console.log(obj);
            if (!obj.variantAttachment) {
                return Data.flagIdNameMap[flagID].default;
            }
            return obj;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
            return Data.flagIdNameMap[flagID].default;
        }
    }

    static async getVariantList(flagID) {
        const timeout = 5000;
        try {
            const { data } = await inst.configFlagrInst({
                method: 'GET',
                url: `${Data.FLAGR_HOST}/api/v1/flags/${flagID}/variants`,
                timeout,
            });
            if (!data) {
                return {};
            }
            return data;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
            return {};
        }
    }
};
