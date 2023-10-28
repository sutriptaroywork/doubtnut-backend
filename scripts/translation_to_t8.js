const path = `${__dirname}/../api_server/`;
require('dotenv').config({ path: `${path}.env` });
const moment = require('moment');
const fs = require('fs');
const { localeData } = require('moment');

const config = require(`${path}config/config`);
const Database = require(`${path}config/database`);

const mysqlWrite = new Database(config.write_mysql);
const mysqlRead = new Database(config.read_mysql);

const DataPayment = require(`${path}data/data.payment`);

async function makeKeyValuePairs(obj1, obj2, resObj) {
    Object.keys(obj1).forEach((key) => {
        if (!obj1[key] || !obj2[key]) {
            return;
        }
        if (obj1[key] === obj2[key]) {
            return;
        }
        if (typeof obj1[key] === 'object') {
            makeKeyValuePairs(obj1[key], obj2[key], resObj);
        } else {
            resObj[obj1[key]] = obj2[key];
        }
    });
}

async function populateDataFiles(dataFile, resObj) {
    for (const item in dataFile) {
        if (item.toString().slice(-3) == '_en') {
            const obj1 = dataFile[`${item}`];
            const obj2 = dataFile[`${item.toString().slice(0, -3)}_hi`];
            await makeKeyValuePairs(obj1, obj2, resObj);
        } else if (dataFile[item].hi && typeof dataFile[item].hi !== 'object') {
            resObj[item] = dataFile[item].hi;
        }
    }
}

async function getTranslation(tableName, columnName) {
    const sql = `select distinct t.${columnName}, lt.translation from ${tableName} t join language_translation lt on lt.row_id = t.id and table_name = '${tableName}' and lt.column_name = '${columnName}' order by lt.id desc`;
    return mysqlRead.query(sql);
}

async function insertIntoT8(obj, locale) {
    sql = `INSERT INTO t8 set ? ON DUPLICATE KEY UPDATE ${locale} = ? , namespace = "translation"`;
    return mysqlWrite.query(sql, [obj, obj[locale]]);
}

async function populateLanguageTranslationTableData(resObj) {
    const tableArr = ['new_library'];
    const columnArr = ['name', 'image_url', 'student_course', 'main_description'];
    // const tableArr = ['icons_latest', 'home_caraousels'];
    // const columnArr = ['title'];
    for (let i = 0; i < tableArr.length; i++) {
        for (let j = 0; j < columnArr.length; j++) {
            const translationsToPopulate = await getTranslation(tableArr[i], columnArr[j]);
            for (let k = 0; k < translationsToPopulate.length; k++) {
                if (translationsToPopulate[k][columnArr[j]] != translationsToPopulate[k].translation) {
                    resObj[translationsToPopulate[k][columnArr[j]]] = translationsToPopulate[k].translation;
                }
            }
        }
    }
}

async function populateT8FromJson(rootPath, locale) {
    const obj = JSON.parse((fs.readFileSync(`${rootPath}locales/${locale}/translation.json`)).toString());
    for (const key in obj) {
        const insertObj = {
            namespace: 'translation',
            key,
        };
        insertObj[locale] = obj[key];
        console.log(insertObj);
        await insertIntoT8(insertObj, locale);
    }
}

async function main() {
    try {
        const resObj = {};
        const dataFile = DataPayment;

        // await populateDataFiles(dataFile, resObj);
        // await populateLanguageTranslationTableData(resObj);
        // fs.writeFileSync('hi.json', JSON.stringify(resObj, null, "\t"));
        await populateT8FromJson(path, 'hi');
    } catch (e) {
        console.error(e);
    } finally {
        console.log(`The script successfully ran at ${moment().add(5, 'hours').add(30, 'minutes')}.`);
    }
}

main();
