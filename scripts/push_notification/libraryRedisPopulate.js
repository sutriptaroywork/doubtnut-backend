"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
const Utility = require('../../api_server/modules/utility')
const mysql = new database(config.mysql_analytics)
const bluebird = require("bluebird");
const redis = require("redis");
bluebird.promisifyAll(redis);
const client = redis.createClient({host : config.redis.host});
const BATCH_SIZE=10000
const expire = 4*60*60;

client.on("connect", async function() {
    console.log("Redis client connected successfully");
    try{
        await redisPopulate(mysql,client);
        await getPlaylist(mysql,client);
        console.log("redis population of data done")
        client.quit();
    }catch(e){
        console.log(e)
    } 
})


function getPlaylistList(database){
    const sql = 'select id from new_library where is_admin_created=1 and is_last=0'
    return database.query(sql);
}


function getPlaylistWithView(database, page, limit, playlist_id) {
    const sql = `select id,name,view_type,main_description as description,image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where parent='${playlist_id}' and is_active=1 and is_delete=0 order by playlist_order,id asc LIMIT ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
    return database.query(sql);
}

function getLibraryLandingInfoWithVersionCode(database, student_class, version_code) {
    const sql = `select a.id,a.name,a.view_type,a.description,a.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in ('playlist','pdf') and is_delete=0 and student_class in ('${student_class}','all') and is_active=1 and min_version_code< ${version_code} and max_version_code>=${version_code} ) as a left join (select * from mapped_icon_library where class in ('${student_class}','all')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC`;
    return database.query(sql);
}


function getLibraryPromotionalData(database,student_class,page,version_code,limit){
    page = '%'+page+'%'
    let sql = "select image_url,action_activity,action_data,type as size,class,page_type,banner_order,position from app_banners where class=? and page_type like '${page}' and is_active=1 and min_version_code < ? and max_version_code>=? order by banner_order asc limit "+limit
    return database.query(sql,[student_class,version_code,version_code]);
  }


async function redisPopulate(mysql,client) {
    const student_class = ['6', '7', '8', '9', '10', '11', '12', '14'];
    const min_version_code = 602;
    const max_version_code = 650;
    let promise = [];
    let bannerAndListCache = [];
    let myclient=client.multi();
    for (let i = 0; i < student_class.length; i++) {
        for (let j = min_version_code; j < max_version_code; j++) {
            promise.push(getLibraryLandingInfoWithVersionCode(mysql, student_class[i], j));
            promise.push(getLibraryPromotionalData(mysql, student_class[i], 'LIBRARY', j, 5));
            bannerAndListCache = await Promise.all(promise);
            console.log(`LIBRARY_GET_ALL_CACHE_${student_class[i]}_${j}`);
            myclient.set(`LIBRARY_GET_ALL_CACHE_${student_class[i]}_${j}`, JSON.stringify(bannerAndListCache))
            promise = [];
        }
    }
    myclient.execAsync();
}


async function getPlaylist(mysql,client) {
     const playlistList = await getPlaylistList(mysql);
     let data = {}
     let myclient=client.multi();
     for (let k = 0; k < playlistList.length; k++) {
        if(playlistList[k].id){
            const playlist_info = await getPlaylistWithView(mysql, 1, 10000, playlistList[k].id);
            const headers = [];
            let filters = [];
            for (let i = 0; i < playlist_info.length; i++) {
                if (playlist_info[i].view_type != null) {
                    if (playlist_info[i].view_type == 'HEADER') {
                        headers.push(playlist_info[i]);
                        playlist_info.splice(i, 1);
                        i--;
                        continue;
                    } else if (playlist_info[i].view_type == 'FILTER') {
                        filters.push(playlist_info[i]);
                        playlist_info.splice(i, 1);
                        i--;
                        continue;
                    }
                }
            }

            data.list = playlist_info;
            if (headers.length) {
                data.headers = headers;
                const child_playlist_info = await getPlaylistWithView(mysql, 1, 10000, headers[0].id);
                let isFilter = false;
                for (let j = 0; j < child_playlist_info.length; j++) {
                    if (child_playlist_info[j].view_type != null) {
                        if (child_playlist_info[j].view_type == 'FILTER') {
                            isFilter = true;
                            break;
                        }
                    }
                }
                if (isFilter) {
                    filters = child_playlist_info;
                } else {
                    data.list = child_playlist_info;
                }
            }
            if (filters.length) {
                data.filters = filters;
                const child_playlist_info = await getPlaylistWithView(mysql, 1, 10000, filters[0].id);
                data.list = child_playlist_info;
            }
            console.log(`LIBRARY_CACHE_ID_${playlistList[k].id}`)
            myclient.set(`LIBRARY_CACHE_ID_${playlistList[k].id}`, JSON.stringify(data))
        }
    }
    myclient.execAsync();
}

