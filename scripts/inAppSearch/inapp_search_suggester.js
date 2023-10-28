const elasticSearch = require('elasticsearch')
require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require('../../api_server/config/database');
const _ = require('lodash');
const neatCsv = require('neat-csv');
const fs = require('fs');


// connection to elastic search
const client = new elasticSearch.Client({
  host: config.elastic.INAPP_ELASTIC_HOST
});

const mysql = new database(config.mysql_analytics);
const base = { index: { _index: 'in_app_search_v0_1', _type: config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH } };
let index = []
let data = {}

async function main() {
  // read from file globalsearch logs
  fs.readFile('/Users/sudhir/Downloads/autoSuggest.csv', async (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    let temp = await neatCsv(data);
    console.log(temp.length)
    for (let i = 0; i < temp.length; i++) {
      data = {};
      index = [];
      data.search_key = temp[i].search_key;
      index.push(base)
      index.push(data)
      await addIndex(client, index)
      console.log(temp[i]);
    }
    console.log("completed successfully 1");
  })


  // let sql = 'select * from inapp_search_data where is_active=1';
  // console.log(sql);
  // let dataqwe =await mysql.query(sql);
  // for (let i=0; i<dataqwe.length; i++) {
  //   console.log("########")
  //   console.log(dataqwe[i])
  //   console.log(i)
  //   let search_key = dataqwe[i].name;
  //   if(dataqwe[i].parent_tags){
  //     let pTags = dataqwe[i].parent_tags.split(',').join(' ');
  //     search_key = `${search_key} ${pTags}`;
  //   } else {
  //     search_key = `${search_key} ${dataqwe[i].class}`;
  //   }
  //   data = {};
  //   index = [];
  //   data.search_key = search_key;
  //   data.class = dataqwe[i].class;
  //   index.push(base)
  //   index.push(data)
  //   await addIndex(client,index)
  //   console.log(search_key)
  //   console.log("#######")
  // }

  // // etoos data in suggestion
  // sql = `(SELECT concat(TG, ' By ', faculty_name) as display  FROM etoos_master group by TG) UNION ALL (SELECT concat(TG, ' By ', nickname) as display  FROM etoos_master group by TG) UNION ALL (SELECT faculty_name as display  FROM etoos_master group by faculty_name)  UNION ALL (SELECT DISTINCT nickname as display  FROM etoos_master) UNION ALL (SELECT lecture_name as display FROM etoos_master)`;
  // console.log(sql);
  // let etoosData =await mysql.query(sql);
  // for (let i=0; i<etoosData.length; i++) {
    // console.log("########")
    // console.log(etoosData[i])
    // console.log(i)
    // let search_key = etoosData[i].display;
    // data.search_key = search_key;
    // index.push(base)
    // index.push(data)
    // await addIndex(client,index)
    // console.log(search_key)
    // console.log("#######")
  // }
}





function addIndex(client, data) {
  return new Promise((resolve, reject) => {
    client.bulk({
      body: data
    }, function (err, resp) {
      console.log("err")
      console.log(err)
      if (err) {
        return reject(err)
      }
      console.log("resp")
      console.log(resp.items[0]['index'])
      return resolve(resp)
    });
  });

}

main();
