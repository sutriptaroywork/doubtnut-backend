const _ = require('lodash');
const moment = require('moment');
const libraryMysql = require('../../../modules/mysql/library');
const Utility = require('../../../modules/utility');
const LanguageContainer = require('../../../modules/containers/language');

const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');

let db; let config; let client;

async function getAll(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const readMysql = db.mysql.read;
        const { student_id } = req.user;
        // let app_version=req.query.app_version
        let student_class;
        if (req.query.class && req.query.class != '13') {
            student_class = req.query.class;
        } else {
            student_class = req.user.student_class;
        }
        const { page_no } = req.query;
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }

        const promise = [];
        promise.push(libraryMysql.getPlaylistTab(db.mysql.read, student_class));
        promise.push(libraryMysql.getPlaylistAllNewWithVersionCode(db.mysql.read, student_class, student_id, page_no, 10, version_code));
        const result = await Promise.all(promise);
        const data = {};
        data.tab = result[0];
        data.playlist = result[1];
		 const responseData = {
	        meta: {
	          code: 200,
	          success: true,
	          message: 'SUCCESS',
	        },
	        data,
	      };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getPlaylist(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const readMysql = db.mysql.read;
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { page_no } = req.query;
        let playlist_id = req.query.id;
        const { pdf_package } = req.query;
        const { level_one } = req.query;
        const { course } = req.query;
        let deeplink_class = req.query.class;
        if (deeplink_class == '13') {
            deeplink_class = '12';
        }
        const { chapter } = req.query;

        // Deep Link Handling
        if (playlist_id === 'NCERT') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, student_class, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'JEE_MAIN') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 12, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'JEE_ADVANCE') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 12, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'BOARDS_12') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 12, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'BOARDS_10') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 10, playlist_id);
            playlist_id = temp[0].id;
        } else if (typeof pdf_package !== 'undefined' && pdf_package.length !== 0 && typeof level_one !== 'undefined' && level_one.length > 0) {
            const temp = await libraryMysql.getPDFPlaylistId(db.mysql.read, student_class, pdf_package);
            const temp1 = await libraryMysql.getPDFParentPlaylistId(db.mysql.read, student_class, temp[0].id, level_one);
            playlist_id = temp1[0].id;
        } else if (typeof pdf_package !== 'undefined' && pdf_package.length !== 0) {
            const temp = await libraryMysql.getPDFPlaylistId(db.mysql.read, student_class, pdf_package);
            playlist_id = temp[0].id;
        } else if (typeof pdf_package !== 'undefined' && pdf_package === '') {
            const temp = await libraryMysql.getPDFPlaylistId(db.mysql.read, student_class, 'PDFs');
            playlist_id = temp[0].id;
        } else if (typeof deeplink_class !== 'undefined' && deeplink_class.length > 0 && typeof chapter !== 'undefined' && chapter.length > 0 && typeof course !== 'undefined' && (course === 'NCERT' || course === 'IIT')) {
            const temp = await libraryMysql.getPlaylistIdNew(db.mysql.read, deeplink_class, 'CONCEPT_VIDEOS');
            const temp1 = await libraryMysql.getParentPlaylistId(db.mysql.read, deeplink_class, temp[0].id, 'MATHS');
            const temp2 = await libraryMysql.getParentPlaylistId(db.mysql.read, deeplink_class, temp1[0].id, chapter);
            playlist_id = temp2[0].id;
        } else if (typeof course !== 'undefined' && course.length > 0 && (course === 'NCERT' || course === 'IIT')) {
            const temp = await libraryMysql.getPlaylistIdNew(db.mysql.read, student_class, 'CONCEPT_VIDEOS');
            const temp1 = await libraryMysql.getParentPlaylistId(db.mysql.read, student_class, temp[0].id, 'MATHS');
            playlist_id = temp1[0].id;
        }
        // Deeplink Handling ends Here

        const data = {};
        const data1 = await libraryMysql.getcheckPlaylistWithActive(db.mysql.read, student_class, student_id, playlist_id);
        if (data1.length !== 0) {
            const data2 = await libraryMysql.getParentDataNew(db.mysql.read, student_class, data1[0].parent, 10, page_no);
            if (page_no === '1') {
                data.header = data2;
            }
            let data3;
            if (data1[0].id == 0) {
                data3 = await libraryMysql.getcustomPlaylistHeader(db.mysql.read, student_class, student_id, page_no, 10, playlist_id);
            } else {
                data3 = await libraryMysql.getPlaylist(db.mysql.read, student_class, student_id, page_no, 10, playlist_id);
            }
            if (data3.length === 0 && page_no === '1') {
                data.meta_info = [{
                    icon: `${config.staticCDN}images/empty_playlist.webp`, title: 'NO VIDEOS', description: data1[0].empty_text, Button: 'WATCH TRENDING VIDEOS', id: '100780', playlist_name: 'TRENDING ON DOUBTNUT',
                }];
            } else {
                data.playlist = data3;
            }
        }
		 const responseData = {
	        meta: {
	          code: 200,
	          success: true,
	          message: 'SUCCESS',
	        },
	        data,
	      };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getResource(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const readMysql = db.mysql.read;
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { page_no } = req.query;
        let { id } = req.query;
        if (id === 'NCERT') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'DPP') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'TRENDING') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'LATEST_FROM_DOUBTNUT') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'HISTORY') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'VIRAL') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'CRASH_COURSE') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, 12, id);
            id = temp2[0].id;
        }

        const limit = 10;
        let language = 'english';
        const lang = await LanguageContainer.getByCode(req.user.locale, db);

        if (lang.length > 0) {
		   language = lang[0].language;
        }
        const data = {};

        if (id === 'SFY') {
            data.library_playlist_id = id;
            if (page_no === '1') {
                const promise = [];
                promise.push(libraryMysql.getParentDataNew(db.mysql.read, student_class, null, 10, page_no));
                promise.push(AnswerContainer.getPreviousHistory(student_id, db));
                promise.push(QuestionContainer.getPreviousHistory(student_id, db));
                const result = await Promise.all(promise);
                data.header = result[0];
                const question_id_playlist = result[1];
                // console.log(result[1])
                // console.log(result[2])
                let ocr = ''; let question_id = '';
			    if (result[1][0].parent_id == result[2][0].question_id && result[1].length > 0 && result[2].length > 0) {
			      question_id = result[1][0].question_id;
			      const d = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
			      if (d.length > 0) {
			      	ocr = d[0].ocr_text;
			      }
				  // ocr=result[2][0]['ocr_text']
			    } else if (result[1][0].question_id !== result[2][0].question_id && result[2].length > 0) {
			      	question_id = result[2][0].question_id;
			      	ocr = result[2][0].ocr_text;
			    }

			    const output = await elasticSearchInstance.findByOcr(ocr);
			    let colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
			    colors = Utility.generateColorArr(colors);
			    // data.playlist=output['hits']['hits']

			    if (output.hits.hits.length > 0) {
			    	let list = [];
	                for (let k = 0; k < output.hits.hits.length && k < 6; k++) {
	                	if (output.hits.hits[k]._source.question_id !== question_id) {
	                		const c = Utility.shuffle(colors);
		                    const i_url = `${config.staticCDN}q-thumbnail/${output.hits.hits[k]._source.question_id}.png`;
		                    const o = {
		                      id: output.hits.hits[k]._source.question_id,
		                      question_id: output.hits.hits[k]._source.question_id,
		                      type: 'video',
		                      ocr_text: output.hits.hits[k]._source.ocr_text,
		                      question: output.hits.hits[k]._source.question,
		                      image_url: i_url,
		                      title: output.hits.hits[k]._source.ocr_text,
		                      description: '',
		                      page: 'HOME_FEED',
		                      capsule_bg_color: '#ffffff',
		                      capsule_text_color: '#000000',
		                      start_gradient: c[0][0],
		                      mid_gradient: c[0][1],
		                      end_gradient: c[0][2],
		                      chapter: output.hits.hits[k]._source.meta_chapter,
		                      capsule_text: null,
		                      duration: null,
		                      duration_text_color: '#000000',
		                      duration_bg_color: '#ffffff',
		                      views: null,
	                    	};
	                    list.push(o);
	                  }
	                }
	            list = await getToatalLikesShare(list, student_id, db);
	            list = Utility.addThumbnail([list], config);
	           	data.playlist = list[0];
            	}
            } else {
                data.playlist = [];
            }
        } else {
            const data1 = await libraryMysql.getcheckPlaylist(db.mysql.read, student_class, student_id, id);
            if (data1[0].parent !== null && data1[0].parent !== '0') {
                const masterParentData = await libraryMysql.getcheckPlaylist(db.mysql.read, student_class, student_id, data1[0].master_parent);
                console.log(masterParentData);
                data.library_playlist_id = masterParentData[0].description;
            } else if (data1[0].parent === null && data1[0].student_id !== '98') {
                data.library_playlist_id = data1[0].description;
            } else {
                data.library_playlist_id = data1[0].id;
            }
            if (data1.length !== 0) {
                let data2;
                if (data1[0].parent === '0') {
                    data2 = await libraryMysql.getcustomPlaylist(db.mysql.read, student_class, student_id, page_no, 10, id);
                } else {
                    data2 = await libraryMysql.getParentDataNew(db.mysql.read, student_class, data1[0].parent, 10, page_no);
                }
                if (page_no === '1') {
                    data.header = data2;
                }
                let data3 = await libraryMysql.getResource(db.mysql.read, student_class, student_id, id);

                if (data3[0].is_last == 1) {
                    let str = _.replace(data3[0].resource_path, /xxlanxx/g, language);
                    str = _.replace(str, /xxclsxx/g, student_class);
                    str = _.replace(str, /xxsidxx/g, student_id);
                    const sql = `${str} limit ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
                    data3 = await readMysql.query(sql, [data3[0].id]);

                    for (let i = 0; i < data3.length; i++) {
                        const str = data3[i].ocr_text.replace(/'/g, "\\'");
                        data3[i].ocr_text = str;
                    }
                }

                if (data3.length === 0 && page_no === '1' && (data1[0].description === 'HISTORY' || data1[0].description === 'DPP' || data1[0].description === 'TRENDING')) {
                    data.meta_info = [{
                        icon: `${config.staticCDN}images/empty_playlist.webp`, title: 'NO VIDEOS', description: data1[0].empty_text, Button: 'WATCH TRENDING VIDEOS', id: '100780', playlist_name: 'TRENDING ON DOUBTNUT',
                    }];
                } else if (data3.length === 0 && page_no === '1' && (data1[0].description !== 'HISTORY' || data1[0].description !== 'DPP' || data1[0].description !== 'TRENDING')) {
                    data.meta_info = [{ icon: `${config.staticCDN}images/empty_playlist.webp`, title: 'No Saved Videos', description: 'Aapki saari saved Videos milengi yahan' }];
                } else {
                    data3 = await getToatalLikesShare(data3, student_id, db);
                    data3 = Utility.addThumbnail([data3], config);
                    data.playlist = data3[0];
                }
            }
        }
        const responseData = {
	        meta: {
	          code: 200,
	          success: true,
	          message: 'SUCCESS',
	        },
	        data,
	      };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getCustomPlaylist(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { page_no } = req.query;
        const playlist = req.query.playlist_name;
        const limit = 10;
        let language = 'english';
        const lang = await LanguageContainer.getByCode(req.user.locale, db);

        let data = [];
        if (lang.length > 0) {
		   language = lang[0].language;
        }
        if (playlist === 'HISTORY') {
            const result = await libraryMysql.getHistoryPlaylist(db.mysql.read, playlist);

            let str = _.replace(result[0].resource_path, /xxlanxx/g, language);
            str = _.replace(str, /xxclsxx/g, student_class);
            str = _.replace(str, /xxsidxx/g, student_id);
            const sql = `${str} limit ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
            // console.log(sql)
            let data3 = await db.mysql.read.query(sql, [result[0].id]);
            data3 = await getToatalLikesShare(data3, student_id, db);

            if (data3.length == 0 && page_no === '1') {
                data = [{
                    icon: `${config.staticCDN}images/empty_playlist.webp`, title: 'NO VIDEOS', description: result[0].empty_text, Button: 'WATCH TRENDING VIDEOS', id: result[0].empty_playlist_id, playlist_name: 'TRENDING ON DOUBTNUT',
                }];
            } else {
                data = data3;
            }
            data = Utility.addThumbnail([data], config);
        }
        const responseData = {
	        meta: {
	          code: 200,
	          success: true,
	          message: 'SUCCESS',
	        },
	        data: data[0],
	    };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

function getToatalLikesShare(elasticSearchResult, student_id, db) {
    return new Promise(async (resolve, reject) => {
        try {
            const color = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
            let durationPromise = [];
            for (let i = 0; i < elasticSearchResult.length; i++) {
      	  if (elasticSearchResult[i].ocr_text !== 'undefined' && elasticSearchResult[i].ocr_text !== null) {
      	  	const str = elasticSearchResult[i].ocr_text.replace(/'/g, "\\'");
		    elasticSearchResult[i].ocr_text = str;
      	  }

                durationPromise.push(AnswerContainer.getByQuestionId(elasticSearchResult[i].question_id, db));
                durationPromise.push(QuestionContainer.getTotalViewsWeb(elasticSearchResult[i].question_id, db));
            }
            const videoData = await Promise.all(durationPromise);
            for (let i = 0; i < elasticSearchResult.length; i++) {
                // console.log(videoData[i*2+1][0][0]['total_count'])
                durationPromise = [];
                durationPromise.push(AnswerContainer.getLikeDislikeStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(AnswerContainer.getWhatsappShareStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, videoData[i * 2][0].answer_id, db));
                const tempData = await Promise.all(durationPromise);
                if (videoData[i * 2][0].duration === 'NULL' || videoData[i * 2][0].duration === null) {
           	elasticSearchResult[i].duration = 0;
                } else {
                    elasticSearchResult[i].duration = videoData[i * 2][0].duration;
                }
                elasticSearchResult[i].bg_color = _.sample(color);
                elasticSearchResult[i].share = tempData[1][0];
                elasticSearchResult[i].like = tempData[0][0];
                elasticSearchResult[i].share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                elasticSearchResult[i].isLiked = false;
                if (tempData[2].length > 0 && tempData[2][0].rating > 3) {
                    elasticSearchResult[i].isLiked = true;
                }
            }
            return resolve(elasticSearchResult);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {
    getAll, getPlaylist, getResource, getCustomPlaylist,
};
