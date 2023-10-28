const moment = require('moment');

module.exports = class Student {
    static insertIntoClassChangeHistory(studentId, studentClass, mongo, origin) {
        try {
            mongo.collection('class_change_history').insertOne({
                student_id: studentId,
                student_class: parseInt(studentClass),
                origin,
                createdAt: moment().add(5, 'hours').add(30, 'minutes').toDate(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    static insertIntoBoardChangeHistory(studentId, studentBoard, mongo, origin) {
        try {
            mongo.collection('board_change_history').insertOne({
                student_id: studentId,
                student_board: studentBoard,
                origin,
                createdAt: moment().add(5, 'hours').add(30, 'minutes').toDate(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    static storeTextSolutionFeedback(studentId, questiontId, mongo) {
        try {
            mongo.collection('text_solution_feedback').insertOne({
                student_id: studentId,
                questiont_id: questiontId,
                createdAt: moment().add(5, 'hours').add(30, 'minutes').toDate(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    static getTextSolutionFeedback(studentId, questiontId, mongo) {
        try {
            return mongo.collection('text_solution_feedback').find({
                student_id: studentId,
                questiont_id: questiontId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }

    static isEligibleForReward(studentId, mongo) {
        try {
            return mongo.collection('reward_sms_sent_students').find({
                student_id: studentId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }

    static isEligibleForDnrReinstallReward(mongo, studentId) {
        try {
            return mongo.collection('uninstall_120_days_dnr_rewarding_sms').find({
                student_id: studentId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }

    static isEligibleForCourseReinstallnReward(mongo, studentId) {
        try {
            return mongo.collection('uninstall_120_days_course_rewarding_sms').find({
                student_id: studentId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }

    static addingDnrReinstallRewardedStudent(mongo, studentId) {
        try {
            return mongo.collection('dnr_rewarded_reinstall_students').insertOne({
                student_id: studentId,
                created_at: moment().add(5, 'hours').add(30, 'minutes').toDate(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    static addingCourseReinstallRewardedStudent(mongo, studentId) {
        try {
            return mongo.collection('course_rewarded_reinstall_students').insertOne({
                student_id: studentId,
                created_at: moment().add(5, 'hours').add(30, 'minutes').toDate(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    static isDnrAlreadyAwarded(mongo, studentId) {
        try {
            return mongo.collection('dnr_rewarded_reinstall_students').find({
                student_id: studentId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }

    static isCourseAlreadyAwarded(mongo, studentId) {
        try {
            return mongo.collection('course_rewarded_reinstall_students').find({
                student_id: studentId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }

    static deletingRewardedStudent(studentId, mongo) {
        try {
            return mongo.collection('reward_sms_sent_students').deleteOne({
                student_id: studentId,
            });
        } catch (e) {
            console.log(e);
        }
    }

    static studentFeedbackForQuestionId(mongo, studentId, questionId) {
        try {
            return mongo.collection('feedbacks').find({
                student_id: studentId,
                question_id: questionId,
            }).toArray();
        } catch (e) {
            console.log(e);
        }
    }
};
