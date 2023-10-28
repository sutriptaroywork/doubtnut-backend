// const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class LanguageTranslations {
    static async getTranslatedDataForRow(database, table_name, row_id, column_name, locale) {
        const sql = 'select translation from language_translation where table_name =? and row_id = ? and locale = ? and column_name = ?';
        // console.log(sql);
        return await database.query(sql, [table_name, row_id, locale, column_name]);
    }
};
