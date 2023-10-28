const mysql = require('mysql');
//create connection

// if (typeof client_write === 'undefined') {
// 	var client_write = mysql.createConnection({ host: process.env.MYSQL_HOST_READ, user: process.env.MYSQL_USER_READ, password: process.env.MYSQL_PASS_READ, database: process.env.MYSQL_DB});
// 	client_write.connect();
// }
exports.handler = async (event, context) => {
	try {
		console.log(event);
		console.log('testsetset')
		let data = event.Records;
		let dataToInsertQuestionInit = [];
		var client_write = mysql.createConnection({ host: process.env.MYSQL_HOST_WRITE, user: process.env.MYSQL_USER_WRITE, password: process.env.MYSQL_PASS_WRITE, database: process.env.MYSQL_DB});
		client_write.connect();
		for (let i = 0; i < data.length; i++) {
			console.log('data')
			console.log(data[i].body)
			let message = JSON.parse(data[i].body);
			if(typeof message.Message !== 'undefined' && typeof message.Message === 'string'){
				message = JSON.parse(message.Message);
			}
			dataToInsertQuestionInit.push(questionInitDataMaker(message));
		}
		// insert into db
		console.log('dataToInsertQuestionInit')
		console.log(dataToInsertQuestionInit)
		//context.callbackWaitsForEmptyEventLoop = false;
		if (dataToInsertQuestionInit.length > 0) {
			let promise = []
			// promise.push(bulkInsertIntoQuestionInit(client_write,dataToInsertQuestionInit))
			// promise.push(bulkInsertIntoQuestionFinal(client_write,dataToInsertQuestionInit))
			let initFinalResponse = await bulkInsertIntoQuestionFinal(client_write,dataToInsertQuestionInit);
			console.log("initFinalResponse")
			console.log(initFinalResponse)
		}
		return new Promise(function (resolve, reject) {
			resolve('All Set');
		});
	} catch (e) {
		console.log(e);
		// conn.end();
		return new Promise(function (resolve, reject) {
			reject('Galat Scene');
		});
	}finally {
        // console.log(client_read)
        console.log(client_write)
        client_write.end(function(err){
          if (err) {
            console.log("write connection no closed")
            console.log(err)
          }else{
            console.log("write DB ended")
          }
        })
    }
};

function questionInitDataMaker (dataObject) {
	return [
		dataObject.uuid,
		dataObject.question_id,
		dataObject.student_id,
		dataObject.class,
		dataObject.subject,
		dataObject.book,
		dataObject.chapter,
		dataObject.question,
		dataObject.doubt,
		dataObject.locale,
		dataObject.asked_at];
};

function bulkInsertIntoQuestionFinal (client, dataToInsert) {
	return new Promise(async function (resolve, reject) {
		var sql = 'INSERT INTO user_questions_final (uuid,' +
			' question_id,' +
			' student_id,' +
			' class, subject, book, chapter, question, doubt, locale, timestamp) VALUES ?';
		client.query(sql, [dataToInsert], function (err) {
			console.log(err)
			if (err){
				if(err.code === 'ER_DUP_ENTRY'){
				return resolve(true);
			}
			return reject(err);
			}
			 return resolve(true);
		});
	});
};
