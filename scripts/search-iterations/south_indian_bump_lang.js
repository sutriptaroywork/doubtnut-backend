const mysql = require('mysql2');
const fs = require('fs');
const _ = require('lodash');
const fuzz = require('fuzzball')
const request = require('request');
// const Data = require('../api_server/data/data');
require('dotenv').config({path : __dirname + '/../../api_server/.env.dev'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
const Utility = require(__dirname+'/../../api_server/modules/utility')
// const { jsonToHTMLTable } = require('nested-json-to-table')
// const sendgrid = require("sendgrid")(config.send_grid_key);
// const helper = require("sendgrid").mail
const { Parser } = require('json2csv');
const fields = ['question_id','ocr_text','locale','topMatchQidDefault','topMatchQidSouthIndian','topMatchQidDuplicates','topMatchVlangDefault','topMatchVlangSounthIndian','topMatchVlangDuplicates','is_same_south_indian','is_same_duplicates'];
const JSONparser = new Parser({fields});
const csv = require('fast-csv');
const readMysql = new Database(config.read_mysql);
const { google } = require("googleapis");
const elasticsearch = require('elasticsearch');

const ElasticSearch = require(__dirname+'/../../api_server/modules/elasticSearch');
const ElasticSearchTest = require(__dirname+'/../../api_server/modules/elasticSearchTest');
const helper = require(__dirname+'/../../api_server/server/helpers/question.helper'); 

const client = new elasticsearch.Client({
    host: 'https://es-search.internal.doubtnut.com/'
});

const db = {};
db.mysql = {};
db.mysql.read = readMysql;

const elasticSearchInstance = new ElasticSearch(client, config);
const elasticSearchTestInstance = new ElasticSearchTest(client, config);

const auth = new google.auth.GoogleAuth({
    keyFile: "match-rate-test-dataset-keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets", 
});

const flagr_get_variants = `/api/v1/flags/3/variants`;
function getIterationAttachment(iter) {
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
                resolve((body.filter((x)=> x.key == iter))[0].attachment);
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
        }
    })
};

async function main(){
    const masterArr=[];
    try{
        // const results = await readCSV('/Users/yash.airen/Github_repos/doubtnut_backend/scripts/search-iterations/test_dataset.csv');
        const authClientObject = await auth.getClient();
        const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
        const spreadsheetId = '1m7k83R6oAM7aKnH19ML_2OtHPrIPZhNFd2-Y3Mb4XBg';
        const csvData = await googleSheetsInstance.spreadsheets.values.get({
            auth, //auth object
            spreadsheetId, // spreadsheet id
            range: "'dupl_1 3k data'!A1:C3001", //range of cells to read from.
        })
        const results = csvData.data.values;
        const attachmentResponse = await Promise.all([getIterationAttachment('v_weighted_string_diff'), getIterationAttachment('v_south_indian_user_reordering')])
        let attachment1 = attachmentResponse[0];
        let attachment2 = attachmentResponse[1];
        let attachment3 = {
            ...attachment1,
            "schoolBoards": ['Andhra Pradesh Board'],
            "userLocation": ['AP'],
            stateWiseLanguageRelevance: true,
        }
        for(let i=1; i < results.length; i++){
            let question_id = results[i][0]
            let ocr_text = results[i][1]
            let locale = results[i][2];
            let promises = [];
            promises.push(helper.handleElasticSearchWrapper({
                ocr: ocr_text,
                elasticSearchInstance,
                elasticSearchTestInstance,
                elasticIndex: 'question_bank_v1.1',
                useStringDiff: true,
                language: locale,
                locale,
                fuzz,
                UtilityModule: Utility,
                studentId: '0',
                db,
                variantAttachment: attachment1,
                isStaging: true,
                searchFieldName: 'ocr_text',
                questionLocale: locale,
                userProfile: {
                    appLocale: 'en',
                    schoolBoard: 'Andhra Pradesh Board',
                    questionLocale: locale,
                },
            }, config))
            promises.push(helper.handleElasticSearchWrapper({
                ocr: ocr_text,
                elasticSearchInstance,
                elasticSearchTestInstance,
                elasticIndex: 'question_bank_v1.1',
                useStringDiff: true,
                language: locale,
                locale,
                fuzz,
                isStaging: true,
                UtilityModule: Utility,
                studentId: '0',
                db,
                variantAttachment: attachment2,
                searchFieldName: 'ocr_text',
                questionLocale: locale,
                userProfile: {
                    appLocale: 'en',
                    schoolBoard: 'Andhra Pradesh Board',
                    questionLocale: locale,
                },
            }, config))
            promises.push(helper.handleElasticSearchWrapper({
                ocr: ocr_text,
                elasticSearchInstance,
                elasticSearchTestInstance,
                elasticIndex: 'question_bank_v1.1',
                useStringDiff: true,
                language: locale,
                locale,
                fuzz,
                isStaging: true,
                UtilityModule: Utility,
                studentId: '0',
                db,
                variantAttachment: attachment3,
                searchFieldName: 'ocr_text',
                questionLocale: locale,
                userProfile: {
                    appLocale: 'en',
                    schoolBoard: 'Andhra Pradesh Board',
                    questionLocale: locale,
                },
            }, config))
            
            const elasticWrapperResponse = await Promise.all(promises)
            console.log(i)
            const stringDiffResp1 = elasticWrapperResponse[0].stringDiffResp;
            const stringDiffResp2 = elasticWrapperResponse[1].stringDiffResp;
            const stringDiffResp3 = elasticWrapperResponse[2].stringDiffResp;

            const topMatchQidDefault = !_.isEmpty(stringDiffResp1) && stringDiffResp1[0].length>0 ? stringDiffResp1[0][0]._id : '';
            const topMatchQidSouthIndian = !_.isEmpty(stringDiffResp2) && stringDiffResp2[0].length>0 ? stringDiffResp2[0][0]._id : '';
            const topMatchQidDuplicates = !_.isEmpty(stringDiffResp3) && stringDiffResp3[0].length>0 ? stringDiffResp3[0][0]._id : '';
            const topMatchVlangDefault = !_.isEmpty(stringDiffResp1) && stringDiffResp1[0].length>0 ? _.get(stringDiffResp1[0][0], '_source.video_language', 'not found') : '';
            const topMatchVlangSounthIndian = !_.isEmpty(stringDiffResp2) && stringDiffResp2[0].length>0 ?  _.get(stringDiffResp2[0][0], '_source.video_language', 'not found') : '';
            const topMatchVlangDuplicates = !_.isEmpty(stringDiffResp3) && stringDiffResp3[0].length>0 ?  _.get(stringDiffResp3[0][0], '_source.video_language', 'not found') : '';
            masterArr.push({
                question_id,
                ocr_text,
                locale,
                topMatchQidDefault,
                topMatchQidSouthIndian,
                topMatchQidDuplicates,
                topMatchVlangDefault,
                topMatchVlangSounthIndian,
                topMatchVlangDuplicates,
                is_same_south_indian: topMatchQidDefault === topMatchQidSouthIndian ? true : false,
                is_same_duplicates: topMatchQidDefault === topMatchQidDuplicates ? true : false,
            });            
        }
        await createCsv(masterArr, 'south_2');
    } catch(e) {
        console.error(e)
    } 
}
main()
