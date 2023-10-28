const bluebird = require("bluebird");
const redis = require("redis");
const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment');
var sendgrid = require("sendgrid")("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");
var helper = require('sendgrid').mail;
bluebird.promisifyAll(redis);

const filename = path.join(__dirname, 'output.csv');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;  
const csvWriter = createCsvWriter({  
  path: filename,
  header: [
    {id: 'key', title: 'Key'},
    {id: 'score', title: 'Score'}
  ]
});




const client = redis.createClient({
  host : '35.200.190.26',
  no_ready_check: true,
  auth_pass : 'neil@123'
})

client.on("connect", async function(){
  console.log("hello")
  let key="keywords_logs"
  let data=await getKeyLogdata(key,client)
  //console.log(data)
  let data1=[]
  for(let i=0;i<data.length;i++){
  	let datetime= moment.unix(data[2*i+1]).format("YYYY:MM:DD HH:mm:ss")
  	let temp={'key':data[2*i],'score':datetime}
  	data1.push(temp)
  }
  csvWriter.writeRecords(data1).then(async () => {
  	console.log("success")
  	await sendMail(sendgrid, "vivek@doubtnut.com", filename,helper)
  	await sendMail(sendgrid, "aditya@doubtnut.com", filename,helper)
    await client.del(key)
    client.quit()
  })

})

function getKeyLogdata(key,client){
	return client.zrangeAsync(key,0,-1,'WITHSCORES')
}

async function sendMail(sendgrid, toMail, tempFilePath, helper) {
return new Promise(async function (resolve, reject) {
  try{	

  let from_email = new helper.Email("vivek@doubtnut.com");
  let to_email = new helper.Email(toMail);
  let subject = "Key Logs for " + moment().subtract(1, 'd').format("YYYY-MM-DD");
  let content = new helper.Content("text/plain", "Report for " +""+ moment().subtract(1, 'd').format("YYYY-MM-DD"));
  var attachment = new helper.Attachment();
  var file1 = fs.readFileSync(tempFilePath);
  var base64File1 = new Buffer(file1).toString('base64');
  attachment.setContent(base64File1);
  attachment.setType('text/csv');
  attachment.setFilename(tempFilePath);
  attachment.setDisposition('attachment');
  let mail = new helper.Mail(from_email, subject, to_email, content);
  mail.addAttachment(attachment);
  var sg = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
   body: mail.toJSON()
  });

  sendgrid.API(sg, function (error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
    return resolve(mail)
  })
  }catch(e){
  console.log(e)
  reject(e)
 }
})
}
