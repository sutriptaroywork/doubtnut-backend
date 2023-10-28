const crypto = require('crypto');
const _ = require('lodash');
const axios = require('axios');
const OlympiadData = require('../../../data/olympiad');
const OlympiadMysql = require('../../../modules/mysql/olympiad');

const ENCRYPTION_KEY = crypto.scryptSync(OlympiadData.paramKey, 'doubtnut', 32);
const algorithm = 'aes-256-ctr';
const IV_LENGTH = 16;

module.exports = {
    encrypt(text) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    },

    decrypt(text) {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    },

    checkIfAlphaNumericWithSpace(str) {
        return _.isNull(str.match(/^[\w\-\s]+$/));
    },

    checkIfAlphaNumericWithoutSpace(str) {
        return _.isNull(str.match(/^[0-9A-Za-z]+$/));
    },

    async getUserDetailsFromHTServer(config, username) {
        const url = process.env.NODE_ENV === 'production' ? OlympiadData.prodAPI : OlympiadData.testAPI;
        const authToken = process.env.NODE_ENV === 'production' ? config.ht_olympiad_auth : OlympiadData.testAuthToken;
        return axios.post(url, { username },
            {
                headers: {
                    authorization: authToken,
                },
            });
    },

    async registerNewUser(db, user, studentId, isAlreadyRegistered) {
        try {
            return await OlympiadMysql.addHTRegisteredStudent(db.mysql.write, {
                user,
                studentId,
                isAlreadyRegistered,
            });
        } catch (e) {
            // used to handle username-mobile DUP_ENTRY Error
            if (e.code === 'ER_DUP_ENTRY') {
                return {
                    code: e.code,
                };
            }
            console.error(e);
            return e;
        }
    },

    async updateRegisteredUser(db, user, studentId, isAlreadyRegistered) {
        try {
            return OlympiadMysql.updateOlympiadRegistration(db.mysql.write, {
                user,
                studentId,
                isAlreadyRegistered,
            });
        } catch (e) {
            console.error(e);
            return e;
        }
    },

    validateEmail(email) {
        const re = /^[a-z0-9][a-z0-9-_.]+@([a-z]|[a-z0-9]?[a-z0-9-]+[a-z0-9])\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/;
        return re.test(email);
    },

    isHTOfficialStudentId(studentId) {
        return studentId === 170123561 || studentId === 81692214;
    },

    parseInputPayload(payload) {
        const params = {};
        payload.replace('}', '').replace('{', '').split(',').map((item) => item.split('=').map((e) => e.trim()))
            .forEach((pair) => {
                params[pair[0]] = pair[1];
            });
        return params;
    },
};
