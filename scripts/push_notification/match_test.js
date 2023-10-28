// const request = require('request')
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const elasticSearch = require('elasticsearch')
const fs = require('fs')
const https = require('https')
const request = require('request');
const {Translate} = require('@google-cloud/translate');
const projectId = 'doubtnut-vm';
const image2base64 = require('image-to-base64');
const vision = require("@google-cloud/vision");

const translate2 = new Translate({
  projectId: projectId,
});
const client = new elasticSearch.Client({
  host: "13.234.45.218:9200"
});
// let images = ["upload_9843128_1555653783.png","upload_9843512_1555654180.png","upload_9843436_1555654103.png","upload_9843532_1555654203.png","upload_9843510_1555654179.png","upload_9848399_1555659306.png","upload_9848391_1555659296.png","upload_9850714_1555662164.jpg","upload_9850712_1555662163.png","upload_5896682_1547128017.jpg"]
// let images = ["upload_10319984_1556522352.png", "upload_10320147_1556522581.png"]
// let images = ["59f45c87eb9a3.png"]
const database = require('./database');

console.log(config.mysql_analytics);
async function main(client) {
  try {
    const mysql = new database(config.mysql_analytics);
    // await searchTest2(client, mysql)
    // await indexDb(mysql,client)
    await insertOldOcr2(mysql)
  } catch (e) {
    console.log(e)
  }
}
function visionApi(url) {
  console.log(url);
  let client = new vision.ImageAnnotatorClient();
  return client.documentTextDetection(url);
}
async function searchTest(client, mysql) {
  let result = await getAll(client)
  let matched = 0
  let nomatched = 0
  for (let i = 0; i < result['hits']['hits'].length; i++) {
    //full ocr of question id
    let questionData = await getQuestionOcr(result['hits']['hits'][i]['_id'], mysql)
    // console.log(questionData[0]['ocr_text'])
    let ocr_text = replaceSpecialSymbol2(questionData[0]['ocr_text'])
    // let ocr_text = questionData[0]['ocr_text']
    let elasticResults = await searchQuery(ocr_text, client)
    // console.log("elasticResults")
    // console.log(elasticResults['hits']['hits'][0]['_id'])
    // for (let j = 0; j < elasticResults['hits']['hits'].length; j++) {

    if (elasticResults['hits']['hits'].length > 0) {
      // for (let j = 0; j < elasticResults['hits']['hits'].length; j++) {
      //   //check
      //   // if(result['hits']['hits'][i]['_id'])
      //   let pattern = /+ result["hits"]["hits"][i]["_id"] +/
      //
      // }
      if (elasticResults['hits']['hits'][0]['_id'] === result['hits']['hits'][i]['_id']) {
        // console.log('elastic qid')
        // console.log(elasticResults['hits']['hits'][0]['_id'])
        // console.log("actual")
        // console.log(result['hits']['hits'][i]['_id'])
        matched = matched + 1
        console.log(matched)
      } else {
        nomatched = nomatched + 1
      }
    }
  }
  console.log("matched = " + matched)
  console.log("nomatched = " + nomatched)
  // }
}
async function searchTest2(client,mysql){
  try {
    let questionsTestData = await getSearchDataSet(mysql)
    // console.log("questionsTestData")
    // console.log(questionsTestData)
    let matched = 0
    let nomatched = 0
    for (let i = 0; i < questionsTestData.length; i++) {
      let matched_question_id = questionsTestData[i]['matched_question_id']
      let ocr = questionsTestData[i]['original_ocr_text']

      // console.log(matched_question_id)
      // console.log(ocr)
      let elasticResults = await searchQuery(ocr, client)
      console.log(ocr)
      console.log(questionsTestData[i]['question_id'])
      // console.log("result length")
      // console.log(elasticResults)
      if (elasticResults['hits']['hits'].length > 0) {
        for (let j = 0; j < elasticResults['hits']['hits'].length; j++) {
          if (elasticResults['hits']['hits'][j]['_id'] == matched_question_id) {
            matched = matched + 1
            console.log(matched)
          } else if(j===4) {
            console.log("no matched")
            nomatched = nomatched + 1
          }
        }
      }
    }
    console.log("matched = " + matched)
    console.log("nomatched = " + nomatched)
  }catch(e){
    console.log(e)
  }
}
function replaceSpecialSymbolWithBackTick(text) {
  text = text.replace(new RegExp("\\*", "g"), "xx");
  text = text.replace(new RegExp("√", "g"), "sqrt");
  text = text.replace(new RegExp("π", "g"), "pi");
  text = text.replace(new RegExp("÷", "g"), ":-");
  text = text.replace(new RegExp("×", "g"), "xx");
  text = text.replace(new RegExp("∆", "g"), "Delta");
  text = text.replace(new RegExp("°", "g"), "^@");
  text = text.replace(new RegExp("<", "g"), "lt");
  text = text.replace(new RegExp(">", "g"), "gt");
  text = text.replace(new RegExp("<=", "g"), "le");
  text = text.replace(new RegExp(">=", "g"), "ge");

  text = text.replace(new RegExp("& dd; ", "g"), "d");
  text = text.replace(new RegExp("& compfn;", "g"), "@");
  text = text.replace(new RegExp("&dd;", "g"), "d");
  text = text.replace(new RegExp("&compfn;", "g"), "@");
  text = text.replace(new RegExp("\n", "g"), "");
  text = text.replace(new RegExp("\r", "g"), "");
  text = text.replace(new RegExp('"', "g"), "");
  text = text.replace(new RegExp("α", "g"), "alpha");
  text = text.replace(new RegExp("β", "g"), "beta");
  text = text.replace(new RegExp("ß", "g"), "beta");
  text = text.replace(new RegExp("θ", "g"), "theta");
  text = text.replace(new RegExp("°", "g"), "^@");
  text = text.replace(new RegExp("γ", "g"), "gamma");
  text = text.replace(new RegExp("δ", "g"), "delta");
  text = text.replace(new RegExp("Δ", "g"), "Delta");
  text = text.replace(new RegExp("φ", "g"), "phi");
  text = text.replace(new RegExp("ω", "g"), "omega");
  text = text.replace(new RegExp("Ω", "g"), "Omega");
  text = text.replace(new RegExp("λ", "g"), "lambda");
  text = text.replace(new RegExp("μ", "g"), "mu");
  text = text.replace(new RegExp("Σ", "g"), "sum");
  text = text.replace(new RegExp("Π", "g"), "prod");
  text = text.replace(new RegExp("→", "g"), "vec");
  text = text.replace(new RegExp("∞", "g"), "oo");
  text = text.replace(new RegExp("√", "g"), "sqrt");
  text = text.replace(new RegExp("& sol;", "g"), "/");
  text = text.replace(new RegExp("& ell; ", "g"), "l");
  text = text.replace(new RegExp("& dd x", "g"), "dx");
  text = text.replace(new RegExp("& dd y", "g"), "dy");

  text = text.replace(new RegExp('{:\\[', "g"), "");
  text = text.replace(new RegExp('],\\[', "g"), "");
  text = text.replace(new RegExp("]:}", "g"), "");
  // text = text.replace(new RegExp('"', "g"), "");
  text = text.replace(new RegExp('\'', "g"), "");


  return text;
}
function replaceSpecialSymbolWithoutBackTick(text) {
  text = text.replace(new RegExp("\\*", "g"), "xx");
  text = text.replace(new RegExp("√", "g"), "sqrt");
  text = text.replace(new RegExp("π", "g"), "pi");
  text = text.replace(new RegExp("÷", "g"), ":-");
  text = text.replace(new RegExp("×", "g"), "xx");
  text = text.replace(new RegExp("∆", "g"), "Delta");
  text = text.replace(new RegExp("°", "g"), "^@");
  text = text.replace(new RegExp("<", "g"), "lt");
  text = text.replace(new RegExp(">", "g"), "gt");
  text = text.replace(new RegExp("<=", "g"), "le");
  text = text.replace(new RegExp(">=", "g"), "ge");

  text = text.replace(new RegExp("& dd; ", "g"), "d");
  text = text.replace(new RegExp("& compfn;", "g"), "@");
  text = text.replace(new RegExp("&dd;", "g"), "d");
  text = text.replace(new RegExp("&compfn;", "g"), "@");
  text = text.replace(new RegExp("\n", "g"), "");
  text = text.replace(new RegExp("\r", "g"), "");
  // text = text.replace(new RegExp('"', "g"), "");
  text = text.replace(new RegExp("α", "g"), "alpha");
  text = text.replace(new RegExp("β", "g"), "beta");
  text = text.replace(new RegExp("ß", "g"), "beta");
  text = text.replace(new RegExp("θ", "g"), "theta");
  text = text.replace(new RegExp("°", "g"), "^@");
  text = text.replace(new RegExp("γ", "g"), "gamma");
  text = text.replace(new RegExp("δ", "g"), "delta");
  text = text.replace(new RegExp("Δ", "g"), "Delta");
  text = text.replace(new RegExp("φ", "g"), "phi");
  text = text.replace(new RegExp("ω", "g"), "omega");
  text = text.replace(new RegExp("Ω", "g"), "Omega");
  text = text.replace(new RegExp("λ", "g"), "lambda");
  text = text.replace(new RegExp("μ", "g"), "mu");
  text = text.replace(new RegExp("Σ", "g"), "sum");
  text = text.replace(new RegExp("Π", "g"), "prod");
  text = text.replace(new RegExp("→", "g"), "vec");
  text = text.replace(new RegExp("∞", "g"), "oo");
  text = text.replace(new RegExp("√", "g"), "sqrt");
  text = text.replace(new RegExp("& sol;", "g"), "/");
  text = text.replace(new RegExp("& ell; ", "g"), "l");
  text = text.replace(new RegExp("& dd x", "g"), "dx");
  text = text.replace(new RegExp("& dd y", "g"), "dy");
  text = text.replace(new RegExp('{:\\[', "g"), "");
  text = text.replace(new RegExp('],\\[', "g"), "");
  text = text.replace(new RegExp("]:}", "g"), "");
  // text = text.replace(new RegExp('"', "g"), "");
  text = text.replace(new RegExp('\'', "g"), "");


  return text;
}
function searchQuery(ocr_text, client) {
  return client.search({
    index: "ocr_break_test",
    type: "answered_index",
    size: 5,
    ignore: [400, 404],
    body: {
      query: {
        "multi_match": {
          "query": ocr_text,
          "type": "cross_fields",
          "fields": [
            "equation",
            "text",
            "ocr_text"
          ]
        }
      }
    }
  })
}
function searchQuery5(ocr_text, client) {
  return client.search({
    index: "ocr_break_test",
    type: "answered_index",
    size: 5,
    ignore: [400, 404],
    body: {
      query: {
        "match": {
          "ocr_text": ocr_text,
        }
      }
    }
  })
}
function searchQuery2(ocr_text, client) {
  return client.search({
    index: "ocr_break_test",
    type: "question_ocr",
    size: 10,
    ignore: [400, 404],
    body: {
      query: {
        "match": {
          "ocr_without_quotes.edgengram": ocr_text
        }
      }
    }
  })
}
function searchQuery3(ocr_text, client) {
  return client.search({
    index: "ocr_break_test",
    type: "answered_index",
    size: 5,
    ignore: [400, 404],
    body: {
      query: {
        bool: {
          must: {
            match: {
              ocr_text: {
                query: ocr_text,
                minimum_should_match: "0%"
              }
            }
          },
          should: {
            match_phrase: {
              ocr_text: {
                "query": ocr_text,
                "slop": 50
              }
            }
          }
        }
      }
    }
  })
}
function searchQuery4(ocr_text, client) {
  return client.search({
    index: "ocr_break_test",
    type: "answered_index",
    size: 5,
    ignore: [400, 404],
    body: {
      query: {
        query_string: {
          "query": ocr_text,
          "fields": [
            "ocr_text"
          ],
          "minimum_should_match": "0%"
        }
      }
    }
  })
}
function getQuestionOcr(question_id, mysql) {
  let query = "select * from raw_ocr where question_id = " + question_id
  return mysql.query(query)
}
function getAll(client) {
  return client.search({
    index: "ocr_break_test",
    type: "question_ocr",
    size: 1000,
    ignore: [400, 404],
    body: {
      query: {
        "match_all": {}
      }
    }
  })
}
async function indexDb(mysql, client) {
  let results = await getOcr(mysql)
// console.log(results.length)
  for (let i = 25639; i < results.length; i++) {
    console.log(i)
    console.log(results[i]['question_id'])
    let index = []
    let text_ocr = divide(results[i])
    // console.log(text_ocr)
    let base = {index: {_index: 'ocr_break_test', _type: 'answered_index', _id: results[i]['question_id']}}
    index.push(base)
    index.push({
      "text": text_ocr['text'],
      "equation": text_ocr['equation'],
      "ocr_text": text_ocr['ocr_text'],
    })
    await addIndex(client, index)
  }
}
function addIndex(client, data) {
  return new Promise((resolve, reject) => {
    client.bulk({
      body: data
    }, function (err, resp) {
      console.log("err")
      console.log(err)
      if (err) {
        return reject(err)
      }
      console.log("resp")
      console.log(resp)
      return resolve(resp)
    });
  });

}
main(client)
function addBackTick(ocr_text) {
  ocr_text = ocr_text.replace(new RegExp('{:\\[', "g"), '');
  ocr_text = ocr_text.replace(new RegExp('],\\[', "g"), '');
  ocr_text = ocr_text.replace(new RegExp("]:}", "g"), '');
  ocr_text = ocr_text.split('"')
  console.log("text")
  console.log(ocr_text)
  for (let j = 0; j < ocr_text.length; j++) {
    if (j % 2 != 0) {
    } else {
      console.log(j)
      if (ocr_text[j].length > 0) {
        ocr_text[j] = "`" + ocr_text[j] + "`"
      }
    }
  }
  ocr_text = ocr_text.join('')
  return ocr_text
}
function divide(questionData) {
  let ocr_text = questionData['ocr_text']
  ocr_text = ocr_text.replace(new RegExp('{:\\[', "g"), '');
  ocr_text = ocr_text.replace(new RegExp('],\\[', "g"), '');
  ocr_text = ocr_text.replace(new RegExp("]:}", "g"), '');
  // console.log("ocr+complete")
  // console.log(ocr_text)
  let text='',equation=''
  if(questionData['ocr_done'] === 0){
    ocr_text = replaceSpecialSymbolWithBackTick(ocr_text)
    //backtick case
    console.log("backtick")
    let ocr_back_tick_array = ocr_text.split('`')
    for(let i=0;i<ocr_back_tick_array.length;i++){
      if(i%2 === 0){
        //text
        // console.log("text")
        // console.log(ocr_back_tick_array[i])
        text = text + ' '+ ocr_back_tick_array[i]
      }else{
        //equation
        // constole.log("equation")
        // console.log(ocr_back_tick_array[i])
        equation = equation + ' '+ ocr_back_tick_array[i]
      }
    }
    //remove backtick also
    ocr_text = ocr_text.replace(new RegExp("`", "g"), "");
    return {
      "text":text.trim(),
      "equation":equation.trim(),
      "ocr_text":ocr_text.trim()
    }
  }else if(questionData['ocr_done'] === 1){
    ocr_text = replaceSpecialSymbolWithoutBackTick(ocr_text)

    //double quotes case
    let ocr_text1 = ocr_text.split('"')
    // console.log("text")
    // console.log(ocr_text)
    // let text = ''
    // let ocr = ''
    for (let j = 0; j < ocr_text1.length; j++) {
      if (j % 2 != 0) {
        // console.log("textSplit")
        // console.log(ocr_text[j])
        if (ocr_text1[j].length > 0) {
          text = text + ' ' + ocr_text1[j]

        }
      } else {
        // console.log("ocrSplit")
        // console.log(ocr_text[j])
        if (ocr_text1[j].length > 0) {
          // ocr_text[j] = " " + ocr_text[j]
          equation = equation + ' ' + ocr_text1[j]
        }
      }
    }
    ocr_text = ocr_text.replace(new RegExp("\"", "g"), "");
    return {
      "text":text.trim(),
      "equation":equation.trim(),
      "ocr_text":ocr_text.trim()
    }
  }else if(questionData['ocr_done'] === 2){
    //direct index
    text = ocr_text
    return {
      "text":text.trim(),
      "equation":equation.trim(),
      "ocr_text":ocr_text.trim()
    }
  }
}

function mathpixOcr2(fileName) {
  // let url = "https://d10lpgp6xz60nq.cloudfront.net/images/" + fileName;
  // console.log(url)
  let url = fileName
  // let url = "https://doubtnutvideobiz.blob.core.windows.net/q-images/" + fileName;
  let options = {
    method: "POST",
    uri: "https://api.mathpix.com/v3/latex",
    body: {
      url: url,
      "formats": ["asciimath", "text"],
      "ocr": ["math", "text"]
    },
    json: true,
    headers: {
      app_id: "aditya_doubtnut_com",
      app_key: "500f7f41d6ef6141251a",
      "Content-Type": "application/json"
    }
  };
  return new Promise(function (resolve, reject) {
    // Do async job
    request(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}
function httpVisionApi(image) {
  // console.log(image)
  let url = "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyD4Os4iXuGWAfJySVk4IW_2KLoe5DtVI2k"
  let options = {
    method: "POST",
    uri: url,
    body: {
      "requests": [
        {
          "image": {
            "content": image
          },
          "features": [
            {
              "type": "DOCUMENT_TEXT_DETECTION"
            }
          ]
        }
      ]
    },
    json: true,
    headers: {
      // app_id: "aditya_doubtnut_com",
      // app_key: "500f7f41d6ef6141251a",
      "Content-Type": "application/json"
    }
  };
  // let client = new vision.ImageAnnotatorClient();
  // return client.webDetection(url);
  return new Promise(function (resolve, reject) {
    // Do async job
    request(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}
function mathpixOcrOld(question_id) {
  let url = "https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/"+question_id+".png";
  // let url = "https://d10lpgp6xz60nq.cloudfront.net/images/upload_10418888_1556703017.png"
  console.log(url)
  let options = {
    method: "POST",
    uri: "https://api.mathpix.com/v3/latex",
    body: {
      url: url,
      format: {
        mathml: true
      }
    },
    json: true,
    headers: {
      app_id: "aditya_doubtnut_com",
      app_key: "500f7f41d6ef6141251a",
      "Content-Type": "application/json"
    }
  };
  return new Promise(function (resolve, reject) {
    // Do async job
    request(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}
function latexToAscii(latex) {
  return new Promise(function (resolve, reject) {
    // Do async job
    // request(options, function (err, resp, body) {
    //   if (err) {
    //     reject(err)
    //   } else {
    //     resolve(body)
    //   }
    // })
    console.log(latex)
    request.post(
      {
        url: "http://35.200.190.26:5000/convert",
        form: {latex: latex}
      },
      function (err, httpResponse, body) {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      }
    );
  });
}
async function insertNewOcr(mysql) {
  try {
    let questionData = await getSampleQuestions(mysql)
    console.log("questionData")
    let ocr, locale
    console.log(questionData)
    for (let i = 0; i < questionData.length; i++) {
      // console.log(questionData[i]['question_image'])
      let fileName = questionData[i]['question_image']
      let latex = await mathpixOcr2(fileName);

      //check for handwritten


      //check if ocr2 is coming
      if ((typeof latex.asciimath !== 'undefined') && (latex.asciimath.length > 0)) {
        ocr = latex.asciimath
        console.log('ocr2')
        ocr = replaceSpecialSymbol2(ocr)
        console.log(ocr)

        await updateOcr(questionData[i]['question_id'],ocr,mysql)
      } else {
        console.log('vision')
        // request.get('https://d10lpgp6xz60nq.cloudfront.net/images/upload_6021307_1547530677.jpg', async function (error, response, body) {
        //     if (!error && response.statusCode == 200) {
        // you can also to use url

        // let question_image = new Buffer(body).toString('base64')
        // let question_image = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
        // let question_image = await image2base64(questionData[i]['question_image'])
        // console.log("question_image")
        // console.log(question_image)
        //do ocr1
        // let visionApiResp = await httpVisionApi(question_image)
        // console.log("visionApiResp")
        let visionApiResp = await visionApi(questionData[i]['question_image'])
        // console.log(visionApiΩnApiResp)
        // visionApiResp = visionApiResp['responses']
        if (typeof visionApiResp[0]['fullTextAnnotation'] !== 'undefined' && visionApiResp[0]['fullTextAnnotation'] !== null) {
          console.log(visionApiResp[0]['textAnnotations'][0]['description'])

          ocr = visionApiResp[0]['textAnnotations'][0]['description']
          locale = visionApiResp[0]['textAnnotations'][0]['locale']
        } else {
          console.log("no detection")
          ocr = ""
        }
        if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
          if (ocr !== "") {
            let transLateApiResp = await translateApi2(ocr, translate2)
            if (transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined && transLateApiResp[1]['data']['translations'] !== undefined && transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined) {
              ocr = transLateApiResp[1]['data']['translations'][0]['translatedText']
              ocr = replaceSpecialSymbol2(ocr)
              console.log("translate")
              console.log(ocr)
              await updateOcr(questionData[i]['question_id'],ocr,mysql)
            }
          }else{
            ocr = replaceSpecialSymbol2(ocr)
            console.log("no translate")
            console.log(ocr)

            // await updateOcr(questionData[i]['question_id'], ocr, mysql)
            // console.log('updated ' + questionData[i]['question_id'])
          }
        } else {
          ocr = replaceSpecialSymbol2(ocr)
          console.log(ocr)

          await updateOcr(questionData[i]['question_id'], ocr, mysql)
          console.log('updated ' + questionData[i]['question_id'])
        }
      }
      // })
    }
  } catch (e) {
    console.log('e')
    console.log(e)
  }
}
async function insertOldOcr2(mysql){
  let questionData = await getOcr(mysql)
  // console.log("questionData")
  // console.log(questionData)
  for(let i=0;i<questionData.length;i++){
    console.log(questionData[i]['question_id'])
   let latex =  await mathpixOcrOld(questionData[i]['question_id'])
    console.log("latex")
    console.log(latex)
    if(typeof latex.latex !== 'undefined' && latex.latex.length > 0){
      console.log('not errr')
      latex = latex.latex
      let latexToAsciii = await latexToAscii(latex);
      console.log("latexto ascii")
      console.log(latexToAsciii)
    //update row
      await updateOcr(questionData[i]['question_id'],latexToAsciii,mysql)
    }else{
      console.log('errr')
    }
  }
  
}
function translateApi2(text, translate) {
  return translate.translate(text, "en");
}
function getOcr(mysql) {

  let query = "select * from raw_ocr where old_ocr2_text is null and ocr_done <> 2 order by" +
    " question_id" +
    " asc"
  return mysql.query(query)
}
function getSampleQuestions(mysql) {
  let query = "select * from ocr_test_dataset where new_ocr_text is null order by question_id desc limit 1000"
  return mysql.query(query)
}
function updateOcr(question_id, ocr, mysql) {
  let query = "update ocr_test_dataset set old_ocr2_text= '" + ocr + "' where question_id = " + question_id
  return mysql.query(query)

}
function getSearchDataSet(mysql){
  let query = "select * from ocr_test_dataset where new_ocr_text is not null and new_ocr_text <> '' order by" +
    " question_id" +
    " desc limit 1000"
  return mysql.query(query)
}

//full_ocr_test2 - without space
//ocr_break_test - with space


// ocr_done = 0  // with backtick
// ocr_done = 1  // ocr2
// ocr_done = 2 // viral video