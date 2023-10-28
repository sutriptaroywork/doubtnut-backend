/*
 cron script to fetch all the sql query which are driven from mysql database
 and write to csv file and uploaded to s3
*/
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname + '/../../api_server/config/config');
const database = require(__dirname + '/../../api_server/config/database');
const mysql = new database(config.mysql_analytics);
const fs = require('fs');

const BUCKET = 'doubtnut-static';
const AWS = require('aws-sdk');
// AWS.config.update({ accessKeyId: config.aws_access_id, secretAccessKey: config.aws_secret });
const s3 = new AWS.S3();

const filePath = "/tmp/sql_query_list.csv";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: filePath,
    header: [{id: 'reference_table', title: 'reference_table'},{id: 'usage_table', title: 'usage_table'},{id : 'reference_table_key', title: 'reference_table_key'},{id: 'sql_query', title: 'sql_query'} ]
});

const tableObject = [
    { 
        reference_table: "new_library",
        reference_table_query: "resource_path",
        reference_table_key: "id",
        extra_sql_condition: "where is_admin_created=1 and is_last=1 and is_active=1 and resource_type='playlist' and resource_path is not null"
    },
    { 
        usage_table: "home_caraousels",
        usage_column: "mapped_playlist_id",
        reference_table: "new_library",
        reference_table_query: "resource_path",
        reference_table_key: "id",
    },
    { 
        usage_table: "app_banners",
        usage_column: "target_group_id",
        reference_table: "target_group",
        reference_table_query: "sql",
        reference_table_key: "id",
    },
    { 
        usage_table: "scholarship_exam",
        usage_column: "target_group_id",
        reference_table: "target_group",
        reference_table_query: "sql",
        reference_table_key: "id",
    },
    { 
        usage_table: "sticky_notification",
        usage_column: "target_group_id",
        reference_table: "target_group",
        reference_table_query: "sql",
        reference_table_key: "id",
    },
    { 
        usage_table: "course_ads_LF",
        usage_column: "target_group_id",
        reference_table: "target_group",
        reference_table_query: "sql",
        reference_table_key: "id",
    },
    { 
        usage_table: "package",
        usage_column: "package_target_group_id",
        reference_table: "target_group",
        reference_table_query: "sql",
        reference_table_key: "id",
    },
    { 
        usage_table: "package_v2",
        usage_column: "package_target_group_id",
        reference_table: "target_group",
        reference_table_query: "sql",
        reference_table_key: "id",
    }
]

function getQueryData(data) {
    let sql = '';
    if(!data.usage_table){
        sql = `select '${data.reference_table}' reference_table, NULL as usage_table, ${data.reference_table_key} reference_table_key, ${data.reference_table_query} sql_query from ${data.reference_table} ${data.extra_sql_condition}`;
    } else {
        sql = `select '${data.reference_table}' reference_table, '${data.usage_table}' usage_table, b.${data.reference_table_key} reference_table_key, b.${data.reference_table_query} sql_query  from ${data.usage_table} a left join ${data.reference_table} b on a.${data.usage_column} = b.${data.reference_table_key} where b.${data.reference_table_query} is not null or b.${data.reference_table_query} not like ''`;
    }
    console.log(sql);
    return mysql.query(sql);
}

const uploadFile = (params) => {
    const fileContent = fs.readFileSync(filePath);
    params.Body = fileContent;
    return new Promise((resolve, reject) => {
        s3.upload(params, function(err, data) {
            if (err) resolve(err);
            if (data) resolve(data);
        });
    })
};

// const s3delete = (params) => {
//     return new Promise((resolve, reject) => {
//         s3.deleteObject(params, function (err, data) {
//             if (err) resolve(err);
//             if (data) resolve(data);
//         });
//     }); 
// };

async function main(mysql){
  for (let i = 0; i < tableObject.length; i++){
    const data = await getQueryData(tableObject[i]);
    await csvWriter.writeRecords(data)
  }
  const params = {
    Bucket: BUCKET,
    Key: 'db_sql_query_list.csv', // File name you want to save as in S3
};
//   const deleteData = await s3delete(params);
//   console.log(deleteData);
  const uploaadData = await uploadFile(params);
  console.log(`File uploaded successfully. ${uploaadData.Location}`);
  process.exit();
}

main();




