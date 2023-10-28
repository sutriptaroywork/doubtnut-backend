function handleComputationalQuestions(req, res, next) {
    try {
        if (typeof req.body.id !== 'undefined') {
            if (req.body.id.includes('COMPUTATIONAL')) {
                req.body.id = req.body.id.replace('COMPUTATIONAL:', '');
                req.body.isComputationQuestion = true;
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
}
module.exports = handleComputationalQuestions;
