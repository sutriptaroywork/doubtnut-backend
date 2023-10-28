const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class Answer {
    static getSuperSeriesDataType(description, type, student_class, limit, database) {
        const sql = 'SELECT DISTINCT cast(package_id as char(50)) as id, package_id,package,NULL as level1,NULL as level2,NULL as location,class,NULL as status,package_order,? as type, package as title,img_url,? as description from pdf_download where package_id in (2,4,20) and class =? and status=1 order by rand()';
        // console.log(sql);
        return database.query(sql, [type, description, student_class]);
    }

    static getJeeMains2019AprilDataType(description, type, student_class, limit, database) {
        const sql = 'SELECT DISTINCT cast(concat(package_id,level1) as char(50)) as id, package_id,package,level1,NULL as level2,NULL as location,class,NULL as status,package_order,? as type, level1 as title,img_url,? as description from pdf_download where package_id in (28) and class =? and status=1 order by rand()';
        return database.query(sql, [type, description, student_class]);
    }

    static getNeet2019AprilDataType(description, type, student_class, limit, database) {
        const sql = 'SELECT DISTINCT cast(concat(package_id,level1) as char(50)) as id, package_id,package,level1,NULL as level2,location,class,NULL as status,package_order,? as type, level1 as title,img_url,? as description from pdf_download where package_id in (29) and class =? and status=1 order by rand()';
        return database.query(sql, [type, description, student_class]);
    }

    static getMocktestDataType(description, type, student_class, limit, database) {
        const sql = 'SELECT cast(concat(package_id,level1) as char(50)) as id, package_id,package,level1,NULL as level2,NULL as location,class,NULL as status,package_order,? as type, level1 as title,img_url,? as description from pdf_download where package_id in (27) and class =? and status=1 group by package_id, package,level1,class,package_order order by rand() limit ?';
        return database.query(sql, [type, description, student_class, limit]);
    }

    static getJeeMainsPrevYearDataType(action_activity, description, type, student_class, limit, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type, case when level1 is null then package else level1 end as title,img_url, ? as action_activity,? as description from pdf_download where package_id in (10) and class =? and status=1 order by id desc limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static getJeeAdvPrevYearDataType(action_activity, description, type, student_class, limit, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type, case when level1 is null then package else level1 end as title,img_url,? as action_activity,? as description from pdf_download where package_id in (9) and class =? and status=1 order by id desc limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static getFormulaSheetDataType(action_activity, description, type, student_class, limit, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level2 is null then package else level2 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (17) and class =? and status=1 order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static getCutOffListDataType(action_activity, description, type, student_class, limit, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level2 is null then package else level2 end as title,img_url,? as action_activity,? as description from pdf_download where package_id in (18) and class =? and status=1 and level1=\'2018\' order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static get12PrevYearDataType(action_activity, description, type, student_class, limit, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (11) and class =? and status=1 order by id desc limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static get12SamplePaperDataType(action_activity, description, type, student_class, limit, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (15) and class =? and status=1 order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static get12MostImportantQuestionDataType(action_activity, description, type, student_class, limit, database) {
    // console.log("==============================Inside Most important question");
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title,img_url,? as action_activity,? as description from pdf_download where package_id in (5) and class =? and status=1 order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static get10BoardPrevYearDataType(action_activity, description, type, limit, student_class, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (14) and class =? and status=1 order by id desc limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static get10SamplePaperDataType(action_activity, description, type, limit, student_class, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (16) and class =? and status=1 order by id desc limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static get10MostImportantQuestionDataType(action_activity, description, type, limit, student_class, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (6) and class =? and status=1 limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static getIBPSClerkSpecialDataType(action_activity, description, type, limit, student_class, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (3) and class =? and status=1 order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static getConceptBoosterPdfDataType(action_activity, description, type, limit, student_class, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (7) and class =? and status=1 order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }

    static getNcertSolutionsPdfDataType(action_activity, description, type, limit, student_class, database) {
        let sql = '';
        let params = [];
        if (student_class == '14') {
            sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,\'downloadpdf_level_two\' as action_activity,? as description from pdf_download where package_id in (13) and class =? and status=1 group by level1 order by rand() limit ?';
            params = [type, description, student_class, limit];
        } else {
            sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level2 is null then package else level2 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (13) and class =? and status=1 order by rand() limit ?';
            params = [type, action_activity, description, student_class, limit];
        }
        return database.query(sql, params);
    }

    static getClass9FoundationCourseDataType(action_activity, description, type, limit, student_class, database) {
        const sql = 'SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,? as type,case when level1 is null then package else level1 end as title, img_url,? as action_activity,? as description from pdf_download where package_id in (1) and class =? and status=1 order by rand() limit ?';
        return database.query(sql, [type, action_activity, description, student_class, limit]);
    }
};
