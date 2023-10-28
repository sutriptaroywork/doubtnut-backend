function handleSrpNoFilterPageValue(req, res, next) {
    try {
        if (req.body.page === 'SRP_NO_FILTER') {
            req.body.page = 'SRP';
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
}
module.exports = handleSrpNoFilterPageValue;
