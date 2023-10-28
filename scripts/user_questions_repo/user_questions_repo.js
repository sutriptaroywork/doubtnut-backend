"use strict";
const database = require('./database')
const moment = require("moment");
const conW = {
  host:"dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1"
  // timezone: "UTC+0"
}

const conR = {
	host:"analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
	user: "dn-prod",
	password: "D0ubtnut@2143",
	database: "classzoo1"
	// timezone: "UTC+0"
}

const mysqlW = new database(conW)
const mysqlR = new database(conR)
const limit = 10000
let offset = 0
main(mysqlW, mysqlR)

async function main(mysqlW, mysqlR){
	try{
		let questions=await getUserQuestions(mysqlR)
		if(questions.length > 0){
			offset = offset+limit
			// console.log(offset)
			// console.log(questions.length)
			// console.log(questions)
			for(let i=0; i<questions.length;i++){
				if(questions[i]['ocr_text'].length > 10){
					console.log(questions[i]["question_id"])
					console.log(questions[i]["timestamp"])
					let text = await replaceChars(questions[i]['ocr_text'])
				    let fullUrl= await ocrToUrl(text)
				    let url = fullUrl.substring(0,100);
				    let values= []
				    values.push(questions[i]['question_id'])
				    values.push(questions[i]['student_id'])
				    values.push(questions[i]['class'])
				    values.push(questions[i]['subject'])
				    values.push(questions[i]['book'])
				    values.push(questions[i]['chapter'])
				    values.push(questions[i]['doubt'])
				    values.push(questions[i]['question_image'])
				    values.push(questions[i]['ocr_text'].replace(/[^\x00-\x7F]/g, "").replace(/'/g, "\\'"))
				    values.push(questions[i]['original_ocr_text'].replace(/[^\x00-\x7F]/g, "").replace(/'/g, "\\'"))
				    values.push(fullUrl)
				    values.push(url)
				    values.push(new Date(questions[i]['timestamp']).toString())
				    values.push(questions[i]['locale'])
				    await insertToDB(values, mysqlW)
				}
			}
			main(mysqlW, mysqlR)
		}else{
			console.log("this is the end: " + new Date())
		}
	}catch(e){
		console.log("hi")
	    console.log(e)
	}
}

function replaceChars(text){
	if(text != null){
		// text = text.replace(/[^\x00-\x7F]/g, "");
		text = text.replace(new RegExp('{:\\[', "g"), "");
		text = text.replace(new RegExp('\\["', "g"), "");
	    text = text.replace(new RegExp('],\\[', "g"), "");
	    text = text.replace(new RegExp("]:}", "g"), "");
	    text = text.replace(new RegExp('"\\]', "g"), "");
	}
    return text
}

function getUserQuestions(mysqlW){
  let sql = "SELECT question_id, student_id, class, subject, book, chapter, doubt, question_image, ocr_text, original_ocr_text, timestamp, locale from questions where student_id > 100 and is_answered=0 and is_text_answered=0 and ocr_text is not null and original_ocr_text is not null LIMIT "+offset+","+limit
  // let sql = "SELECT question_id, student_id, class, subject, book, chapter, doubt, question_image, ocr_text, original_ocr_text, timestamp, locale from questions where question_id=6789"
  console.log(sql)
  return mysqlW.query(sql)
}

async function insertToDB(qValues, mysqlW){
	// console.log(qValues)
	// try{
	// 	var sql = "INSERT INTO  user_questions_web (question_id, student_id, class, subject, book, chapter, doubt, question_image, ocr_text, original_ocr_text, full_ocr_url, ocr_url, timestamp, locale) VALUES ('"+qValues[0]+"','"+qValues[1]+"','"+qValues[2]+"','"+qValues[3]+"','"+qValues[4]+"','"+qValues[5]+"','"+qValues[6]+"','"+qValues[7]+"','"+qValues[8]+"','"+qValues[9]+"','"+qValues[10]+"','"+qValues[11]+"','"+qValues[12]+"','"+qValues[13]+"')";
	//     console.log(sql)
	//     return mysqlW.query(sql)
	// }catch(e){
	// 	console.log("err")
	// 	console.log(e)
	// 	resolve()
	// }
	let date = moment(new Date(qValues[12])).format("YYYY-MM-DD HH:mm:ss")
  	var sql = "INSERT INTO  user_questions_web (question_id, student_id, class, subject, book, chapter, doubt, question_image, ocr_text, original_ocr_text, full_ocr_url, ocr_url, timestamp, locale) VALUES ('"+qValues[0]+"','"+qValues[1]+"','"+qValues[2]+"','"+qValues[3]+"','"+qValues[4]+"','"+qValues[5]+"','"+qValues[6]+"','"+qValues[7]+"','"+qValues[8]+"','"+qValues[9]+"','"+qValues[10]+"','"+qValues[11]+"','"+date+"','"+qValues[13]+"')";
    return new Promise(function (resolve, reject) {
        mysqlW.query(sql, function(err) {
            // conn.end();
            // if (err) reject(err) else resolve(true)
            // await removeFromQueue(questionMeta);
            if (err){
                console.log(err);
                // conn.end()
                resolve()
                // reject()
            }else{
                resolve() 
            }     
        });
    });
}

async function ocrToUrl(ocrText) {

    ocrText = replaceAll(ocrText, "`", "");
    ocrText = ocrText.replace(/<img[^>]+>/i, "");
    ocrText = replaceAll(ocrText, "<br>", "");
    ocrText = replaceAll(ocrText, '"', "");
    ocrText = replaceAll(ocrText, "&", " and ");
    ocrText = replaceAll(ocrText, "<=", " le ");
    ocrText = replaceAll(ocrText, ">=", " ge ");
    ocrText = replaceAll(ocrText, "->", " rarr ");
    ocrText = replaceAll(ocrText, ">", " gt ");
    ocrText = replaceAll(ocrText, "<", " lt ");
    ocrText = replaceAll(ocrText, " dot ", " ");
    ocrText = replaceAll(ocrText, "+", "-");
    ocrText = ocrText.replace(/[\n\r]/g, " ");
    ocrText = ocrText.replace(/\s+/g, " ");
    ocrText = ocrText.trim();
    ocrText = ocrText.replace(/[ ]{2,}|[\t]/g, " ");
    ocrText = ocrText.replace(/!\s+!/g, " ");
    ocrText = replaceAll(ocrText, "\xc2\xa0", ' ');
    ocrText = ocrText.replace(/\xc2\xa0/g, ' ');
    ocrText = ocrText.replace(/[[:^print:]]/g, '');
    ocrText = cleanString(ocrText);

    let urlText = ocrText.toLowerCase();

    urlText = replaceAll(urlText, " ", '-');
    urlText = replaceAll(urlText, "/", '-');
    urlText = replaceAll(urlText, "&", 'and');
    urlText = replaceAll(urlText, ".", '');

    urlText= hyphenize(urlText);

    urlText = replaceAll(urlText, "--", '-');
    return urlText;
}

function cleanString(string) {
    let utf8 = [
        {find:'[áàâãªä]', repl:'a'},
        {find:'[ÁÀÂÃÄ]' , repl:'A'},
        {find:'[ÍÌÎÏ]'  , repl:'I'},
        {find:'[íìîï]'  , repl:'i'},
        {find:'[éèêë]'  , repl:'e'},
        {find:'[ÉÈÊË]'  , repl:'E'},
        {find:'[óòôõºö]', repl:'o'},
        {find:'[ÓÒÔÕÖ]' , repl:'O'},
        {find:'[úùûü]'  , repl:'u'},
        {find:'[ÚÙÛÜ]'  , repl:'U'},
        {find:'ç'       , repl:'c'},
        {find:'Ç'       , repl:'C'},
        {find:'ñ'       , repl:'n'},
        {find:'Ñ'       , repl:'N'},
        {find:'–'       , repl:'-'}, // UTF-8 hyphen to "normal" hyphen
        {find:'[’‘‹›‚]' , repl:' '}, // Literally a single quote
        {find:'[“”«»„]' , repl:' '}, // Double quote
        {find:' '       , repl:' '}, // nonbreaking space (equiv. to 0x160)
        {find:'[–°“”‘’×—©ºð@Â€˜™¬]',repl:''}
    ];

    utf8.map((standard, index)=>{
        string = string.replace(new RegExp(standard.find, "ug"),standard.repl);
        //console.log('data from clean string ---> ',string);
    });
    return string;
}

function hyphenize(string){
    let dict = [
        {find:"I'm", repl:"I am"},
        {find:"thier" , repl:"their"}
    ];
    let array = [
        {find:'[\\s-]+', repl:'-'},
        {find:'[^A-Za-z0-9\-]+' , repl:''}
    ];
    dict.map((s, i)=>{
        string = string.replace(new RegExp(s.find, "g"),s.repl);
    });
    string = cleanString(string);
    array.map((s, i)=>{
        string = string.replace(new RegExp(s.find, "g"),s.repl);
    });
    string = decodeURI(string);
    return string;
}

function escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceAll(str, term, replacement) {
    return str.replace(new RegExp(escapeRegExp(term), 'g'), replacement);
    //return str.replace(new RegExp('/'+term+'/', 'g'), replacement);
}
