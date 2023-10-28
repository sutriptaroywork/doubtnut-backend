/*
    cron script to fetch the metadata(size of video) from s3 of each video and write to answer table(filesize_bytes)
 */

// const Redshift = require('node-redshift');

require("dotenv").config({ path: __dirname + "/../../api_server/.env" });
const config = require(__dirname + "/../../api_server/config/config");
const database = require("../../api_server/config/database");

const BUCKET = 'doubtnutteststreamin-hosting-mobilehub-1961518253';
let AWS = require('aws-sdk');

// AWS.config.update({ accessKeyId: config.aws_access_id, secretAccessKey: config.aws_secret });

const s3 = new AWS.S3();
const mysql = new database(config.mysql_analytics);
const writeMysql = new database(config.write_mysql);

// let RSclient = {
//     user: config.redshift.user,
//     database: config.redshift.database,
//     password: config.redshift.password,
//     port: config.redshift.port,
//     host: config.redshift.host,
// };
// const redshiftClient = new Redshift(RSclient);


function getTotalSize() {
    const sql = "SELECT count(*) as size FROM classzoo1.answers WHERE answer_video like '%.mp4' and updated_at >= (NOW() - INTERVAL 1 DAY)";
    return mysql.query(sql)
};

function getVideoList(page) {
    const sql = `select answer_id, answer_video from classzoo1.answers WHERE answer_video like '%.mp4' and updated_at >= (NOW() - INTERVAL 1 DAY) order by answer_id asc limit 50000 offset ${page * 50000}`;
    console.log(sql);
    return mysql.query(sql)
};


function updateVideoSize(id, key) {
    const obj = { filesize_bytes: key};
    const sql = `update IGNORE answers set ? where answer_id=${id}`;
    return writeMysql.query(sql, obj)
}


const putObjectWrapper = (params) => {
    return new Promise((resolve, reject) => {
        s3.headObject(params, function (err, result) {
            if (err) resolve(err);
            if (result) resolve(result);
        });
    })
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


async function main() {
    const videoSize = await getTotalSize();
    // console.log(videoSize.rows[0].size);
    const totalSize = Math.floor(videoSize[0].size/ 50000) + 1;
    console.log(totalSize);
    for (let j=0; j<totalSize; j++){
        const data = await getVideoList(j);
        for (let i = 0; i < data.length; i++) {
            // console.log(data[i]);
            const key = data[i].answer_video;
            const params = { Bucket: BUCKET, Key: key };
            const videoData = await putObjectWrapper(params);
            if (videoData && videoData.ContentLength) {
                console.log(`${j}th iteration ${i} element value is ${data[i].answer_id}`);
                // console.log(videoData);
                updateVideoSize(data[i].answer_id, videoData.ContentLength)
            }
            if( i%3000 === 0){
                await sleep(100);
            }
        }
    }
};

main();