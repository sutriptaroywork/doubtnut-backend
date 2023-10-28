/**
 * @Author: Meghna Gupta
 * @Date:   2021-08-30
 * @Email:  meghna.gupta@doubtnut.com
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2021-08-30
 */

/* 
    This script extracts detailed mathpix logs from Elasticsearch, for the current day and past 3 days.
    Doc link - https://docs.google.com/document/d/1noy674kTXTdtbVuChdL3H8G5MG42WJBatZUCX6EfS5M/edit?usp=sharing
    For debugging / running on local for testing, the comments in the code can be uncommented and corresponding line can be commented instead.
*/

require('dotenv').config({path : __dirname + '/../../../api_server/.env'});
const fs = require('fs');
const { Parser } = require('json2csv');
const fields = ['question_id', 'image_link', 'ocr_text', 'query_text', 'latex_confidence', 'latex_confidence_rate', 'contains_table', 'contains_chart',
 'contains_diagram', 'contains_graph', 'is_blank', 'is_inverted', 'is_printed', 'is_not_math', 'auto_rotate_confidence', 'auto_rotate_degrees'];
const JSONparser = new Parser({fields});
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: 'https://vpc-dn-private-xwfzzm23aa4eqclkbg2igad5zm.ap-south-1.es.amazonaws.com/'
});

function createCsv(data, startTime) {
    const csv = JSONparser.parse(data);
    let csvName = 'mathpix_' + startTime + '.csv'
    try {
        let i = 1;
        while (fs.existsSync(csvName)) {
            csvName = `mathpix_${startTime}_${i}.csv`
            i+=1;
        }
    } catch (error) {
        console.error(`Error while saving script.`);
        process.exit(1);
    }
    fs.writeFile(csvName, csv, 'utf8', function (err) {
      if (err) {
        console.error('Some error occured - file either not saved or corrupted file saved.');
        process.exit(1);
      } else {
        console.log('csv saved!');
        process.exit(0);
      }
    })
}

function getParamsFromCLI(argv) {
    let startTime, endTime;
    if (argv && Array.isArray(argv) && argv[0] && argv[1]) {
        startTime = argv[0];
        endTime = argv[1];
        return { startTime, endTime };
    }
    console.error('Please use command in the format: node your/file/path start-time-in-epoch end-time-in-epoch');
    process.exit(1);
} 

async function main() {
    try {
        const responseQueue = []
        let csvData = [];
        const argv = process.argv.slice(2);
        let { startTime, endTime } = getParamsFromCLI(argv);
        const response = await client.search({
            index: `user-questions`,
            scroll: '30s',
            // size: 10,
            size: 1000,
            body: {
                query: {
                    "bool": {
                        "must": [
                            {
                                "match": {
                                    "ocr_service": "img_mathpix"
                                }
                            },
                            {
                                "range": {
                                    "timestamp": {
                                        "gte": startTime,
                                        "lte": endTime
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        })

        responseQueue.push(response)

        while (responseQueue.length) {
            const body = responseQueue.shift()
            body.hits.hits.forEach(function (hit) {
                hit._source.image_link = `https://d10lpgp6xz60nq.cloudfront.net/images/${hit._source.question_image}`
                csvData.push(hit._source);
            })

            // if (csvData.length % 10 == 0) {
            if (csvData.length % 1000 == 0) {
                console.log(`Processed ${csvData.length} docs out of ${body.hits.total}`)
            }
            // if (csvData.length >= 50) {
            if (csvData.length === body.hits.total) {
                console.log('All documents extracted!');
                break
            }

            responseQueue.push(
                await client.scroll({
                    scrollId: body._scroll_id,
                    scroll: '60s'
                })
            )
        }
        createCsv(csvData, startTime)

    } catch (error) {
        console.error(`Error occured: ${error}`);
        process.exit(1);
    }
}

main()