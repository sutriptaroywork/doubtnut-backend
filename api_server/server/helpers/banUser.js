const BannedUser = require('../../modules/mysql/banneduser');

async function banUser(db, reportedStudentID) {
    const checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, reportedStudentID);
    if (checkbanned.length > 0) {
        return false;
        // already BANNED
    }
    const banMode = await BannedUser.getBanMode(db.mysql.read, reportedStudentID);
    if (banMode.length && banMode[0].ban_mode !== 'MANUAL') {
        await BannedUser.banUser(db.mysql.write, reportedStudentID);
        return true;
    }

    return false;
}

module.exports = {
    banUser,
};
