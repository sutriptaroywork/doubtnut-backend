const _ = require('lodash');

const AnswerRedis = require('../../modules/redis/answer');
const Data = require('../../data/data');

async function getNcertWatchedData(db, studentId, locale) {
    let ncertPlaylistData = await AnswerRedis.getNCERTPlaylistData(db.redis.read, studentId);
    let title = Data.ncertLastWatchedTitle.hinglish;
    if (locale === 'en') {
        title = Data.ncertLastWatchedTitle.en;
    } else if (locale === 'hi') {
        title = Data.ncertLastWatchedTitle.hi;
    }

    const ncertCard = {};
    if (!_.isNull(ncertPlaylistData)) {
        ncertPlaylistData = JSON.parse(ncertPlaylistData);
        if (ncertPlaylistData && ncertPlaylistData.list && ncertPlaylistData.list.length && ncertPlaylistData.homePagePopUp) {
            const chapter = ncertPlaylistData.list[0].main_description.split('|');
            if (chapter.length > 1) {
                ncertCard.title = `${title} \n NCERT ${ncertPlaylistData.list[0].subject}, ${chapter[1]}, ${ncertPlaylistData.list[0].chapter}`;
            }
            ncertCard.resource_type = 'playlist';
            ncertCard.list = ncertPlaylistData.list;
            ncertCard.homePagePopUp = ncertPlaylistData.homePagePopUp;
        }
    }
    return ncertCard;
}

module.exports = {
    getNcertWatchedData,
};
