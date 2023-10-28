const { getCcmIdbyStudentId } = require('../../../modules/mysql/student');
const { getAdsData } = require('./stories.helper');

async function getAds(req, res, next) {
    let responseData = {};
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        let { locale } = req.user;
        if (locale !== 'hi') {
            locale = 'en';
        }
        let ccmIds = await getCcmIdbyStudentId(db.mysql.read, student_id);
        ccmIds = ccmIds.map((id) => id.ccm_id);
        const ads = await getAdsData(db.mysql.read, ccmIds, locale);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                story: ads,
            },
        };
        return res.json(responseData);
    } catch (error) {
        console.log(error);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Something Went Wrong',
            },
        };
        next(responseData);
    }
}

module.exports = { getAds };
