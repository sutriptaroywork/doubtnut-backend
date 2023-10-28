module.exports = class pzn {
    static getVideosByPznTG(database, targetGroup, mcID, locale) {
        const sql = 'select b.question_id from (select target_group_type from studentid_package_mapping_new where target_group= ? group by target_group_type) as a inner join (select target_group, mc_id, locale, question_id from pzn_similar where mc_id= ? and locale= ?) as b on a.target_group_type=b.target_group inner join (select question_id, question, matched_question, chapter, subject from questions where student_id < 100) as c on b.question_id=c.question_id order by rand() limit 2';
        // console.log(sql);
        return database.query(sql, [targetGroup, mcID, locale]);
    }

    static getVideos(database, mcID, locale) {
        const sql = 'select b.question_id from (select target_group, mc_id, locale, question_id from pzn_similar where mc_id= ? and locale= ?) as a inner join (select question_id, question, matched_question, chapter, subject from questions where student_id < 100) as b on a.question_id=b.question_id order by rand() limit 2';
        // console.log(sql);
        return database.query(sql, [mcID, locale]);
    }
};
