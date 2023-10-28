const _ = require('lodash');
const axios = require('axios');

const HASH_EXPIRY = 60 * 60 * 24; // 1 day
const { ROANUZ_PROJECT_KEY, ROANUZ_API_KEY } = process.env;

async function getTokenByAPI() {
    const options = {
        method: 'POST',
        url: `https://api.sports.roanuz.com/v5/core/${ROANUZ_PROJECT_KEY}/auth/`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            api_key: `${ROANUZ_API_KEY}`,
        }),
    };
    try {
        const res = await axios(options);
        const token = _.get(res, 'data.data.token', null);

        return token;
    } catch (err) {
        console.log('error in fetching token');

        return null;
    }
}

async function getAuthToken(db) {
    let authToken = await db.redis.read.getAsync('ROANUZ_CRICKET:AUTH_TOKEN');
    if (_.isEmpty(authToken)) {
        const authTokenAPI = await getTokenByAPI();

        authToken = authTokenAPI;

        if (!_.isEmpty(authToken)) {
            await db.redis.write.setAsync('ROANUZ_CRICKET:AUTH_TOKEN', authToken, 'Ex', HASH_EXPIRY);
        }
    }
    return authToken;
}

async function unsubscribeMatch(db, matchKey) {
    const authToken = await getAuthToken(db);

    const options = {
        method: 'POST',
        url: `https://api.sports.roanuz.com/v5/cricket/${ROANUZ_PROJECT_KEY}/match/${matchKey}/unsubscribe/`,
        headers: {
            'rs-token': `${authToken}`,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            method: 'web_hook',
        }),
    };

    try {
        await axios(options);

        return true;
    } catch (err) {
        console.log('error in unsubscribing token');

        return false;
    }
}

module.exports = {
    unsubscribeMatch,
};
