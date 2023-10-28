const auth = require('./auth.js');

async function checkUserAgent(req, res, next) {
    const { 'user-agent': user_agent, 'x-auth-token': xAuthToken, studentid } = req.headers;
    if (user_agent.includes('okhttp') || user_agent.includes('PostmanRuntime/7.26.8') || xAuthToken || studentid) {
        auth(req, res, next);
    } else {
        next();
    }
}

module.exports = checkUserAgent;
