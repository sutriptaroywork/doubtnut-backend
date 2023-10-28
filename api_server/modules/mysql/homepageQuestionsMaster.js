module.exports = class HomePageQuestionsMaster {
    static getTopicBoosterCategoryWiseData(database, widgetType, sClass, chapter) {
        const sql = `SELECT * FROM (
                        (SELECT
                            id,
                            question_id AS qid,widget_name,
                            class,subject,
                            chapter,
                            master_chapter_alias
                        FROM homepage_questions_master
                        WHERE
                            widget_name =? AND is_active=1
                        ) as a
                        INNER JOIN
                        (SELECT
                            question_id ,
                            is_answered,
                            is_text_answered
                        FROM questions
                        ) as c
                        ON a.qid = c.question_id
                        INNER JOIN
                        (SELECT
                            answer,
                            question_id
                        FROM text_solutions
                        WHERE
                            answer IN ('a','b','c','d','A','B','C','D')
                        ) as b
                        ON a.qid = b.question_id
                        )
                        WHERE a.class= ? AND
                        CASE WHEN a.master_chapter_alias is not NULL THEN a.master_chapter_alias = ? ELSE a.chapter = ? END`;
        return database.query(sql, [widgetType, sClass, chapter, chapter]);
    }

};
