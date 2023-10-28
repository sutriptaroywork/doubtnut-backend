module.exports = class feedback {
    static insertFeedBack(database, obj) {
        const sql = 'INSERT INTO bounty_feedback SET ?';
        return database.query(sql, [obj]);
    }
};
