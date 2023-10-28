"use strict";
const request = require("request")
module.exports = class VdoCipher {
  constructor(config) {
    this.vdo_secret = config.vdo_secret
  }
  getOtp(vdo_cipher_id) {
    let options = {
      method: 'POST',
      uri: 'https://dev.vdocipher.com/api/videos/' + vdo_cipher_id + '/otp',
      body: {
        // some: 'payload'
      },
      json: true,
      headers: {
        'authorization': 'Apisecret ' + this.vdo_secret
      }
    }
    return new Promise(function (resolve, reject) {
      // Do async job
      request(options, function (err, resp, body) {
        if (err) {
          reject(err)
        } else {
          resolve((body))
        }
      })
    })
  }
};
