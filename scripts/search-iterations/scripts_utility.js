
/*
 * @Author: Meghna
 * @Email: meghna.gupta@doubtnut.com
 * @Date: 2020-10-22 14:48:31
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2020-10-22
 */
"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const sendgrid = require("sendgrid")(config.send_grid_key);
const helper = require('sendgrid').mail;
const fs = require("fs");
const { Parser } = require('json2csv');

module.exports = class Utility {

    static async sendTheMail(toMail, csvName, subject) {
        return new Promise(async function (resolve, reject) {
            let from_email = new helper.Email("autobot@doubtnut.com");
            let to_email = new helper.Email(toMail);
            let content = new helper.Content("text/plain", "PFA");
            var attachment = new helper.Attachment();
            var file = fs.readFileSync(csvName);
            var base64File = new Buffer(file).toString('base64');
            attachment.setContent(base64File);
            attachment.setType('text/csv');
            attachment.setFilename(csvName);
            attachment.setDisposition('attachment');
            let mail = new helper.Mail(from_email, subject, to_email, content);
            mail.addAttachment(attachment);
            var sg = sendgrid.emptyRequest({
              method: 'POST',
              path: '/v3/mail/send',
              body: mail.toJSON()
            }); 
            sendgrid.API(sg, function (error, response) {
              console.log(response.statusCode);
              console.log(response.body);
              console.log(response.headers);
              return resolve()
            })
        })
    }

    static async createCsv(data, fields, to_email_array, name, subject) {
        const that = this;
        return new Promise(async function (resolve, reject) {
            const JSONparser = new Parser({fields});
            const csv = JSONparser.parse(data);
            const csvName = name + '.csv'
            fs.writeFileSync(csvName, csv, 'utf8');
            for (let index = 0; index < to_email_array.length; index++) {
                const to_email = to_email_array[index];
                await that.sendTheMail(to_email, csvName, subject)
            }
            fs.unlinkSync(`./${csvName}`);
            return resolve()
        })
    }

}