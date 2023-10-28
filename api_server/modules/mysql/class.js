
// const _ = require('lodash');

module.exports = class Class {
    static getList(language, database) {
        const sql = `SELECT a.class,b.class_display FROM ( SELECT DISTINCT class FROM mc_course_mapping where active_status in (1,2)) as a left join (SELECT class,${language} as class_display FROM \`class_display_mapping\`)as b on a.class=b.class`;
        return database.query(sql);
    }

    static getListNew(language, appCountry, database) {
        let sql = `SELECT a.class,b.class_display FROM ( SELECT DISTINCT class FROM mc_course_mapping where active_status in (1,2)) as a left join (SELECT class,${language} as class_display FROM \`class_display_mapping\`)as b on a.class=b.class`;
        if (appCountry == 'IN') {
            sql += ' WHERE a.class BETWEEN 6 AND 14';
        } else if (appCountry == 'US') {
            sql += ' WHERE a.class BETWEEN 21 AND 27';
        }
        sql += ' order by a.class desc';
        return database.query(sql);
    }

    static getClassListNewOnBoarding(database, language) {
        const sql = `SELECT class as id,${language} as title,class as code,'class' as type, 0 as is_active from class_display_mapping WHERE class BETWEEN 6 AND 14 order by id desc`;
        return database.query(sql);
    }

    static getClassDetailsByClassCode(database, language, sClass) {
        const sql = `SELECT class as code,${language} as title from class_display_mapping where class='${sClass}'`;
        return database.query(sql);
    }

    static getClassListNewOnBoardingForHome(database, language, appCountry) {
        let sql = `SELECT class ,${language} as class_display from class_display_mapping`;
        if (appCountry == 'IN') {
            sql += ' WHERE class BETWEEN 6 AND 14';
        } else if (appCountry == 'US') {
            sql += ' WHERE class BETWEEN 21 AND 27';
        }
        sql += ' order by class desc';
        return database.query(sql);
    }

    static getClassList(database) {
        const sql = 'select english from class_display_mapping order by class asc';
        return database.query(sql);
    }

    static getEnglishClassList(database) {
        const sql = 'select class,english as class_display from class_display_mapping';
        return database.query(sql);
    }
};
