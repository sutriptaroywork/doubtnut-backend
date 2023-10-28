module.exports = class settings {
    static getAboutus(database, region) {
        const sql = 'SELECT aboutus FROM wordpress_data where region = ? ';
        return database.query(sql, [region]);
    }

    static getTnc(database, region) {
        const sql = 'SELECT tnc FROM wordpress_data where region = ?';
        return database.query(sql, [region]);
    }

    static getPrivacy(database, region) {
        const sql = 'SELECT privacy FROM wordpress_data where region = ?';
        return database.query(sql, [region]);
    }

    static getContactUs(database, region) {
        const sql = 'SELECT contactus FROM wordpress_data where region = ?';
        return database.query(sql, [region]);
    }

    static getHtml(database, region) {
        const sql = 'SELECT `value` FROM `app_constants` WHERE `constant_key` = \'camera_guide\' and region = ?';
        return database.query(sql, [region]);
    }

    static getRefundPolicy(database, region) {
        const sql = 'SELECT refunds FROM wordpress_data where region = ?';
        return database.query(sql, [region]);
    }
};
