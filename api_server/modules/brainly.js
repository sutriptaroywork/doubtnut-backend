module.exports = class Brainly {
    static insertBrainlyRating(gcm, qid, rating, database) {
        const sql = "INSERT INTO `web_external_question_rating` (`id`, `qid`, `gcm_id`, `rating`) VALUES ('', ?, ?, ?)";
        return database.query(sql, [qid, gcm, rating]);
    }
};
