const _ = require('lodash');
const rp = require('request-promise');
const mysql = require('./mysql');
const redis = require('./redis');
const config = require(__dirname+'/../../api_server/config/config');

async function getResourceByResourceReference(db, resourceReference) {
    try {
        let data = await redis.getResourceByResourceReference(db.redis.read, resourceReference);
        if (!_.isNull(data)) {
            return JSON.parse(data);
        }
        data = await mysql.getResourceByResourceReference(db.mysql.read, resourceReference);
        // if (data && data.length) {
            await redis.setResourceByResourceReference(db.redis.write, resourceReference, data);
        // }
        return data;
    } catch (e) {
        console.error(e);
        throw e;
    }
}
function sendFcm(studentID, fcmID, message) {
    // See documentation on defining a message payload.
    if (!_.isNull(fcmID)) {
        const user = [{ id: studentID, gcmId: fcmID }];
        if (!('firebase_eventtag' in message) || message.firebase_eventtag === '') message.firebase_eventtag = 'user_journey';
        const options = {
            method: 'POST',
            url: config.NEWTON_NOTIFICATION_URL,
            headers:
                { 'Content-Type': 'application/json' },
            body:
                { notificationInfo: message, user },
            json: true,    
        }; 
        return rp(options);
    }
}

async function getAssortmentsByResourceReference(db, resourceReference) {
    try {
        let data;
        data = await redis.getAssortmentsByResourceReference(db.redis.read, resourceReference);
        if (!_.isNull(data)) {
            return JSON.parse(data);
        }
        data = await mysql.getAssortmentsByResourceReference(db.mysql.read, resourceReference);
        if (data.length) {
            await redis.setAssortmentsByResourceReference(db.redis.write, resourceReference, data);
        }
        return data;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
async function checkPushed(db, studentID, questionID) {
    try {
        let data;
        data = await redis.checkPushed(db.redis.read, studentID, questionID);
        if (!_.isNull(data)) {
            return JSON.parse(data);
        }
        data = await mysql.checkPushed(db.mysql.read, studentID, questionID);
        if (data.length) {
            await redis.setCheckPushed(db.redis.write, studentID, questionID, data);
        }
        return data;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getWhatsappOptinSource(db, mobile) {
    try {
        let data;
        data = await redis.getWhatsappOptinSource(db.redis.read, mobile);
        if (!_.isNull(data)) {
            return JSON.parse(data);
        }
        data = await mysql.getWhatsappOptinSource(db.mysql.read, mobile);
        if (data.length) {
            await redis.setWhatsappOptinSource(db.redis.write, mobile, data);
        }
        return data;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getParentAssortmentListRecursively(db, assortmentList, totalResource = []) {
    try {
        const results = await mysql.getAllParentAssortments(db.mysql.read, assortmentList);
        if (results.length > 0) {
            const assortmentListArr = results.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            totalResource = [...totalResource, ...assortmentListArr];
            return getParentAssortmentListRecursively(db, assortmentListArr, totalResource);
        }
        return totalResource;
    } catch (e) {
        throw new Error(e);
    }
}

async function getParentAssortmentList(db, assortmentList) {
    try {
        const totalResource = [];
        const totalMapppings = await getParentAssortmentListRecursively(db, assortmentList, totalResource);
        return totalMapppings;
    } catch (e) {
        throw new Error(e);
    }
}
module.exports = {
    getResourceByResourceReference,
    sendFcm,
    getAssortmentsByResourceReference,
    checkPushed,
    getParentAssortmentList,
    getWhatsappOptinSource,
};
