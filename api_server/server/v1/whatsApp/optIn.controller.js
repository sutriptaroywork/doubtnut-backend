/*
  * @Author: XesLoohc
  * @Email: god@xesloohc.com
  * @Date:   2019-01-11 13:33:31
  * @Last Modified by:   XesLoohc
  * @Last Modified time: 2019-01-16 14:05:31
  */


let config; let
    db;
const _ = require('lodash');
const { MongoClient } = require('mongodb');
const Whatsapp = require('../../../modules/whatsapp');
const Utility = require('../../../modules/utility');

const url = 'mongodb://13.233.54.212:27017';
const dbName = 'doubtnut';
const Whatsapp_fetch = require('../../../modules/mysql/whatsapp');


async function optIn(req, res, next) {
    const phone_num = req.body.phone;
    const { source } = req.body;
    let flag = 0;
    db = req.app.get('db');
    try {
        config = req.app.get('config');
        const id = await Whatsapp.insertNum(phone_num, source, db.mysql.write);
        if (id.insertId) {
            await Utility.OptIn(phone_num, config);
        } else {
            flag = 1;
        }
        if (source != '4') {
            await Utility.sendWhatsAppMessageHSM(phone_num, 'Hi! I am a robot  \n\nI can answer your Physics, Chemistry & Maths doubts.\n\nHow?  \n\nStep  - Click  photo of your question from the book\n\nStep  - Crop to one question   \n\n No handwritten questions\n\nSend question photo now  !', config);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        if (flag == 1) {
            responseData.meta.message = 'Duplicate entry';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        const responseData2 = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong.',
            },
        };
        res.status(responseData2.meta.code).json(responseData2);
        next(error);
    }
}


async function optInMultipart(req, res, next) {
    const phone_num = req.body.phone;
    const { source } = req.body;
    let flag = 0;
    db = req.app.get('db');
    try {
        config = req.app.get('config');
        const id = await Whatsapp.insertNum(phone_num, source, db.mysql.write);
        if (id.insertId) {
            await Utility.OptIn(phone_num, config);
        } else {
            flag = 1;
        }
        if (source != '4') {
            await Utility.sendWhatsAppMessageHSM(phone_num, 'Hi! I am a robot  \n\nI can answer your Physics, Chemistry & Maths doubts.\n\nHow?  \n\nStep  - Click  photo of your question from the book\n\nStep  - Crop to one question   \n\n No handwritten questions\n\nSend question photo now  !', config);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        if (flag == 1) {
            responseData.meta.message = 'Duplicate entry';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        const responseData2 = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong.',
            },
        };
        res.status(responseData2.meta.code).json(responseData2);
        next(error);
    }
}

async function optInOne(req, res, next) {
    try {
        const phone_num = req.query.msisdn;
        const source = req.query.extension;
        let flag = 0;
        config = req.app.get('config');
        db = req.app.get('db');
        const id = await Whatsapp.insertNum(phone_num, source, db.mysql.write);
        if (id.insertId) {
            await Utility.OptIn(phone_num, config);
        } else {
            flag = 1;
        }
        if (source != '4') {
            await Utility.sendWhatsAppMessageHSM(phone_num, 'Hi! I am a robot  \n\nI can answer your Physics, Chemistry & Maths doubts.\n\nHow?  \n\nStep  - Click  photo of your question from the book\n\nStep  - Crop to one question   \n\n No handwritten questions\n\nSend question photo now  !', config);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        if (flag == 1) {
            responseData.meta.message = 'Duplicate entry';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        const responseData2 = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong.',
            },
        };
        res.status(responseData2.meta.code).json(responseData2);
        next(error);
    }
}

async function optInTwo(req, res, next) {
    try {
        const phone_num = req.query.msisdn;
        const source = req.query.extension;
        let flag = 0;
        config = req.app.get('config');
        db = req.app.get('db');
        const id = await Whatsapp.insertNum(phone_num, source, db.mysql.write);
        if (id.insertId) {
            await Utility.OptIn(phone_num, config);
        } else {
            flag = 1;
        }
        if (source != '4') {
            await Utility.sendWhatsAppMessageHSM(phone_num, 'Hi! I am a robot  \n\nI can answer your Physics, Chemistry & Maths doubts.\n\nHow?  \n\nStep  - Click  photo of your question from the book\n\nStep  - Crop to one question   \n\n No handwritten questions\n\nSend question photo now  !', config);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        if (flag == 1) {
            responseData.meta.message = 'Duplicate entry';
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        const responseData2 = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong.',
            },
        };
        res.status(responseData2.meta.code).json(responseData2);
        next(error);
    }
}

async function optInThree(req, res, next) {
    try {
        const phone_num = req.query.msisdn;
        const source = req.query.extension;
        let flag = 0;
        config = req.app.get('config');
        db = req.app.get('db');
        const id = await Whatsapp.insertNum(phone_num, source, db.mysql.write);
        if (id.insertId) {
            await Utility.OptIn(phone_num, config);
        } else {
            flag = 1;
        }
        if (source != '4') {
            await Utility.sendWhatsAppMessageHSM(phone_num, 'Hi! I am a robot  \n\nI can answer your Physics, Chemistry & Maths doubts.\n\nHow?  \n\nStep  - Click  photo of your question from the book\n\nStep  - Crop to one question   \n\n No handwritten questions\n\nSend question photo now  !', config);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        if (flag == 1) {
            responseData.meta.message = 'Duplicate entry';
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        const responseData2 = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong.',
            },
        };
        res.status(responseData2.meta.code).json(responseData2);
        next(error);
    }
}

async function newRetention_wa(req, res, next) {
    try {
        const { date } = req.query;
        const db = req.app.get('db');
        console.log(date);
        console.log('inside\n');
        const promises = [];
        promises.push(getOldNumbersFromMongo(date, db.mongo.read));
        promises.push(Whatsapp_fetch.getNumbers_wa_students(date, db.mysql.read));
        promises.push(Whatsapp_fetch.truncating_wa_students(db.mysql.write));
        const resolvedPromises = await Promise.all(promises);
        const AllNum = resolvedPromises[0];
        const newNum = resolvedPromises[1];
        const formatted_nums = newNum.map((obj) => obj.mobile);
        const finalNumList = _.difference(AllNum, formatted_nums);
        const questionCount = await getQuestionCount(finalNumList, date, db.mongo.read);
        console.log('question_Count');
        const data = [];
        for (let i = 0; i < questionCount.length; i++) {
            const obj = [];
            obj.push(questionCount[i]._id);
            obj.push(questionCount[i].question_count);
            data.push(obj);
        }
        console.log('datalength', data.length);
        console.log('inserting');
        await Whatsapp_fetch.insert_wa_retention_old(data, db.mysql.write);
        console.log('inserted');
        setTimeout(async () => {
        // console.log("Hello");
            const finalObject = await Whatsapp_fetch.getQuestionCountWithFingerprint(db.mysql.read);
            let str = '';
            for (let i = 0; i < finalObject.length; i++) {
                str = `${str.concat(finalObject[i].mobile)},${finalObject[i].question_count},${finalObject[i].fingerprints},${finalObject[i].student_id}<br>`;
            }
            str = `${str + new Date()}::${finalObject.length}::${data.length}`;
            res.send(str);
        }, 1000);
        // await new Promise(done => )
    } catch (error) {
        res.status(responseData.meta.code).send(error);
    }
}


async function getQuestionCount(finalNumList, date, db) {
    return new Promise(async (resolve, reject) => {
        const gt = new Date(date);
        const lt = new Date(date);


        gt.setHours(0, 0, 0, 0);
        lt.setHours(23, 59, 59, 999);
        console.log('lt', lt);
        console.log('gt', gt);
        console.log('date', date);


        const finds = await db.collection('whatsapps').aggregate([

            {
                $match: {
                    createdAt: {
                        $lt: lt,
                        $gt: gt,
                    },
                    phone: { $in: finalNumList },
                    'data.message': /.*gupshup\.*/i,

                },
            },
            {
                $group: {
                    _id: '$phone',
                    question_count: {
                        $sum: 1,
                    },
                },
            },
        ]).toArray();
        resolve(finds);
    });
}


async function getOldNumbersFromMongo(date, db) {
    return new Promise(async (resolve, reject) => {
        const gt = new Date(date);
        const lt = new Date(date);

        gt.setHours(0, 0, 0, 0);
        lt.setHours(23, 59, 59, 999);


        const query = {
            createdAt:
          { $gte: gt, $lte: lt },
            'data.type': 'message',
        };

        const result = await db.collection('whatsapps').distinct('phone', query);
        resolve(result);
    });
}


function retentionReportByDate(req, res, next) {
    let mongo;
    const retentionDays = req.query.days;
    const { date } = req.query;
    MongoClient.connect(url, { useNewUrlParser: true }, async (
        err,
        client,
    ) => {
        try {
            if (err) {
                throw err;
            } else {
                mongo = await client.db(dbName);
                // console.log("inside")
                const response = await getAllPhone(date, retentionDays);
                res.json(response);
            }
        } catch (e) {
            console.log('error while handling', e);
        } finally {
            client.close();
        }
    });


    async function getAllPhone(date, retentionDays) {
        const day = new Date(date);
        day.setUTCHours(0, 0, 0, 0);
        day.setUTCHours(23, 59, 59, 999);
        const phoneList = await getUniquePhoneNumbersForDate(day);
        return await findRetentionForDays(phoneList, day);
    }


    async function getPhoneNumbersForDate(date) {
        const gt = new Date(date);
        const lt = new Date(date);
        // gt = new Date(gt.setHours(0,0,0,0));let retentionDays = 7;

        // lt = new Date(lt.setHours(23,59,59,59));

        gt.setUTCHours(0, 0, 0, 0);
        lt.setUTCHours(23, 59, 59, 999);
        // console.log("lt", lt);
        // console.log("gt", gt);
        // console.log("date", date);


        const query = {
            createdAt:
          { $gte: gt, $lte: lt },
            'data.type': 'message',
        };

        // console.log(query);
        const result = await mongo.collection('whatsapps').distinct('phone', query);
        // console.log("next day", result);
        return result;
    }

    async function getUniquePhoneNumbersForDate(date) {
        const gt = new Date(date);
        const lt = new Date(date);
        // gt = new Date(gt.setHours(0,0,0,0));let retentionDays = 7;

        // lt = new Date(lt.setHours(23,59,59,59));

        gt.setUTCHours(0, 0, 0, 0);
        lt.setUTCHours(23, 59, 59, 999);
        console.log('dates');
        console.log('lt', lt);
        console.log('gt', gt);
        console.log('date', date);

        // get all joining date
        const numberJoiningDateMap = await mongo.collection('whatsapps')
            .aggregate([
                { $match: { 'data.type': 'message' } },
                {
                    $group: {
                        _id: '$phone',
                        joiningDate: { $min: '$createdAt' },
                    },
                },
            ]).toArray();

        // console.log("################################################################",numberJoiningDateMap);
        // find numbers of a given date
        const phoneListResult = new Array();

        for (let i = 0; i < numberJoiningDateMap.length; i++) {
        // console.log(i);

            if (numberJoiningDateMap[i].joiningDate > gt && numberJoiningDateMap[i].joiningDate < lt) {
                phoneListResult.push(numberJoiningDateMap[i]._id);
            }
        }

        // console.log("phoneListResultLength", phoneListResult.length);
        // console.log("phoneListResult", phoneListResult);
        return phoneListResult;

        //
        // let query = {
        //   "createdAt":
        //     {$gte: gt, $lte: lt}
        //   , "data.type": "message"
        // };
        //
        // // console.log(query);
        // let result = await mongo.collection("whatsapps").distinct("phone", query);
        // // console.log("next day", result);
        // return result;
    }


    async function findRetentionForDays(phoneList, day) {
        const date = day;
        const finalRetention = new Array();
        finalRetention.push({ [`${date.getUTCDate()}-${date.getMonth() + 1}-${date.getFullYear()}`]: { number: phoneList.length } });
        for (let i = 1; i <= retentionDays; i++) {
            const nextDay = new Date(date);


            nextDay.setDate(date.getDate() + i);
            const phoneListForDate = await getPhoneNumbersForDate(nextDay);

            // console.log("phoneListForDate", nextDay, phoneListForDate);
            const retentionForDate = checkIfPhoneNumberPresent(phoneList, phoneListForDate);


            const dateKey = `${nextDay.getUTCDate()}-${nextDay.getMonth() + 1}-${nextDay.getFullYear()}`;
            // console.log(dateKey);
            const retentionObject = new Object();

            retentionObject.number = retentionForDate;
            retentionObject.percentage = parseFloat(((retentionForDate / phoneList.length) * 100).toFixed(2));

            const dateObject = { [dateKey]: retentionObject };
            finalRetention.push(dateObject);
            console.log('retention ', finalRetention);
        }
        return finalRetention;
    }

    function checkIfPhoneNumberPresent(phone, phoneList) {
        const result = _.intersection(phone, phoneList);
        // console.log("intersection result", result)

        return result.length;
    }
}


module.exports = {
    optIn, optInOne, optInTwo, optInThree, retentionReportByDate, optInMultipart, newRetention_wa,
};
