const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/studentProperties');
const redis = require('../redis/studentProperties');

module.exports = class StudentProperties {
    constructor() {
    }

    static getWidgetTypeContent(db, config, widget_type, student_locale) {
        return new Promise(async (resolve, reject) => {
            try {
                let data;
                // if (config.caching){
                if (0) {
                    data = await redis.getHomePageWidgetContentByType(db.redis.read, widget_type, student_locale);
                    if (!_.isNull(data)) {
                        resolve(JSON.parse(data));
                    } else {
                        data = await mysql.getHomePageWidgetContentByType(db.mysql.read, widget_type, student_locale);
                        if (data.length > 0) {
                            await redis.setHomePageWidgetContentByType(db.redis.write, data, widget_type, student_locale);
                        }
                        resolve(data);
                    }
                } else {
                    data = await mysql.getHomePageWidgetContentByType(db.mysql.read, widget_type, student_locale);
                    resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
};
