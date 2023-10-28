// Created to resolve conflicts of container/questionv2 only
// for caching questions.
const _ = require('lodash');

module.exports = class Utility {
    static async getTimeDiff() {
        const currentTime = new Date().getTime();
        const endTime = new Date().setHours(23, 59, 59, 0);
        return (endTime - currentTime) / 1000;
    }

    static getOffset(page_no, page_length) {
        let offset;
        if (page_no > 1) {
            offset = (page_no - 1) * page_length;
        } else if (page_no == 1) {
            offset = 0;
        }
        return offset;
    }

    static getRedisKey(params) {
        // console.log(params)
        // let redisKey = (typeof params.classes != 'undefined' && params.classes.length > 0) ? params.classes+"_" :  "";
        // redisKey = redisKey + (typeof params.chapters != 'undefined' && params.chapters.length > 0) ? params.chapters+"_" :  "";
        // redisKey = redisKey + (typeof params.subtopics != 'undefined' && params.subtopics.length > 0) ? params.subtopics+"_" :  "";
        // redisKey = redisKey + (typeof params.courses != 'undefined' && params.courses.length > 0) ? params.courses[0]+"_" :  "";
        // redisKey = redisKey + (typeof params.books != 'undefined' && params.books.length > 0) ? params.books+"_" :  "";
        // redisKey = redisKey + (typeof params.exams != 'undefined' && params.exams.length > 0) ? params.exams+"_" :  "";
        // redisKey = redisKey + (typeof params.study != 'undefined' && params.study.length > 0) ? params.study+"_" :  "";
        // redisKey = redisKey + (typeof params.levels != 'undefined' && params.levels.length > 0) ? params.levels+"_" :  "";
        // // redisKey = redisKey + (typeof params.exercise != 'undefined' && params.exercise.length > 0) ? params.exercise+"_" :  "";
        // redisKey = redisKey + (typeof params.page_no != 'undefined' && params.page_no != '') ? params.page_no+"_" :  "";
        // // redisKey = redisKey + (typeof params.year != 'undefined' && params.year.length > 0) ? params.year+"_" :  "";
        //         console.log("key")
        //         console.log(redisKey)
        // redisKey = redisKey.slice(0, -1);
        let redisKey = JSON.stringify(params);
        redisKey = redisKey.split(' ').join('_');
        console.log(`params :::::: ${params}`);
        console.log(`redisKey :::::: ${redisKey}`);
        return redisKey;
    }

    static queryMakerLocalised(locale_val, params) {
        const { classes } = params;
        const { chapters } = params;
        const { subtopics } = params;
        const { courses } = params;
        // const { books } = params;
        const { exams } = params;
        const { study } = params;
        // const { levels } = params;
        const { exercise } = params;
        const page_no = parseInt(params.page_no);
        const page_length = parseInt(params.page_length);
        let offset;
        const { year } = params;
        if (page_no > 1) offset = (page_no - 1) * page_length;
        else if (page_no == 1) offset = 0;

        let sql = '';
        let countQuery = '';
        let contentSql = 'SELECT heading, content FROM listing_page_content WHERE';

        sql += 'select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class,';

        if (study.length > 0) {
            if (study[0] == 'CENGAGE') {
                if (chapters.length > 0) {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_hi='${chapters[0]}'`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_clean='${chapters[0]}'`;
                    }
                    contentSql += ` topic = 'CEN' AND chapter = '${chapters[0]}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += ' questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    } else {
                        sql += ' questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    }
                    contentSql += " topic = 'CEN' AND chapter IS NULL";
                }
            } else if (study[0] == 'RD SHARMA') {
                if (classes.length > 0) {
                    if (chapters.length > 0) {
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_hi='${chapters[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_clean='${chapters[0]}'`;
                        }
                        contentSql += ` topic = 'RDS' AND class = ${classes[0]} AND chapter = '${chapters[0]}'`;
                    } else {
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}'`;
                        }
                        contentSql += ` topic = 'RDS' AND class = ${classes[0]} AND chapter IS NULL`;
                    }
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%'";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%'";
                    }
                    contentSql += " topic = 'RDS' AND class IS NULL AND chapter IS NULL";
                }
            }
            sql += " AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        } else if (exams.length > 0) {
            if (exams[0] == 'Jee Mains') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'JM' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        // sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_18%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'JM' AND year IS NULL";
                }
            } else if (exams[0] == 'Jee Advanced') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'JA' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'JA' AND year IS NULL";
                }
            } else if (exams[0] == 'X Boards') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND doubt LIKE 'X_BD${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND doubt LIKE 'X_BD${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'xboards' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'xboards' AND year IS NULL";
                }
            } else if (exams[0] == 'XII Boards') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND doubt LIKE 'XII${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND doubt LIKE 'XII${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'xiiboards' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'xiiboards' AND year IS NULL";
                }
            }
        } else if (courses.length > 0) {
            if (courses[0] == 'NCERT') {
                if (classes.length > 0) {
                    if (chapters.length > 0) {
                        if (exercise != undefined && !_.isNull(exercise) && exercise != '') {
                            if (locale_val == 'hindi') {
                                sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_hi='${chapters[0]}' AND questions_web.doubt LIKE '%${exercise}%'`;
                            } else {
                                sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_clean='${chapters[0]}' AND questions_web.doubt LIKE '%${exercise}%'`;
                            }
                            contentSql += ` topic = 'ncert' AND class = '${classes[0]}' AND chapter='${chapters[0]}' AND exercise = '${exercise}'`;
                        } else {
                            if (locale_val == 'hindi') {
                                sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_hi='${chapters[0]}'`;
                            } else {
                                sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_clean='${chapters[0]}'`;
                            }
                            contentSql += ` topic = 'ncert' AND class = '${classes[0]}' AND chapter='${chapters[0]}' AND exercise IS NULL`;
                        }
                    } else {
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}'`;
                        }
                        contentSql += ` topic = 'ncert' AND class = '${classes[0]}' AND chapter IS NULL AND exercise IS NULL`;
                    }
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%'";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%'";
                    }
                    contentSql += " topic = 'ncert' AND class IS NULL AND chapter IS NULL AND exercise IS NULL";
                }
            } else if (courses[0] == 'IIT') {
                if (chapters.length > 0) {
                    if (subtopics.length > 0) {
                        // if(locale_val == 'hindi') {
                        //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter_hi='"+chapters[0]+"' AND questions_web.subtopic='"+subtopics[0]+"'"
                        // } else {
                        //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter='"+chapters[0]+"' AND questions_web.subtopic='"+subtopics[0]+"'"
                        // }
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_hi='${chapters[0]}' AND questions_web.subtopic='${subtopics[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_clean='${chapters[0]}' AND questions_web.subtopic_clean='${subtopics[0]}'`;
                        }
                        contentSql += ` topic = 'iit' AND chapter = '${chapters[0]}' AND subtopic = '${subtopics[0]}'`;
                    } else {
                        // if(locale_val == 'hindi') {
                        //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter_hi='"+chapters[0]+"'"
                        // } else {
                        //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter='"+chapters[0]+"'"
                        // }
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_hi='${chapters[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_clean='${chapters[0]}'`;
                        }
                        contentSql += ` topic = 'iit' AND chapter = '${chapters[0]}' AND subtopic IS NULL`;
                    }
                } else {
                    // if(locale_val == 'hindi') {
                    //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>''"
                    // } else {
                    //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>''"
                    // }
                    if (locale_val == 'hindi') {
                        sql += ' questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    } else {
                        sql += ' questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    }
                    contentSql += " topic = 'iit' AND chapter IS NULL AND subtopic IS NULL";
                }
            }
            sql += " AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        }

        countQuery += `SELECT count(d.question_id) as total_records FROM ( ${sql} ) as d`;

        if (
            !_.isNull(page_no)
            && page_no != ''
            && !_.isNull(page_length)
            && page_length != ''
        ) {
            sql += ` LIMIT ${offset},${page_length}`;
        }

        return { sql, countQuery, contentSql };
    }

    static queryMaker(params) {
        const { classes } = params;
        const { chapters } = params;
        const { subtopics } = params;
        const { courses } = params;
        const { books } = params;
        const { exams } = params;
        const { study } = params;
        const { levels } = params;
        const { exercise } = params;
        const page_no = parseInt(params.page_no);
        const page_length = parseInt(params.page_length);
        let offset;
        const { year } = params;
        if (page_no > 1) offset = (page_no - 1) * page_length;
        else if (page_no == 1) offset = 0;

        let sql = '';
        let countQuery = '';
        if (study.length > 0 && study[0] == 'CENGAGE') {
            if (chapters.length > 0) {
                sql
                    += `Select subtopic_cen.chapter, questions.question_id,questions.class as q_class, questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped from (Select * from questions where student_id = 5 and is_answered = 1) as questions left join questions_meta on questions.question_id = questions_meta.question_id left join subtopic_cen on questions.doubt=subtopic_cen.code where subtopic_cen.chapter = '${chapters[0]}'`;
            } else {
                sql
                    += 'Select subtopic_cen.chapter, questions.question_id,questions.class as q_class, questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped from (Select * from questions where student_id = 5 and is_answered = 1) as questions left join questions_meta on questions.question_id = questions_meta.question_id left join subtopic_cen on questions.doubt=subtopic_cen.code';
            }
            countQuery
                += `SELECT count(d.question_id) as total_records FROM ( ${sql} ) as d`;
        } else {
            sql
                += `SELECT * FROM (SELECT questions.question_id,questions.class as q_class,${(courses.length > 0 && courses[0] == 'IIT')
                    || (exams.length > 0 && exams[0] == 'Jee Mains')
                    || (exams.length > 0 && exams[0] == 'Jee Advanced')
                    || (study.length > 0 && study[0] == 'CENGAGE')
                    ? ' questions_meta.chapter, '
                    : ' questions.chapter, '} questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped  FROM questions left join questions_meta on questions_meta.question_id=questions.question_id `;
            if (classes.length > 0) {
                sql += ' WHERE ';
                for (let i = 0; i < classes.length; i++) {
                    if (i != classes.length - 1) { sql += `questions.class=${classes[i]} || `; } else if (i == classes.length - 1) { sql += `questions.class=${classes[i]}`; }
                }
                if (
                    chapters.length > 0
                    || subtopics.length > 0
                    || courses.length > 0
                    || books.length > 0
                    || exams.length > 0
                    || levels.length > 0
                ) {
                    sql += ' && ';
                }
            }

            if (chapters.length > 0) {
                if (classes.length == 0) sql += ' WHERE ';
                for (let i = 0; i < chapters.length; i++) {
                    if (i != chapters.length - 1) {
                        if (
                            (courses.length > 0 && courses[0] == 'IIT')
                            || (study.length > 0 && study[0] == 'CENGAGE')
                        ) { sql += `questions_meta.chapter='${chapters[i]}' || `; } else if (study.length > 0 && study[0] == 'RD SHARMA') { sql += `questions.doubt LIKE'${chapters[i]}%'`; } else sql += `questions.chapter='${chapters[i]}' || `;
                    } else if (i == chapters.length - 1) {
                        if (
                            (courses.length > 0 && courses[0] == 'IIT')
                            || (study.length > 0 && study[0] == 'CENGAGE')
                        ) { sql += `questions_meta.chapter='${chapters[i]}'`; } else if (study.length > 0 && study[0] == 'RD SHARMA') {
                            // sql += "questions.doubt LIKE '" + chapters[i] + "%'";
                            sql += `questions.chapter LIKE '${chapters[i]}%'`;
                        } else sql += `questions.chapter='${chapters[i]}'`;
                    }
                }
                if (
                    subtopics.length > 0
                    || courses.length > 0
                    || books.length > 0
                    || exams.length > 0
                    || levels.length > 0
                ) {
                    sql += ' && ';
                }
            }

            if (subtopics.length > 0) {
                if (classes.length == 0 && chapters.length == 0) sql += ' WHERE ';
                for (let i = 0; i < subtopics.length; i++) {
                    if (i != subtopics.length - 1) { sql += `questions_meta.subtopic='${subtopics[i]}' || `; } else if (i == subtopics.length - 1) { sql += `questions_meta.subtopic='${subtopics[i]}'`; }
                }
                if (
                    courses.length > 0
                    || books.length > 0
                    || exams.length > 0
                    || levels.length > 0
                ) {
                    sql += ' && ';
                }
            }

            if (courses.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                ) { sql += ' WHERE '; }
                for (let i = 0; i < courses.length; i++) {
                    const value = courses[i];
                    if (value == 'IIT') {
                        sql
                            += " questions_meta.class in ('11','12') && target_course <> 'BOARDS' && is_answered=1 ";
                    } else if (value == 'NCERT') {
                        sql += ' questions.student_id=1 && is_answered=1 ';
                    }
                }
                if (books.length > 0 || exams.length > 0 || levels.length > 0) {
                    sql += ' && ';
                }
            }

            if (books.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                ) { sql += ' WHERE '; }
                for (let i = 0; i < books.length; i++) {
                    if (i != books.length - 1) { sql += `questions_meta.package='${books[i]}' || `; } else if (i == books.length - 1) { sql += `questions_meta.package='${books[i]}'`; }
                }
            }

            // if (exams.length > 0) {
            //   if (classes.length == 0 && chapters.length == 0 && subtopics.length == 0 && courses.length == 0 && books.length == 0)
            //     sql += " WHERE ";
            //   for (let i = 0; i < exams.length; i++) {

            //     if (i != exams.length - 1)
            //       sql += "questions_meta.package='" + exams[i] + "' || ";
            //     else if (i == exams.length - 1)
            //       sql += "questions_meta.package='" + exams[i]+"'";

            //   }
            //   if (levels.length > 0) {
            //     sql += " && ";
            //   }
            // }

            if (levels.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                    && books.length == 0
                    && exams.length == 0
                ) { sql += ' WHERE '; }
                for (let i = 0; i < levels.length; i++) {
                    if (i != levels.length - 1) { sql += `questions_meta.level='${levels[i]}' || `; } else if (i == levels.length - 1) { sql += `questions_meta.level='${levels[i]}'`; }
                }
            }

            if (exams.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                    && books.length == 0
                    && levels.length == 0
                ) { sql += ' WHERE '; }

                if (exams == 'Jee Mains') { sql += "  questions.student_id='3' && is_answered='1' "; }
                if (exams == 'Jee Advanced') { sql += "  questions.student_id='8' && is_answered='1' "; }
                if (exams == 'X Boards') { sql += "  questions.student_id='9' && is_answered='1' "; }
                if (exams == 'XII Boards') { sql += "  questions.student_id='2' && is_answered='1' "; }
            }

            if (study.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                    && books.length == 0
                    && levels.length == 0
                    && exams.length == 0
                ) { sql += ' WHERE '; }
                if (classes.length == 0 && chapters.length == 0) {
                    if (study == 'RD SHARMA') { sql += " questions.student_id='4' && is_answered='1' "; }
                    if (study == 'CENGAGE') { sql += " questions.student_id='5' && is_answered='1' "; }
                    if (study == 'NARAYNA') { sql += " questions.student_id='11' && is_answered='1' "; }
                    if (study == 'BANSAL') { sql += " questions.student_id='14' && is_answered='1' "; }
                    if (study == 'RESONANCE') { sql += " questions.student_id='15' && is_answered='1' "; }
                } else if (classes.length != 0 || chapters.length != 0) {
                    if (study == 'RD SHARMA') { sql += " && questions.student_id='4' && is_answered='1' "; }
                    if (study == 'CENGAGE') { sql += " && questions.student_id='5' && is_answered='1' "; }
                    if (study == 'NARAYNA') { sql += " && questions.student_id='11' && is_answered='1' "; }
                    if (study == 'BANSAL') { sql += " && questions.student_id='14' && is_answered='1' "; }
                    if (study == 'RESONANCE') { sql += " && questions.student_id='15' && is_answered='1' "; }
                }
            }

            if (exercise != undefined && !_.isNull(exercise) && exercise != '') {
                sql += ` && questions.doubt LIKE '%${exercise}%'`;
            }

            if (year != undefined && !_.isNull(year) && year != '') {
                if (exams == 'Jee Advanced') { sql += ` && questions.doubt LIKE 'JA${year}%'`; }
                if (exams == 'Jee Mains') { sql += ` && questions.doubt LIKE 'JM_${year}%'`; }
                if (exams == 'X Boards') { sql += ` && questions.doubt LIKE 'X_BD${year}%'`; }
                if (exams == 'XII Boards') { sql += ` && questions.doubt LIKE 'XII${year}%'`; }
            }

            //  REMOVED by ADITYA SIR (10/jan/19)
            // if (!(study.length != 0 && study[0] == "RD SHARMA"))
            //   sql += " && questions_meta.is_skipped=0 ";

            // sql+=" order by questions.doubt DESC ";
            sql
                += ') as a left join (select GROUP_CONCAT(packages) as packages,question_id as qid_from_question_package_mapping from question_package_mapping group by question_id) as e on a.question_id = e.qid_from_question_package_mapping ';
            sql += ' order by a.doubt ASC ';
            countQuery
                += `SELECT count(b.question_id) as total_records FROM ( ${sql} ) as b`;
        }

        if (
            !_.isNull(page_no)
            && page_no != ''
            && !_.isNull(page_length)
            && page_length != ''
        ) {
            sql += ` LIMIT ${offset},${page_length}`;
        }

        console.log(sql);

        return { sql, countQuery };
    }
};
