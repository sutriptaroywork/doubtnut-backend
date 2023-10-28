const _ = require('lodash');
const Question = require('../../../modules/question');
const Student = require('../../../modules/student');
const Playlist = require('../../../modules/playlist');
const Home = require('../../../modules/home');

const Token = require('../../../modules/tokenAuth');
const DppContainer = require('../../../modules/containers/dailyPractiseProblems');
const LanguageContainer = require('../../../modules/containers/language');
// const validator = require('validator')
// const request = require("request")
let db; let config; let
    client;

async function get(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        client = req.app.get('client');
        const limit = 5;
        let flag;
        // res.send("ok")
        const { student_class } = req.params;
        const { student_course } = req.params;
        const { student_id } = req.user;
        let language = 'english';
        const lang = await LanguageContainer.getByCode(req.user.locale, db);
        // console.log("language")
        // console.log(lang)
        if (lang.length > 0) {
            language = lang[0].language;
        }
        const promises = [];
        // check for subscription
        // Student.isSubscribed(student_id, db.mysql.read).then(std => {
        //   //console.log("std")
        //   //console.log(std)

        // get question of the day
        promises.push(Question.getTrendingVideos(student_class, limit, language, db.mysql.read));
        promises.push(DppContainer.getByStudentIdWithLanguage(student_id, limit, language, db));
        promises.push(Question.getVlsByLimit(student_class, limit, language, db.mysql.read));
        // promises.push(Question.getQuestionsOfTheDay(student_class, student_course, limit, db.mysql.read))
        // get student recent video played history
        promises.push(Student.getStudentQuestionHistoryListWithLanguage(student_id, limit, language, db.mysql.read));
        if (_.includes(['6', '7', '8', '9', '14'], student_class.toString())) {
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));

            // get doubtnut recomended questions
            // promises.push(Question.getRecommendedQuestions(limit, student_class, db.mysql.read))

            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));
            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
        } else if (student_class == '10') {
            promises.push(Home.getTenthBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));
            // get doubtnut recomended questions
            // promises.push(Question.getRecommendedQuestions(limit, student_class, db.mysql.read))

            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));
            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
        } else if (student_class == '11' && student_course == 'IIT') {
            promises.push(Home.getJeeMainBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getJeeAdvancedBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));
            // get doubtnut recomended questions
            // promises.push(Question.getRecommendedQuestions(limit, student_class, db.mysql.read))
            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
        } else if (student_class == '11' && student_course == 'NCERT') {
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));
            promises.push(Home.getJeeMainBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getJeeAdvancedBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            // get doubtnut recomended questions
            // promises.push(Question.getRecommendedQuestions(limit, student_class, db.mysql.read))

            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
        } else if (student_class == '12' && student_course == 'NCERT') {
            promises.push(Home.getBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));
            promises.push(Home.getJeeMainBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getJeeAdvancedBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));
            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
        } else if (student_class == '12' && student_course == 'IIT') {
            promises.push(Home.getJeeMainBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getJeeAdvancedBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));

            // get doubtnut recomended questions
            // promises.push(Question.getRecommendedQuestions(limit, student_class, db.mysql.read))

            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));
            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
        } else {
        // get doubtnut recomended questions
            promises.push(Question.getRecommendedQuestions(limit, student_class, db.mysql.read));

            // viral videos
            promises.push(Question.getViralVideoByLimitWithLanguage(limit, language, db.mysql.read));

            //   subscribed
            // answered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 1, limit, language, db.mysql.read));
            // unanswered
            promises.push(Student.subscribedStudentHistoryWithLanguage(student_id, 0, limit, language, db.mysql.read));
            // get playlist data of student
            promises.push(Playlist.getPlaylistByStudentIdWithLanguage(student_id, limit, language, db.mysql.read));
            // get ncert - home page questions
            promises.push(Home.getNcertBrowseLibraryByClassWithLanguage(limit, student_class, language, db.mysql.read));

            if (student_class == 11 || student_class == 12) {
                flag = 1;
                // get XII boards questions
                promises.push(Home.getBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
                promises.push(Home.getJeeMainBrowseLibraryWithLanguage(limit, language, db.mysql.read));
                promises.push(Home.getJeeAdvancedBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            }

            if (student_class == 10) {
                flag = 2;
                promises.push(Home.getTenthBoardsBrowseLibraryWithLanguage(limit, language, db.mysql.read));
            }
        }

        Promise.all(promises).then((result) => {
        // //console.log('result')
        // console.log(result)

            const data = [];
            if (result[0].length > 0) {
                const r = {};
                r.title = 'Trending Videos';
                r.playlist_id = 'TRENDING';
                r.image_url = `${config.blob_url}q-images/`;
                r.list = result[0];
                data.push(r);
            }
            if (result[1].length > 0) {
                const r = {};
                r.title = 'Daily Practice Problems';
                r.playlist_id = 'DPP';
                r.image_url = `${config.blob_url}q-images/`;
                r.list = result[1];
                data.push(r);
            }

            if (result[2].length > 0) {
                const r = {};
                r.title = 'Daily Lessons';
                r.playlist_id = 'VLS';
                r.image_url = `${config.blob_url}q-images/`;
                r.list = result[2];
                data.push(r);
            }
            if (result[3].length > 0) {
                const r = {};
                r.title = 'History';
                r.playlist_id = 'HISTORY';
                r.image_url = `${config.blob_url}q-images/`;
                r.list = result[3];
                data.push(r);
            }
            if (_.includes(['6', '7', '8', '9', '14'], student_class.toString())) {
                if (result[4].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[4];
                    data.push(r);
                }
                // get doubtnut recomended questions
                // if (result[4].length > 0) {
                //   let r = {}
                //   r['title'] = 'We Recommend'
                //   r['image_url'] = config.blob_url + 'q-images/'
                //   r['playlist_id'] = 'DN_REC'
                //   r['list'] = result[4]
                //   data.push(r)
                // }
                // viral videos
                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[5];
                    data.push(r);
                }
                if (result[6].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[6];
                    data.push(r);
                }
                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;

                    r.list = result[7];
                    data.push(r);
                }
                if (result[8].length > 0) {
                    // console.log(result[8]);
                    const grouped = _.groupBy(result[8], 'name');

                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
            } else if (student_class == '10') {
                if (result[4].length > 0) {
                    const r = {};
                    r.title = '10 Boards';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'BOARDS_10';
                    r.list = result[4];
                    data.push(r);
                }
                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[5];
                    data.push(r);
                }
                // if (result[5].length > 0) {
                //   let r = {}
                //   r['title'] = 'We Recommend'
                //   r['image_url'] = config.blob_url + 'q-images/'
                //   r['playlist_id'] = 'DN_REC'
                //   r['list'] = result[5]
                //   data.push(r)
                // }

                if (result[6].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[6];
                    data.push(r);
                }
                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[7];
                    data.push(r);
                }
                if (result[8].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;

                    r.list = result[8];
                    data.push(r);
                }
                if (result[9].length > 0) {
                    // console.log(result[9]);
                    const grouped = _.groupBy(result[9], 'name');

                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
            } else if (student_class == '11' && student_course == 'IIT') {
                // }

                if (result[4].length > 0) {
                    const r = {};
                    r.title = 'JEE Mains';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_MAIN';
                    r.list = result[4];
                    data.push(r);
                }
                // if (i == 8) {
                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'JEE Advanced';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_ADVANCE';
                    r.list = result[5];
                    data.push(r);
                }
                if (result[6].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[6];
                    data.push(r);
                }
                // if (result[6].length > 0) {
                //   let r = {}
                //   r['title'] = 'We Recommend'
                //   r['image_url'] = config.blob_url + 'q-images/'
                //   r['playlist_id'] = 'DN_REC'
                //   r['list'] = result[6]
                //   data.push(r)
                // }

                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[7];
                    data.push(r);
                }
                if (result[8].length > 0) {
                    const r = {};
                    r.title = '12 Boards';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'BOARDS_12';
                    r.list = result[8];
                    data.push(r);
                }
                if (result[9].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[9];
                    data.push(r);
                }
                if (result[10].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;

                    r.list = result[10];
                    data.push(r);
                }
                if (result[11].length > 0) {
                    // console.log(result[11]);
                    const grouped = _.groupBy(result[11], 'name');

                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
            } else if (student_class == '11' && student_course == 'NCERT') {
                if (result[4].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[4];
                    data.push(r);
                }
                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'JEE Mains';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_MAIN';
                    r.list = result[5];
                    data.push(r);
                }
                // if (i == 8) {
                if (result[6].length > 0) {
                    const r = {};
                    r.title = 'JEE Advanced';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_ADVANCE';
                    r.list = result[6];
                    data.push(r);
                }

                // if (result[6].length > 0) {
                //   let r = {}
                //   r['title'] = 'We Recommend'
                //   r['image_url'] = config.blob_url + 'q-images/'
                //   r['playlist_id'] = 'DN_REC'
                //   r['list'] = result[6]
                //   data.push(r)
                // }

                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[7];
                    data.push(r);
                }
                if (result[8].length > 0) {
                    const r = {};
                    r.title = '12 Boards';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'BOARDS_12';
                    r.list = result[8];
                    data.push(r);
                }
                if (result[9].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[9];
                    data.push(r);
                }
                if (result[10].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;

                    r.list = result[10];
                    data.push(r);
                }
                if (result[11].length > 0) {
                    // console.log(result[11]);
                    const grouped = _.groupBy(result[11], 'name');

                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
            } else if (student_class == '12' && student_course == 'NCERT') {
                if (result[4].length > 0) {
                    const r = {};
                    r.title = '12 Boards';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'BOARDS_12';
                    r.list = result[4];
                    data.push(r);
                }
                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[5];
                    data.push(r);
                }
                if (result[6].length > 0) {
                    const r = {};
                    r.title = 'JEE Mains';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_MAIN';
                    r.list = result[6];
                    data.push(r);
                }
                // if (i == 8) {
                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'JEE Advanced';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_ADVANCE';
                    r.list = result[7];
                    data.push(r);
                }

                // if (result[7].length > 0) {
                //   let r = {}
                //   r['title'] = 'We Recommend'
                //   r['image_url'] = config.blob_url + 'q-images/'
                //   r['playlist_id'] = 'DN_REC'
                //   r['list'] = result[7]
                //   data.push(r)
                // }

                if (result[8].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[8];
                    data.push(r);
                }

                if (result[9].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[9];
                    data.push(r);
                }
                if (result[10].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;

                    r.list = result[10];
                    data.push(r);
                }
                if (result[11].length > 0) {
                    // console.log(result[11]);
                    const grouped = _.groupBy(result[11], 'name');

                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
            } else if (student_class == '12' && student_course == 'IIT') {
                if (result[4].length > 0) {
                    const r = {};
                    r.title = 'JEE Mains';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_MAIN';
                    r.list = result[4];
                    data.push(r);
                }
                // if (i == 8) {
                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'JEE Advanced';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'JEE_ADVANCE';
                    r.list = result[5];
                    data.push(r);
                }
                if (result[6].length > 0) {
                    const r = {};
                    r.title = '12 Boards';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'BOARDS_12';
                    r.list = result[6];
                    data.push(r);
                }
                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[7];
                    data.push(r);
                }

                //
                // if (result[7].length > 0) {
                //   let r = {}
                //   r['title'] = 'We Recommend'
                //   r['image_url'] = config.blob_url + 'q-images/'
                //   r['playlist_id'] = 'DN_REC'
                //   r['list'] = result[7]
                //   data.push(r)
                // }

                if (result[8].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[8];
                    data.push(r);
                }

                if (result[9].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[9];
                    data.push(r);
                }
                if (result[10].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;

                    r.list = result[10];
                    data.push(r);
                }
                if (result[11].length > 0) {
                    // console.log(result[11]);
                    const grouped = _.groupBy(result[11], 'name');

                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
            } else {
                if (result[4].length > 0) {
                    const r = {};
                    r.title = 'We Recommend';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'DN_REC';
                    r.list = result[4];
                    data.push(r);
                }

                if (result[5].length > 0) {
                    const r = {};
                    r.title = 'Tips & Tricks';
                    r.playlist_id = 'VIRAL';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.list = result[5];
                    data.push(r);
                }
                // }
                // if (i == 4) {
                if (result[6].length > 0) {
                    const r = {};
                    r.title = 'Your Answered';
                    r.playlist_id = 'SUB_ANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    // for (let i = 0; i < result[4].length; i++) {
                    //   result[4][i]['question_image'] = config.blob_url + 'q-images/' + result[4][i]['question_image']
                    // }
                    r.list = result[6];
                    data.push(r);
                }
                // }
                // if (i == 5) {
                if (result[7].length > 0) {
                    const r = {};
                    r.title = 'Your Unanswered';
                    r.playlist_id = 'SUB_UNANS';
                    r.image_url = `${config.blob_url}q-images/`;
                    // for (let i = 0; i < result[5].length; i++) {
                    //   result[5][i]['question_image'] = config.blob_url + 'q-images/' + result[5][i]['question_image']
                    // }
                    r.list = result[7];
                    data.push(r);
                }
                // }
                // if (i == 6) {
                if (result[8].length > 0) {
                    // console.log(result[8]);
                    const grouped = _.groupBy(result[8], 'name');
                    // let model = {
                    //   question_id:null,
                    //   ocr_text:null,
                    //   question:null
                    // }
                    // //console.log(grouped)
                    for (const i in grouped) {
                        const r = {};
                        r.title = i;
                        r.playlist_id = grouped[i][0].id.toString();
                        r.image_url = `${config.blob_url}q-images/`;
                        grouped[i].forEach((v) => {
                            delete v.id;
                            delete v.name;
                        });

                        r.list = grouped[i];
                        data.push(r);
                    }
                }
                // }
                // if (i == 7) {
                if (result[9].length > 0) {
                    const r = {};
                    r.title = 'NCERT Questions';
                    r.image_url = `${config.blob_url}q-images/`;
                    r.playlist_id = 'NCERT';
                    r.list = result[9];
                    data.push(r);
                }
                // }

                if (flag == 1) {
                    if (result[10].length > 0) {
                        const r = {};
                        r.title = '12 Boards';
                        r.image_url = `${config.blob_url}q-images/`;
                        r.playlist_id = 'BOARDS_12';
                        r.list = result[10];
                        data.push(r);
                    }
                    if (result[11].length > 0) {
                        const r = {};
                        r.title = 'JEE Mains';
                        r.image_url = `${config.blob_url}q-images/`;
                        r.playlist_id = 'JEE_MAIN';
                        r.list = result[11];
                        data.push(r);
                    }
                    // if (i == 8) {
                    if (result[12].length > 0) {
                        const r = {};
                        r.title = 'JEE Advanced';
                        r.image_url = `${config.blob_url}q-images/`;
                        r.playlist_id = 'JEE_ADVANCE';
                        r.list = result[12];
                        data.push(r);
                    }
                    // }
                    // if (i == 9) {

                    // }
                    // if (i == 10) {

                    // }
                } else if (flag == 2) {
                    // if (i == 8) {
                    if (result[10].length > 0) {
                        const r = {};
                        r.title = '10 Boards';
                        r.image_url = `${config.blob_url}q-images/`;
                        r.playlist_id = 'BOARDS_10';
                        r.list = result[10];
                        data.push(r);
                    }
                    // }
                }
            }
            // //console.log("Test2")
            // }
            // //console.log("test")
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data,
            };
            res.status(responseData.meta.code).json(responseData);
        }).catch((error) => {
        // console.log(error);
            next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Something is wrong",
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData);
        });
    } catch (e) {
    // console.log(e);
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong(catch)",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    get,
};
