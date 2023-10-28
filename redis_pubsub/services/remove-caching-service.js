// const _ = require('lodash');
// const Student = require('../../api_server/modules/student')
// const Question = require('../../api_server/modules/question')
// const Utility = require('../../api_server/modules/utility')
// const VideoViewContainer = require('../../api_server/modules/containers/videoView')
// const Notification = require('../../api_server/modules/notifications')
// const Milestones = require('../../api_server/modules/mysql/milestones')

// const moment = require('moment')
module.exports = class RemoveCachingService {
  constructor(config) {
    this.config = config
  }
  async run(message, db) {
    console.log(message)
    console.log('run')
    try {
      let type = message.type
      if (type === "homepage") {
        let pattern = message.pattern
        let keysData = await this.getPatternKeys(pattern, db.redis.read);
        if(keysData.length>0){
          for(let i=0; i<keysData.length; i++){
            await this.removePatternKeys(keysData[i],db.redis.read);
          }
          console.log("keys deleted successfully");
        }

      }
    }
    catch (e) {
      console.log(e)
    }
  }
  async getPatternKeys(pattern, client){
    return client.keysAsync(pattern);
  }

  async  removePatternKeys(keysData,client){
    return client.delAsync(keysData);
  }
}



