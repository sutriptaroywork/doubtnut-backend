
module.exports = class GoogleAppRatingUsers {
    static addGoogleRatingByUser(database, student_id, status) {
        const insert_obj = {
            student_id,
            status,
        };
        const sql = 'INSERT INTO google_app_rating_users SET ?';
        return database.query(sql, insert_obj);
    }

    static checkUserAlreadySumbittedGoogleRating(database, student_id) {
        const sql = 'select * from google_app_rating_users where student_id = ?';
        return database.query(sql, student_id);
    }
};
