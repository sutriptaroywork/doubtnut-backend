
"use strict";

const faker = require('faker');
const moment = require('moment');
const mysql = require('mysql');
const _ = require('lodash');
// const randomstring = require('randomstring');
const database = require('./database');
// Load Chance
const Chance = require('chance');
const Utitlity = require('../../api_server/modules/utility');

// Instantiate Chance so it can be used
const chance = new Chance();
const pool = "qwertyuiopasdfghjlkzxcvbnm1234567890"
const config = {
  host: "52.187.1.240",
  user: "name",
  password: "abc123",
  database: "classzoo1"
}

// let db = new database(config)
let db = mysql.createConnection(config);
db.connect(function (err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + db.threadId);
  main(db)
});
function getStudents(db, cb) {
  let sql = "select student_id from students where student_username is null order by student_id ASC";
  db.query(sql, function (error, results, fields) {
    cb(results)
  })
}

function updateUserName(students, updateCount, db, cb) {
  // console.log(students.length)
  if (students.length === 0) {
    console.log("zero length")
    cb(false, updateCount)
  } else {
    console.log(students.length)
    let user_name = Utitlity.generateUsername(0).toLowerCase();
    let update_sql = "update students set student_username='" + user_name + "' where student_id =" + students[0]['student_id'];
    console.log(update_sql)
    db.query(update_sql, function (error, results, fields) {
      students.splice(0, 1)
      updateCount = updateCount + 1
      console.log(students.length)
      process.nextTick(function () {
        updateUserName(students, updateCount, db, function (err, count) {
          process.nextTick(function () {
            cb(false, count);
          })
        })
      })
    })
  }
}

function main(db) {
  let startTime = new Date();
  getStudents(db, function (students) {
    console.log(students.length)
    let updateCount = 0;
    // console.log('1')
    let clonedStudents = _.cloneDeep(students);
    updateUserName(clonedStudents, updateCount, db, function (err, count) {
      if (err === 0) {
        let endTime = new Date();
        console.log("Total " + count + " updated in " + (startTime.getTime() - endTime.getTime()))
      }
    })
  })
}



