function responseTemplate(msg = 'Success', data = 'Success', status = 200) {
    const responseData = {
        meta: {
            code: status,
            success: status === 200,
            message: msg,
        },
        data,
    };
    return responseData;
}

module.exports = {
    responseTemplate,
};
