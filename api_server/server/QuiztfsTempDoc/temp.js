// /**
//  * This documents contain api implementations(basic) for quiztwentyfourseven(QuizTfs)
//  * Also contains schema for mongodb collection,mysql tables along with their modules.
//  * Functions and logic are commented in between these APIs to ease understanding of implementation
//  */

// // redis apis to get data
// module.exports = class QuizTfs{
//    // get session ID
//     static getSessionID(client,language,subject,studentClass){
//        return client.getAsync(`QuizTfs:${language}:${studentClass}:${subject}:sessionId`)
//     }
//     static getTestLeaderboardAll(client, sessionId, min, max) {
//         return client.zrevrangeAsync(`QuizTfs:leaderboard:sessions:${sessionId}`, min, max, 'WITHSCORES');
//     }

//     static getTestLeaderboardAllRank(client, sessionID, studentID) {
//         return client.zrevrankAsync(`QuizTfs:leaderboard:sessions:${sessionID}`, studentID);
//     }

//     static getTestLeaderboardAllScore(client, sessionId, studentID) {
//         return client.zscoreAsync(`QuizTfs:leaderboard:sessions:${sessionId}`, studentID);
//     }
//     // TODO: Leaderboard expireat and execAsync understand
//     static setLeaderboard(client,sessionId, studentId, ptsReceived){
//         client.multi()
//             .zadd(`QuizTfs:leaderboard:sessions:${sessionId}`, ptsReceived, studentId)
//             .expireat(`leaderboard:tests:${testId}`, parseInt((+new Date()) / 1000) + 60 * 60 * 24 * 3)
//             .execAsync();
//     }
// }

// // mysql
// // Sessions Table schema -- sessionId, studentId, testQuestionId, date, studentClass, subject, language, answerSelected, pts_received, actualAnswer, sessionType

// module.exports = class QuizTfsMysql{
//     static insertIntoSessionsTable(database,sessionId, studentId, testQuestionId, date, studentClass, subject, language,answerSelected, ptsReceived, actualAnswer, sessionType) {
//         const sql = 'insert into sessions_details(session_id, student_id, test_question_id, date, class, subject, language, answer, pts_received, is_streak, type) values (?,?,?,?,?,?,?,?,?,?,?)';
//         return database.query(sql, [sessionId, studentId, testQuestionId, date, studentClass, subject, language,answerSelected, ptsReceived, actualAnswer, sessionType]);
//     }
//     static getAttemptedCount(database,yesterday,today,studentID){
//         const sql = `select count(*) from sessions_details where studentID = ? and data BETWEEN ? and ?`;
//         return database.query(sql,[studentID,yesterday,today]);
//     }
//     static getTotalQuestionsAttemped(database,yesterday,today,studentID){
//         sql = `SELECT sessionId, testQuestionId, answerSelected, pts_received, actualAnswer, sessionType FROM sessions_details where studentID = ? and date BETWEEN ? and ? GROUP BY sessionId`;
//         return database.query(sql,[studentID,yesterday,today]);
//     }
// }

// // main controller

// async function getQuestionForQuizTfs(req,res) {
//     try{
//         const responseData = {
//             meta:{
//                 code: 200,
//                 success: true,
//                 message: 'SUCCESS',
//             },
//             data:{},
//         };
//         // get request so query
//         const db = req.app.get('db');
//         const {
//             studentClass,
//             language,
//             studentId,
//             subject,
//             sessionId
//         } = req.query;
//         const sessionID = sessionId ? sessionId: await QuizTfs.getSessionID(db.redis.read,language,subject,studentClass);
//         // get question
//         const reqTime = Date.now();
//         // Replace placeholder with the new collection we implement for tests
//         const questsionDetails = await db.mongo.read.collection('PLACEHOLDER').findOne(`{"startTime": {"$lte": ${reqTime}}, "endTime": {"$gt":${reqTime}}, "subject":${subject}, "class":${studentClass}, "lang":${language}}`);
//         responseData.data  = questsionDetails;
//         return res.status(responseData.meta.code).json(responseData);
//     } catch(e) {
//         console.log(e)
//         const responseData = {
//             meta: {
//                 code: 500,
//                 message: 'SOMETHING WENT WRONG',
//             }
//         }
//         return res.status(responseData.meta).json(responseData)
//     }

// }
// async function submitAnswer(req,res){
//     try {

//         const db = req.app.get('db');
//         const {
//             studentClass,
//             language,
//             studentId,
//             subject,
//             sessionId,
//             answerSelected,
//             ptsReceived,
//             actualAnswer,
//             sessionType,
//             testQuestionId
//         } = req.body;
//         const date = Date.now();
//         const sessionID = sessionId ? sessionID: await QuizTfs.getSessionID(db.redis.read,language,subject,studentClass);
//         const answer = answerSelected ? answerSelected : 'SKIPPED';
//         // update session table
//         await QuizTfsMysql.insertIntoSessionsTable(db.mysql.read,sessionID, studentId, testQuestionId, date, studentClass, subject, language, answer, ptsReceived, actualAnswer, sessionType)
//         // update redis leaderboard
//         const ptsBefore = QuizTfs.getScoreByStudentId(db.redis.read,sessionID,studentId);
//         const ptsnow = ptsBefore+ptsReceived ;
//         await QuizTfs.setLeaderboard(db.redis.read,sessionID,studentId,ptsnow);
//         const responseData = {
//             meta:{
//                 code: 200,
//                 success: true,
//                 message: 'SUCCESS',
//             },
//             data:{},
//         };
//         return res.status(responseData.meta.code).json(responseData);
//     } catch (e) {
//         console.log(e);
//         const responseData = {
//             meta: {
//                 code: 500,
//                 message: 'SOMETHING WENT WRONG',
//             }
//         }
//         return res.status(responseData.meta).json(responseData);
//     }
// }

// // new function to format string
// function dateFormatter(today){
//     let day = today.getDate();
//     let month = today.getMonth()+1;
//     let year = today.getFullYear();
//     day = day.toString();
//     day = day.length == 2 ? day : '0'+day;
//     month = month.toString();
//     month = month.length == 2 ? month : '0'+month;
//     year = year.toString();
//     const dateFormatted = `${year}-${month}-${day} 00:00:00`;
//     return dateFormatted

// }

// // check number of questions answered today
// // check for number of questions answered yesterday
// // if today == 10 and yesterday >= 10: give him rewards
// // more optimized if only called when user attempted 10 questions so we only have to check for number of questions yesterday

// async function checkDailyStreak(req,res){
//     try {
//         const db = req.app.get('db');
//         const { studentID } = req.query;
//         let today = new Date();
//         let yesterday = new Date();
//         yesterday.setDate(yesterday.getDate()-1);
//         today = dateFormatter(today);
//         yesterday = dateFormatter(yesterday);
//         const responseData = {
//             meta: {
//                 code: 200,
//                 success: true,
//                 message: 'SUCCESS',
//             },
//             data = {is_streak: false}
//         }
//         const numberOfQuestions = await QuizTfsMysql.getAttemptedCount(db.mysql.read,yesterday,today,studentID);
//         if (numberOfQuestions >= 10) {
//             responseData.data.is_streak = true;
//             const ptsBefore = QuizTfs.getScoreByStudentId(db.redis.read,sessionID,studentId);
//             // if streak set studentID points with +50
//             const ptsnow = ptsBefore+50;
//             await QuizTfs.setLeaderboard(db.redis.read,sessionID,studentId,ptsnow);

//         } return res.status(responseData.meta).json(responseData);

//     } catch (e) {
//         console.log(e);
//         const responseData = {
//             meta: {
//                 code: 500,
//                 message: 'SOMETHING WENT WRONG',
//             }
//         }
//         return res.status(responseData.meta).json(responseData);
//     }
// }
// // start with a mongo implementation for the apis

// // Mongo ::::: used because ideal for querying compared to redis (only ideal for static values queryied on id)
// // onSubmit - 1.) redis set value 2.) send mysql value update table
// // LeaderBoard : based on session ID
// // SessionID: class-language-subject: uuid: ZSET: studentId: score()
// // is_streak -> front-end -> state: lastScore ->  // only send score
// // query startTime <= requesttime < endTime  for question selection
// // studentId score is maintained in redis

// /****
//  *
//  *  schema for mongo collection
//  *  questionID:
//  *  questionText:
//  *  optionA:
//  *  optionB:
//  *  optionC:
//  *  optionD:
//  *  correctOption:
//  *  startTime:
//  *  endTime:
//  *  subject:
//  *  class:
//  *  lang:
//  *
//  */

// // mongo API ->
// /***
//  * check for studentID sessionID -> if not set sessionID
//  * use this sessionID and studentID and check for request Time
//  * MongoQuery on findOne -> based on language, class, subject(using these instead of sessionId, because multiple sessions can rely on them) and time which returns the current test question
//  * return the current testQuestion as data
//  */

// // SessionID cron: updates sessionID for class:language combinations
// // Party -- create a session code and set that as session ID for all users who join the party
// // LeaderBoard -- based on sessionID generate LeaderBoard (since all sessionIDs point to ZSets in Redis) -> solves for both party and global
// // Tables for previous submissions

// /***
//  * function to calculate records:
//  *  from studentId -> group by session ID -> for each session
//  *                                  if points received > 0: correct
//  *                                    else: if answerSeelected: skipped: skipped
//  *                                          else: wrong
//  *                                  can also order them by streak inc -- so we can return how many answers were given in a streak
//  *
//  *  */

// // get the array of all answered questions
// async function getSessionScore(req,res){
//     try {
//         const db = req.app.get('db');
//         const {studentId} = req.query;
//         let today = Date.now();
//         today = dateFormatter(today);
//         let yesterday = req.query.start ? req.query.start : DAYOFQUIZSTART;
//         const allPreviousAnswers = QuizTfsMysql.getTotalQuestionsAttemped(db.mysql.read,yesterday,today,studentId);
//         let sessions = {}
//         allPreviousAnswers.forEach(item =>{
//             if (!(items.sessionId in sessions)) sessions[sessionId] = {correctAnswers:[],skippedAnswers:[],incorrectAnswers:[]};
//             if (item.pts_received && item.actualAnswer === 'SKIPPED') sessions[sessionId].skippedAnswers.push(item);
//             else if (item.ptsReceived && item.actualAnswer != 'SKIPPED') sessions[sessionId].correctAnswers.push(item);
//             else sessions[sessionId].incorrectAnswers.push(item);
//         })
//         sessions.key
//         const responseData = {
//             meta: {
//                 code: 200,
//                 success: true,
//                 message: 'SUCCESS',
//             },
//             data: {}
//         }
//         responseData.data = sessions;
//         return res.status(responseData.meta).json(responseData);
//     } catch (e) {
//         console.log(e);
//         const responseData = {
//             meta: {
//                 code: 500,
//                 message: 'SOMETHING WENT WRONG',
//             }
//         };
//         return res.status(responseData.meta).json(responseData);
//     }
// }

// /***
//  * left to implement -> mostly a Cron job to upload values from redis to mysql table
//  * Session History table: to store sessionID, studentID, rank, score
//  * Could be used to check for rewards -> in which case change name
//  * Or implement a rewards table -> stores studentId, scoreSoFar, isElgibile tabs and has_used tabs (preferred)
//  */
