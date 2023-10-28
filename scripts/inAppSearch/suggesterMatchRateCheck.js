const elasticSearch = require('elasticsearch')
require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const _ = require('lodash');
const neatCsv = require('neat-csv');
const fs = require('fs');
const { Parser } = require('json2csv');
const json2csvParser = new Parser();


// connection to elastic search
const client = new elasticSearch.Client({
  host: config.elastic.INAPP_ELASTIC_HOST
});


function getIasAutoSuggest(ocr, index){
    const body = { suggest: { ias_suggest: { prefix: ocr, completion: { field: 'text', size: 6 } } } };
    return client.search({
        index,
        type: 'suggestions',
        ignore: [400, 404],
        body,
    });
}


function removeDuplicateSuggestion(arr) {
    const result = [];
    if (arr.length > 1) {
        for (let i = 0; i < arr.length - 1; i++) {
            if ((arr[i + 1].includes(arr[i])) && (Math.abs(arr[i + 1].length - arr[i].length) <= 1)) {
                result.push(i);
            }
        }
        for (let i = result.length - 1; i >= 0; i--) {
            arr.splice(result[i], 1);
        }
    }
    return arr.splice(0,6);
}

async function newIasImplementation(text) {
    let stIndex = 2;
    const token = text.split(' ');
    if (token.length > 2 && token.length <= 4) {
        stIndex = 4;
    } else if (token.length > 4 && token.length <= 6) {
        stIndex = 6;
    } else if (token.length > 6 && token.length <= 8) {
        stIndex = 8;
    } else if (token.length > 8) {
        stIndex = 10;
    }
    let result = [];
    for (let i = stIndex; i <= 10; i += 2) {
        const index = `ias_suggestor_v1.6_ntk_lte_${i}`;
        // eslint-disable-next-line no-await-in-loop
        const newIasResult = await getIasAutoSuggest(text, index);
        if (newIasResult.suggest && newIasResult.suggest.ias_suggest && newIasResult.suggest.ias_suggest.length && newIasResult.suggest.ias_suggest[0].options && newIasResult.suggest.ias_suggest[0].options.length) {
            const temp = newIasResult.suggest.ias_suggest[0].options;
            result = [...result, ...temp.map((x) => (x.text))];
            if (result.length >= 10) {
                result = result.slice(0, 10);
                break;
            }
        }
    }
    return removeDuplicateSuggestion(result);
}

async function main(){
    fs.readFile('/Users/sudhir/Downloads/suggesterMatch.csv', async (err, data) => {
        if (err) {
          console.error(err)
          return
        }
        let temp = await neatCsv(data);
        console.log(temp.length)
        const csv = [];
        for (let i = 0; i < temp.length; i++) {
            console.log(i);
            if(temp[i]['v1.6Suggestions'] && temp[i]['v1.6Suggestions'].length){
                let result = await newIasImplementation(temp[i].searchString);
                result = result.join('\n');
                csv.push({searchtext: temp[i].searchString, expectedOutput: temp[i]['v1.6Suggestions'], output: result})
            }
        }
        const csv1 = json2csvParser.parse(csv);
        fs.appendFile('/Users/sudhir/Downloads/suggesterOutput.csv', csv1, function (err) {
            if (err) throw err;
        });
        console.log("completed successfully 1");
      });
}

main();