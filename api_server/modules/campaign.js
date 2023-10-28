module.exports = class Campaign {
    static checkNps(student_id, database) {
        const sql = 'SELECT s.student_id, c.id FROM campaign_students as s INNER JOIN campaigns as c on s.campaign_id= c.id WHERE c.end >= CURDATE() and c.start <= CURDATE() AND s.student_id = ? AND s.rating is null';
        return database.query(sql, [student_id]);
    }

    static getCampaignQuestion(id, database) {
        const sql = 'select * from campaigns where id = ?';
        return database.query(sql, [id]);
    }

    static updateCampaignRating(campaign_id, student_id, rating, database) {
        const params = {};
        if (typeof rating !== 'undefined' && rating) {
            params.rating = rating;
        }
        const sql = 'UPDATE campaign_students SET ?  where student_id = ? AND campaign_id = ?';
        return database.query(sql, [params, student_id, campaign_id]);
    }
};
