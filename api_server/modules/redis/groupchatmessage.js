/**
 * @Author: xesloohc
 * @Date:   2019-07-19T13:39:54+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-07-30T16:12:40+05:30
 */
// let Utility = require('./utility');

module.exports = class Groupchat {
    static getIsSeenToday(client, studentId) {
        return client.getAsync(`gupshup_${studentId}`);
    }

    static setIsSeenToday(client, studentId) {
        const todayEnd = new Date().setHours(23, 59, 59, 999);
        return client.multi()
            .set(`gupshup_${studentId}`, '1')
            .expireat(`gupshup_${studentId}`, parseInt(todayEnd / 1000))
            .execAsync();
    }
};
