const _ = require('lodash')

var dateUTC = new Date();
var dateUTC = dateUTC.getTime()
var dateIST = new Date(dateUTC);
//date shifting for IST timezone (+5 hours and 30 minutes)
dateIST.setHours(dateIST.getHours() + 5);
dateIST.setMinutes(dateIST.getMinutes() + 30);
let today = dateIST
let dd = String(today.getDate()).padStart(2, '0');
let mm = String(today.getMonth() + 1).padStart(2, '0');
let yyyy = today.getFullYear();
today = mm + '/' + dd + '/' + yyyy;
let date = today
let todayEnd = new Date(dateIST)
todayEnd.setHours(23);
todayEnd.setMinutes(59);
todayEnd.setSeconds(59);
let hash_expiry = Math.floor((todayEnd -dateIST) / 1000)

console.log('hash_expiry ::: ',hash_expiry)

module.exports = class Student {
  constructor() {
  }
  static getListingDetails(structuredCourseId, student_class, client) {
    return client.hgetAsync("live_videos_"+student_class, structuredCourseId)
  }
  static setListingDetails(structuredCourseId, student_class, data, client) {
    // return client.hsetAsync("live_videos", structuredCourseId, JSON.stringify(data))

    return client.multi()
        .hset("live_videos_"+student_class, structuredCourseId, JSON.stringify(data))
        .expire("live_videos_"+student_class, hash_expiry)
        .execAsync()
    }
}
