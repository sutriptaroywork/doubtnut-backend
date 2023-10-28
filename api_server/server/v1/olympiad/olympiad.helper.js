async function sendError(res, code, message) {
    const responseData = {
        meta: {
            code,
            success: false,
        },
        data: [],
    };
    responseData.meta.message = message;
    return res.status(code).json(responseData);
}

function sendSuccess(res, data) {
    const responseData = {
        meta: {
            code: 200,
            success: true,
        },
        data,
    };
    return res.status(responseData.meta.code).json(responseData);
}

module.exports = {
    sendError,
    sendSuccess,
};
