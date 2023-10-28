module.exports = class Notice {
    static getAllNoticesDetails(database, type, versionCode, flagVariantsArr, todayStartDateTime, todayEndDateTime, campaign, packageValue) {
        let sql = 'select * from notice where start_date <= CURRENT_TIMESTAMP AND end_date >= ? AND is_active = 1 AND flagr_variant IN (?) AND min_version < ?  AND max_version >= ? ';
        let data = [todayStartDateTime, flagVariantsArr, versionCode, versionCode, campaign];
        if (type === 'todays_special') {
            sql = 'select * from notice where start_date <= CURRENT_TIMESTAMP AND end_date >= ? AND end_date <= ? AND is_active = 1 AND flagr_variant IN (?) AND min_version < ? AND max_version >= ? ';
            data = [todayStartDateTime, todayEndDateTime, flagVariantsArr, versionCode, versionCode, campaign];
        }
        if (campaign) {
            sql += 'AND (campaign IS NULL OR campaign = ?) ';
        } else {
            sql += 'AND campaign IS NULL ';
        }
        if (packageValue === 'default') {
            sql += 'and (package = \'default\' or package is null) ';
        } else {
            sql += `and package = '${packageValue}' `;
        }
        sql += 'ORDER BY priority';
        return database.query(sql, data);
    }
};
