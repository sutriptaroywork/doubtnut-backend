/* eslint-disable no-await-in-loop */
require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });

// eslint-disable-next-line import/no-dynamic-require
const config = require(`${__dirname}/../../api_server/config/config`);
// const _ = require('lodash');
// const moment = require('moment');
const { MongoClient } = require('mongodb');
const Database = require('./database');

const mysqlWrite = new Database(config.write_mysql);

function getInappInputData(mongo) {
        return mongo.collection('globalsearchlogs').find(
            {
                is_clicked: true,
            },
        ).sort(
            {
                _id: -1.0,
            },
        ).limit(50)
            .toArray();
}

function insertIntoInAppLogs(mysql, str, student_class, student_id, createdAt, eventType) {
        const created_at = createdAt.toISOString();
        const sql = `insert into inapp_logs (input_str, student_class, student_id, created_at, eventType) values ('${str}', '${student_class}', '${student_id}','${created_at}','${eventType}')`;
        console.log(sql);
        return mysql.query(sql);
}
MongoClient.connect(config.mongo.database_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (
    err,
    client,
) => {
    if (err) {
        throw err;
    } else {
        try {
            const mongo = client.db(config.mongo.database_name);
            const result = await getInappInputData(mongo);
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    result[i].search_text = result[i].search_text.replace(/'/g, '&apos;');
                    const resp = await insertIntoInAppLogs(mysqlWrite, result[i].search_text, result[i].student_class, result[i].student_id, result[i].createdAt, result[i].eventType);
                }
                console.log('Data Inserted');
            }
        } catch (e) {
            console.log(e);
        } finally {
            mysqlWrite.connection.end();
            client.close();
        }
    }
});
