async function updateAnswerViewBadReqFilter(req, res, next) {
    if (parseInt(req.body.view_id) !== -1) {
        return next();
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: null,
    };
    res.status(responseData.meta.code).json(responseData);
}

module.exports = {
    updateAnswerViewBadReqFilter,
};
