const { ValidationError } = require('express-validation');
const PaidUserChampionshipData = require('./paidUserChampionship.data');
const PaidUserChampionshipMysql = require('../../../modules/mysql/paidUserChampionship');

async function claimReward(req, res, next) {
    try {
        const { type, id } = req.query;
        const { student_id: studentId, locale } = req.user;

        const db = req.app.get('db');
        const result = await PaidUserChampionshipMysql.getTshirtRewardDataById(db.mysql.read, id);
        if (result[0].student_id !== studentId) {
            throw new ValidationError('invalid username');
        }
        const states = [];
        PaidUserChampionshipMysql.updateSeenTshirtReward(db.mysql.write, id);
        Object.keys(PaidUserChampionshipData.stateAbbreviationMapping).forEach((item) => states.push({ id: item, title: PaidUserChampionshipData.stateAbbreviationMapping[item] }));
        states.unshift({
            id: '',
            title: locale === 'hi' ? 'स्टेट' : 'State',
        });
        const sizes = [];
        PaidUserChampionshipData.shirtSizes.forEach((item) => sizes.push({ id: item, title: item }));
        sizes.unshift({
            id: '',
            title: locale === 'hi' ? 'साइज़ चुनिये' : 'Select Size',
        });
        const data = {
            title: 'Enter Your Address',
            hint_full_name: locale === 'hi' ? 'पूरा नाम' : 'Full Name',
            title_text_sizeFull: '14',
            title_text_color: '#272727',
            country_code: '+91',
            hint_mobile_number: locale === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number',
            hint_pin_code: locale === 'hi' ? 'पिन कोड' : 'PIN CODE',
            hint_address_one: locale === 'hi' ? 'फ्लैट, हाउस नंबर, बिल्डिंग, अपार्टमेंट' : 'Flat, House No., Building, Apartment',
            hint_address_two: locale === 'hi' ? 'क्षेत्र, कॉलोनी, गली, सेक्टर, गांव' : 'Area, Colony, Street, Sector, Village',
            hint_landmark: locale === 'hi' ? 'लैंडमार्क (उदाहरण, नियर रिलायंस मार्ट)' : 'Landmark eg. Near Reliance Mart',
            hint_city: locale === 'hi' ? 'टाउन/सिटी' : 'Town/ City',
            hint_state: locale === 'hi' ? 'स्टेट' : 'STATE',
            submit_text: locale === 'hi' ? 'सबमिट' : 'Submit',
            extra_params: { type, id },
            states,
            sizes,
        };
        return next({ data });
    } catch (err) {
        return next({ err });
    }
}

async function submitClaim(req, res, next) {
    try {
        const {
            full_name: fullName, address_one: addressOne, address_two: addressTwo, city, country_code: countryCode, landmark, mobile_number: mobile, pin_code: pincode, state_id: stateId, id, size_id: sizeId,
        } = req.body;
        const db = req.app.get('db');
        const { locale } = req.user;
        let errorMessage = '';
        // eslint-disable-next-line no-restricted-globals
        if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
            errorMessage = locale === 'hi' ? 'अमान्य मोबाइल' : 'Invalid Mobile';
        } else if (!fullName) {
            errorMessage = locale === 'hi' ? 'पूरा नाम लिखें' : 'Enter Full Name';
        } else if (!stateId) {
            errorMessage = locale === 'hi' ? 'राज्य चुनें' : 'Select State';
        } else if (!addressOne) {
            errorMessage = locale === 'hi' ? 'पता लिखिए' : 'Enter address';
        } else if (!city) {
            errorMessage = locale === 'hi' ? 'शहर लिखें' : 'Enter City';
        } else if (!pincode) {
            errorMessage = locale === 'hi' ? 'पिनकोड लिखें' : 'Enter Pincode';
        } else if (!sizeId) {
            errorMessage = locale === 'hi' ? 'साइज़ चुनें' : 'Select Size';
        }

        if (errorMessage) {
            return next({ data: { error_message: errorMessage } });
        }

        await PaidUserChampionshipMysql.claimReward(db.mysql.write, addressOne, addressTwo, city, countryCode, landmark, mobile, pincode, PaidUserChampionshipData.stateAbbreviationMapping[stateId], fullName, id, sizeId);
        return next({
            data: {
                message: locale === 'hi' ? 'अपनी डिटेल्स सबमिट करने के लिए धन्यवाद। टी-शर्ट 45 दिनों में डिलीवर हो जाएगी।' : 'Thank you for submitting your details, T-shirt will be delivered in 45 days!',
            },
        });
    } catch (err) {
        return next({ err });
    }
}

module.exports = {
    claimReward,
    submitClaim,
};
