module.exports = class BookMarkedQuestions {
    static addedPlaylistCheck(question_id, student_id, database) {
        const sql = 'select student_id, name, question_id, playlist_id from((select * from student_playlists where student_id =?) as a inner join(select * from playlist_questions_mapping where question_id =?) as b on a.id = b.playlist_id)';
        return database.query(sql, [student_id, question_id]);
    }

    static checkBookmarked(question_id, student_id, database) {
        const sql = 'select * from question_bookmarked where student_id=? AND question_id=?';
        return database.query(sql, [student_id, question_id]);
    }
};
