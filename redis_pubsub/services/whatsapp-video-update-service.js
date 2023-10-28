'use strict';
var request = require('request');
// const Students = require('../../api_server/modules/student')
const mysqlStudent = require("../../api_server/modules/mysql/student");

module.exports = class WhatsappVideoUpdateService {
    constructor(config) {
        this.config=config
    }

    async run(message, db) {
        try {
            console.log(message.whatsapp_stu_id)
            console.log(message.student_id)
            let wha_student_id = message.whatsapp_stu_id
            let student_id = message.student_id
            let studentDetails = await mysqlStudent.getById(wha_student_id, db.mysql.read)
            console.log(studentDetails)
            let student_phone = studentDetails[0]["mobile"]
            await mysqlStudent.updatePhone(student_phone,student_id, db.mysql.write)
            let students = await mysqlStudent.getAllStudentsByPhone(student_phone, db.mysql.read)
            let promises = []
            if(students.length > 1){
                let lowestStudentId = students[0]["student_id"]
                console.log(lowestStudentId)
                for(let i=1; i<students.length;i++ ){
                    console.log(students[i]["student_id"])
                    promises.push(mysqlStudent.updateQuestions(lowestStudentId, students[i]["student_id"], db.mysql.write))
                    promises.push(mysqlStudent.updateVideos(lowestStudentId, students[i]["student_id"], db.mysql.write))
                    

                }
            }
            promises.push(mysqlStudent.insertWhatsappMapping(wha_student_id, student_id, db.mysql.write))
            await Promise.all(promises)
        }
        catch (e) {
            console.log(e)
        }
    }
}