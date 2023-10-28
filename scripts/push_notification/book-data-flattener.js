// const config = require(__dirname + '/../../api_server/config/config');
// const config = require('../../api_server/config/config');
const database = require('./database');
const _ = require('lodash');

const MYSQL_HOST_WRITE = 'dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_HOST_READ = 'analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_HOST_TEST = 'test-db-latest-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_USER_WRITE = 'sutripta';
const MYSQL_DB_WRITE = 'classzoo1';
const MYSQL_PASS_TEST = '';
const MYSQL_PASS_WRITE = '';

const mysqlConf = {
    host     : MYSQL_HOST_WRITE,
    user     : MYSQL_USER_WRITE,
    password : MYSQL_PASS_WRITE,
    database : MYSQL_DB_WRITE,
};

const mysqlTestConf = {
    host     : MYSQL_HOST_TEST,
    user     : MYSQL_USER_WRITE,
    password : MYSQL_PASS_TEST,
    database : MYSQL_DB_WRITE,
}
// console.log('config : ', config)
// config.mysql_analytics.charset = 'utf8mb4';

main();

//This script will run every minute
async function main() {
    try{
        const classPlaylistMapping = {
            // 9: [108868, 108867, 108866, 108865],
            // 10: [108864, 108863, 108862, 108861],
            // 11: [108855, 108856, 108857, 110496],
            // 12: [108858, 108859, 108860, 110500],
            12: [110500],
        };

        const keysArr = Object.keys(classPlaylistMapping);

        for (let i = 0; i < keysArr.length; i++) {
            const mainPlaylistId = classPlaylistMapping[keysArr[i]];
            // console.log('mainPlaylistId > ', mainPlaylistId)
            for (const subjectPlaylist of mainPlaylistId) {
                const subjectPlaylistId = subjectPlaylist;
                const tabPlaylistResponse = await getTabPlaylistId(subjectPlaylistId);
                // console.log('tabPlaylistResponse > ', tabPlaylistResponse)
                for (const tabPlaylist of tabPlaylistResponse) {
                    const tabPlaylistId = tabPlaylist.id;
                    const booksPlaylistResponse = await getBookPlaylistId(tabPlaylistId);
                    // console.log('booksPlaylistResponse > ', booksPlaylistResponse)
                    for (const booksPlaylist of booksPlaylistResponse) {
                        let booksPlaylistId = booksPlaylist.id;
                        console.log('booksPlaylistId > ', booksPlaylistId)

                        if (booksPlaylistId == 110517) {
                            // continue;
                            console.log('book class tab flow')
                            let newBookResponse = await getBookPlaylistId(booksPlaylistId);
                            newBookResponse = newBookResponse.filter((x) => x.name === 'Volume 2');
                            for (const newBook of newBookResponse) {
                                newBooksPlaylistId = newBook.id;
                                console.log('newbooksPlaylistId > ', newBooksPlaylistId)
                                const chapterPlaylistResponse = await getChapterPlaylistId(newBooksPlaylistId);
                                for (const chapterPlaylist of chapterPlaylistResponse) {
                                    const chapterPlaylistId = chapterPlaylist.id;
                                    console.log('chapterPlaylistId > ', chapterPlaylistId)
                                    let chapterPlaylistResourcePath = chapterPlaylist.resource_path;
                                    chapterPlaylistResourcePath = _.replace(chapterPlaylistResourcePath, /xxlanxx/g, 'english');
                                    console.log('chapterPlaylistResourcePath > ', chapterPlaylistResourcePath)
                                    // const exPlaylistResponse = await getExPlaylistId(chapterPlaylistId);
                                    // for (const exPlaylist of exPlaylistResponse) {
                                    //     const exPlaylistId = exPlaylist.id;
                                    //     console.log('exPlaylistId > ', exPlaylistId)
                                    //     let exPlaylistResourcePath = exPlaylist.resource_path;
                                    //     exPlaylistResourcePath = _.replace(exPlaylistResourcePath, /xxlanxx/g, 'english');
                                    //     console.log('exPlaylistResourcePath > ', exPlaylistResourcePath)
                                        const questionList = await getQuestionList(chapterPlaylistResourcePath);

                                        let count = 0;
                                    
                                        for (const question of questionList) {
                                            count++;
                                            console.log('count > ', count);
                                            const obj = {
                                                subject_playlist_id: subjectPlaylistId,
                                                tab_playlist_id: tabPlaylistId,
                                                book_playlist_id: booksPlaylistId,
                                                chapter_playlist_id: chapterPlaylistId,
                                                // exercise_playlist_id: exPlaylistId,
                                                exercise_playlist_id: 0,
                                                student_class: keysArr[i],
                                                question_id: question.question_id,
                                            };
                                            console.log('obj > ', obj)
                                            await insertData(obj);
                                        }
                                    // }
                                }
                            }
                        }
                        // if (booksPlaylistId == 108192) {
                        //     console.log('special book flow')
                        //     let newBookResponse = await getBookPlaylistId(booksPlaylistId);
                        //     for (const newBook of newBookResponse) {
                        //         booksPlaylistId = newBook.id;
                        //         console.log('newbooksPlaylistId > ', booksPlaylistId)
                        //         const chapterPlaylistResponse = await getChapterPlaylistId(booksPlaylistId);
                        //         for (const chapterPlaylist of chapterPlaylistResponse) {
                        //             const chapterPlaylistId = chapterPlaylist.id;
                        //             console.log('chapterPlaylistId > ', chapterPlaylistId)
                        //             const exPlaylistResponse = await getExPlaylistId(chapterPlaylistId);
                        //             for (const exPlaylist of exPlaylistResponse) {
                        //                 const exPlaylistId = exPlaylist.id;
                        //                 console.log('exPlaylistId > ', exPlaylistId)
                        //                 let exPlaylistResourcePath = exPlaylist.resource_path;
                        //                 exPlaylistResourcePath = _.replace(exPlaylistResourcePath, /xxlanxx/g, 'english');
                        //                 console.log('exPlaylistResourcePath > ', exPlaylistResourcePath)
                        //                 const questionList = await getQuestionList(exPlaylistResourcePath);

                        //                 let count = 0;
                                    
                        //                 for (const question of questionList) {
                        //                     count++;
                        //                     console.log('count > ', count);
                        //                     const obj = {
                        //                         subject_playlist_id: subjectPlaylistId,
                        //                         tab_playlist_id: tabPlaylistId,
                        //                         book_playlist_id: booksPlaylistId,
                        //                         chapter_playlist_id: chapterPlaylistId,
                        //                         exercise_playlist_id: exPlaylistId,
                        //                         student_class: keysArr[i],
                        //                         question_id: question.question_id,
                        //                     };
                        //                     console.log('obj > ', obj)
                        //                     await insertData(obj);
                        //                 }
                        //             }
                        //         }
                        //     }
                        // }
                        // if (booksPlaylistId == 111106) {
                            // console.log('exercise category flow') 
                        //     const chapterPlaylistResponse = await getChapterPlaylistId(booksPlaylistId);
                            // for (const chapterPlaylist of chapterPlaylistResponse) {
                            //     const chapterPlaylistId = chapterPlaylist.id;
                            //     console.log('chapterPlaylistId > ', chapterPlaylistId)
                            //     const exPlaylistResponse = await getExPlaylistId(chapterPlaylistId);
                            //     for (const exPlaylist of exPlaylistResponse) {
                            //         let exPlaylistId = exPlaylist.id;
                            //         console.log('exPlaylistId > ', exPlaylistId)
                            //         const newExPlaylistResponse = await getExPlaylistId(exPlaylistId);
                            //         for (newExPlaylist of newExPlaylistResponse) {
                            //             exPlaylistId = newExPlaylist.id;
                            //             console.log('new exPlaylistId > ', exPlaylistId)
                            //             let exPlaylistResourcePath = newExPlaylist.resource_path;
                            //             exPlaylistResourcePath = _.replace(exPlaylistResourcePath, /xxlanxx/g, 'english');
                            //             const questionList = await getQuestionList(exPlaylistResourcePath);

                            //             let count = 0;
                                    
                            //             for (const question of questionList) {
                            //                 count++;
                            //                 console.log('count > ', count);
                            //                 const obj = {
                            //                     subject_playlist_id: subjectPlaylistId,
                            //                     tab_playlist_id: tabPlaylistId,
                            //                     book_playlist_id: booksPlaylistId,
                            //                     chapter_playlist_id: chapterPlaylistId,
                            //                     exercise_playlist_id: exPlaylistId,
                            //                     student_class: keysArr[i],
                            //                     question_id: question.question_id,
                            //                 };
                            //                 console.log('obj > ', obj)
                            //                 await insertData(obj);
                            //             }
                            //         }
                            //     }
                            // }
                        // } 
                        // else 
                        else if (booksPlaylistId == 110515 || booksPlaylistId == 110516) {
                            console.log('chapter flow')
                            const chapterPlaylistResponse = await getChapterPlaylistId(booksPlaylistId);
                            for (const chapterPlaylist of chapterPlaylistResponse) {
                                const chapterPlaylistId = chapterPlaylist.id;
                                console.log('chapterPlaylistId > ', chapterPlaylistId)
                                let playlistResourcePath = chapterPlaylist.resource_path;
                                playlistResourcePath = _.replace(playlistResourcePath, /xxlanxx/g, 'english');
                                console.log('playlistResourcePath > ', playlistResourcePath)
                                const questionList = await getQuestionList(playlistResourcePath);
                                let count = 0;
                                for (const question of questionList) {
                                    count++;
                                    console.log('count > ', count);
                                    const obj = {
                                        subject_playlist_id: subjectPlaylistId,
                                        tab_playlist_id: tabPlaylistId,
                                        book_playlist_id: booksPlaylistId,
                                        chapter_playlist_id: chapterPlaylistId,
                                        exercise_playlist_id: 0,
                                        student_class: keysArr[i],
                                        question_id: question.question_id,
                                    };
                                    console.log('obj > ', obj)
                                    await insertData(obj);
                                }
                            }
                        } else if (booksPlaylistId != 122724) {
                            console.log('normal flow')
                            const chapterPlaylistResponse = await getChapterPlaylistId(booksPlaylistId);
                            for (const chapterPlaylist of chapterPlaylistResponse) {
                                const chapterPlaylistId = chapterPlaylist.id;
                                console.log('chapterPlaylistId > ', chapterPlaylistId)
                                const exPlaylistResponse = await getExPlaylistId(chapterPlaylistId);
                                for (const exPlaylist of exPlaylistResponse) {
                                    const exPlaylistId = exPlaylist.id;
                                    console.log('exPlaylistId > ', exPlaylistId)
                                    let exPlaylistResourcePath = exPlaylist.resource_path;
                                    exPlaylistResourcePath = _.replace(exPlaylistResourcePath, /xxlanxx/g, 'english');
                                    console.log('exPlaylistResourcePath > ', exPlaylistResourcePath)
                                    const questionList = await getQuestionList(exPlaylistResourcePath);

                                    let count = 0;
                                
                                    for (const question of questionList) {
                                        count++;
                                        console.log('count > ', count);
                                        const obj = {
                                            subject_playlist_id: subjectPlaylistId,
                                            tab_playlist_id: tabPlaylistId,
                                            book_playlist_id: booksPlaylistId,
                                            chapter_playlist_id: chapterPlaylistId,
                                            exercise_playlist_id: exPlaylistId,
                                            student_class: keysArr[i],
                                            question_id: question.question_id,
                                        };
                                        console.log('obj > ', obj)
                                        await insertData(obj);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log("success at: "+new Date())
    }catch(e){
        console.log(e)
    }
}

function getTabPlaylistId(subjectPlaylistId) {
    const mysql = new database(mysqlConf);
    const sql= "SELECT * FROM `new_library` WHERE `parent` LIKE '"+subjectPlaylistId+"' AND name = 'Books'";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function getBookPlaylistId(tabPlaylistId) {
    const mysql = new database(mysqlConf);
    let sql = "SELECT * FROM `new_library` WHERE `parent` LIKE '"+tabPlaylistId+"' AND is_active = 1";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function getChapterPlaylistId(booksPlaylistId) {
    const mysql = new database(mysqlConf);
    const sql= "SELECT * FROM `new_library` WHERE `parent` LIKE '"+booksPlaylistId+"' AND is_active = 1";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function getExPlaylistId(chapterPlaylistId) {
    const mysql = new database(mysqlConf);
    const sql= "SELECT * FROM `new_library` WHERE `parent` LIKE '"+chapterPlaylistId+"' AND is_active = 1";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function getQuestionList(exPlaylistResourcePath) {
    const mysql = new database(mysqlConf);
    const sql= exPlaylistResourcePath;
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

async function insertData(dataObj) {
    const mysql_w = new database(mysqlTestConf);
    // const checkSql = `SELECT * FROM book_questions_details WHERE subject_playlist_id = ? AND tab_playlist_id = ? AND book_playlist_id = ? AND chapter_playlist_id = ? AND exercise_playlist_id = ? AND student_class = ? AND question_id = ?`;
    // const checkData = await mysql_w.query(checkSql, [dataObj.subject_playlist_id, dataObj.tab_playlist_id, dataObj.book_playlist_id, dataObj.chapter_playlist_id, dataObj.exercise_playlist_id, dataObj.student_class, dataObj.question_id]);
    // console.log('checkData > ', checkData)
    // let data = [];
    // if (checkData.length == 0) {
        // console.log('inserting...')
        const sql= "INSERT INTO book_questions_details SET ?";
        const data = mysql_w.query(sql, dataObj);
    // }
    mysql_w.connection.end();
    return data;
}
