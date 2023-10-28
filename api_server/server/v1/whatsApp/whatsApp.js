"use strict";
const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class insertNum {
  constructor() {
  }



static insertNum(phone_num, database) {
    let sql = "INSERT INTO `whatsapp_optins`(`phone_num`) VALUES ('"+phone_num+"')";
    console.log(sql);
    return database.query(sql);
  }};