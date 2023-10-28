"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const Utility = require('../../api_server/modules/Utility');
const ScriptsUtility = require('./scripts_utility.js');
const mysql = new Database(config.mysql_analytics);
const fields = ['question_id', 'latex_ocr', 'latex_confidence', 'latex_detection_map', 'text_ocr', 'text_confidence', 'text_detected_alphabets'];
const qidArray = [
    406009411,406009412,
    // 406009413,406009414,406009415,406009416,406009417,406009418,406009419,406009420,406009421,406009422,406009424,406009425
]

function getData() {
    let sql = `SELECT question_id, question_image from questions where question_id IN (${qidArray})`
    return mysql.query(sql);
}

async function main() {
    const all_data = await getData();
    const csvData = [];
    for (let index = 0; index < all_data.length; index++) {
        const row = all_data[index];
        if (row.question_image) {
            const data = {};
            data.question_id = row.question_id;
            let latex = await Utility.mathpixOcr3('http://localhost:3000', row.question_image, config);
            let text = await Utility.mathpixOcr3Text('http://localhost:3000', row.question_image, config)
            if (typeof latex !== 'undefined'
            && (typeof latex.asciimath !== 'undefined')
            && (latex.asciimath.length > 0)) {
                data.latex_ocr = latex.asciimath;
                data.latex_confidence = latex.latex_confidence;
                data.latex_detection_map = latex.detection_map;
            }
            if (text && text.asciimath_legacy) {
                data.text_ocr = text.asciimath_legacy;
                data.text_confidence = text.confidence;
                data.text_detected_alphabets = text.detected_alphabets;
            }
            csvData.push(data);
        }
    }
    await ScriptsUtility.createCsv(csvData, fields, ["meghna.gupta@doubtnut.com"], 'ocr-comparison', 'Ocr Analysis');
    process.exit(0);
}

main()