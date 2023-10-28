const GooglePhoneUtility = require('google-libphonenumber');

module.exports = class PhoneUtility {
    /** *
   * All phone number related utilities will go here
   */
    static isValidPhoneNumber(phone) {
        if (!Number.isNaN(phone) && phone.length >= 4 && parseInt(phone) >= 0) {
            return true;
        }
        return false;
    }

    static isValidIndianPhoneNumber(phone) {
        if (!Number.isNaN(phone) && phone.length === 10 && parseInt(phone.charAt(0)) >= 6) {
            return true;
        }
        return false;
    }

    static isValidNumberByCountry(phone, country) {
        const phoneUtil = GooglePhoneUtility.PhoneNumberUtil.getInstance();
        if (country === 'IN') {
            return this.isValidIndianPhoneNumber(phone);
        }
        return phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, country), country);
    }

    static invalidPhoneNumberResponse() {
        return {
            meta: {
                code: 401,
                success: false,
                message: 'Wrong mobile Number',
            },
            data: {
                status: 'FAILURE',
                session_id: false,
            },
        };
    }
};
