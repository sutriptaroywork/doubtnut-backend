/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-10 20:05:15
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-20T16:40:45+05:30
*/
const PostModel = require('../../../modules/mongo/post')
const CommentModel = require('../../../modules/mongo/comment')

const _ = require('lodash')
let db, config, client
const moment = require('moment')
let inProgress = false;
const profanity = require("../../helpers/profanity-hindi");
var sendgrid = require("sendgrid")("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")
var helper = require('sendgrid').mail
const { response } = require('express')


async function sendMail(req, res, next) {
    try {
        let content_html = req.body.content
        let subject = req.body.subject
        let from_email = new helper.Email("autobot@doubtnut.com");
        let to_email = new helper.Email(req.body.to_email);
        let content = new helper.Content("text/html", content_html)
        let mail = new helper.Mail(from_email, subject, to_email, content);
        var sg = await sendgrid.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
        });

        let response = await sendgrid.API(sg)
        let responseData = {
            "meta": {
                "code": response.statusCode,
                "success": true,
                "message": "SUCCESS"
            },
            "data": response
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e)
    }
}

async function search(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let entity_type = req.params.entity_type
        let searchtext = req.query.searchtext
        let query = {}
        let data
        if (entity_type === 'ugc') {
            query = { $or: [{ "text": { "$regex": searchtext, "$options": 'i' } }, { "student_username": searchtext }, { "student_id": searchtext }] }
            //console.log(query)
            data = await PostModel.find(query)

            //console.log(data)
        } else if (entity_type === 'comment') {
            query = { $or: [{ "message": { "$regex": searchtext, "$options": 'i' } }, { "student_username": searchtext }, { "entity_id": searchtext }, { "entity_type": searchtext }] }
            data = await CommentModel.find(query)

        }

        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": data
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e)
    }
}
async function deleteugc(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let entity_id = req.params['entity_id']

        let postData = {
            _id: entity_id
        }
        // let post = new PostModel(postData);
        PostModel.findOne(postData).then(async result => {
            //console.log(result);
            result.is_deleted = 1
            result.is_visible = 0
            let post = new PostModel(result);
            post.save().then(async result => {
                let responseData = {
                    "meta": {
                        "code": 200,
                        "success": true,
                        "message": "SUCCESS"
                    },
                    "data": {}
                }
                res.status(responseData.meta.code).json(responseData);
            })
        })

    } catch (e) {

    }
}
async function deletecomment(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let entity_id = req.params['entity_id']

        let postData = {
            _id: entity_id
        }
        // let post = new PostModel(postData);
        CommentModel.findOne(postData).then(async result => {
            //console.log(result);
            result.is_deleted = 1
            let comment = new CommentModel(result);
            comment.save().then(async result => {
                let responseData = {
                    "meta": {
                        "code": 200,
                        "success": true,
                        "message": "SUCCESS"
                    },
                    "data": {}
                }
                res.status(responseData.meta.code).json(responseData);
            })
        })

    } catch (e) {

    }
}

async function migrateMock(req, res, next) {
    try {
        //console.log(inProgress)
        if (!inProgress) {
            inProgress = true
            db = req.app.get('db')
            config = req.app.get('config')
            let id = req.params.idfrom
            let sql = "SELECT * FROM mock_test_master_data WHERE test_id = ? ORDER BY paper_code ASC"
            let MockData = await db.mysql.write.query(sql, [id])
            //console.log(MockData)
            let testwisemockdata = _.groupBy(MockData, 'test_id');
            _.map(testwisemockdata, testdata => {
                let sectionwisedata = _.groupBy(testdata, 'section_code')
                _.mapKeys(sectionwisedata, async (sectionData, section_code) => {
                    //console.log(section_code)
                    let sectionsql = "INSERT INTO `testseries_sections`(`section_code`, `test_id`, `subject_code`,`title`,`description`, `type`, `order_pref`, `is_active`) VALUES ('" + section_code + "'," + sectionData[0].test_id + ",'" + section_code + "','" + section_code + "','" + section_code + "','NORMAL',1,1)";
                    //console.log(sectionsql)
                    _.map(sectionData, async questiondata => {
                        let questionData = { question_uuid: questiondata.paper_code, subject_code: questiondata.section_code, chapter_code: questiondata.section_code, subtopic_code: "", class_code: "12", difficulty_type: "MEDIUM", type: questiondata.answer_type, loc_lang: "en", text: questiondata.q_text, text_solution: questiondata.q_solution }
                        //console.log(questiondata.paper_code)
                        let sql = "INSERT INTO `testseries_question_bank` SET ?"
                        let questionInsert = await db.mysql.write.query(sql, [questionData])
                        let questionInsertId = questionInsert['insertId']
                        for (var i = 1; i <= 4; i++) {
                            let optionData = { option_code: "Option_" + i, questionbank_id: questionInsertId, loc_lang: "en" }
                            if (i == 1) {
                                optionData.title = questiondata.op_1
                                optionData.is_answer = questiondata.op_1_correct
                            } else if (i == 2) {
                                optionData.title = questiondata.op_2
                                optionData.is_answer = questiondata.op_2_correct
                            } else if (i == 3) {
                                optionData.title = questiondata.op_3
                                optionData.is_answer = questiondata.op_3_correct
                            } else if (i == 4) {
                                optionData.title = questiondata.op_4
                                optionData.is_answer = questiondata.op_4_correct
                            }
                            //console.log("1.1")
                            let sqlOption = "INSERT INTO `testseries_question_answers` (`option_code`, `questionbank_id`, `title`, `is_answer`, `loc_lang`, `difficulty_type`) VALUES ('" + optionData.option_code + "','" + optionData.questionbank_id + "','" + optionData.title + "'," + optionData.is_answer + ",'en','MEDIUM')";
                            //let sqlOption = "INSERT INTO `testseries_question_answers SET ?"
                            let optionInsert = await db.mysql.write.query(sqlOption)
                        }
                        let sqlTestSeriesQuestion = "INSERT INTO `testseries_questions`(`test_id`, `section_code`, `questionbank_id`, `difficulty_type`, `correct_reward`, `incorrect_reward`, `validity`, `is_active`) VALUES ('" + questiondata.test_id + "','" + questiondata.section_code + "','" + questionInsertId + "','MEDIUM','" + questiondata.correct_marks + "','" + questiondata.incorrect_marks + "',60,1)";
                        let testSeriesQuestionInsert = await db.mysql.write.query(sqlTestSeriesQuestion)
                        //console.log("1.2")


                    })
                    //console.log('2')
                    let sectionInsert = await db.mysql.write.query(sectionsql)
                    //console.log('3')
                })
            })
            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "Done"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);
        } else {
            let responseData = {
                "meta": {
                    "code": 403,
                    "success": true,
                    "message": "Still In Progress Wait La!!!!"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);

        }

    } catch (e) {
        next(e)
    }
}
async function migrateMockSync(req, res, next) {
    try {

        let pass = req.query.god
        if (pass !== 'xesloohc') {
            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "Ok Tata Bye Bye"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);
        } else {
            //console.log(inProgress)
            if (!inProgress) {
                inProgress = true

                db = req.app.get('db')
                config = req.app.get('config')
                let id = req.params.idfrom
                let empty_qid_questions = [];
                let sql = "SELECT * FROM mock_test_master_data WHERE test_id = ? ORDER BY paper_code DESC"
                let MockData = await db.mysql.write.query(sql, [id])

                for (var j = MockData.length - 1; j >= 0; j--) {
                    let questiondata = MockData[j]
                    let alreadyDataSql = "SELECT * FROM testseries_question_bank WHERE question_uuid = ?"
                    let alreadyDataSqlData = await db.mysql.write.query(alreadyDataSql, [questiondata.paper_code])

                    if (alreadyDataSqlData.length == 0) {
                        questiondata.q_text = questiondata.q_text.replace(/\'/gi, "'");
                        questiondata.q_type = null;
                        if (questiondata.qid){
                            let question_id_type_sql = `select count(1) as is_text_solution from questions where question_id = ? and is_answered=0 and is_text_answered =1 limit 1`;
                            let question_id_type_data = await db.mysql.read.query(question_id_type_sql, [+questiondata.qid]);
                            questiondata.q_type = (+question_id_type_data[0].is_text_solution?'TEXT':'VIDEO');
                        }else{
                            empty_qid_questions.push[questiondata.paper_code]
                        }

                        let questionData = { question_uuid: questiondata.paper_code, subject_code: questiondata.section_code, chapter_code: questiondata.section_code, subtopic_code: "", class_code: "12", difficulty_type: "MEDIUM", type: questiondata.answer_type, loc_lang: "en", text: questiondata.q_text, text_solution: questiondata.q_solution,doubtnut_questionid:questiondata.qid,qid_type:questiondata.q_type};

                        let sql = "INSERT INTO `testseries_question_bank` SET ?"
                        let questionInsert = await db.mysql.write.query(sql, questionData)
                        let questionInsertId = questionInsert['insertId']
                        let optionsData = _.split(questiondata.all_options, '#!#')
                        let optionAnswerData = _.split(questiondata.all_answers, ',')
                        //console.log(optionsData)
                        for (var i = 0; i < optionsData.length; i++) {
                            //console.log(i)
                            if (questiondata.answer_type == 'MATRIX') {
                                let no = i + 1
                                let optionData = { option_code: optionsData[i], questionbank_id: questionInsertId, loc_lang: "en", difficulty_type: "MEDIUM" }
                                optionData.title = optionsData[i]
                                optionData.title = optionData.title.replace(/\'/gi, "'");
                                optionData.is_answer = optionAnswerData[i]
                                let sqlOption = "INSERT INTO `testseries_question_answers` SET ?"
                                let optionInsert = await db.mysql.write.query(sqlOption, optionData)
                            } else if (questiondata.answer_type == 'TEXT') {
                                let no = i + 1
                                let optionData = { option_code: "Option_" + no, questionbank_id: questionInsertId, loc_lang: "en", difficulty_type: "MEDIUM" }
                                optionData.title = optionsData[i]
                                optionData.title = optionData.title.replace(/\'/gi, "'");
                                optionData.is_answer = 1
                                optionData.answer = optionAnswerData[i]
                                let sqlOption = "INSERT INTO `testseries_question_answers` SET ?"
                                let optionInsert = await db.mysql.write.query(sqlOption, optionData)
                            } else {
                                let no = i + 1
                                let optionData = { option_code: "Option_" + no, questionbank_id: questionInsertId, loc_lang: "en", difficulty_type: "MEDIUM" }
                                optionData.title = optionsData[i]
                                optionData.title = optionData.title.replace(/\'/gi, "'");
                                optionData.is_answer = optionAnswerData[i]
                                let sqlOption = "INSERT INTO `testseries_question_answers` SET ?"
                                let optionInsert = await db.mysql.write.query(sqlOption, optionData)

                            }
                        }


                        let sqlTestSeriesData = {
                            test_id: questiondata.test_id,
                            section_code: questiondata.section_code,
                            questionbank_id: questionInsertId,
                            difficulty_type: "MEDIUM",
                            correct_reward: questiondata.correct_marks,
                            incorrect_reward: questiondata.incorrect_marks,
                            validity: 60,
                            is_active: 1
                        }
                        let sqlTestSeriesQuestion = "INSERT INTO `testseries_questions` SET ?"
                        let testSeriesQuestionInsert = await db.mysql.write.query(sqlTestSeriesQuestion, sqlTestSeriesData)
                        if (j == 0) {
                            let testwisemockdata = _.groupBy(MockData, 'test_id');
                            _.map(testwisemockdata, testdata => {
                                let sectionwisedata = _.groupBy(testdata, 'section_code')
                                _.mapKeys(sectionwisedata, async (sectionData, section_code) => {
                                    let sectionInsertData = {
                                        section_code: section_code,
                                        test_id: sectionData[0].test_id,
                                        subject_code: section_code,
                                        title: section_code,
                                        description: section_code,
                                        type: "NORMAL",
                                        order_pref: 1,
                                        is_active: 1
                                    }
                                    let sectionsql = "INSERT INTO `testseries_sections` SET ?"
                                    let sectionInsert = await db.mysql.write.query(sectionsql, sectionInsertData)
                                })
                            })
                            inProgress = false
                            let responseData = {
                                "meta": {
                                    "code": 200,
                                    "success": true,
                                    "message": "Done"
                                },
                                "data": {}
                            }
                            res.status(responseData.meta.code).json(responseData);
                        }
                    } else {
                        inProgress = false

                        let responseData = {
                            "meta": {
                                "code": 403,
                                "success": true,
                                "message": "Partial Data Alert !! Roll Back First"
                            },
                            "data": `${empty_qid_questions.length} are without qid  -----
                                      paper_codes are ${_.join(empty_qid_questions,',')}` ,

                        }
                        res.status(responseData.meta.code).json(responseData);
                        break;

                    }

                }

            } else {
                let responseData = {
                    "meta": {
                        "code": 403,
                        "success": true,
                        "message": "Still In Progress Wait La!!!!"
                    },
                    "data": {}
                }
                res.status(responseData.meta.code).json(responseData);

            }
        }

    } catch (e) {
        next(e)
    }
}

async function rollBack(req, res, next) {
    try {
        let pass = req.query.god
        if (pass !== 'xesloohc') {
            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "Ok Tata Bye Bye"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);
        } else {

            db = req.app.get('db')
            config = req.app.get('config')
            let id = req.params.idfrom
            let sql = "SELECT * FROM mock_test_master_data WHERE test_id = ? ORDER BY paper_code ASC"
            let MockData = await db.mysql.write.query(sql, [id])
            for (var i = MockData.length - 1; i >= 0; i--) {
                let questiondata = MockData[i]
                let questionbankDataSql = "SELECT * FROM testseries_question_bank WHERE question_uuid = ?"
                let questionbankData = await db.mysql.write.query(questionbankDataSql, [questiondata.paper_code])

                if (questionbankData.length) {
                    let sql = "DELETE FROM `testseries_question_bank` WHERE question_uuid = ?"
                    let questionDelete = await db.mysql.write.query(sql, [questiondata.paper_code])
                    let optionsDeleteSql = "DELETE FROM testseries_question_answers WHERE questionbank_id = ?"
                    let optionDelete = await db.mysql.write.query(optionsDeleteSql, [questionbankData[0].id])
                    let testSeriesQuestionSql = "DELETE FROM testseries_questions WHERE test_id = ?"
                    let testSeriesQuestion = await db.mysql.write.query(testSeriesQuestionSql, [questiondata.test_id])
                    let testsectionDeleteSql = "DELETE FROM testseries_sections WHERE test_id = ?"
                    let testsectionDelete = await db.mysql.write.query(testsectionDeleteSql, [questiondata.test_id])
                }
            }
            inProgress = false

            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "Done"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);
        }

    } catch (e) {
        next(e)
    }

}
async function banuser(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let student_id = req.params.studentid
        let pass = req.query.god
        if (pass !== 'xesloohc') {
            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "Ok Tata Bye Bye"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);
        } else {
            let criteria = {
                "student_id": student_id.toString()
            }
            //console.log(criteria)
            let deleteugc = await PostModel.updateMany(criteria, { is_deleted: true })
            let deletecomment = await CommentModel.updateMany(criteria, { is_deleted: true })
            let bandata = {
                'student_id': student_id,
                'app_module': 'ALL',
                'ban_type': 'Perma',
                'is_active': '1'
            }
            //console.log(deleteugc)
            //console.log(deletecomment)
            //console.log(bandata)

            let insertBan = "INSERT INTO banned_users SET ?"
            let data = await db.mysql.write.query(insertBan, bandata)

            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "BANNED"
                },
                "data": {}
            }
            res.status(responseData.meta.code).json(responseData);

        }

    } catch (e) {
        next(e)
    }
}
async function unbanuser(req, res, next) {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.params.studentid
    let unban_sql = "Update banned_users SET is_active= 0 WHERE student_id = ?"
    let update = await db.mysql.write.query(unban_sql, [student_id])
    let responseData = {
        "meta": {
            "code": 200,
            "success": true,
            "message": "UnBanned"
        },
        "data": update
    }
    res.status(responseData.meta.code).json(responseData);

}



async function addbadword(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let badword = req.query.badword
        console.log(badword)
        let badwordArray = _.split(badword, ',')
        profanity.addWords(badwordArray)
        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "ADDED"
            },
            "data": {}
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e)
    }
}

async function removebadword(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let badword = req.query.badword
        let badwordArray = _.split(badwordArray, ',')
        profanity.removeWords(badwordArray)
        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "BANNED"
            },
            "data": {}
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e)
    }


}

async function changeQuestionRating(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let question_id = req.params.question_id
        let rating = req.params.rating
        let max_answer_id_sql = "SELECT answer_id FROM `answers` WHERE question_id = ? ORDER BY `answer_id` DESC limit 1"
        let max_answer_id = await db.mysql.write.query(max_answer_id_sql, [question_id])
        let update_text = ""
        console.log(max_answer_id)
        if (rating == '1') {
            let update_query = "UPDATE answers Set answer_rating = '1' where answer_id = " + max_answer_id[0].answer_id
            let updated = await db.mysql.write.query(update_query)
            update_text = " answer id " + max_answer_id[0].answer_id + " Rating updated to 1"
            console.log(update_query)
        } else if (rating == '0') {
            let update_query = "UPDATE answers Set answer_rating = '0' where answer_id = " + max_answer_id[0].answer_id
            let updated = await db.mysql.write.query(update_query)
            update_text = " answer id " + max_answer_id[0].answer_id + " Rating updated to 0"

        } else {

        }
        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "Updated"
            },
            "data": update_text
        }
        res.status(responseData.meta.code).json(responseData);

    } catch (e) {
        next(e)

    } finally {

    }
}



module.exports = { search, deleteugc, deletecomment, migrateMock, rollBack, migrateMockSync, banuser, addbadword, removebadword, changeQuestionRating, sendMail, unbanuser}
