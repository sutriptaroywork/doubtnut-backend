/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const util = require('util');
const url = require('url-exists');
const moment = require('moment');
const Question = require('../../../modules/question');
// const Student = require('../../../modules/student');
const constant = require('../../../data/data');
const Bounty = require('../../../modules/mysql/bounty');
const BountyPostDetail = require('../../../modules/bounytPostDetail');
const BountyAnswerDetail = require('../../../modules/bountyAnswerDetail');
const BookMarkingDetail = require('../../../modules/bountyBookMarkingDetail');
const Chapter = require('../../../modules/mysql/chapter');
const BountyVoteCheck = require('../../../modules/bountyAnswerQualityCheck');
const redis = require('../../../modules/redis/utility.redis');
const getRedisValues = require('../../../modules/redis/bounty');
const bountyConstants = require('../../../data/bounty');
const Spam = require('../../../modules/bountyReportSpam');
const bountyfeedback = require('../../../modules/bountyFeedback');
const BountyNotification = require('./bountyNotificationController');
const MailUtility = require('../../../modules/Utility.mail');
const Exams = require('../../../modules/classCourseMapping');
const BountyDisbursement = require('../../../modules/bounty_disbursement');
const bountyFIlter = require('./filter');
const commentCount = require('../../../modules/commentCount');
const classListing = require('../../../modules/mysql/class');
const Utility = require('../../../modules/utility');
const StudentContainer = require('../../../modules/containers/student');

const urlExists = util.promisify(url);

function getTimeLeft(postedTime, curr_time) {
    console.log('posted time', postedTime);
    const timeLeft = moment(postedTime).diff(curr_time);
    return timeLeft;
}

function checkForAcceptedAnswer(bountyDetails) {
    if (bountyDetails[0].is_accepted == 1) {
        return true;
    }
    return false;
}

function checkNumOfDays(created_at, curr_time) {
    curr_time = moment(curr_time, 'YYYY-MM-DD');
    created_at = moment(created_at, 'YYYY-MM-DD');
    const days = moment.duration(curr_time.diff(created_at)).asDays();
    return parseInt(days);
}

async function getImgUrl(db, img) {
    const ifExisits = await urlExists(img);
    if (!_.isNull(img) && ifExisits) {
        await redis.lpush(db, 'images', img);
        await redis.ltrim(db, 'images', 0, 10);
        const images = await redis.lrange(db, 'images', 0, 2);
        return images;
    }
    const images = await redis.lrange(db, 'images', 0, 2);
    return images;
}

async function getCommentCounts(entity_type, bounty_ids) {
    const commentCounter = [];
    for (let i = 0; i < bounty_ids.length; i++) {
        const commentCounts = await commentCount.getCommentCount(entity_type, [bounty_ids[i].toString()]);
        if (commentCounts.length == 0) {
            commentCounter.push(0);
        } else {
            commentCounter.push(parseInt(commentCounts[0].count));
        }
    }
    return commentCounter;
}

function getAnswersCount(totalAnswers, bounty) {
    const answerCount = [];
    const obj = {};
    if (totalAnswers.length == 0) {
        for (let i = 0; i < bounty.length; i++) {
            answerCount.push(0);
        }
    } else {
        for (let i = 0; i < totalAnswers.length; i++) {
            obj[totalAnswers[i].bounty_id] = totalAnswers[i].answer_count;
        }
        for (let i = 0; i < bounty.length; i++) {
            if (bounty[i] in obj) {
                answerCount.push(obj[bounty[i]]);
            } else {
                answerCount.push(0);
            }
        }
    }
    return answerCount;
}

function getBountyString(bounty_ids, bountyId) {
    if (bounty_ids.length == 0) {
        bountyId = ' (  "   "  ) ';
    } else {
        bountyId = ` ( ${bountyId} ) `;
    }
    return bountyId;
}

function faqPopUp(_req, _res, next) {
    try {
        const faqData = bountyConstants.data;
        const checkDetail = {
            checkoutMakingVideo: 'Solution Video Kaise Banaye',
            soln_video: bountyConstants.bounty_soln_vid,
            button1_text: 'Play',
        };
        faqData.checkDetail = checkDetail;
        next({
            data: faqData,
        });
    } catch (err) {
        next({ err });
    }
}

async function bountyPostPage(req, _res, next) {
    try {
        const db = req.app.get('db');
        const { student_id, question_id } = req.body;
        const { is_reupload } = req.body;
        let prefill_chapter;
        let prefill_exam;
        let prefill_subject;
        let bounty_ques_img;
        if (is_reupload) {
            const getBountyDetails = await BountyPostDetail.getBountyQuestionDetailByQid(db.mysql.read, question_id);
            prefill_exam = getBountyDetails[0].exam;
            prefill_subject = getBountyDetails[0].question_subject;
            prefill_chapter = getBountyDetails[0].chapter;
            bounty_ques_img = getBountyDetails[0].bounty_ques_img;
        }
        const examList = await Exams.getExams(db.mysql.read);
        const exams = examList.map((obj) => obj.course);
        // const student_info = await Student.getStudent(student_id, db.mysql.read);
        const student_info = await StudentContainer.getById(student_id, db);
        const { student_class } = student_info[0];
        const { img_url } = student_info[0];
        const images = await getImgUrl(db.redis.write, img_url);
        const getsubjects = await Chapter.getSubjects(db.mysql.read);
        const subjects = getsubjects.map((obj) => obj.subject);
        _.remove(subjects, (sub) => sub === 'Mathematics');
        subjects.push('Others');
        const questionData = await Question.getByNewQuestionId(question_id, db.mysql.read);
        const questionUrl = constant.questionAskUrlPrefix + questionData[0].question_image;
        const fileToUpdate = {
            student_id,
            bounty_ques_img: questionUrl,
            question_id,
            student_class,
            is_answered: 0,
            is_active: 0,
        };
        const id = await Bounty.insertBounty(db.mysql.write, fileToUpdate);

        const data = {
            images,
            bounty_id: id.insertId,
            exams,
            userimages_text: 'Vikash, Neha, aditi and 100+ Helpers available',
            title: 'Help and Earn',
            faq: 'FAQs',
            prize_text_heading: 'Put a Prize Money',
            prize_text_desc: 'ye paisa jo aapka doubt solve karega usko jayega, agar aap uska solution accept karte hain',
            min_prize: 0,
            max_amount: 50,
            tag: 'Popular Subjects',
            highlightText: 'Choose a Subject',
            tag1: 'Pick a Chapter',
            tag2: 'Do you like Padhao Aur Kamao?',
            tag3: 'Give Feedback',
            tag4: 'Choose an Exam',
            subjects,
            prefill_subject,
            prefill_exam,
            prefill_chapter,
            bounty_ques_img,
        };
        next({ data });
    } catch (err) {
        console.log(err);
        next({ err });
    }
}
async function getChapters(req, _res, next) {
    try {
        const db = req.app.get('db');
        const { subject } = req.body;
        let chapter;
        let chapters = [];

        if (subject == 'Maths') {
            chapter = await Chapter.getChapterbySubjectForMaths(db.mysql.read, subject);
            chapters = chapter.map((chap) => chap.chapter);
        } else {
            chapter = await Chapter.getChapterbySubject(db.mysql.read, subject);
            chapters = chapter.map((chap) => chap.chapter);
        }
        chapters.unshift('Others');

        next({ data: chapters });
    } catch (err) {
        next({ err });
    }
}

async function postQuestionPopup(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const {
            question_id, bounty_id, subject, chapter, bounty_amount, exam, is_reupload,
        } = req.body;

        if (is_reupload) {
            const getBountyDetails = await BountyPostDetail.getBountyQuestionsByQidForReupload(db.mysql.read, question_id);
            for (let i = 0; i < getBountyDetails.length; i++) {
                if (getBountyDetails[i].is_active == 1 && getBountyDetails[i].is_delete == 0) {
                    const bountyToreupload = {
                        bounty_id: getBountyDetails[i].bounty_id,
                        is_delete: 1,
                    };
                    await BountyPostDetail.reuploadOldBounty(db.mysql.write, bountyToreupload);
                }
            }
        }

        const obj = {
            student_id,
            bounty_id,
            question_subject: subject,
            chapter,
            exam,
            bounty_amount,
        };
        const data = {
            popUpdata: 'Question submitted successfully.\nPlease wait while your friends will solve your doubt.\n Also, help others by solving their doubts :)',
            button_text: 'OK',
            bounty_id,
            bounty_amount,
        };
        if (bounty_amount > 0) {
            data.transaction = 1;
        } else {
            data.transaction = 0;
            obj.is_active = 1;
        }

        await BountyPostDetail.updateBountyPost(db.mysql.write, obj);

        next({ data });
    } catch (err) {
        next({ err });
    }
}

async function allBountyListingPage(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const { last_id } = req.body;
        const { sort_order } = req.body;
        const { filter } = req.body;
        const filterConfig = bountyFIlter.getQueryForAll(filter, sort_order);
        const filters = filterConfig.query;
        const { order } = filterConfig;
        const noData = {};

        const subChap = await BountyPostDetail.getChapterFromBountyPost(db.mysql.read);

        const grouped = _.groupBy(subChap, (item) => item.question_subject);

        const subChapMap = bountyFIlter.getFiltersToshow(grouped);

        const exams = await Exams.getExams(db.mysql.read);
        const finalExamList = exams.map((obj) => obj.course);

        const pageSize = bountyConstants.limit;
        const bookMarkIds = [];
        let getQuestions;
        let last_id1;

        if (last_id != 0) {
            if (filterConfig.solved_solutions.length && !filterConfig.noSolution.length) {
                getQuestions = await BountyPostDetail.getBountyQuestionsWithSolutionsNext(db.mysql.read, pageSize, last_id, order, filters);
            } else if (filterConfig.noSolution.length && !filterConfig.solved_solutions.length) {
                getQuestions = await BountyPostDetail.getQuestionsWithNoSolutionNext(db.mysql.read, pageSize, last_id, order, filters);
            } else {
                getQuestions = await BountyPostDetail.getBountyQuestionsWithoutClassNext(db.mysql.read, pageSize, last_id, order, filters);
            }
        } else if (filterConfig.solved_solutions.length && !filterConfig.noSolution.length) {
            getQuestions = await BountyPostDetail.getBountyQuestionsWithSolutions(db.mysql.read, pageSize, order, filters);
        } else if (filterConfig.noSolution.length && !filterConfig.solved_solutions.length) {
            getQuestions = await BountyPostDetail.getQuestionsWithNoSolution(db.mysql.read, pageSize, order, filters);
        } else {
            getQuestions = await BountyPostDetail.getBountyQuestionsWithoutClass(db.mysql.read, pageSize, order, filters);
        }

        const bounty_ids = getQuestions.map((obj) => obj.bounty_id);
        let bountyId = Utility.getPreservedQuoteString(bounty_ids);
        bountyId = getBountyString(bounty_ids, bountyId);
        const totalAnswers = await BountyAnswerDetail.getTotalAnswers(db.mysql.read, bountyId);
        const countOfAnswers = getAnswersCount(totalAnswers, bounty_ids);
        const commentCounter = await getCommentCounts(bountyConstants.bounty_question_entity_type, bounty_ids);
        if (bounty_ids.length) {
            const checkBookMark = await BookMarkingDetail.checkForBookMark(db.mysql.read, student_id, bounty_ids);
            for (let i = 0; i < checkBookMark.length; i++) {
                if (checkBookMark[i].is_bookmark == 1) {
                    bookMarkIds.push(checkBookMark[i].bounty_id);
                }
            }
        }

        const classes = await classListing.getClassList(db.mysql.read);
        const classList = classes.map((obj) => obj.english);

        let finalQuestionsList = getQuestions.map((obj, i) => {
            const date = obj.created_at;
            const date1 = moment(date).from(obj.curr_time, true);
            const timeLeft = getTimeLeft(obj.expired_at, obj.curr_time);
            if (timeLeft < 0) {
                obj.timeLeft = 0;
            } else {
                obj.timeLeft = timeLeft;
            }
            if (bookMarkIds.includes(obj.bounty_id)) {
                obj.is_bookmark = 1;
            } else {
                obj.is_bookmark = 0;
            }
            obj.created_at = `${date1} ago`;
            if (!_.isEmpty(obj.question_subject)) {
                obj.description = `#${obj.question_subject} #${obj.chapter}`;
            }
            obj.student_name = obj.student_name || obj.student_username;
            obj.viewSolution = `View Solutions(${countOfAnswers[i]})`;
            obj.submitButtonText = 'Submit Solution';
            obj.share_message = 'Kariye is question ko solve aur jitiye prize money';
            obj.comment_count = commentCounter[i];
            obj.answer_count = countOfAnswers[i];
            return obj;
        });

        if (_.isEmpty(finalQuestionsList) && !_.isEmpty(filter) && last_id == 0) {
            noData.type = 'nodata';
            noData.title = 'No results found';
            finalQuestionsList.unshift(noData);
        }

        if (_.isEmpty(finalQuestionsList)) {
            finalQuestionsList = [];
            last_id1 = 'null';
        } else if (finalQuestionsList.length != 10) {
            last_id1 = 'null';
        } else if ((finalQuestionsList[finalQuestionsList.length - 1].bounty_id)) {
            last_id1 = (finalQuestionsList[finalQuestionsList.length - 1].bounty_id);
        }

        const filtersToshow = [{
            display: 'Exam', parent_key: 'exam', key: 'exam', value: finalExamList,
        },

        {
            display: 'Prize Money', parent_key: 'prizeMoney', key: 'prizeMoney', value: ['Yes', 'No'],
        },

        {
            display: 'Status', parent_key: 'status', key: 'status', value: ['Running', 'Solved Doubts', 'No Solution', 'Accepted'],
        },
        {
            display: 'Class', parent_key: 'class', key: 'class', value: classList,
        },
        ];

        for (let i = 0; i < subChapMap.length; i++) {
            filtersToshow.push(subChapMap[i]);
        }

        const data = {
            tab: 'All',
            last_id: last_id1,
            list: finalQuestionsList,
            history_text: 'Check Payment History',
            button2_text: 'I Want To Solve',
            button3_text: 'View Solutions',
            button4_text: 'Solution Video Kaise Banaye',
            soln_video: bountyConstants.bounty_soln_vid,
            button5_text: 'Play',
            button6_text: 'Sort by',
            button7_text: 'Filter',
            sort_order: [{ display: 'Highest Prize', value: 'bounty_amount', sort: 'desc' }, { display: 'Newest First', value: 'bounty_id', sort: 'desc' }, { display: 'Oldest First', value: 'bounty_id', sort: 'asc' }],
            filter: [...filtersToshow],
        };

        next({
            data,
        });
    } catch (err) {
        next({ err });
    }
}

async function myQuestionsBountyList(req, res, next) {
    try {
        const { student_id } = req.user;
        const db = req.app.get('db');
        const { last_id } = req.body;
        const { sort_order } = req.body;
        const { filter } = req.body;
        const filterConfig = bountyFIlter.getQueryForAll(filter, sort_order);
        const filters = filterConfig.query;
        const pageSize = bountyConstants.limit;
        // const studentInfo = await Student.getStudent(student_id, db.mysql.read);
        const studentInfo = await StudentContainer.getById(student_id, db);
        const student_name = [studentInfo[0].student_fname, studentInfo[0].student_lname].join(' ').trim();
        const { student_username } = studentInfo[0];
        let myQuestions;
        const { order } = filterConfig;
        const noData = {};

        const subChap = await BountyPostDetail.getChapterFromBountyPost(db.mysql.read);

        const grouped = _.groupBy(subChap, (item) => item.question_subject);
        const subChapMap = bountyFIlter.getFiltersToshow(grouped);
        const exams = await Exams.getExams(db.mysql.read);
        const finalExamList = exams.map((obj) => obj.course);

        if (last_id != 0) {
            if (filterConfig.solved_solutions.length && !filterConfig.noSolution.length) {
                myQuestions = await BountyPostDetail.getMyQuestionNextWithSolvedSolutionNext(db.mysql.read, student_id, pageSize, last_id, order, filters);
            } else if (filterConfig.noSolution.length && filterConfig.solved_solutions.length) {
                myQuestions = await BountyPostDetail.getMyQuestionNextWithNoSolutionNext(db.mysql.read, student_id, pageSize, last_id, order, filters);
            } else {
                myQuestions = await BountyPostDetail.getMyQuestionNext(db.mysql.read, student_id, pageSize, last_id, order, filters);
            }
        } else if (filterConfig.solved_solutions.length && !filterConfig.noSolution.length) {
            myQuestions = await BountyPostDetail.getMyQuestionNextWithSolvedSolution(db.mysql.read, student_id, pageSize, order, filters);
        } else if (filterConfig.noSolution.length && !filterConfig.solved_solutions.length) {
            myQuestions = await BountyPostDetail.getMyQuestionNextWithNoSolution(db.mysql.read, student_id, pageSize, order, filters);
        } else {
            myQuestions = await BountyPostDetail.getMyQuestion(db.mysql.read, student_id, pageSize, order, filters);
        }

        const bounty_ids = myQuestions.map((obj) => obj.bounty_id);
        let bountyId = Utility.getPreservedQuoteString(bounty_ids);
        bountyId = getBountyString(bounty_ids, bountyId);
        const totalAnswers = await BountyAnswerDetail.getTotalAnswers(db.mysql.read, bountyId);
        const commentCounter = await getCommentCounts(bountyConstants.bounty_question_entity_type, bounty_ids);
        const countOfAnswers = getAnswersCount(totalAnswers, bounty_ids);

        let finalQuestions = myQuestions.map((obj, i) => {
            obj.student_name = student_name || student_username;
            obj.img_url = studentInfo[0].img_url;
            const date = obj.created_at;
            const date1 = moment(date).from(obj.curr_time, true);
            const timeLeft = getTimeLeft(obj.expired_at, obj.curr_time);
            if (timeLeft < 0) {
                obj.timeLeft = 0;
            } else {
                obj.timeLeft = timeLeft;
            }
            if (!_.isEmpty(obj.question_subject)) {
                obj.description = `#${obj.question_subject} #${obj.chapter}`;
            }
            obj.created_at = `${date1} ago`;
            obj.viewSolution = `View Solutions(${countOfAnswers[i]})`;
            obj.share_message = 'Kariye is question ko solve aur jitiye prize money';
            obj.reupload_title = 'Solutions nahi mil rahe?';
            obj.reupload_subtitle = 'Add a prize Money';
            if (obj.bounty_amount == 0 && countOfAnswers[i] == 0) {
                obj.reupload = true;
            } else {
                obj.reupload = false;
            }
            obj.comment_count = commentCounter[i];
            obj.answer_count = countOfAnswers[i];
            return obj;
        });

        if (_.isEmpty(myQuestions) && last_id == 0) {
            noData.type = 'nodata';
            noData.title = 'No results found';
            finalQuestions.unshift(noData);
        }

        let last_id1;
        if (_.isEmpty(finalQuestions) && last_id != 0) {
            finalQuestions = [];
            last_id1 = 'null';
        } else if (finalQuestions.length != 10) {
            last_id1 = 'null';
        } else if ((finalQuestions[finalQuestions.length - 1].bounty_id)) {
            last_id1 = (finalQuestions[finalQuestions.length - 1].bounty_id);
        }

        const filtersToshow = [{
            display: 'Exam', parent_key: 'exam', key: 'exam', value: finalExamList,
        },

        {
            display: 'Prize Money', parent_key: 'prizeMoney', key: 'prizeMoney', value: ['Yes', 'No'],
        },

        {
            display: 'Status', parent_key: 'status', key: 'status', value: ['Running', 'Solved Doubts', 'No Solution', 'Not Accepted'],
        },
        ];

        for (let i = 0; i < subChapMap.length; i++) {
            filtersToshow.push(subChapMap[i]);
        }

        next({
            data: {
                tab: 'My Question',
                tag: 'question',
                last_id: last_id1,
                list: finalQuestions,
                history_text: 'Check Payment History',
                button1_text: 'Solution Video Kaise Banaye',
                soln_video: bountyConstants.bounty_soln_vid,
                button2_text: 'View Solutions',
                button3_text: 'Play',
                button4_text: 'Sort by',
                button5_text: 'Filter',
                sort_order: [{ display: 'Highest Prize', value: 'bounty_amount', sort: 'desc' }, { display: 'Newest First', value: 'bounty_id', sort: 'desc' }, { display: 'Oldest First', value: 'bounty_id', sort: 'asc' }],
                filter: [...filtersToshow],
            },
        });
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

async function mySolutionsBountyList(req, _res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const { last_id } = req.body;
        const { filter } = req.body;
        const { sort_order } = req.body;
        const filterConfig = bountyFIlter.getQueryForAll(filter, sort_order);
        const filters = filterConfig.query;
        const { order } = filterConfig;
        const pageSize = bountyConstants.limit;
        const noData = {};
        // const studentInfo = await Student.getStudent(student_id, db.mysql.read);
        const studentInfo = await StudentContainer.getById(student_id, db);
        const student_name = [studentInfo[0].student_fname, studentInfo[0].student_lname].join(' ').trim();
        const { student_username } = studentInfo[0];
        let mySolution;
        let votedAnswers;
        let upvotes;
        let downvotes;
        const a_ids = [];
        const votes = [];
        const arrUpvotes = [];
        const arrDownvotes = [];

        const subChap = await BountyPostDetail.getChapterFromBountyPost(db.mysql.read);

        const grouped = _.groupBy(subChap, (item) => item.question_subject);

        const subChapMap = bountyFIlter.getFiltersToshow(grouped);

        const exams = await Exams.getExams(db.mysql.read);
        const finalExamList = exams.map((obj) => obj.course);

        if (last_id != 0) {
            mySolution = await BountyAnswerDetail.getMySolutionsBountyListNext(db.mysql.read, student_id, pageSize, last_id, order, filters);
        } else {
            mySolution = await BountyAnswerDetail.getMySolutionsBountyList(db.mysql.read, student_id, pageSize, order, filters);
        }

        const answer_ids = mySolution.map((obj) => obj.answer_id);
        const commentCounter = await getCommentCounts(bountyConstants.bounty_answer_entity_type, answer_ids);
        if (answer_ids.length) {
            votedAnswers = await BountyVoteCheck.checkVoteStatus(db.mysql.read, student_id, answer_ids);
            for (let i = 0; i < votedAnswers.length; i++) {
                const { answer_id } = votedAnswers[i];
                const voteStatus = votedAnswers[i].vote;
                a_ids.push(answer_id);
                votes.push(voteStatus);
            }
        }

        if (!_.isEmpty(mySolution)) {
            for (let i = 0; i < mySolution.length; i++) {
                const upvoteId = `${mySolution[i].answer_id}upvote`;
                const downvoteId = `${mySolution[i].answer_id}downvote`;
                arrUpvotes.push(upvoteId);
                arrDownvotes.push(downvoteId);
            }
            const promises = [];
            promises.push(getRedisValues.getVotes(db.redis.read, arrUpvotes));
            promises.push(getRedisValues.getVotes(db.redis.read, arrDownvotes));
            const resolvedPromises = await Promise.all(promises);
            upvotes = resolvedPromises[0];
            downvotes = resolvedPromises[1];
        }
        let finalSolutionsList = mySolution.map((obj, i) => {
            const date = obj.created_at;
            const date1 = moment(date).from(obj.curr_time, true);
            obj.created_at = `${date1} ago`;
            obj.student_name = student_name || student_username;
            obj.img_url = studentInfo[0].img_url;
            obj.upvote = upvotes[i];
            obj.downvote = downvotes[i];
            obj.button_text = 'View Question';
            obj.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App par समझाया hai :D Khud dekho...maan jaaoge :D';
            obj.tag = 'Solution';
            obj.type = 'solution';
            if (a_ids.includes(obj.answer_id)) {
                const index = a_ids.indexOf(obj.answer_id);
                if (votes[index] == 1) {
                    obj.vote_state = 1;
                } else if (votes[index] == 2) {
                    obj.vote_state = 2;
                } else {
                    obj.vote_state = 0;
                }
            } else {
                obj.vote_state = 0;
            }
            obj.answer_url = `${bountyConstants.bounty_ans_vid}/${obj.answer_video}`;
            if (obj.entity_type == 'image') {
                obj.answer_image_url = `${bountyConstants.bounty_ans_vid}/${obj.answer_video}`;
            } else {
                obj.answer_image_url = bountyConstants.bounty_video_thumbnail;
            }
            obj.comment_count = commentCounter[i];
            return obj;
        });
        if (_.isEmpty(mySolution) && last_id == 0) {
            noData.type = 'nodata';
            noData.title = 'No results found';
            finalSolutionsList.unshift(noData);
        }

        let last_id1;
        if (_.isEmpty(finalSolutionsList) && last_id != 0) {
            finalSolutionsList = [];
            last_id1 = 'null';
        } else if (finalSolutionsList.length != 10) {
            last_id1 = 'null';
        } else if ((finalSolutionsList[finalSolutionsList.length - 1].answer_id)) {
            last_id1 = (finalSolutionsList[finalSolutionsList.length - 1].answer_id);
        }

        const filtersToshow = [{
            display: 'Exam', parent_key: 'exam', key: 'exam', value: finalExamList,
        },
        {
            display: 'Prize Money', parent_key: 'prizeMoney', key: 'prizeMoney', value: ['Yes', 'No'],
        }];

        for (let i = 0; i < subChapMap.length; i++) {
            filtersToshow.push(subChapMap[i]);
        }

        next({
            data: {
                tab: 'My Solutions',
                tag: 'Solution',
                last_id: last_id1,
                list: finalSolutionsList,

                // getChaptersFromExam,
                history_text: 'Check Payment History',
                button1_text: 'Solution Video Kaise Banaye',
                soln_video: bountyConstants.bounty_soln_vid,
                button3_text: 'Play',
                button4_text: 'Sort by',
                button5_text: 'Filter',
                sort_order: [{ display: 'Highest Prize', value: 'bounty_amount', sort: 'desc' }, { display: 'Newest First', value: 'answer_id', sort: 'desc' }, { display: 'Oldest First', value: 'answer_id', sort: 'asc' }],
                filter: [...filtersToshow],
            },
        });
    } catch (err) {
        next({ err });
    }
}

async function wantToSolveBountyList(req, _res, next) {
    try {
        const { student_id } = req.user;
        const { last_id } = req.body;
        const db = req.app.get('db');
        const { sort_order } = req.body;
        const { filter } = req.body;
        const filterConfig = bountyFIlter.getQueryForAll(filter, sort_order);
        const final = filterConfig.query;
        const { order } = filterConfig;
        const noData = {};
        const pageSize = bountyConstants.limit;
        // const studentInfo = await Student.getStudent(student_id, db.mysql.read);
        const studentInfo = await StudentContainer.getById(student_id, db);
        const student_name = [studentInfo[0].student_fname, studentInfo[0].student_lname].join(' ').trim();
        let myWantToSolve;

        const subChap = await BountyPostDetail.getChapterFromBountyPost(db.mysql.read);

        const grouped = _.groupBy(subChap, (item) => item.question_subject);

        const subChapMap = bountyFIlter.getFiltersToshow(grouped);

        const exams = await Exams.getExams(db.mysql.read);
        const finalExamList = exams.map((obj) => obj.course);

        if (last_id != 0) {
            if (filterConfig.solved_solutions.length && !filterConfig.noSolution.length) {
                myWantToSolve = await BookMarkingDetail.getMyBookMarkingDetailForSolvedNext(db.mysql.read, student_id, pageSize, last_id, order, final);
            } else if (filterConfig.noSolution.length && !filterConfig.solved_solutions.length) {
                myWantToSolve = await BookMarkingDetail.getMyBookMarkingDetailForNoSolutionNext(db.mysql.read, student_id, pageSize, last_id, order, final);
            } else {
                myWantToSolve = await BookMarkingDetail.getMyBookMarkingDetailNext(db.mysql.read, student_id, pageSize, last_id, order, final);
            }
        } else if (filterConfig.solved_solutions.length && !filterConfig.noSolution.length) {
            myWantToSolve = await BookMarkingDetail.getMyBookMarkingDetailForSolved(db.mysql.read, student_id, pageSize, order, final);
        } else if (filterConfig.noSolution.length && !filterConfig.solved_solutions.length) {
            myWantToSolve = await BookMarkingDetail.getMyBookMarkingDetailForNoSolution(db.mysql.read, student_id, pageSize, order, final);
        } else {
            myWantToSolve = await BookMarkingDetail.getMyBookMarkingDetail(db.mysql.read, student_id, pageSize, order, final);
        }
        const bounty_ids = myWantToSolve.map((obj) => obj.bounty_id);
        let bountyId = Utility.getPreservedQuoteString(bounty_ids);
        bountyId = getBountyString(bounty_ids, bountyId);
        const totalAnswers = await BountyAnswerDetail.getTotalAnswers(db.mysql.read, bountyId);
        const commentCounter = await getCommentCounts(bountyConstants.bounty_question_entity_type, bounty_ids);
        const countOfAnswers = getAnswersCount(totalAnswers, bounty_ids);
        let finalMyWantToSolve = myWantToSolve.map((obj, i) => {
            const date = obj.created_at;
            const date1 = moment(date).from(obj.curr_time, true);
            const timeLeft = getTimeLeft(obj.expired_at, obj.curr_time);
            if (timeLeft < 0) {
                obj.timeLeft = 0;
            } else {
                obj.timeLeft = timeLeft;
            }
            if (!_.isEmpty(obj.question_subject)) {
                obj.description = `#${obj.question_subject} #${obj.chapter}`;
            }
            obj.student_name = obj.student_name || obj.student_username;
            obj.created_at = `${date1} ago`;
            obj.share_message = 'Kariye is question ko solve aur jitiye prize money';
            obj.ViewSolution = `View Solutions(${countOfAnswers[i]})`;
            obj.submitButtonText = 'Submit Solution';
            obj.is_bookmark = 1;
            obj.comment_count = commentCounter[i];
            obj.answer_count = countOfAnswers[i];
            return obj;
        });

        if (_.isEmpty(myWantToSolve) && last_id == 0) {
            noData.type = 'nodata';
            noData.title = 'No results found';
            finalMyWantToSolve.unshift(noData);
        }

        let last_id1;
        if (_.isEmpty(myWantToSolve) && last_id != 0) {
            finalMyWantToSolve = [];
            last_id1 = 'null';
        } else if (finalMyWantToSolve.length != 10) {
            last_id1 = 'null';
        } else if ((finalMyWantToSolve[finalMyWantToSolve.length - 1].bookmark_id)) {
            last_id1 = (finalMyWantToSolve[finalMyWantToSolve.length - 1].bookmark_id);
        }

        const filtersToshow = [{
            display: 'Exam', parent_key: 'exam', key: 'exam', value: finalExamList,
        },
        {
            display: 'Prize Money', parent_key: 'prizeMoney', key: 'prizeMoney', value: ['Yes', 'No'],
        },

        {
            display: 'Status', parent_key: 'status', key: 'status', value: ['Running', 'Solved Doubts', 'No Solution', 'Not Accepted'],
        },
        ];

        for (let i = 0; i < subChapMap.length; i++) {
            filtersToshow.push(subChapMap[i]);
        }

        next({
            data: {
                tab: 'Favorites',
                tag: 'Solution',
                student_name,
                last_id: last_id1,
                list: finalMyWantToSolve,
                history_text: 'Check Payment History',
                button1_text: 'Solution Video Kaise Banaye',
                soln_video: bountyConstants.bounty_soln_vid,
                button2_text: 'View Question',
                button3_text: 'Play',
                button4_text: 'Sort by',
                button5_text: 'Filter',
                sort_order: [{ display: 'Highest Prize', value: 'bounty_amount', sort: 'desc' }, { display: 'Newest First', value: 'answer_id', sort: 'desc' }, { display: 'Oldest First', value: 'answer_id', sort: 'asc' }],
                filter: [...filtersToshow],
            },
        });
    } catch (err) {
        next({ err });
    }
}

async function viewSolutionsByQuestionId(req, _res, next) {
    try {
        const { question_id, last_id, student_id } = req.query;
        const db = req.app.get('db');
        const pageSize = bountyConstants.limit;
        const arrUpvotes = [];
        const arrDownvotes = [];
        let finalgetAnswers;
        let votedAnswers;
        const a_ids = [];
        const votes = [];
        let upvotes;
        let downvotes;
        const getQuestionDetails = await BountyPostDetail.getBountyQuestionDetailByQid(db.mysql.read, question_id);
        // const studentInfo = await Student.getStudent(getQuestionDetails[0].student_id, db.mysql.read);
        const studentInfo = await StudentContainer.getById(getQuestionDetails[0].student_id, db);
        const student_name = [studentInfo[0].student_fname, studentInfo[0].student_lname].join(' ').trim();
        const studentImage = studentInfo[0].img_url;
        const questionData = await Question.getByNewQuestionId(question_id, db.mysql.read);
        const questionUrl = constant.questionAskUrlPrefix + questionData[0].question_image;
        let getAnswers;
        if (last_id != 0) {
            getAnswers = await BountyAnswerDetail.getAnswersBybountyIdNext(db.mysql.read, getQuestionDetails[0].bounty_id, pageSize, last_id);
        } else {
            getAnswers = await BountyAnswerDetail.getAnswersBybountyId(db.mysql.read, getQuestionDetails[0].bounty_id, pageSize);
        }
        const answer_ids = getAnswers.map((obj) => obj.answer_id);
        const commentCounter = await getCommentCounts(bountyConstants.bounty_answer_entity_type, answer_ids);
        if (answer_ids.length) {
            votedAnswers = await BountyVoteCheck.checkVoteStatus(db.mysql.read, student_id, answer_ids);
            for (let i = 0; i < votedAnswers.length; i++) {
                const { answer_id } = votedAnswers[i];
                const voteStatus = votedAnswers[i].vote;
                a_ids.push(answer_id);
                votes.push(voteStatus);
            }
        }
        const checkIfAccept = await BountyPostDetail.getBountyQuestionDetailByQid(db.mysql.read, question_id);
        const isAccept = checkForAcceptedAnswer(checkIfAccept);
        if (student_id == getQuestionDetails[0].student_id && !isAccept) {
            finalgetAnswers = getAnswers.map((obj) => {
                const date = obj.created_at;
                const date1 = moment(date).from(obj.curr_time, true);
                obj.answer_url = `${bountyConstants.bounty_ans_vid}/${obj.answer_video}`;
                if (obj.entity_type == 'image') {
                    obj.answer_image_url = `${bountyConstants.bounty_ans_vid}/${obj.answer_video}`;
                } else {
                    obj.answer_image_url = bountyConstants.bounty_video_thumbnail;
                }
                obj.type = 'qnasolution';
                obj.created_at = `${date1} ago`;
                if (student_id == obj.student_id) {
                    obj.showAccept = 0;
                    obj.type1 = "You can't accept this answer as it was posted by you";
                } else {
                    obj.showAccept = 1;
                    obj.type1 = 'Accept Answer';
                }

                return obj;
            });
        } else {
            finalgetAnswers = getAnswers.map((obj) => {
                const date = obj.created_at;
                const date1 = moment(date).from(obj.curr_time, true);
                obj.created_at = `${date1} ago`;
                obj.showAccept = 0;
                obj.answer_url = `${bountyConstants.bounty_ans_vid}/${obj.answer_video}`;
                if (obj.entity_type == 'image') {
                    obj.answer_image_url = `${bountyConstants.bounty_ans_vid}/${obj.answer_video}`;
                } else {
                    obj.answer_image_url = bountyConstants.bounty_video_thumbnail;
                }
                obj.type = 'qnasolution';
                obj.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App par समझाया hai :D Khud dekho...maan jaaoge :D';
                obj.type1 = 'Aapko ye solution kaisa laga?';
                return obj;
            });
        }

        let last_id1;
        // console.log(getAnswers[0].answer_id);
        if (!_.isEmpty(finalgetAnswers)) {
            for (let i = 0; i < finalgetAnswers.length; i++) {
                const upvoteId = `${finalgetAnswers[i].answer_id}upvote`;
                const downvoteId = `${finalgetAnswers[i].answer_id}downvote`;
                arrUpvotes.push(upvoteId);
                arrDownvotes.push(downvoteId);
            }
            const promises = [];
            promises.push(getRedisValues.getVotes(db.redis.read, arrUpvotes));
            promises.push(getRedisValues.getVotes(db.redis.read, arrDownvotes));
            const resolvedPromises = await Promise.all(promises);
            upvotes = resolvedPromises[0];
            downvotes = resolvedPromises[1];
        }
        if (_.isEmpty(finalgetAnswers)) {
            finalgetAnswers = [];
            last_id1 = 'null';
        } else if ((finalgetAnswers[finalgetAnswers.length - 1].answer_id)) {
            last_id1 = (finalgetAnswers[finalgetAnswers.length - 1].answer_id);
        }

        const timeLeft = getTimeLeft(getQuestionDetails[0].expired_at, getQuestionDetails[0].curr_time);
        const questionDetails = {
            type: 'qnaquestion',
            tag: 'Question',
            question_id,
            bounty_id: getQuestionDetails[0].bounty_id,
            bounty_ques_img: questionUrl,
            bounty_amount: getQuestionDetails[0].bounty_amount,
            student_name,
            img_url: studentImage,
            student_class: studentInfo[0].student_class,
            share_message: 'Kariye is question ko solve aur jitiye prize money',
            created_at: `${moment(getQuestionDetails[0].created_at).from(getQuestionDetails[0].curr_time, true)} ago`,
        };
        if (timeLeft < 0) {
            questionDetails.timeLeft = 0;
        } else {
            questionDetails.timeLeft = timeLeft;
        }
        if (!_.isEmpty(getQuestionDetails[0].question_subject)) {
            questionDetails.description = `#${getQuestionDetails[0].question_subject} #${getQuestionDetails[0].chapter}`;
        }

        const finalListgetAnswers = finalgetAnswers.map((obj, i) => {
            if (a_ids.includes(obj.answer_id)) {
                const index = a_ids.indexOf(obj.answer_id);
                if (votes[index] == 1) {
                    obj.vote_state = 1;
                } else if (votes[index] == 2) {
                    obj.vote_state = 2;
                } else {
                    obj.vote_state = 0;
                }
            } else {
                obj.vote_state = 0;
            }
            if (upvotes[i] == null) {
                obj.upvote = 0;
            } else {
                obj.upvote = upvotes[i];
            }
            if (downvotes[i] == null) {
                obj.downvote = 0;
            } else {
                obj.downvote = downvotes[i];
            }

            obj.question_id = question_id;
            obj.bounty_ques_img = questionDetails.bounty_ques_img;
            obj.student_name = obj.student_name || obj.student_username;
            obj.comment_count = commentCounter[i];
            return obj;
        });

        if (last_id == 0) {
            finalListgetAnswers.unshift(questionDetails);
        }

        next({
            data: {
                last_id: last_id1,
                list: finalListgetAnswers,
                title: 'Solutions',
                tag1: 'Solution',
                tag3: 'Accepted',
                tag5: 'Accept and Watch',
                tag6: 'Cancel',
            },

        });
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

async function bountyAnswerUpvoteCounter(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const { answer_id, typeOfVote } = req.body;
        const checkVote = typeOfVote;
        let upVote = await redis.checkIfExists(db.redis.read, `${answer_id}upvote`);
        if (upVote == null) {
            upVote = 0;
        }
        let downVote = await redis.checkIfExists(db.redis.read, `${answer_id}downvote`);
        if (downVote == null) {
            downVote = 0;
        }
        const getBountyIdByAnswer_id = await BountyAnswerDetail.getAnswerDeatilsByAnswerId(db.mysql.read, answer_id);
        let obj = {
            student_id,
            answer_id,
            vote: checkVote,
            bounty_id: getBountyIdByAnswer_id[0].bounty_id,
        };
        const checkIfVote = await BountyVoteCheck.checkIfVoted(db.mysql.read, obj);
        const currentVote = (Array.isArray(checkIfVote) && checkIfVote.length) ? checkIfVote[0].vote : null;
        if (currentVote) {
            // unvoted
            if (typeOfVote == currentVote) {
                obj = {
                    student_id,
                    answer_id,
                    vote: 0,
                    bounty_id: getBountyIdByAnswer_id[0].bounty_id,
                };
                await BountyVoteCheck.upsertVote(db.mysql.write, obj);
                if (typeOfVote == 1) {
                    await redis.decrementValue(db.redis.write, `${answer_id}upvote`);
                }
                if (typeOfVote == 2) {
                    await redis.decrementValue(db.redis.write, `${answer_id}downvote`);
                }
            } else {
                // vote
                const promises1 = [];
                if (typeOfVote == 1 && currentVote == 2) {
                    promises1.push(await BountyVoteCheck.upsertVote(db.mysql.write, obj));
                    promises1.push(redis.lock(db.redis.write, `${answer_id}upvote`, parseInt(upVote) + 1, 300000));
                    if (downVote) {
                        promises1.push(redis.lock(db.redis.write, `${answer_id}downvote`, parseInt(downVote) - 1, 300000));
                    }
                    await Promise.all(promises1);
                }
                if (typeOfVote == 1 && currentVote == 0) {
                    await redis.lock(db.redis.write, `${answer_id}upvote`, parseInt(upVote) + 1, 300000);
                }
                if (typeOfVote == 2 && currentVote == 0) {
                    await redis.lock(db.redis.write, `${answer_id}downvote`, parseInt(downVote) - 1, 300000);
                }
                if (typeOfVote == 2 && currentVote == 1) {
                    promises1.push(await BountyVoteCheck.upsertVote(db.mysql.write, obj));
                    promises1.push(redis.lock(db.redis.write, `${answer_id}downvote`, parseInt(downVote) + 1, 300000));
                    if (upVote) {
                        promises1.push(redis.lock(db.redis.write, `${answer_id}upvote`, parseInt(upVote) - 1, 300000));
                    }
                    await Promise.all(promises1);
                }
            }
        } else {
            await BountyVoteCheck.upsertVote(db.mysql.write, obj);
            if (typeOfVote == 1) {
                await redis.lock(db.redis.write, `${answer_id}upvote`, parseInt(upVote) + 1, 300000);
            }
            if (typeOfVote == 2) {
                await redis.lock(db.redis.write, `${answer_id}downvote`, parseInt(downVote) + 1, 300000);
            }
        }
        const promises = [];
        promises.push(redis.checkIfExists(db.redis.read, `${answer_id}upvote`));
        promises.push(redis.checkIfExists(db.redis.read, `${answer_id}downvote`));
        const resolvedPromises = await Promise.all(promises);
        const upvote = resolvedPromises[0];
        const downvote = resolvedPromises[1];
        next({
            data: {
                upvote,
                downvote,
            },
        });

        if (upvote == 5) {
            const params = {
                answer_id,
                type: 'more-than-5-likes',
                question_id: getBountyIdByAnswer_id[0].question_id,
            };
            console.log('paramsssssssssssss', params);
            BountyNotification.sendBountyNotification(db, params);
        }
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

async function addToBookMark(req, _res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const { bounty_id, status } = req.body;
        let msg;
        const getBountyAmount = await BountyPostDetail.getQuestionbyBountyId(db.mysql.read, bounty_id);
        if (status == 1) {
            const params = {
                bounty_id,
                student_id,
                bounty_amount: getBountyAmount[0].bounty_amount,
                isBookMark: 1,
            };
            await BookMarkingDetail.upsertBookMark(db.mysql.write, params);
            msg = 'You have bookmarked this question';
        } else {
            const params = {
                bounty_id,
                student_id,
                bounty_amount: getBountyAmount[0].bounty_amount,
                isBookMark: 0,
            };
            await BookMarkingDetail.upsertBookMark(db.mysql.write, params);
            msg = 'Removed from the bookmark question list';
        }
        next({ data: msg });
    } catch (err) {
        next({ err });
    }
}

async function acceptVideoSolution(req, _res, next) {
    try {
        const { student_id } = req.user;
        const { answer_id, question_id } = req.body;
        const db = req.app.get('db');

        const getBountyId = await BountyPostDetail.getBountyQuestionDetailByQid(db.mysql.read, question_id);
        const params = {
            student_id,
            answer_id,
            bounty_id: getBountyId[0].bounty_id,
            bounty_earned: getBountyId[0].bounty_amount,
            acceptance_flag: 1,
        };
        const bountyParamsToUpdate = {
            bounty_id: params.bounty_id,
            is_accepted: 1,
        };
        const isAccepted = await BountyAnswerDetail.validateAccepting(db.mysql.read, params);

        if (isAccepted[0].total > 0) {
            return next({ data: 'already accepted' });
        }
        const answerDetail = await BountyAnswerDetail.getAnswerDeatilsByAnswerId(db.mysql.read, answer_id);
        const checkSelfAnswer = await BountyPostDetail.checkingSelfAnswer(db.mysql.read, params);
        if (checkSelfAnswer[0].student_id == answerDetail[0].student_id) {
            return next({ data: 'cannot accept self solution' });
        }
        // const studentInfo = await Student.getStudent(answerDetail[0].student_id, db.mysql.read);
        const studentInfo = await StudentContainer.getById(answerDetail[0].student_id, db);
        const student_name = [studentInfo[0].student_fname, studentInfo[0].student_lname].join(' ').trim();
        await BountyAnswerDetail.accpetVideoSolution(db.mysql.write, params);
        await BountyPostDetail.updateBountyPost(db.mysql.write, bountyParamsToUpdate);
        const obj = {
            question_id,
            type: 'answer-accepted',
            student_id: answerDetail[0].student_id,
        };
        BountyNotification.sendBountyNotification(db, obj);

        next({ data: `You have accepted ${student_name}'s solution! The prize money if applicable will be given to ${student_name} for solving the doubt.` });

        // put a check if the answer was posted in 24 hours from the bounty posted and it has been more than 3 days since the answer was accepted.

        const numOfdays = checkNumOfDays(getBountyId[0].created_at, getBountyId[0].curr_time);
        const days = checkNumOfDays(getBountyId[0].created_at, answerDetail.created_at);

        if (params.bounty_earned > 0 && (!(numOfdays < 3 && days > 0) && !(numOfdays > 3))) {
            const paramsForAccepting = {
                student_id: answerDetail[0].student_id,
                bounty_id: params.bounty_id,
                answer_id,
                amount_to_disburse: (0.9 * (params.bounty_earned)).toFixed(2),
                type: 'accepted',
            };
            const phone = await BountyDisbursement.getPhone(db.mysql.read, answerDetail[0].student_id);
            if (phone.length == 0) {
                paramsForAccepting.phone = 0;
            } else {
                paramsForAccepting.phone = phone[0].phone;
            }
            await BountyDisbursement.insertBountyToDisburse(db.mysql.write, paramsForAccepting);
        }
    } catch (err) {
        next({ err });
    }
}

async function uploadVideoSolution(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        const { question_id } = req.body;
        const answer_key = req.files.video[0].key;
        const { entity_type } = req.body;
        const getBountyId = await BountyPostDetail.getBountyQuestionDetailByQid(db.mysql.read, question_id);
        const params = {
            student_id,
            bounty_id: getBountyId[0].bounty_id,
            answer_video: answer_key,
            entity_type,
            is_delete: 0, // need to undelete from profanity lambda, for now keep it 0
        };
        const updateBountyPost = {
            bounty_id: params.bounty_id,
            is_answered: 1,
        };

        await Bounty.insertAnswerDetail(db.mysql.write, params);
        await BountyPostDetail.updateBountyPost(db.mysql.write, updateBountyPost);
        const obj = {
            student_id: getBountyId[0].student_id,
            type: 'got-answer',
            question_id,
        };
        BountyNotification.sendBountyNotification(db, obj);

        next({ data: 'uploaded' });
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

async function reportSpam(req, res, next) {
    try {
        console.log('hello');
        const { student_id, mobile } = req.user;
        const config = req.app.get('config');
        const {
            text, type, id,
        } = req.body;
        let params;
        const db = req.app.get('db');
        if (type) {
            params = {
                student_id,
                text,
                type,
                id,
            };
            Spam.reportSpam(db.mysql.write, params);
        }
        MailUtility.sendMailViaSendGrid(config, bountyConstants.mail_details.autobotMailID, bountyConstants.mail_details.bountyMailID, `${bountyConstants.mail_details.spamSubject} ${student_id} ${bountyConstants.mail_details.delimitter} ${type} ${id} ${bountyConstants.mail_details.delimitter} ${mobile}`, text);
        console.log('-------mail-sent -------');
        next({ data: 'reported' });
    } catch (e) {
        next({ e });
    }
}

async function bountyFeedback(req, _res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const { student_id, mobile } = req.user;
        const { text } = req.body;
        const params = {
            student_id,
            feedback: text,
        };
        bountyfeedback.insertFeedBack(db.mysql.write, params);
        MailUtility.sendMailViaSendGrid(config, bountyConstants.mail_details.autobotMailID, bountyConstants.mail_details.bountyMailID, `${bountyConstants.mail_details.feedbackSubject} ${student_id} ${bountyConstants.mail_details.delimitter} ${mobile}`, text);
        next({ data: 'Thank you for your feedback' });
    } catch (e) {
        next({ e });
    }
}

module.exports = {
    faqPopUp,
    bountyPostPage,
    getChapters,
    allBountyListingPage,
    myQuestionsBountyList,
    mySolutionsBountyList,
    wantToSolveBountyList,
    addToBookMark,
    viewSolutionsByQuestionId,
    acceptVideoSolution,
    uploadVideoSolution,
    bountyAnswerUpvoteCounter,
    postQuestionPopup,
    reportSpam,
    bountyFeedback,
};
