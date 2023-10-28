const moment = require('moment');

function random(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getTotalViewsNew(questionId) {
    return Math.floor((((questionId + Math.floor(random(questionId) * 15000000)) % 15000000) + ((moment().unix() - 1639586981) * 10000 + 1639586981) / 1639586981 + random(questionId) * 10000000)); // increases by 5000
}

function getTotalViewsWebNew(questionId) {
    return Math.floor(((questionId + Math.floor(random(questionId) * 15000000)) % 15000000) + ((moment().unix() - 1639586981) * 10000 + 1639586981) / 1639586981 + random(questionId) * 10000000 + random(questionId) * 10000); // increases by 5000
}

function getLikeDislikeStatsNew(questionId) {
    const like = 200000 + ((questionId + Math.floor(random(questionId) * 200000)) % 200000) + ((moment().unix() - 1639586981) * 1000 + 1639586981) / 1639586981 + random(questionId) * 20000;// increases by 500 everyday
    const dislike = 20000 + ((questionId + Math.floor(random(questionId) * 20000)) % 20000) + ((moment().unix() - 1639586981) * 100 + 1639586981) / 1639586981 + random(questionId) * 2000; // increases by 50 everyday
    return [Math.floor(like), Math.floor(dislike)];
}

function getWhatsappShareStatsNew(questionId) {
    return Math.floor(20000 + ((questionId + Math.floor(random(questionId) * 20000)) % 20000) + ((moment().unix() - 1639586981) * 100 + 1639586981) / 1639586981 + random(questionId) * 5000 + 51); // increases by 50 everyday
}

function userWatchingCount(min, max) {
    return Math.floor((Math.random()) * (max - min + 1)) + min;
}

module.exports = {
    getTotalViewsNew,
    getTotalViewsWebNew,
    getLikeDislikeStatsNew,
    getWhatsappShareStatsNew,
    userWatchingCount,
};
