/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 18:11:23
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-16 14:05:31
*/

const Language = require('../../../modules/language');
const Student = require('../../../modules/student');
const Utility = require('../../../modules/utility');
const UtilityIP = require('../../../modules/Utility.IP');
const StaticData = require('../../../data/data');

let db;

async function getList(req, res, next) {
    db = req.app.get('db');

    const countryByIP = await UtilityIP.getCountryFromIPAddress(req);
    Language.getList(db.mysql.read).then(async (values) => {
        let withoutIcons = values.map((x) => {
            x.icons = '';
            return x;
        });

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: withoutIcons,
        };
        if (req.headers.version_code > 866) {
            let title = StaticData.classListTitle2;
            let subTitle = StaticData.classListSubTitle2;

            if (countryByIP !== 'IN') {
                title = StaticData.classListTitle2_en;
                subTitle = StaticData.classListSubTitle2_en;
                withoutIcons = values.filter((x) => x.code == 'en');
            }
            responseData.data = {
                title,
                title_size: 32.0,
                sub_title: subTitle,
                sub_title_size: 14.0,
                language_list: withoutIcons,

            };
        }
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => next(error));
}

async function updateLanguage(req, res, next) {
    db = req.app.get('db');
    const { udid } = req.body;
    const { locale } = req.body;
    try {
    // get students using udid
        const students = await Student.getStudentByUdid(udid, db.mysql.write);
        if (students.length > 0) {
            // update locale using id
            const result = await Student.setLangUdid(locale, udid, db.mysql.write);
            if (result) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: null,
                };
                /*
      Activity Stream Entry
      */

                res.status(responseData.meta.code).json(responseData);
                // delete student from redis
                for (let i = 0; i < students.length; i++) {
                    db.redis.read.publish('activitystream_service', JSON.stringify({
                        actor_id: students[i].student_id,
                        actor_type: 'USER',
                        actor: { student_username: students[i].student_username },
                        verb: 'CHANGE',
                        object: 'locale',
                        object_id: '',
                        object_type: 'LANGUAGE',
                        target_id: '',
                        target_type: '',
                        target: '',
                    }));
                    Student.deleteUserInRedis(students[i].student_id, db.redis.write).then((re) => {
                        // Comment.find({student_id: student_id, is_deleted: false}).then(result => {
                        // let updateQuery = {}
                        // if (image !== undefined) {
                        //   updateQuery['student_avatar'] = params['img_url']
                        // }
                        // if (student_username !== undefined) {
                        //   updateQuery['student_username'] = params['student_username']
                        // }
                        // var bulk = Comment.collection.initializeOrderedBulkOp();
                        // bulk.find({student_id: student_id.toString(), is_deleted: false}).update({$set: updateQuery});
                        // bulk.execute(function (error) {
                        // });
                        // }).catch(err => {

                        // })
                        // )
                    }).catch((e) => {

                    });
                }
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Error in update',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            // insert public student
            const student_username = Utility.generateUsername(1);
            const result2 = await Student.add(udid, locale, '12', 'default', 0, '', student_username, '', null, db.mysql.write);
            // if (typeof result2['insertId'] !== 'undefined' && result2['insertId'] !== 0) {
            //   student_id = result2['insertId']
            // }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData)
    }
}
module.exports = { getList, updateLanguage };
