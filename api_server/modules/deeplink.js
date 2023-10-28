// const _ = require('lodash');
// const Utility = require('./utility');

module.exports = class DeepLink {
    static addNumber(mobile_num, source, database) {
  	const obj = { number: mobile_num, source };
        const sql = 'INSERT IGNORE INTO deeplink_number SET ?';
        return database.query(sql, [obj]);
    }
};
