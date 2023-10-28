async function setBrowserInHeaders(req, _res, next) {
    const { 'user-agent': userAgent } = req.headers;
    if (!userAgent.includes('okhttp') && !userAgent.startsWith('PostmanRuntime')) {
        req.headers.is_browser = true;
    }
    next();
}

module.exports = setBrowserInHeaders;
