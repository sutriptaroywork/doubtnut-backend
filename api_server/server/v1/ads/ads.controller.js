const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const kafka = require('../../../config/kafka');

let db;
async function updateEngageTime(req, res, next) {
    try {
        db = req.app.get('db');
        const { uuid } = req.body;
        const { engage_time } = req.body;
        await CourseMysqlV2.addCourseAdsEngageTime(db.mysql.write, uuid, engage_time);
        return res.status(200).json({ message: 'Success' });
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    updateEngageTime,
};
