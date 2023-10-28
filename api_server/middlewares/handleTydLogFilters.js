function handleTydLogFilters(req, res, next) {
    try {
        const {
            studentId,
            locale,
            isVoiceSearch,
        } = req.body;
        const studentClass = req.body.class;

        req.body.filters = {};
        if (typeof studentId !== 'undefined') {
            req.body.filters.studentId = parseInt(studentId);
        }
        if (typeof locale !== 'undefined') {
            req.body.filters.locale = locale;
        }
        if (typeof studentClass !== 'undefined') {
            req.body.filters.class = parseInt(studentClass);
        }
        if (typeof isVoiceSearch !== 'undefined') {
            req.body.filters.isVoiceSearch = isVoiceSearch;
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
}
module.exports = handleTydLogFilters;
