const _ = require('lodash')
const config = require('../../config/config')
const mysql = require("../mysql/structuredCourse")
const redis = require("../redis/structuredCourse")

module.exports = class StructuredCourse {
    constructor() {
    }

    static async getListingDetails(structuredCourseId, student_class, db) {
        return new Promise(async function (resolve, reject) {
            try {
                let data
                if (0) {
                    data = await redis.getListingDetails(structuredCourseId, student_class, db.redis.read)
                    if (!_.isNull(data)) {
                        return resolve(JSON.parse(data))
                    } else {
                        data = await mysql.getListingDetails(structuredCourseId, student_class, db.mysql.read)
                        if (data.length > 0) {
                            await redis.setListingDetails(structuredCourseId, student_class, data, db.redis.write)
                        }
                        return resolve(data)
                    }
                } else {
                    data = await mysql.getListingDetails(structuredCourseId, student_class, db.mysql.read)
                    return resolve(data)
                }
            } catch (e) {
                reject(e)
            }
        })
    }
}
