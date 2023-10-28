module.exports = class reportSpam {
    static reportSpam(database, obj) {
        const sql = 'INSERT INTO report_spam SET ?';
        return database.query(sql, [obj]);
    }
};
