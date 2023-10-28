const elasticSearch = require('elasticsearch')
const axios = require('axios')

require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require('../../api_server/config/database');
const _ = require('lodash');

// connection to elastic search
const client = new elasticSearch.Client({
    host: config.elastic.INAPP_ELASTIC_HOST
});

// connection to mysql
const mysql = new database(config.mysql_analytics);

main(mysql, client)

async function main(mysql, client) {
    const base = { index: { _index: config.elastic.REPO_INDEX_INAPP_SEARCH, _type: config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH } }
    const letters = /^[A-Za-z]+$/

    let index = []
    let data = {}

    // Getting data from etoos_course_data and indexing it.
    let etoosCourseData = await getEtoosCourseData(mysql)
    for (let i = 0; i < etoosCourseData.length; i++) {
        index = []
        data = {}
        data['id'] = etoosCourseData[i]['id']
        data['class'] = etoosCourseData[i]['class']
        data['type'] = 'etoos_course'
        if (etoosCourseData[i]['course'] === 'CBSE' || etoosCourseData[i]['course'] === 'FOUNDATION') {
            data['image_url'] = 'https://d10lpgp6xz60nq.cloudfront.net/images/etoos_boards.png';
        } else if (etoosCourseData[i]['course'] === 'JEE') {
            data['image_url'] = 'https://d10lpgp6xz60nq.cloudfront.net/images/etoos_jee.png';
        } else if (etoosCourseData[i]['course'] === 'NEET') {
            data['image_url'] = 'https://d10lpgp6xz60nq.cloudfront.net/images/etoos_neet.png';
        }
        data['subject'] = ''
        data['']
        data['parent'] = ''
        data['isVip'] = true
        data['resource_path'] = ''
        data['display'] = etoosCourseData[i]['display_name']
        data['page'] = 'SEARCH_SRP'
        data['tab_type'] = 'etoos_course'
        data['is_last'] = 0;
        data['tags'] = ''
        data['breadcrumbs'] = `Class ${etoosCourseData[i]['class']} || ETOOS(Kota Classes)`
        data['search_key'] = `class ${etoosCourseData[i]['class']} ${etoosCourseData[i]['display_name']} ${etoosCourseData[i]['course']} ETOOS Kota Classes`
        data['hindi_image_url'] = ''
        data['hindi_breadcrumbs'] = ''
        data['hindi_display'] = ''

        base.index._id = `etoos_course_${data['class']}_${data['id']}`;
        index.push(base)
        index.push(data)
        await addIndex(client, index)
    }

    // Getting data from faculty_data and indexing it.
    let facultyData = await getEtoosFacultyData(mysql)
    for (let i = 0; i < facultyData.length; i++) {
        index = []
        data = {}
        data['id'] = facultyData[i]['id']
        data['class'] = facultyData[i]['class']
        data['type'] = 'etoos_faculty'
        data['image_url'] = facultyData[i].square_image_url
        data['subject'] = facultyData[i]['subject']
        data['faculty_id'] = facultyData[i]['id'];
        data['ecm_id'] = facultyData[i]['ecm_id'];
        data['parent'] = ''
        data['isVip'] = true
        data['resource_path'] = ''
        data['display'] = `${facultyData[i]['name']} (${facultyData[i].nickname})`
        data['page'] = 'SEARCH_SRP'
        data['tab_type'] = 'etoos_faculty'
        data['is_last'] = 0;
        data['tags'] = ''//videoData[i]['tags_yt']
        data['breadcrumbs'] = `${facultyData[i]['degree_obtained']} | ${facultyData[i].college} \n ${facultyData[i].coaching}`
        data['search_key'] = `${facultyData[i]['course']} course by sir ${facultyData[i]['name']} ${facultyData[i].nickname} ${facultyData[i]['subject']} ${facultyData[i].coaching}`
        data['hindi_image_url'] = ''
        data['hindi_breadcrumbs'] = ''
        data['hindi_display'] = ''

        base.index._id = `etoos_faculty_${data['class']}_${data['id']}`;
        index.push(base)
        index.push(data)
        await addIndex(client, index)
    }

    // Getting data from faculty_chapter_data and indexing it.
    let etoosFacultyChapterData = await getEtoosFacultyChapterData(mysql)
    for (let i = 0; i < etoosFacultyChapterData.length; i++) {
        index = []
        data = {}
        data['id'] = etoosFacultyChapterData[i]['id']
        data['class'] = etoosFacultyChapterData[i]['class']
        data['type'] = 'etoos_chapter'
        data['image_url'] = etoosFacultyChapterData[i].thumbnail
        data['subject'] = etoosFacultyChapterData[i]['subject']
        data['chapter_id'] = etoosFacultyChapterData[i]['id'];
        data['parent'] = ''
        data['isVip'] = true
        data['resource_path'] = ''
        data['display'] = etoosFacultyChapterData[i]['name']
        data['page'] = 'SEARCH_SRP'
        data['tab_type'] = 'etoos_chapter'
        data['is_last'] = 0
        data['tags'] = ''
        data['breadcrumbs'] = `${etoosFacultyChapterData[i].faculty_name} (${etoosFacultyChapterData[i].faculty_nickname})`
        data['search_key'] = `${etoosFacultyChapterData[i]['name']} By ${etoosFacultyChapterData[i].faculty_nickname} ${etoosFacultyChapterData[i].faculty_name} ${etoosFacultyChapterData[i]['subject']}`
        data['hindi_image_url'] = ''
        data['hindi_breadcrumbs'] = ''
        data['hindi_display'] = ''

        base.index._id = `etoos_chapter_${data['class']}_${data['id']}`;
        index.push(base)
        index.push(data)
        await addIndex(client, index)
    }

    // Getting data from etoos_video_data and indexing it.
    let etoosVideoData = await getEtoosVideoData(mysql)
    for (let i = 0; i < etoosVideoData.length; i++) {
        index = []
        data = {}
        data['id'] = etoosVideoData[i]['question_id']
        data['class'] = etoosVideoData[i]['class']
        data['type'] = 'video'
        data['image_url'] = 'https://d10lpgp6xz60nq.cloudfront.net/etoos/lecture/' + etoosVideoData[i]['question_id'] + '.png'
        data['subject'] = etoosVideoData[i]['subject']
        data['parent'] = ''
        data['isVip'] = true
        data['resource_path'] = ''
        data['display'] = etoosVideoData[i]['lecture_name']
        data['page'] = 'SEARCH_SRP'
        data['tab_type'] = 'video'
        data['is_last'] = ''
        data['tags'] = ''
        data['breadcrumbs'] = etoosVideoData[i]['topic_name'] + " By " + etoosVideoData[i]['nickname'] + " || ETOOS"
        data['search_key'] = etoosVideoData[i]['lecture_name'] + " " + etoosVideoData[i]['topic_name'] + " " + etoosVideoData[i]['subject'] + " class " + etoosVideoData[i]['mapped_class'] + " " + etoosVideoData[i]['course'] + " " + etoosVideoData[i]['TG'] + " By " + etoosVideoData[i]['faculty_name'] + " " + etoosVideoData[i]['nickname'] + " ETOOS Kota"
        data['hindi_image_url'] = ''
        data['hindi_breadcrumbs'] = ''
        data['hindi_display'] = ''
        base.index._id = `etoos_video_${data['class']}_${data['id']}`;
        index.push(base)
        index.push(data)
        await addIndex(client, index)
    }
    console.log("successfully completed");
}


function getEtoosVideoData(mysql) {
    let sql = "Select * from etoos_inapp_data ";
    return mysql.query(sql)
}

function getEtoosFacultyData(mysql) {
    let sql = "SELECT a.*,b.ecm_id,c.display_name as course,c.class as class FROM `etoos_faculty` as a left join etoos_faculty_course as b on a.id=b.faculty_id left join etoos_course_mapping as c on b.ecm_id=c.id";
    return mysql.query(sql)
}

function getEtoosFacultyChapterData(mysql) {
    let sql = "SELECT a.*,b.name as faculty_name,b.nickname as faculty_nickname, c.display_name, c.class as class FROM `etoos_chapter` as a left join etoos_faculty as b on a.faculty_id=b.id left join etoos_course_mapping as c on a.ecm_id=c.id";
    return mysql.query(sql)
}

function getEtoosCourseData(mysql) {
    let sql = "SELECT * from etoos_course_mapping";
    return mysql.query(sql)
}
