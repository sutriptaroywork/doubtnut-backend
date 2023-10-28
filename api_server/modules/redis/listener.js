"use strict";
module.exports = class Listener {
  constructor(redis) {
    this.client = redis
  }

  listen() {
// Attach a listener to receive new messages as soon as subscribe to a channel.
    this.client.on('message', function(channel, message) {
      // message is json string in our case so we are going to parse it.
      try {
        const json = JSON.parse(message)

        console.log("sub")

        console.log(json)
        console.log(channel)
        // json.csrfToken is our csrfToken we have created in our frontend server!
      } catch (e) {
        // This error indicates that we receive a message that is not in the json format.
      }
    })
  }
  subscribe(channelName){
    this.client.subscribe(channelName)
  }

};
