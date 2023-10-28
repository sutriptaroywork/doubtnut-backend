module.exports = class sevenPmQuiz {
    static getUserRank(db, studentId, quizId) {
        return db.mongo.client.db('whatsappdb').collection('whatsapp_daily_quiz_scores').aggregate([{
            $match: {
                studentId,
                quizId,
            },
        },
        {
            $sort: { totalMarks: -1, incorrectCount: 1, lastSubmit: 1 },
        }, { $addFields: { order: '$index' } }]).toArray();
    }

    static getTopTenUsersDaily(db, quizId) {
        return db.mongo.client.db('whatsappdb').collection('whatsapp_daily_quiz_scores').aggregate([{
            $match: {
                quizId,
            },
        }, { $limit: 10 }, {
            $sort: { totalMarks: -1, incorrectCount: 1, lastSubmit: 1 },
        }]).toArray();
    }

    static getTopTenUsersWeekly(db, quizId) {
        return db.mongo.client.db('whatsappdb').collection('whatsapp_daily_quiz_scores').aggregate([{
            $match: {
                quizId,
            },
        }, { $limit: 10 }, {
            output: {
                rank: {
                    $rank: {},
                },
            },
        }, {
            $sort: { totalMarks: -1, incorrectCount: 1, lastSubmit: 1 },
        }]).toArray();
    }

    static getQuizId(db, date) {
        return db.mongo.client.db('whatsappdb').collection('whatsapp_daily_quizzes').aggregate([{
            $match: {
                quizDate: date,
            },
        }]).toArray();
    }

    static getQuizIds(db, dates) {
        return db.mongo.client.db('whatsappdb').collection('whatsapp_daily_quizzes').aggregate([{
            $match: {
                quizDate: {
                    $in: dates,
                },
            },
        }, {
            $project: {
                quizId: 1.0,
            },
        }]).toArray();
    }

    static getUserScores(db, studentIds, quizIds) {
        return db.mongo.client.db('whatsappdb').collection('whatsapp_daily_quiz_scores').aggregate([{
            $match: {
                quizId: {
                    $in: quizIds,
                },
                studentId: {
                    $in: studentIds,
                },
            },
        }, {
            $group:
            {
                _id: '$studentId',
                totalScore: { $sum: '$totalScore' },
            },
        }, {
            $sort: { totalScore: -1 },
        }]).toArray();
    }
};
