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
  const base = { index: { _index: 'micro_ias_v1', _type: config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH } }
  const letters = /^[A-Za-z]+$/

  let index = []
  let data = {}

  // Getting data from ncert_video_meta and indexing it.
  let videoData = await getNCERTVideoMetaData(mysql)
  for (let i = 0; i < videoData.length; i++) {
    index = []
    data = {}
    data['id'] = videoData[i]['question_id']
    data['class'] = videoData[i]['class']
    data['type'] = 'video'
    data['image_url'] = videoData[i]['thumbnail_img_url']
    data['subject'] = videoData[i]['subject']
    data['parent'] = ''
    data['isVip'] = false
    data['resource_path'] = ''
    data['display'] = videoData[i]['ocr_text']
    data['page'] = 'SEARCH_SRP'
    data['tab_type'] = 'video'
    data['is_last'] = ''
    data['tags'] = videoData[i]['tags_yt']
    data['breadcrumbs'] = `Class ${videoData[i]['class']} || ${data['subject']} || ${videoData[i]['chapter']} || Video`
    let text2 = videoData[i]['ex_code'] + " " + videoData[i]['q_code'] + " " + videoData[i]['exercise_name'] + " " + videoData[i]['yt_description']
    let text1 = videoData[i]['tags_yt'].split(',').join(" ").split(" ")
    text2 = text2.split(" ")
    for (let i = 0; i < text2.length; i++) {
      if (letters.test(text2[i])) {
        text2[i] = text2[i].toLowerCase()
      }
    }
    text2 = text2.join(" ")
    for (let i = 0; i < text1.length; i++) {
      if (letters.test(text1[i])) {
        text1[i] = text1[i].toLowerCase()
      }
      if (!text2.includes(text1[i])) {
        text2 = text2 + " " + text1[i]
      }
    }
    text2 = text2 + " "+text1.join(' ');
    data['search_key'] = text2 + " " + videoData[i]['display1']
    data['hindi_image_url'] = videoData[i]['thumbnail_img_url_hindi']
    data['hindi_breadcrumbs'] = ''
    data['hindi_display'] = videoData[i]['ocr_text_hindi']
    base.index._id = data['id'];
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  // Getting data from ncert_video_meta_new and indexing it.
  videoData = await getNCERTVideoMetaNewData(mysql)
  for (let i = 0; i < videoData.length; i++) {
    index = []
    data = {}
    data['id'] = videoData[i]['question_id']
    data['class'] = videoData[i]['class']
    data['type'] = 'video'
    data['image_url'] = videoData[i]['thumbnail_img_url']
    data['subject'] = videoData[i]['subject']
    data['parent'] = ''
    data['isVip'] = false
    data['resource_path'] = ''
    data['display'] = videoData[i]['ocr_text']
    data['page'] = 'SEARCH_SRP'
    data['tab_type'] = 'video'
    data['is_last'] = ''
    data['tags'] = videoData[i]['tags_yt']
    data['breadcrumbs'] = `Class ${videoData[i]['class']} || ${data['subject']} || ${videoData[i]['chapter']} || Video`
    let text2 = videoData[i]['ex_code'] + " " + videoData[i]['q_code'] + " " + videoData[i]['exercise_name'] + " " + videoData[i]['yt_description']
    let text1 = videoData[i]['tags_yt'].split(',').join(" ").split(" ")
    text2 = text2.split(" ")
    for (let i = 0; i < text2.length; i++) {
      if (letters.test(text2[i])) {
        text2[i] = text2[i].toLowerCase()
      }
    }
    text2 = text2.join(" ")
    for (let i = 0; i < text1.length; i++) {
      if (letters.test(text1[i])) {
        text1[i] = text1[i].toLowerCase()
      }
      if (!text2.includes(text1[i])) {
        text2 = text2 + " " + text1[i]
      }
    }
    text2 = text2 + " "+text1.join(' ');
    data['search_key'] = text2 + " " + videoData[i]['display1']
    data['hindi_image_url'] = videoData[i]['thumbnail_img_url_hindi']
    data['hindi_breadcrumbs'] = ''
    data['hindi_display'] = videoData[i]['ocr_text_hindi']
    base.index._id = data['id'];
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  // Getting data from ncert_video_meta_new and indexing it.
  videoData = await getCrashCourse(mysql)
  for (let i = 0; i < videoData.length; i++) {
    index = []
    data = {}
    data['id'] = videoData[i]['resource_reference']
    data['class'] = videoData[i]['class']
    data['type'] = 'video'
    data['image_url'] = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${videoData[i]['resource_reference']}.png`
    data['subject'] = videoData[i]['subject']
    data['parent'] = ''
    data['isVip'] = false
    data['resource_path'] = ''
    data['display'] = `${stringFormatter(videoData[i]['topic'])} - ${stringFormatter(videoData[i]['chapter'])}`;
    data['page'] = 'SEARCH_SRP'
    data['tab_type'] = 'video'
    data['is_last'] = ''
    data['tags'] = ''
    data['breadcrumbs'] = `Crash Course || Class ${data['class']} || ${data['subject']} || Video`
    let facultyName = stringFormatter(videoData[i]['expert_name']);
    if (facultyName) {
      data['breadcrumbs'] = `Crash Course By || ${facultyName} || Class ${data['class']} || ${data['subject']} || Video`
    }
    data['search_key'] = `${data['display']} ${facultyName} ${data['subject']} ${data['class']} Crash Course`
    data['hindi_image_url'] = ''
    data['hindi_breadcrumbs'] = ''
    data['hindi_display'] = ''
    base.index._id = data['id'];
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  // Getting data from ncert_video_meta_new and indexing it.
  videoData = await getStudentByQuestionData(mysql)
  for (let i = 0; i < videoData.length; i++) {
    index = []
    data = {}
    data['id'] = videoData[i]['question_id']
    const topperTagData = await getToppersTag(data['id']);
    if(topperTagData.length && topperTagData[0].ratings > 4){
      data['is_recommended'] = true;
    }
    data['class'] = videoData[i]['class']
    data['type'] = 'video'
    data['image_url'] = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${data['id']}.png`
    data['subject'] = videoData[i]['subject']
    data['parent'] = ''
    data['isVip'] = false
    data['resource_path'] = ''
    data['display'] = videoData[i]['ocr_text']
    data['page'] = 'SEARCH_SRP'
    data['tab_type'] = 'video'
    data['is_last'] = ''
    data['tags'] = ''
    data['breadcrumbs'] = `Video`
    if(videoData[i]['subtopic']){
      data['breadcrumbs'] = `${videoData[i]['subtopic']} || `+ data['breadcrumbs'];
    }
    if(videoData[i]['chapter']){
      data['breadcrumbs'] = `${videoData[i]['chapter']} || ` + data['breadcrumbs'];
    }
    data['search_key'] = data['display'] + " " + data['breadcrumbs']
    data['hindi_image_url'] = ''
    data['hindi_breadcrumbs'] = ''
    data['hindi_display'] = ''
    base.index._id = data['id'];
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  // Getting data from in_app_search and indexing it.
  let libraryData = await getLibraryData(mysql)
  for (let i = 0; i < libraryData.length; i++) {
    index = []
    data = {}
    data['id'] = libraryData[i]['id']
    data['class'] = libraryData[i]['class']
    data['type'] = libraryData[i]['resource_type']
    data['image_url'] = libraryData[i]['thumbnail_img_url']
    data['subject'] = libraryData[i]['subject']
    data['parent'] = libraryData[i]['parent']
    data['isVip'] = false
    data['resource_path'] = ""
    if (libraryData[i]['resource_path'] && libraryData[i]['resource_path'].length < 200) {
      data['resource_path'] = libraryData[i]['resource_path']
    }
    data['display'] = ""
    let display = libraryData[i]['name'].split(" ")
    for (let j = 0; j < display.length; j++) {
      if (letters.test(display[j])) {
        data['display'] = data['display'] + " " + _.startCase(display[j].toLowerCase())
      } else {
        data['display'] = data['display'] + " " + display[j]
      }
    }
    data['display'] = data['display'].slice(1)
    data['page'] = ''
    data['tab_type'] = libraryData[i]['tab_type']
    data['is_last'] = libraryData[i]['is_last']
    data['tags'] = ''
    let breadcrumbs
    data['breadcrumbs'] = ""
    if (libraryData[i]['parent_tags']) {
      breadcrumbs = libraryData[i]['parent_tags'].split(',')
      for (let i = 0; i < breadcrumbs.length; i++) {
        let str = breadcrumbs[i].split(" ")
        if (str.length > 0) {
          for (let j = 0; j < str.length; j++) {
            if (letters.test(str[j])) {
              str[j] = str[j].toLowerCase()
            }
          }
        }
        breadcrumbs[i] = str.join(" ")
        if (data['breadcrumbs']) {
          data['breadcrumbs'] = data['breadcrumbs'] + " | " + _.startCase(breadcrumbs[i])
        } else {
          data['breadcrumbs'] = _.startCase(breadcrumbs[i])
        }

      }
    } else {
      if (data['tab_type'] === 'pdf') {
        data['breadcrumbs'] = 'PDF'
      } else if (data['tab_type'] === 'book') {
        data['breadcrumbs'] = 'Book'
      } else if (data['tab_type'] === 'ncert') {
        data['breadcrumbs'] = 'Ncert Solutions'
      } else if (data['tab_type'] === 'topic') {
        data['breadcrumbs'] = 'Topic Video'
      } else {
        data['breadcrumbs'] = 'Playlist'
      }
    }
    data['display'] = data['display']
    data['search_key'] = libraryData[i]['name'] + " " + libraryData[i]['class']
    if (libraryData[i]['parent_tags']) {
      let text1 = libraryData[i]['name'] + " " + libraryData[i]['class'] + " " + libraryData[i]['subject']
      text1 = text1.split(',').join(" ").split(" ")
      for (let i = 0; i < text1.length; i++) {
        if (letters.test(text1[i])) {
          text1[i] = text1[i].toLowerCase()
        }
      }
      text1 = text1.join(" ")
      for (let i = 0; i < breadcrumbs.length; i++) {
        if (!text1.includes(breadcrumbs[i])) {
          text1 = text1 + " " + breadcrumbs[i]
        }
      }
      data['search_key'] = text1
    }

    data['hindi_image_url'] = libraryData[i]['thumbnail_img_url_hindi']
    data['hindi_breadcrumbs'] = ''
    if (libraryData[i]['parent_tags_language_1']) {
      data['hindi_breadcrumbs'] = libraryData[i]['parent_tags_language_1'].split(',').join(' | ')
    }
    data['hindi_display'] = ''
    if (libraryData[i]['name_language_1']) {
      data['hindi_display'] = libraryData[i]['name_language_1']
    }
    data['search_key'] = `${data.search_key} ${data['hindi_display']} ${data['hindi_breadcrumbs']}`;

    base.index._id = `library_${data['id']}`;
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  // Getting data from ncert_video_meta_new and indexing it.
  videoData = await liveClassData(mysql)
  let regex = /^[0-9]*$/;
  for (let i = 0; i < videoData.length; i++) {
    index = []
    data = {}
    data['id'] = videoData[i]['resource_reference']
    data['class'] = videoData[i]['class']
    data['type'] = 'video'
    data['image_url'] = ''
    data['page'] = 'SEARCH_SRP'
    data['meta_data']={
      resource_reference: data['id'],
      player_type: videoData[i]['player_type']
    }
    if(videoData[i]['resource_type']===1){
      data['image_url']=`https://img.youtube.com/vi/${data['id']}/hqdefault.jpg`;
      if(videoData[i]['player_type']==='livevideo'){
        data['image_url'] = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${data['id']}.png`;
        data['meta_data'].live_at = videoData[i]['live_at'];
        data['meta_data'].video_time_in_mins = 90;
      }
      data['page'] = 'LIVECLASS_RESOURCE'
    }
    if(videoData[i]['resource_type']===8){
      data['image_url'] = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${data['id']}.png`
      data['page'] = 'TS_VOD'
    }
    data['meta_data'].page = data['page'];
    data['subject'] = videoData[i]['subject']
    data['parent'] = ''
    data['isVip'] = false
    data['resource_path'] = ''
    data['display'] = videoData[i]['topic']
    data['tab_type'] = 'video'
    data['is_last'] = ''
    data['tags'] = ''
    data['breadcrumbs'] = `Class ${data['class']} || ${data['subject']} || video`
    if(videoData[i]['expert_name']){
      data['breadcrumbs'] = `By ${videoData[i]['expert_name']} || ` + data['breadcrumbs'];
    }
    
    data['search_key'] =` ${data['display']}`
    if(videoData[i]['chapter']){
      data['meta_data'].title = videoData[i]['chapter'];
      data['search_key'] = `${data['search_key']} ${videoData[i]['chapter']} class ${data['class']} ${data['subject']} `
    }
    if(videoData[i]['expert_name']){
      data['search_key'] = `${data['search_key']} live class by ${videoData[i]['expert_name']} live classes live videos`;
    }
    if(videoData[i]['player_type']==='livevideo'){
      data['search_key'] = `${data['search_key']} By VMC vmc live classes`;
    }
    
    data['hindi_image_url'] = ''
    data['hindi_breadcrumbs'] = ''
    data['hindi_display'] = ''
    data['is_live_class']=true
    base.index._id = data['id'];
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  // Getting data from upcomming and livestream data and indexing it.
  videoData = await liveStreamingData(mysql)
  for (let i = 0; i < videoData.length; i++) {
    index = []
    data = {}
    data['id'] = `${videoData[i]['resource_reference']}`
    data['class'] = videoData[i]['class']
    data['type'] = 'video'
    data['image_url'] = ''
    data['page'] = 'SEARCH_SRP'
    if(videoData[i]['resource_type']===4){
      data['image_url'] = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${data['id']}.png`
      data['page'] = 'LIVECLASS'
    }
    data['subject'] = videoData[i]['subject']
    data['parent'] = ''
    data['isVip'] = false
    data['resource_path'] = ''
    data['display'] = videoData[i]['topic']
    data['tab_type'] = 'video'
    data['is_last'] = ''
    data['tags'] = ''
    data['breadcrumbs'] = `Class ${data['class']} || ${data['subject']} || video`
    if(videoData[i]['expert_name']){
      data['breadcrumbs'] = `By ${videoData[i]['expert_name']} || ` + data['breadcrumbs'];
    }
    data['meta_data']={
      resource_reference: data['id'],
      player_type: 'liveclass',
      page: data['page'],
      live_at: videoData[i]['live_at'],
      video_time_in_mins: 90
    }
    data['search_key'] = 'live class live classes '
    if(videoData[i]['expert_name']){
      data['search_key'] = `${data['search_key']} By ${videoData[i]['expert_name']} ${data['display']}`;
    }
    if(videoData[i]['chapter']){
      data['meta_data'].title = videoData[i]['chapter'];
      data['search_key'] = `${data['search_key']} ${videoData[i]['chapter']} class ${data['class']} ${data['subject']} live videos current live class`
    }
    data['hindi_image_url'] = ''
    data['hindi_breadcrumbs'] = ''
    data['hindi_display'] = ''
    data['is_live_class']=true
    base.index._id = data['id'];
    index.push(base)
    index.push(data)
    await addIndex(client, index)
  }

  console.log("Script successfully ran")
}

function stringFormatter(str) {
  if ((str === null) || (str === ''))
    return false;
  else
    str = str.toString();
  return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function getNCERTVideoMetaData(mysql) {
  let sql = "Select a.*,b.hindi as ocr_text_hindi,concat('NCERT ','Class ',a.class,' ',case when a.exercise_name='MEX' then a.exercise_type when a.exercise_name='SLV' then 'Solved Example' else concat(a.exercise_type,' ',a.chapter_order,'.',a.exercise_order) end,' Q ',a.question_order) as display1 from ncert_video_meta as a left join questions_localized as b on a.question_id=b.question_id order by a.chapter_order,a.exercise_order"
  return mysql.query(sql)
}

function getCrashCourse(mysql) {
  let sql = "SELECT a.*,b.chapter from structured_course_resources as a left join structured_course_details as b on a.structured_course_detail_id=b.id and a.structured_course_id=b.structured_course_id where a.resource_type=0"
  return mysql.query(sql)
}

function getNCERTVideoMetaNewData(mysql) {
  let sql = "Select a.*,b.hindi as ocr_text_hindi,concat('NCERT ','Class ',a.class,' ',a.chapter,' ',concat(a.exercise_type),' Q ',a.question_order) as display1 from ncert_video_meta_new as a left join questions_localized as b on a.question_id=b.question_id  where a.is_answered=1 order by a.chapter_order"
  return mysql.query(sql)
}

function getStudentByQuestionData(mysql) {
  let sql = "SELECT a.question_id,a.class,a.subject,a.ocr_text,b.chapter,b.subtopic  FROM `questions` as a left join questions_meta as b on a.question_id=b.question_id WHERE a.student_id=-56 and a.is_answered=1"
  return mysql.query(sql)
}

function liveClassData(mysql) {
  let sql = "SELECT a.*,b.chapter,b.live_at  FROM liveclass_course_resources as a left join liveclass_course_details as b on a.liveclass_course_id=b.liveclass_course_id and a.liveclass_course_detail_id=b.id WHERE a.resource_type in (1,8)"
  return mysql.query(sql)
}

function liveStreamingData(mysql) {
  let sql = "SELECT a.*,b.chapter,b.live_at  FROM liveclass_course_resources as a left join liveclass_course_details as b on a.liveclass_course_id=b.liveclass_course_id and a.liveclass_course_detail_id=b.id WHERE a.resource_type=4 and b.live_at>NOW()"
  return mysql.query(sql)
}


function getLibraryData(mysql) {
  let sql = "Select *, case when parent_tags like '%BOOKS%' then 'book' when parent_tags like '%Topic Videos%' then 'topic' when parent_tags like '%NCERT Video Solutions%' then 'ncert' when parent_tags like '%ncert solution%' then 'ncert' else resource_type end as tab_type from inapp_search_data where is_active=1 and is_delete=0"
  return mysql.query(sql)
}

function getToppersTag(id) {
  let sql = "Select avg(rating) as ratings from user_answer_feedback where question_id=? group by answer_id desc limit 1"
  return mysql.query(sql, [id])
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



