const _ = require('lodash');
const QuestionRedis = require('../modules/redis/question');
async function sequentialQuestionIdHandler(req, res, next) {
        try {
            const db = req.app.get('db');
            const questionId = await QuestionRedis.getQuestionAskRequestsIdTracker(db.redis.read);
            if (_.isNull(questionId)) {
                await QuestionRedis.setQuestionAskRequestsIdTracker(db.redis.write, 1);
                req.body.uploaded_image_question_id = 1;
            } else {
                const response = await QuestionRedis.increaseQuestionAskRequestsIdTracker(db.redis.write);
                req.body.uploaded_image_question_id = parseInt(response);
                if (parseInt(response) % 3 === 0) {
                    delete req.body.uploaded_image_question_id;
                    delete req.body.uploaded_image_name;
                    req.body.question_text = 'hello world';
                    req.body.text_question_qid = parseInt(response);
                }
            }
            next();
        } catch (e) {
            console.log(e);
            next();
        }
}



module.exports = sequentialQuestionIdHandler;
