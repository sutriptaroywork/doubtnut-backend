/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2018-12-27 16:13:11
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-15 14:59:13
*/
"use strict";
const mysql = require('mysql');
module.exports = class Database {
  constructor(config) {
    this.connection = mysql.createPool(config);
  }

  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.getConnection(function (err, conn) {
        if (err) {
          // console.log(err)

          return reject(err);
        } else {
          conn.query(sql, args, (err, rows) => {
            if (err){
              // console.log(err)
              conn.release(err => {
                // if (err)
                // return reject(err);

              });
              return reject(err);
            } else {
              conn.release(err => {
                // if (err)
                // return reject(err);

              });
              resolve(rows);
            }
            // resolve(rows);
          });
        }
      })
    });
  }
  getConnection (cb) {
    return this.connection.getConnection(cb);
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.getConnection(function (err, conn) {
        if (err) {
          return reject(err);
        } else {
          conn.release(err => {
            if (err)
              return reject(err);
            resolve();
          });
        }
      })
    });
  }

};
