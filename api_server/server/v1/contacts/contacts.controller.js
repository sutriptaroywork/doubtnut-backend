/* eslint-disable eqeqeq */
/* eslint-disable prefer-const */
const moment = require('moment');
const _ = require('lodash');
const referralSql = require('../../../modules/mysql/referralFlow');
const contactsHelper = require('./contacts.helper');

async function insert(req, res, next) {
    try {
        const { contacts } = req.body;
        const { mobile } = req.user;
        const db = req.app.get('db');
        let i = 0;
        while (i < contacts.length) {
            contactsHelper.insertIntoContacts(db, contacts.slice(i, i + 100), mobile);
            i += 100;
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
                success: true,
            },
            data: {
                message: `Last sync at ${moment()}`,
                timestamp: moment().unix(),
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function read(req, res, next) {
    try {
        let { is_on_dn: isOnDn, page, count } = req.query;
        if (_.isEmpty(count)) {
            count = 500;
        }
        const { mobile, locale } = req.user;
        const db = req.app.get('db');
        const data = await contactsHelper.getContactsData(db, isOnDn, page, count, mobile, locale);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
                success: true,
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}

async function lastUpdate(req, res, next) {
    try {
        const { mobile } = req.user;
        const db = req.app.get('db');
        const time = await referralSql.getLastUpdateTime(db.mysql.read, mobile);
        let message = 'No update yet.';
        let timestamp;
        if (time.length && time[0].updated_at) {
            message = `Last sync at ${time[0].updated_at}`;
            timestamp = moment(time[0].updated_at).unix();
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                message,
                timestamp,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return next(e);
    }
}
module.exports = {
    insert,
    read,
    lastUpdate,
};
