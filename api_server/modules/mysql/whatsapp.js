module.exports = class Student {
    constructor() {
    }

    static getQuestionCountWithFingerprint(database) {
        let sql = "select a.mobile,a.question_count,b.fingerprints,b.student_id from ((select mobile , question_count from wa_retention_old) as a left join (select mobile , fingerprints ,student_id from students ) as b on a.mobile = b.mobile)";
        return database.query(sql);
      }

    static insert_wa_retention_old(resp,database){
        let sql = "INSERT INTO wa_retention_old (mobile,question_count) VALUES ?";
        return database.query(sql,[resp]);
    }

    static getNumbers_wa_students(date,database){
        let gt = new Date(date);
        gt.setHours(0, 0, 0, 0);
        let today = gt
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();
        today = yyyy + '-' + mm + '-' + dd;
        today = today.toString()
        console.log(today,'todayyy')
        let nextDay = gt
        let dd1 = parseInt(String(nextDay.getDate()).padStart(2, '0'))+1
        let mm1 = String(nextDay.getMonth() + 1).padStart(2, '0');
        let yyyy1 = nextDay.getFullYear();
        nextDay = yyyy1 + '-' + mm1 + '-' + dd1;
        nextDay=nextDay.toString()
        console.log('nextDay' , nextDay)
        let sql = "SELECT DISTINCT(mobile) FROM `whatsapp_students` WHERE timestamp BETWEEN ? AND ?";
        return database.query(sql, [today, nextDay]);

    }
    
    static truncating_wa_students(database){
        let sql = "TRUNCATE table wa_retention_old";
        return database.query(sql);
    }


}