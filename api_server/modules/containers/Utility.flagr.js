const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/Utility.flagr');
const redis = require('../redis/Utility.flagr');
const UtilityFlagr = require('../Utility.flagr');
const Data = require('../../data/data');

module.exports = class Flagr {
    static async evaluateServiceWrapperPricing(data) {
        const {
            db,
            studentId,
            flagrArr,
        } = data;
        try {
            const capabilities = {};
            const keyNotInDb = [];
            const obj = {};
            const promise = [];
            for (let i = 0; i < flagrArr.length; i++) {
                if (config.flagrMysql) {
                    promise.push(mysql.getFlagrConfigUsingFlagKey(db.mysql.read, studentId, flagrArr[i]));
                } else {
                    keyNotInDb.push(flagrArr[i]);
                    capabilities[flagrArr[i]] = {
                        entityId: studentId,
                    };
                }
            }
            if (config.flagrMysql) {
                const resolvedPromises = await Promise.all(promise);
                for (let i = 0; i < resolvedPromises.length; i++) {
                    if (resolvedPromises[i].length > 0) {
                        obj[flagrArr[i]] = JSON.parse(resolvedPromises[i][0].data);
                    } else {
                        keyNotInDb.push(flagrArr[i]);
                        capabilities[flagrArr[i]] = {
                            entityId: studentId,
                        };
                    }
                }
            }
            const flagrResp = await UtilityFlagr.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: studentId.toString(),
                    capabilities,
                },
            }, 350);
            for (let j = 0; j < keyNotInDb.length; j++) {
                if (flagrResp && flagrResp[keyNotInDb[j]] && flagrResp[keyNotInDb[j]].enabled) {
                    obj[keyNotInDb[j]] = flagrResp[keyNotInDb[j]];
                    // set in mysql
                    const insertObject = {
                        payload: flagrResp[keyNotInDb[j]].payload,
                    };
                    mysql.setFlagrConfigUsingFlagKey(db.mysql.write, {
                        flag_key: keyNotInDb[j],
                        variant_id: flagrResp[keyNotInDb[j]].variantId,
                        student_id: studentId,
                        data: JSON.stringify(insertObject),
                    });
                }
            }
            console.log(obj);
            return obj;
        } catch (error) {
            console.log(error);
            // throw new Error(error);
            // return Data.flagIdNameMap[flagID].default;
            return {};
        }
    }

    static async evaluateServiceWrapper(data) {
        const {
            db,
            xAuthToken,
            entityContext = {},
            flagID,
            timeout = 100,
        } = data;
        try {
            let dataToReturn;
            if (config.flagrMysql) {
                dataToReturn = await mysql.getFlagrConfig(db.mysql.read, entityContext.studentId, flagID);
                if (dataToReturn.length > 0) {
                    const obj = {};
                    obj.variantID = dataToReturn[0].variant_id;
                    obj.flagID = flagID;
                    obj.variantAttachment = JSON.parse(dataToReturn[0].data);
                    return obj;
                }
            }
            dataToReturn = await UtilityFlagr.evaluateServiceWrapper(xAuthToken, entityContext, flagID, timeout);
            // set in mysql
            if (!_.isNull(dataToReturn)) {
                await mysql.setFlagrConfig(db.mysql.write, {
                    flag_id: flagID,
                    variant_id: dataToReturn.variantID,
                    student_id: entityContext.studentId,
                    data: JSON.stringify(dataToReturn.variantAttachment),
                });
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            // throw new Error(error);
            return Data.flagIdNameMap[flagID].default;
        }
    }

    static async evaluate(db, entityID, entityContext = {}, flagID) {
        try {
            let dataToReturn;
            if (config.flagrMysql) {
                dataToReturn = await mysql.getFlagrConfig(db.mysql.read, entityID, flagID);
                if (dataToReturn.length > 0) {
                    const obj = {};
                    obj.variantID = dataToReturn[0].variant_id;
                    obj.flagID = flagID;
                    obj.variantAttachment = JSON.parse(dataToReturn[0].data);
                    return obj;
                }
            }
            dataToReturn = await UtilityFlagr.evaluate(entityID, entityContext, flagID);
            console.log(dataToReturn);
            // set in mysql
            if (!_.isNull(dataToReturn) && !_.isNull(dataToReturn.variantID) && !_.isNull(dataToReturn.variantAttachment)) {
                await mysql.setFlagrConfig(db.mysql.write, {
                    flag_id: flagID,
                    variant_id: dataToReturn.variantID,
                    student_id: entityID,
                    data: JSON.stringify(dataToReturn.variantAttachment),
                });
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            // throw new Error(error);
            return Data.flagIdNameMap[flagID].default;
        }
    }

    static async getVariantList(db, flagID) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getVariantList(db.redis.read, flagID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await UtilityFlagr.getVariantList(flagID);
                if (data) {
                    await redis.setVariantList(db.redis.write, flagID, data);
                }
                return data;
            }
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getEtoosVariantsAB(db, studentID, flagrData) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getEtoosVariantsAB(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await UtilityFlagr.getFlagrResp(flagrData);
            if (data) {
                await redis.setEtoosVariantsAB(db.redis.write, studentID, data);
            }
            return data;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }
};
