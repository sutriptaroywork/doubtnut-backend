// const request = require("request")
module.exports = class OldVideoView {
    static insertAnswerView(data, database) {
        const sql = 'INSERT INTO view_download_stats_new SET ?';
        return database.query(sql, [data]);
    }
};
