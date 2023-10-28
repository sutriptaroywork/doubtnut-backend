const _ = require('lodash');
const StudentRedis = require('../../modules/redis/student');

async function isBookmarkedFunc(db, studentId, examCornerId) {
    const result = await StudentRedis.getExamCornerBookmarks(db.redis.read, studentId);
    if (_.isNull(result)) {
        return false;
    }
    return result.includes(examCornerId.toString());
}

module.exports = {
    isBookmarkedFunc,
};
