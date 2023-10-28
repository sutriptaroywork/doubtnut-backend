// const _ = require('lodash');
// const config = require('../../config/config');
const mysql = require('../mysql/userProperties');
// const redis = require('../redis/userProperties');

module.exports = class UserProperties {
    static getDefault() {
        return { state: 'NotFlagged' };
    }

    static async getByStudentID(db, studentID) {
        try {
            // let data;
            // if (0) {
            //     data = await redis.getByStudentID(db.redis.read, studentID);
            //     if (!_.isNull(data)) {
            //         return JSON.parse(data);
            //     }
            // }
            const data = await mysql.getByStudentID(db.mysql.read, studentID);
            if (data.length > 0) {
                data[0].properties = JSON.parse(data[0].properties);
                data[0].properties.state = 'Flagged';
                // if (0) await redis.setByStudentID(db.redis.write, studentID, data);
            }
            return data;
        } catch (error) {
            // console.error(error);
            throw new Error(error);
        }
    }
};
