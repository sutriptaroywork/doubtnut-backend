module.exports = class Formulas {
    static getSubject(database) {
        let sql = '';
        sql = 'SELECT * FROM `formula_subject` ORDER By seq ASC';
        return database.query(sql);
    }

    static getSuperChapterBySubject(database, subject_id) {
        let sql = '';
        sql = 'Select * FROM formula_super_chapter where subject_id = ?';
        return database.query(sql, [subject_id]);
    }

    static getChaptersBySuperChapterIds(database, superChapterIdArray, subjectId) {
        const params = [];
        params.push(superChapterIdArray);
        params.push(subjectId);
        let sql = '';
        sql = 'Select * FROM formula_chapter where super_chapter_id IN (?) AND subject_id = ?';
        return database.query(sql, params);
    }

    static getTopicsByChapterId(database, chapterId) {
        let sql = '';
        sql = 'Select * FROM formula_topic where chapter_id = ?';
        return database.query(sql, [chapterId]);
    }

    static getFormulasByTopics(database, topicIdsArray, chapterId) {
        let sql = '';
        sql = 'Select * FROM formula_formulas where chapter_id = ? AND topic_id IN (?)';
        return database.query(sql, [chapterId, topicIdsArray]);
    }

    static getFormulasConstantByFormulasIds(database, formulaIdsArray) {
        let sql = '';
        sql = 'SELECT * FROM formula_constant_parameters Where formula_id IN (?)';
        return database.query(sql, [formulaIdsArray]);
    }

    static getFormulaslegendsByFormulasIds(database, formulaIdsArray) {
        let sql = '';
        sql = 'SELECT * FROM formula_legends Where formula_id IN (?)';
        return database.query(sql, [formulaIdsArray]);
    }

    static getCheatsheets(database, student_id) {
        const sql = 'SELECT * FROM formula_cheatsheet where is_generic = 1 OR student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getCheatsheetById(database, cheatsheet_id) {
        let sql = '';
        sql = 'SELECT * FROM formula_cheatsheet Where id = ?';
        return database.query(sql, [cheatsheet_id]);
    }

    static getGlobalSearchResultFormula(database, query) {
        let sql = '';
        sql = 'SELECT * from formula_formulas WHERE name LIKE ?';
        return database.query(sql, [`%${query}%`]);
    }


    static getGlobalSearchResultChapter(database, query) {
        let sql = '';
        sql = `SELECT * from formula_chapter WHERE name LIKE ?`;
        return database.query(sql, [`%${query}%`]);
    }


    static getGlobalSearchResultTopic(database, query) {
        let sql = '';
        sql = `SELECT * from formula_topic WHERE name LIKE ?`;
        return database.query(sql, [`%${query}%`]);
    }

    static getFormulasByChapterId(database, Id) {
        let sql = '';
        sql = 'SELECT * from formula_formulas Where chapter_id = ?';
        return database.query(sql, [Id]);
    }

    static getFormulasByTopicId(database, Id) {
        let sql = '';
        sql = 'SELECT * from formula_formulas Where topic_id = ?';
        return database.query(sql, [Id]);
    }

    static getFormulasById(database, Id) {
        let sql = '';
        sql = 'SELECT * from formula_formulas Where id = ?';
        return database.query(sql, [Id]);
    }

    static createCheatsheet(database, cheatSheetName, student_id, num_formula) {
        let sql = '';
        sql = 'INSERT INTO `formula_cheatsheet`( `name`, `num_formulas`, `student_id`) VALUES (?,?,?)';
        return database.query(sql, [cheatSheetName, num_formula, student_id]);
    }

    static getCheatSheetFormulasById(database, id) {
        let sql = '';
        sql = 'SELECT * FROM formula_cheatsheet_formula Where cheatsheet_id = ?';
        return database.query(sql, [id]);
    }

    static getFormulasByIds(database, idsArray) {
        let sql = '';
        sql = 'SELECT * FROM formula_formulas Where id IN (?)';
        return database.query(sql, [idsArray]);
    }

    static getFormulasByChapterIds(database, idsArray) {
        let sql = '';
        sql = 'SELECT * from formula_formulas Where chapter_id IN (?)';
        return database.query(sql, [idsArray]);
    }

    static getFormulasBytopicIds(database, idsArray) {
        let sql = '';
        sql = 'SELECT * from formula_formulas Where topic_id IN (?)';
        return database.query(sql, [idsArray]);
    }

    static insertFormulasIntoCheatSheet(database, formulasArray) {
        let sql = '';
        sql = 'INSERT INTO formula_cheatsheet_formula Set ?';
        return database.query(sql, formulasArray);
    }
};
