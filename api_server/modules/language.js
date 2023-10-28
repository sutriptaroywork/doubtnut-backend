
module.exports = class Language {
    static getList(database) {
        const sql = 'SELECT * FROM languages WHERE is_active = 1 order by language_order asc';
        return database.query(sql);
    }

    static changeLanguage(question_id, language, database) {
        const sql = `SELECT ${language} from questions_localized where question_id = ?`;
        return database.query(sql, [question_id]);
    }

    static getListNewOnBoarding(database) {
        const sql = "SELECT id,language_display as title,code,'language' as type, 0 as is_active FROM languages WHERE is_active = 1 order by language_order asc";
        return database.query(sql);
    }
};
