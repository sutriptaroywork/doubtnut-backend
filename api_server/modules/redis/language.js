const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class Language {
  constructor() {
  }

  static getList(client) {
    return client.hgetAsync("config","languages")
  }
  static setList(languages, client) {
    console.log('set question in redis')
    return client.hsetAsync("config", "languages", JSON.stringify(languages))
  }
  static getByCode(code,client) {
    return client.hgetAsync("language",code)
  }
  static setByCode(code,languages, client) {
    console.log('set question in redis')
    return client.hsetAsync("language", code, JSON.stringify(languages))
  }

  static getLanguageByCode(client, code) {
    return client.hgetAsync("language_new_onboarding", code)
  }
  static setLanguageByCode(client, code, languages) {
    console.log('set question in redis')
    return client.hsetAsync("language_new_onboarding", code, JSON.stringify(languages))
  }
}


