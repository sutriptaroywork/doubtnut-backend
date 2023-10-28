/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-await-in-loop */

const path = `${__dirname}/../../api_server/`;
require('dotenv').config({ path: `${path}.env` });
const moment = require('moment');

const config = require(`${path}config/config`);
const Database = require(`${path}config/database`);

console.log('config.write_mysql ', config.write_mysql);
console.log('config.read_mysql ', config.read_mysql);

const mysqlWrite = new Database(config.write_mysql);
const mysqlRead = new Database(config.read_mysql);

async function getOldRegisteredStudents() {
    const sql = 'SELECT * FROM olympiad_registered_students';
    return mysqlRead.query(sql);
}

async function insertIntoNewTable(inputString) {
    const sql = `INSERT IGNORE INTO ht_olympiad_students (username, name, email, mobile, class, state, district, school_name, student_id, is_registered_dn, created_at) VALUES ${inputString}`;
    return mysqlWrite.query(sql);
}

async function main() {
    try {
        const oldRegisteredStudents = await getOldRegisteredStudents();

        let newRecords = '';
        for (let idx = 0; idx < oldRegisteredStudents.length; idx++) {
            const createdAt = moment(oldRegisteredStudents[idx].created_at).add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            newRecords += `('${oldRegisteredStudents[idx].username}', '${oldRegisteredStudents[idx].name}', '${oldRegisteredStudents[idx].email}', '${oldRegisteredStudents[idx].mobile}', ${oldRegisteredStudents[idx].class}, '${oldRegisteredStudents[idx].state}', '${oldRegisteredStudents[idx].district}', "${oldRegisteredStudents[idx].school_name}", ${oldRegisteredStudents[idx].student_id}, ${oldRegisteredStudents[idx].registered_on_doubtnut}, '${createdAt}')`;

            insertIntoNewTable(newRecords);
            newRecords = '';
        }

        console.log(`${oldRegisteredStudents.length} Records Inserted!`);
    } catch (e) {
        console.error(e);
    } finally {
        console.log(`the script successfully ran at ${moment().add(5, 'hours').add(30, 'minutes')}`);
    }
}

main();
