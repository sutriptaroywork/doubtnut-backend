const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/textSolutions');
const redis = require('../redis/textSolutions');

module.exports = class TextSolutions {
    constructor() {
    }

    static async getTextSolutions(db, question_id) {
        // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let data = 0;
                if (config.caching) {
                    data = await redis.getTextSolutions(db.redis.read, question_id);
                    // data=null
                    console.log(data);
                    if (!_.isNull(data)) {
                        console.log('exist');
                        return resolve(JSON.parse(data));
                    }
                    // get from mysql
                    console.log(' not exist');
                    data = await mysql.getTextSolutions(db.mysql.read, question_id);
                    if (data.length > 0) {
                        await redis.setTextSolutions(db.redis.write, question_id, data);
                    }
                    return resolve(data);
                }
                console.log(' not exist');
                data = await mysql.getTextSolutions(db.mysql.read, question_id);

                // console.log("mysql data")
                //
                // console.log(data)
                return resolve(data);
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
};
