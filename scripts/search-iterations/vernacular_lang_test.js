const mysql = require('mysql2');
const fs = require('fs');
const _ = require('lodash');
const request = require('request');
// const Data = require('../api_server/data/data');
require('dotenv').config({path : __dirname + '/../../api_server/.env.dev'});
const config = require(__dirname+'/../../api_server/config/config');
const QuestionHelper = require(__dirname+'/../../api_server/server/helpers/question.helper');
const { jsonToHTMLTable } = require('nested-json-to-table')
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require("sendgrid").mail
const { Parser } = require('json2csv');
const fields = ['qid',
    'ocr_text',
    'locale',
    'ocr_type',
    'fileName',
    'viser_ocr',
    'vision_ocr',
    'vision_ocr_eqn'];
const JSONparser = new Parser({fields});
const { Translate } = require('@google-cloud/translate').v2;
const projectId = 'doubtnut-vm';

const translate2 = new Translate({
    projectId,
});

const myArgs = process.argv.slice(2);
const flagr_get_variants = `/api/v1/flags/3/variants`;
function getIterationAttachment(variant) {
    const options = {
        method: 'GET',
        uri: `${process.env.FLAGR_URL}${flagr_get_variants}`,
        json:true
    };
    return new Promise(((resolve, reject) => {
        request(options, (err, resp, body) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve((body.filter((x)=> x.key == variant))[0].attachment);
            }
        });
    }));
}


function createCsv(data, name) {
    const csv = JSONparser.parse(data);
    let csvName = `${name}.csv`;
    try {
        let i = 1;
        while (fs.existsSync(csvName)) {
            csvName = `${name}.csv`;
            i+=1;
        }
    } catch (error) {
        console.error(`Error while saving script.`);
        // process.exit(1);
    }
    fs.writeFile(csvName, csv, 'utf8', function (err) {
        if (err) {
            console.error('Some error occured - file either not saved or corrupted file saved.');
            // process.exit(1);
        } else {
            console.log('csv saved!');
            // process.exit(0);
            // sendTheMail(sendgrid, "meghna.gupta@doubtnut.com", csvName, helper, startTime)
        }
    })
};

// create the connection to database
const connection = mysql.createConnection({
    host: 'analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com',
    user: '',
    password: '',
    database: 'classzoo1'
  });

async function main(){
    const masterArr=[];
    try{
        connection.query(
            'select * from classzoo1.questions_new where question_id in (1308999792)',
            async function (err, results) {
                if(err){
                    console.log(err);
                    throw new Error('ERROR');
                }else{
                    if(!results.length){
                        throw new Error('NO RESULTS');
                    }else{
                        connection.close();
                        let variants = ['v_weighted_string_diff','v_vernacular_homo_locale_secondary','v_vernacular_homo_locale_secondary_eqn_boost'];
                        for(let i=0; i < results.length; i++){
                            let qid = results[i]['question_id'];
                            let ocr_text = results[i]['ocr_text'];
                            let ocr_type = results[i]['is_trial'];
                            let fileName = results[i]['question_image'];
                            let locale = results[i]['locale']
                            let studentId = results[i]['student_id'];
                            for (let j = 0; j < variants.length; j++) {
                                let variantAttachment = await getIterationAttachment(variants[j]);
                                let ocr_meta_data = await QuestionHelper.handleOcrGlobal({
                                    image: fileName, fileName, translate2, variantAttachment, config, studentId, isb64ConversionRequired: true, qid,
                                });
                                if (j===0) {
                                    viser_ocr = ocr_meta_data.ocr;
                                }
                                else if (j===1) {
                                    vision_ocr = ocr_meta_data.ocr;
                                }
                                else if (j===2) {
                                    vision_ocr_eqn = ocr_meta_data.ocr;
                                }
                            }
                            masterArr.push({
                                qid,
                                ocr_text,
                                locale,
                                ocr_type,
                                fileName,
                                viser_ocr,
                                vision_ocr,
                                vision_ocr_eqn
                            });
                        }
                        await createCsv(masterArr, 'vernacular')
                    }
                }
            }
        )
    }
    catch(e) {
        console.error(e);
    }
}

main()

