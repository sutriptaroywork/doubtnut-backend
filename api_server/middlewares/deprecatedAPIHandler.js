function deprecatedHandler(req, res) {
    const responseData = {
        meta: {
            code: 410,
            message: 'API deprecated',
        },
        data: null,
    };
    res.status(responseData.meta.code).json(responseData);
}

module.exports = deprecatedHandler;
