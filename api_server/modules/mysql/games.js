module.exports = class Games {
    static getList(database, order) {
        const sql = `select * from games where is_active=1 ORDER BY ${order}`;
        return database.query(sql);
    }

    static getBanner(database, versionCode) {
        const sql = 'select image_url from app_banners where class=\'all\' and min_version_code<? and max_version_code>=? and page_type like \'%GAMES%\'';
        console.log(sql);
        return database.query(sql, [versionCode, versionCode]);
    }

    static getGameByID(database, gameID) {
        // DID NOT CHCK is_active, since getList doesnt return any
        const sql = 'SELECT * FROM games WHERE id = ?';
        return database.query(sql, [gameID]);
    }
};
