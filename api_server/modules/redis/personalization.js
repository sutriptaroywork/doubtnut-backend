const _ = require('lodash')
const mc_expiry = 30 * 60 * 60 * 24; // 30 day

// let Utility = require('./utility');
module.exports = class Personalization {
  constructor() {
  }

  static getDistinctMcByPlaylistId(playlist_id, client) {
    return client.hgetAsync("personalization_distinct_mc", playlist_id);
  }

  static setDistinctMcByPlaylistId(playlist_id, data, client) {
    return client.multi()
      .hset("personalization_distinct_mc" , playlist_id , JSON.stringify(data))
        .expireat("personalization_distinct_mc", parseInt((+new Date) / 1000) + mc_expiry)
        .execAsync();
  }

  static getMcVideosByPlaylistId(playlist_id, client) {
    return client.hgetAsync("personalization_mc_videos", playlist_id);
  }

  static setMcVideosByPlaylistId(playlist_id, data, client) {
    return client.multi()
      .hset("personalization_mc_videos" , playlist_id , JSON.stringify(data))
        .expireat("personalization_mc_videos", parseInt((+new Date) / 1000) + mc_expiry)
        .execAsync();
  }


}