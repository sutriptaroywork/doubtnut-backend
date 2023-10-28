const mysql = require('mysql');
//create connection

// if (typeof client_write === 'undefined') {
	// client_write.connect();
// }
exports.handler = async (event, context) => {
	try {
		console.log(event);
		console.log('testsetset')
		let data = event.Records;
		var client_write = mysql.createConnection({ host: process.env.MYSQL_HOST_WRITE, user: process.env.MYSQL_USER_WRITE, password: process.env.MYSQL_PASS_WRITE, database: process.env.MYSQL_DB});
		let dataToInsertQuestionInit = [];
		for (let i = 0; i < data.length; i++) {
			console.log('data')
			console.log(data[i].body)
			let message = JSON.parse(data[i].body);
			if(typeof message.Message !== 'undefined' && typeof message.Message === 'string'){
				message = JSON.parse(message.Message);
			}
			dataToInsertQuestionInit.push(userMatchedQuestionsDataMaker(message));
		}
		// insert into db
		console.log('dataToInsertQuestionInit')
		console.log(dataToInsertQuestionInit)
		if (dataToInsertQuestionInit.length > 0) {
			let r = await bulkInsertIntoUserMatchedQuestions(client_write,dataToInsertQuestionInit);
			console.log(r)
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

function userMatchedQuestionsDataMaker (dataObject) {
	return {
		question_id: dataObject.question_id,
	};
};
function queryMaker(data){
	let cases = 'UPDATE user_questions_final SET matched_app_questions = (CASE question_id WHEN ';
	let questionIdArray = [];
	for(let i=0;i<data.length;i++){
		questionIdArray.push(data[i]['question_id']);
		if(i === (data.length - 1)){
			cases = cases + data[i]['question_id'] + ' then 1 end) WHERE question_id IN (?)';
		}else{
			cases = cases + data[i]['question_id'] + ' then 1 when ';
		}
	}
	return { query: cases, questionIdArray }
}
function bulkInsertIntoUserMatchedQuestions (client, dataToInsert) {
	return new Promise(async function (resolve, reject) {
		const { query,questionIdArray } = queryMaker(dataToInsert);
		console.log(query)
		console.log(questionIdArray)
		client.query(query, [questionIdArray], function (err) {
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
}
