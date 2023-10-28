/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2018-12-27 18:01:54
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-18 17:37:46
*/

module.exports = class Rules {
    static getRulesById(database, ruleId) {
        const params = [];
        params.push(ruleId);
        let sql = '';
        sql = 'SELECT * FROM `testseries_rules` WHERE id = ?';
        return database.query(sql, params);
    }
};
