require('dotenv').config({path :'../api_server/.env.dev'});
const data = require('../api_server/data/practiceCorner.data');
const config = require('../api_server/config/config');
const Database = require('../api_server/config/database');
const mysql = new Database(config.write_mysql);

async function insertTestData(category, examClass, test_id) {
    const sql = 'insert into revision_corner_tests (category, class, test_id, is_active) values (?, ?, ?, 1)';
    return mysql.query(sql, [category, examClass, test_id]);
}

async function main() {
    for (const key of Object.keys(data.testId)) {
        let test = key.replace(/[^a-zA-Z]/g, '');
        test = data.category[test];
        let examClass = key.match(/\d+/);
        if (examClass != null) {
            examClass = parseInt(examClass[0]);
        } else {
            examClass = 0;
        }
        for (let i = 0; i < data.testId[key].length; i++) {
            console.log(data.testId[key][i].test_id);
            await insertTestData(test, examClass, data.testId[key][i].test_id);
        }
    }
    process.exit();
}
main();