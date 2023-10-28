const referralMysql = require('../../modules/mysql/referralFlow');
const couponMysql = require('../../modules/mysql/coupon');

async function getRefererSidAndCouponCode(db, studentId) {
    const campaignData = await referralMysql.getReferalCampaignDetails(db.mysql.read, studentId);
    if (campaignData.length > 0) {
        const refererSid = campaignData[0].campaign.split(';;;')[1];
        const refererCouponCode = await couponMysql.getInfoByStudentId(db.mysql.read, refererSid);
        if (refererCouponCode.length > 0) {
            return {
                student_id: refererSid,
                coupon_code: refererCouponCode[0].coupon_code,
            };
        }
    }
    return null;
}
module.exports = {
    getRefererSidAndCouponCode,
};
