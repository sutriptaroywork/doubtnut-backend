const elasticSearch = require("elasticsearch");
const axios = require("axios");

require("dotenv").config({ path: __dirname + "/../../api_server/.env" });
const config = require(__dirname + "/../../api_server/config/config");
const database = require("../../api_server/config/database");
const _ = require("lodash");

// connection to elastic search
const client = new elasticSearch.Client({
    host: config.elastic.INAPP_ELASTIC_HOST,
});

// connection to mysql
const mysql = new database(config.mysql_analytics);
const regex = /^[0-9]*$/;

const lang = {
    en: "English",
    "hi-en": "English",
    hi: "Hindi",
    "bn-en": "Bangla",
    "kn-en": "Kannada",
    "te-en": "Telugu",
    "ta-en": "Tamil",
};

async function main(mysql, client) {
    const base = {
        index: {
            _index: "liveclass_v2",
            _type: config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH,
        },
    };

    let index = [];
    let data = {};
    // Getting data from ncert_video_meta_new and indexing it.
    let liveClassData = await liveClassResourceData(mysql);
    console.log(liveClassData.length)
    for (let i = 0; i < liveClassData.length; i++) {
        console.log(i);
        index = [];
        data = {};
        data.id = liveClassData[i].assortment_id;
        data.class = liveClassData[i].class;
        data.type = liveClassData[i].assortment_type;
        data.subject = liveClassData[i].subject;
        data.search_key = liveClassData[i].search_key;

        base.index._id = `${data.id}_${data.class}_${data.type}`;
        index.push(base);
        index.push(data);
        await addIndex(client, index);
    }

    let liveClassDataChapter = await liveClassChapterCourseData(mysql);
    console.log(liveClassDataChapter.length)
    for (let i = 0; i < liveClassDataChapter.length; i++) {
        console.log(i);
        index = [];
        data = {};
        data.id = liveClassDataChapter[i].assortment_id;
        data.class = liveClassDataChapter[i].class;
        data.type = liveClassDataChapter[i].assortment_type;
        data.subject = liveClassDataChapter[i].subject;
        data.search_key = liveClassDataChapter[i].search_key;

        base.index._id = `${data.id}_${data.class}_${data.type}`;
        index.push(base);
        index.push(data);
        await addIndex(client, index);
    }

    console.log("Script successfully ran");
    process.exit();
}

function liveClassResourceData(mysql) {
    const sql = "SELECT concat(b.name, ' ', a.expert_name, ' ', a.chapter, ' ', a.display,' ',  a.subject, ' class ',c.class) as search_key, b.assortment_id,c.class,c.assortment_type,a.subject FROM `course_resources` as a left join course_resource_mapping as b on a.id=b.course_resource_id and b.resource_type='resource' left join course_details as c on b.assortment_id=c.assortment_id  where c.is_active=1";
    return mysql.query(sql);
}

function liveClassChapterCourseData(mysql) {
    const sql = "SELECT concat(display_name, category, ' class ', class) as search_key, assortment_id, class, assortment_type from course_details where assortment_type in ('chapter','course','subject')";
    return mysql.query(sql);
}

function addIndex(client, data) {
    return new Promise((resolve, reject) => {
        client.bulk(
            {
                body: data,
            },
            function (err, resp) {
                console.log("err");
                console.log(err);
                if (err) {
                    return reject(err);
                }
                console.log("resp");
                console.log(resp.items[0]["index"]);
                return resolve(resp);
            }
        );
    });
}

main(mysql, client);