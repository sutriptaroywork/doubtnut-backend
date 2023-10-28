async function onboardingBadReqFilter(req, res, next) {
    if (req.body.question_id && req.body.page) {
        return next();
    }
    if (req.headers.version_code && req.headers.version_code >= 804 && req.headers.version_code <= 832) {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { view_id: -1 },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
    next();
}

module.exports = {
    onboardingBadReqFilter,
};
