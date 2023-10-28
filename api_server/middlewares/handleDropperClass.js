function handleDroppersParamsClass(req, res, next) {
    if (typeof req.params.student_class !== 'undefined') {
        if (req.params.student_class == '13') {
            req.params.student_class = '12';
        }
    }
    if (typeof req.body.student_class !== 'undefined') {
        if (req.body.student_class == '13') {
            req.body.student_class = '12';
        }
    }
    if (typeof req.body.class !== 'undefined') {
        if (req.body.class == '13') {
            req.body.class = '12';
        }
    }
    next();
}
module.exports = {

    classChangeParams: handleDroppersParamsClass,

};
