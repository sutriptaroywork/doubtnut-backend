const hashExpiry = 60 * 60 * 24 * 2; // 24 hour

module.exports = class Question {
    static getVideosByPznTG(client, targetGroup, mcID, locale) {
        return client.getAsync(`PZN_SIMILAR:${targetGroup}:${mcID}:${locale}`);
    }

    static setVideosByPznTG(client, data, targetGroup, mcID, locale) {
        return client.setAsync(`PZN_SIMILAR:${targetGroup}:${mcID}:${locale}`, JSON.stringify(data), 'EX', hashExpiry);
    }

    static getVideos(client, targetGroup, mcID, locale) {
        return client.getAsync(`PZN_SIMILAR:${mcID}:${locale}`);
    }

    static setVideos(client, data, mcID, locale) {
        return client.setAsync(`PZN_SIMILAR:${mcID}:${locale}`, JSON.stringify(data), 'EX', hashExpiry);
    }
};
