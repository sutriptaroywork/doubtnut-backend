require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const redisClient = require(__dirname + '/../../api_server/config/redis');
const database = require('../../api_server/config/database');



const mysql = new database(config.mysql_analytics);
const writeMysql = new database(config.write_mysql);


function getPackageData() {
    const sql = `SELECT student_id,class,subject  FROM studentid_package_details WHERE package_type in ('books','ncert','coaching') and is_active > 0`;
    // const sql = "select student_id,class,subject from studentid_package_details where package_type like '%BOOKS%' and is_active=1 and class=14 and student_id in (-263,-249,-204,-95,-89,16,22,72,88);"
    // console.log(sql);
    return mysql.query(sql);
}

function getChapterListData(studentId, studentClass, subject) {
    const sql = `SELECT chapter, question_id FROM questions where student_id=${studentId} and class=${studentClass} and subject='${subject}' and (is_answered=1 or is_text_answered=1) GROUP by chapter`;
    // console.log(sql);
    return mysql.query(sql);
}

function updateStudentPackagedetails(studentId, studentClass, subject) {
    const sql = `UPDATE studentid_package_details SET is_active=0 where student_id=${studentId} and class=${studentClass} and subject='${subject}'`;
    console.log(sql);
    return writeMysql.query(sql);
}

function getExerciseListData(studentId, studentClass, subject, chapter) {
    const sql = `SELECT b.id as text_solutions_id, b.type, a.question_id FROM (SELECT * from questions where student_id=${studentId} and class=${studentClass} and subject='${subject}' and chapter LIKE '${chapter}' and (is_answered=1 or is_text_answered=1)) as a inner join text_solutions as b on a.question_id = b.question_id GROUP by b.type order by b.id`;
    // console.log(sql);
    return mysql.query(sql);
}

function getPDFData(studentId, studentClass, subject, chapter) {
    const sql = `SELECT pdf_url from chapter_pdf_details where student_id=${studentId} and class=${studentClass} and subject='${subject}' and chapter LIKE '${chapter}' and is_pdf_ready=1`;
    // console.log(sql);
    return mysql.query(sql);
}

function getQuestionList(studentId, studentClass, subject, chapter, type) {
    const sql = `SELECT a.question_id FROM (SELECT * from questions where student_id=${studentId} and class=${studentClass} and subject='${subject}' and chapter LIKE '${chapter}' and (is_answered=1 or is_text_answered=1)) as a inner join text_solutions as b on a.question_id = b.question_id and b.type='${type}' GROUP by b.question_id order by a.question_id`;
    // console.log(sql);
    return mysql.query(sql);
}

function getChapterQuestionList(studentId, studentClass, subject, chapter) {
    const sql = `SELECT question_id FROM questions where student_id=${studentId} and class=${studentClass} and subject='${subject}' and chapter LIKE '${chapter}' and is_answered=1  order by question_id`;
    // console.log(sql);
    return mysql.query(sql);
}

async function main() {
    const packageData = await getPackageData();
    console.log("package length", packageData.length)
    for (let i = 0; i < packageData.length; i++) {
        console.log("#############", i);
        if (packageData[i].student_id && packageData[i].class && packageData[i].subject) {
            const chapterList = await getChapterListData(packageData[i].student_id, packageData[i].class, packageData[i].subject);
            // console.log("chapterlist", chapterList)
            if (chapterList.length === 0) {
                await updateStudentPackagedetails(packageData[i].student_id, packageData[i].class, packageData[i].subject);
            } else {
                const chapterData = [];
                let chapterLengthFlag = 0;
                for (let j = 0; j < chapterList.length; j++) {
                    if (chapterList[j].chapter) {
                        let count = 0;
                        const list = {};
                        list.id = chapterList[j].question_id;
                        list.name = chapterList[j].chapter;
                        list.view_type = "FLEX";
                        list.description = "";
                        list.image_url = null;
                        list.is_first = 0;
                        list.is_last = 0;
                        list.empty_text = null;
                        list.student_class = packageData[i].class;
                        list.resource_type = "playlist";
                        list.subject = packageData[i].subject;
                        list.flex_list = []

                        chapterList[j].chapter = chapterList[j].chapter.replace(/'/g, "''").replace(/`/g, "").replace(/'/g, "\'");
                        const pdfData = await getPDFData(packageData[i].student_id, packageData[i].class, packageData[i].subject, chapterList[j].chapter);
                        if (pdfData && pdfData.length && pdfData[0].pdf_url) {
                            list.pdf_meta_info = {
                                "pdf_url": `https://d10lpgp6xz60nq.cloudfront.net/${pdfData[0].pdf_url}`,
                            }
                        }
                        const exerciseList = await getExerciseListData(packageData[i].student_id, packageData[i].class, packageData[i].subject, chapterList[j].chapter);
                        // console.log("exerciseList", exerciseList)
                        if (exerciseList.length && exerciseList[0].type && exerciseList[0].type.length) {
                            for (let k = 0; k < exerciseList.length; k++) {
                                if (exerciseList[k].type && exerciseList[k].type.length) {
                                    const flexData = {}
                                    flexData.id = exerciseList[k].question_id;
                                    flexData.name = exerciseList[k].type;
                                    flexData.view_type = "LIST";
                                    flexData.description = "";
                                    flexData.image_url = null;
                                    flexData.is_first = 0;
                                    flexData.is_last = 1;
                                    flexData.empty_text = null;
                                    flexData.student_class = packageData[i].class;
                                    flexData.resource_type = "playlist";
                                    flexData.subject = packageData[i].subject;
                                    flexData.package_details_id = `LIBRARY_NEW_BOOK_${packageData[i].student_id}_${packageData[i].class}_${packageData[i].subject}_${flexData.id}_${exerciseList[k].text_solutions_id}`;

                                    exerciseList[k].type = exerciseList[k].type.replace(/'/g, "''").replace(/`/g, "''").replace(/'/g, "\'");
                                    const questionList = await getQuestionList(packageData[i].student_id, packageData[i].class, packageData[i].subject, chapterList[j].chapter, exerciseList[k].type);
                                    // console.log(questionList);
                                    if (questionList.length) {
                                        const qList = [];
                                        questionList.forEach((x) => {
                                            qList.push(x.question_id);
                                        });
                                        // console.log(qList);
                                        list.flex_list.push(flexData);
                                        count = count + questionList.length;
                                        await redisClient.del(flexData.package_details_id);
                                        redisClient.set(flexData.package_details_id, JSON.stringify(qList), 'EX', 60 * 60 * 24 * 180);
                                        redisClient.del(`${flexData.package_details_id}_EXTRA`);
                                        redisClient.set(extraDataKey, JSON.stringify(extraInfo), 'EX', 60 * 60 * 24 * 180);
                                    }
                                }
                            }
                        } else {
                            const questionChapterList = await getChapterQuestionList(packageData[i].student_id, packageData[i].class, packageData[i].subject, chapterList[j].chapter);
                            // console.log("questionChapterList", questionChapterList)
                            if (questionChapterList.length) {
                                const flexData = {}
                                flexData.id = questionChapterList[0].question_id;
                                flexData.name = "All Questions";
                                flexData.view_type = "LIST";
                                flexData.description = "";
                                flexData.image_url = null;
                                flexData.is_first = 0;
                                flexData.is_last = 1;
                                flexData.empty_text = null;
                                flexData.student_class = packageData[i].class;
                                flexData.resource_type = "playlist";
                                flexData.subject = packageData[i].subject;
                                flexData.package_details_id = `LIBRARY_NEW_BOOK_${packageData[i].student_id}_${packageData[i].class}_${packageData[i].subject}_${flexData.id}_${flexData.id}`;

                                if (questionChapterList.length) {
                                    const qList = [];
                                    questionChapterList.forEach((x) => {
                                        qList.push(x.question_id);
                                    });
                                    // console.log(qList);
                                    list.flex_list.push(flexData);
                                    count = questionChapterList.length;
                                    redisClient.set(flexData.package_details_id, JSON.stringify(qList), 'EX', 60 * 60 * 24 * 180);
                                }
                            } else {
                                chapterLengthFlag = chapterLengthFlag + 1;
                            }
                        }

                        list.description = `#!#${count}`
                        if (list.flex_list.length) {
                            chapterData.push(list)
                        }
                        // console.log(list);
                    }
                }
                if (chapterLengthFlag === chapterList.length) {
                    console.log("chapter exist but there is no solutions is_text_answered and is_answered marked wrong")
                    await updateStudentPackagedetails(packageData[i].student_id, packageData[i].class, packageData[i].subject);
                }
                await redisClient.del(`LIBRARY_NEW_BOOK_${packageData[i].student_id}_${packageData[i].class}_${packageData[i].subject}`);
                redisClient.set(`LIBRARY_NEW_BOOK_${packageData[i].student_id}_${packageData[i].class}_${packageData[i].subject}`, JSON.stringify(chapterData), 'EX', 60 * 60 * 24 * 180);
            }
        }
    }
    process.exit();
}


main();

