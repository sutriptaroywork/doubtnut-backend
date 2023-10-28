function _(req, res, next) {
    try {
        if (typeof req.body.id !== 'undefined') {
            if (req.body.page.includes('back_press')) {
                req.body.page = 'LIBRARY';
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
}

module.exports = _;
