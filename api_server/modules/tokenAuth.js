const jwt = require('jsonwebtoken');

const session_expiry_time = 1 * 60 * 10; // 5 minutes
const token_expiry_time = '730d';

module.exports = class Token {
    static createRandomString(length, chars) {
        let result = '';
        for (let i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        const currentTimestamp = new Date().getTime();
        const partA = result.substr(0, 58);
        const partB = result.substr(58, 57);
        result = partA + currentTimestamp + partB;
        return result;
    }

    static makeid() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 15; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    static create(student_id, config) {
        return jwt.sign({ id: student_id }, config.jwt_secret, {
            expiresIn: token_expiry_time,
        });
    }

    static verify(config, token, ignoreExpiration = false) {
        return jwt.verify(token, config.jwt_secret, { ignoreExpiration });
    }

    tokenVerification(token) {
        return this.client.hgetAsync('tokens', token);
    }

    tokenVerification2(token) {
        return this.client.hgetAsync(`doubtnut_token_${token}`);
    }

    static otpCreate(session_id, contact_number, email, class1, course, language, app_version, gcm_reg_id, udid, is_web, client) {
        return client.multi()
            .set(`otp_sessions_${session_id}`, JSON.stringify({
                contact_number,
                email,
                class: class1,
                course,
                language,
                app_version,
                gcm_reg_id,
                udid,
                is_web,
            }))
            .expireat(`otp_sessions_${session_id}`, parseInt((+new Date()) / 1000) + session_expiry_time)
            .execAsync();
    }

    static otpCreateUpdated(data, client) {
        const {
            session_id,
            contact_number,
            email,
            class1,
            course,
            language,
            app_version,
            gcm_reg_id,
            udid,
            is_web,
            clevertap_id,
        } = data;
        return client.multi()
            // remove old token
            .set(`otp_sessions_${session_id}`, JSON.stringify({
                contact_number,
                email,
                class: class1,
                course,
                language,
                app_version,
                gcm_reg_id,
                udid,
                is_web,
                clevertap_id,
            }))
            .expireat(`otp_sessions_${session_id}`, parseInt((+new Date()) / 1000) + session_expiry_time)
            .execAsync();
    }

    static getContact(session_id, client) {
        return client.getAsync(`otp_sessions_${session_id}`);
    }

    static getOtpByContact(mobile, client) {
        return client.getAsync(`otp_${mobile}`);
    }

    static setOtpByContact(mobile, data, client) {
        return client.multi()
            .set(`otp_${mobile}`, JSON.stringify(data))
            .expireat(`otp_${mobile}`, parseInt((+new Date()) / 1000) + session_expiry_time)
            .execAsync();
    }

    static getContactBySessionId(session_id, client) {
        return client.getAsync(`otp_session_id_${session_id}`);
    }

    static setContactBySessionId(session_id, mobile, client) {
        return client.multi()
            .set(`otp_session_id_${session_id}`, mobile.toString())
            .expireat(`otp_session_id_${session_id}`, parseInt((+new Date()) / 1000) + session_expiry_time)
            .execAsync();
    }
};
