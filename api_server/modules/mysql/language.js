module.exports = class Language {
    static getList(database) {
        const sql = 'SELECT * FROM languages WHERE is_active = 1';
        return database.query(sql);
    }

    static getByCode(code, database) {
        const sql = 'SELECT language FROM languages WHERE code = ? and is_active = 1';
        return database.query(sql, [code]);
    }

    static getLanguageByCode(database, code) {
        const sql = 'SELECT * FROM languages WHERE code = ? and is_active = 1';
        return database.query(sql, [code]);
    }
};
