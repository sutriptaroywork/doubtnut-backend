const Student = require('../../api_server/modules/student')
const Question = require('../../api_server/modules/question')
const QuestionContainer = require('../../api_server/modules/containers/question')
const Utility = require('../../api_server/modules/utility')
const QuestionMeta = require('../../api_server/modules/containers/questionsMeta')


module.exports = class TelegramService {
  constructor(config) {
    this.config = config
    // console.log(this.config)
  }

  async run(db, TelegramBot, moment, fs, dirname, request, translate) {
    const token = this.config.telegram_token;
    // Create a bot that uses 'polling' to fetch new updates
    const bot = new TelegramBot(token, {polling: true});
    // Matches "/echo [whatever]"
    // Matches "/echo [whatever]"
    bot.onText(/\/start/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message

      const chatId = msg.chat.id;
      const resp = match[1];
      // console.log(resp) // the captured "whatever" //comment this
      let message = "Hurray!!🤟\n" +
        "Doubt Killer se judne ke liye shukriya 😍✋\n" +
        "\n" +
        "Solution paane ke liye sirf 2 cheezon ka dhyan rakhe \n" +
        "\n" +
        "1) Phone se question ki photo khichkar 📸 aur crop karke hume send kijiye 📲\n" +
        "2) Crop kaise karna hai, uske liye di gayi video dekhiye 👉🏻\n" +
        "\n" +
        "Matlab, No confusion.... sirf solution 😃\n" +
        "\n" +
        "Let's Begin 😎"
      // send back the matched "whatever" to the chat
      bot.sendMessage(chatId, message);
      // setTimeout(function(){bot.sendDocument(chatId,"https://d10lpgp6xz60nq.cloudfront.net/intro-video/crop.gif")},0)
      setTimeout(function(){bot.sendVideo(chatId,"https://d10lpgp6xz60nq.cloudfront.net/intro-video/Crop.mp4")},0)

    });

// Listen for any kind of message. There are different kinds of
// messages.
//     bot.on('message', (msg) => {
//       const chatId = msg.chat.id;
//
//       // send a message to the chat acknowledging receipt of their message
//       bot.sendMessage(chatId, 'Received your message');
//     });
    let self = this
    bot.on('photo', async function (msg) {
      // console.log(msg)//comment this
      console.log('phto event')//comment this
      const chatId = msg.chat.id;
      bot.sendtId = msg.chat.id;
      bot.sendMessage(chatId, "Count to 3...2..1 🕚\n")

      try {
        
        var path = await bot.downloadFile(msg.photo[msg.photo.length - 2].file_id, "./public/img");
        // console.log(path);//comment this
        //upload to s3
        let extension = ".png", content_type
        if (path.indexOf("png") !== -1) {
       
          extension = ".png"
          content_type = "image/png"
        }
        else if (path.indexOf("jpg") !== -1 || path.indexOf("jpeg") !== -1) {
          
          extension = ".jpg"
          content_type = "image/jpg"
        }
        // console.log(extension)//comment this
        // console.log(content_type)//comment this
        const fileName = "upload_" + msg.message_id + "_" + moment().unix() + extension;
        console.log('xoxoxoxoxoxox', fileName);
        let promises = [], transLateApiResp, latex,
          latexToAscii, ocr,handwritten
         
        // console.log(dirname + "/" + path)//ubncomment this
        // console.log(__dirname)
        let data = await fs.readFileAsync(dirname + "/" + path)
        console.log('data',data)
        await Utility.uploadTos3(db.s3, self.config.aws_bucket, fileName, data, content_type)
        let text, locale


        // console.log(self.config.cdn_url + "images/" + fileName)//uncomment this 
        // let visionApiResp = await Utility.visionApi(path)
        // let text, locale
        // if (visionApiResp[0]['fullTextAnnotation'] !== null) {
        //   ocr = visionApiResp[0]['textAnnotations'][0]['description']
        //   locale = visionApiResp[0]['textAnnotations'][0]['locale']
        //
        // } else {
        //   ocr = ""
        // }
        // if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
        //   if (text !== "") {
        //     transLateApiResp = await self.translateApi(text, translate)
        //     if(transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined  && transLateApiResp[1]['data']['translations'] !== undefined &&  transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined ){
        //       text = transLateApiResp[1]['data']['translations'][0]['translatedText']
        //     }
        //   }
        // }
        // console.log("text")
        // console.log(text)
        // if (text.length <= 85) {
        //   latex = await Utility.mathpixOcrForService(self.config.cdn_url + "images/" + fileName);
        //   console.log("latex")
        //   console.log(latex)
        //     latex = latex.latex
        //   if (latex.length > 0) {
        //     latexToAscii = await Utility.latexToAscii(latex);
        //     console.log("latexToAscii")
        //     console.log(latexToAscii)
        //     latex = latexToAscii
        //   } else {
        //     latex = ""
        //   }
        //   if (text.length < 2 * latex.length) {
        //     ocr = latex;
        //   } else {
        //     ocr = latex + " " + text;
        //   }
        // } else {
        //   ocr = text;
        // }
        latex = await Utility.mathpixOcr2("", fileName);
        console.log('latex',latex)
        if((typeof latex["detection_map"] !== 'undefined') && (typeof latex["detection_map"]["is_printed"] !== 'undefined') && (latex["detection_map"]["is_printed"] < 0.8) ){
          // console.log('handwritten')//comment this
          handwritten = 1
        }

        //check if ocr2 is coming
        if((typeof latex.asciimath !== 'undefined') && (latex.asciimath.length > 0)){
          ocr = latex.asciimath
          console.log('ocr====>',ocr)//comment this
        }else{
          // console.log('ocr1')
          //do ocr1
          // let visionApiResp = await Utility.httpVisionApi(question_image)
          // visionApiResp = visionApiResp['responses']
          // if (typeof visionApiResp[0]['fullTextAnnotation'] !== 'undefined' && visionApiResp[0]['fullTextAnnotation'] !== null) {
          //   ocr = visionApiResp[0]['textAnnotations'][0]['description']
          //   locale = visionApiResp[0]['textAnnotations'][0]['locale']
          // } else {
          //   ocr = ""
          // }
          let visionApiResp = await Utility.visionApi(path)
          console.log('visionApiResp--',visionApiResp)
          if (visionApiResp[0]['fullTextAnnotation'] !== null) {
            ocr = visionApiResp[0]['textAnnotations'][0]['description']
            console.log('ocr -<>>>---', ocr)
            locale = visionApiResp[0]['textAnnotations'][0]['locale']

          } else {
            ocr = ""
          }
          if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
            if (ocr !== "") {
              transLateApiResp = await Utility.translateApi2(ocr,translate2)
              if(transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined  && transLateApiResp[1]['data']['translations'] !== undefined &&  transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined ){
                ocr = transLateApiResp[1]['data']['translations'][0]['translatedText']
                console.log('ocr -<>-------',ocr)
              }
            }
          }
          // if (text.length <= 85) {
          //   if (text.length < 2 * latex.length) {
          //     ocr = latex;
          //   } else {
          //     ocr = latex + " " + text;
          //   }
          // } else {
          //   ocr = text;
          // }
        }
        // return res.send(ocr2)
        ocr = Utility.replaceSpecialSymbol2(ocr)
        console.log('ocr',ocr)
        // ocr = Utility.replaceSpecialSymbol(ocr)
        let questionToInsert = {}
        questionToInsert["student_id"] = "1706545"
        questionToInsert["class"] = "12"
        questionToInsert["subject"] = "Mathematics"
        questionToInsert["book"] = "Mathematics"
        questionToInsert["chapter"] = "DEFAULT"
        questionToInsert["question"] = "about to only mathematics"
        questionToInsert["doubt"] = "about to only mathematics"
        questionToInsert["locale"] = locale
        questionToInsert["ocr_text"] = ocr
        questionToInsert["ocr_done"] = 1
        questionToInsert["original_ocr_text"] = ocr
        questionToInsert['question_image'] = fileName
        
        promises.push(Question.addQuestion(questionToInsert, db.mysql.write))
        promises.push(db.elasticClient.findByOcrService(ocr));
        let resolvedPromises = await Promise.all(promises)
        // console.log(resolvedPromises[0]['hits']['hits'])
        if (resolvedPromises[1]['hits']['hits'].length > 0) {
          let self2 = self
          let question, question_id
          bot.sendMessage(chatId, "Ye raha Solution aapka 😃\n")

          // resolvedPromises[1]['hits']['hits'].forEach(function (item) {
          // console.log(item)
          for(let i=0;i<resolvedPromises[1]['hits']['hits'].length;i++) {
            let question = await QuestionContainer.getByQuestionIdForCatalogQuestions(db,resolvedPromises[1]['hits']['hits'][i]['_id'])
            // .then(question => {
            //check matched
            if (question.length > 0) {
              if (question[0]['matched_question'] == null) {
                question_id = question[0]['question_id']
              } else {
                question_id = question[0]['matched_question']
              }
              let ocr_text = question[0]['ocr_text']
              let thumbnail = self2.config.cdn_url + "q-thumbnail/" + question_id + ".png"
              if (question.length > 0) {
                let url = await self2.generateDeepLink(question[0]['question_id'], thumbnail, ocr_text, request, self2.config)
                // .then(url => {
                // bot.sendMessage(chatId,url.url)
                let message = "Solution dekhne ke liye\n" +
                  "link click kijiye 👉🏻" +
                  url.url
                bot.sendPhoto(chatId, thumbnail, {caption: message});
                if (resolvedPromises[1]['hits']['hits'].length == i + 1) {
                  let msg = "For Free PDFs, study material,\n" +
                    "Tips & Tricks, Latest news\n" +
                    "Previous year papers and much more\n" +
                    "Join below groups - \n" +
                    "\n" +
                    "11th, 12th ( JEE,SSC & other exams)\n" +
                    "Link - t.me/IITjeedoubtsolverDOUBTNUT\n" +
                    "\n" +
                    "Class 6th to 10th \n" +
                    "Link - t.me/CBSEdoubtsolveDoubtNut"
                  setTimeout(function () {
                    bot.sendMessage(chatId, msg)
                  }, 5000)
                }
                // }).catch(er => {
                //
                // })

              }
              //   }).catch(error => {
              // })

            }
          }
          // });
        }
        else {
          console.log(2)
          //no match found
        }
      } catch (e) {
        console.log(e)
        bot.sendMessage(chatId, "Oh no! 😱\n" +
          "Kuch toh gadbad hai 😶\n" +
          "Try again please 🙂")
      }
    });


    // Listen for any kind of message. There are different kinds of
    // bot.on('message', (msg) => {
    //
    //   const chatId = msg.chat.id;
    //   console.log('message event')
    //   console.log(msg)
    //   if(typeof msg.new_chat_members !== 'undefined'){
    //     bot.sendMessage(chatId, 'this is a new member');
    //   }
    //   // let file = bot.downloadFile("AgADBQADhKgxG4h3OFYAAUBRND0QvlmHYdsyAASiBVraJUOptKMqAwABAg","/home/neil/Office/doubtnut_backend/backup").then(result => {
    //   // 	console.log("result")
    //   // 	console.log(result)
    //   // }).catch(error => {
    //   // 	console.log("error")
    //   // 	console.log(error)
    //   // })
    //   // console.log("file")
    //   // console.log(file)
    //   // console.log(msg);
    //   // if(typeof msg.text !== 'undefined'){
    //   // 	//text message
    //   //
    //   // }else if(typeof msg.photo !== 'undefined'){
    //   // 	//image message
    //   // 	// let file = bot.getFile("AgADBQADhKgxG4h3OFYAAUBRND0QvlmHYdsyAASiBVraJUOptKMqAwABAg")
    //   // 	// console.log("file")
    //   // 	// console.log(file)
    //   // }
    //   // send a message to the chat acknowledging receipt of their message
    //   // bot.sendMessage(chatId, 'this is a test message');
    // })

  }

  translateApi(text, translate) {
    // return translate(text, {to: 'en'})
    return translate
      .translate(text, "en")
  }

  async generateDeepLink(question_id, image_url, title, request, config) {
    //console.log(post_id)
    return new Promise(async function (resolve, reject) {
      try {
        var myJSONObject = {
          "branch_key": config.branch_key,
          "channel": "telegram",
          "feature": "video",
          "campaign": "TLA_VDO",
          "data": {
            "qid": question_id,
            "sid": 1706545,
            "page": "DEEPLINK",
            // "$og_title": title,
            "$og_image_url": image_url,
          }
        };
        console.log(myJSONObject)
        request({
          url: "https://api.branch.io/v1/url",
          method: "POST",
          json: true,   // <--Very important!!!
          body: myJSONObject
        }, function (error, response, body) {
          if (error) {
            // console.log(error);//uncomment this
          } else {
            console.log(body);//comment this
            return resolve(body)
          }
        });
      } catch (e) {
        console.log(e)
        return reject(e)
      }
    })
  }

}
// { message_id: 8,
//   from:
//   { id: 798655655,
//     is_bot: false,
//     first_name: 'neil',
//     language_code: 'en' },
//   chat: { id: 798655655, first_name: 'neil', type: 'private' },
//   date: 1548078093,
//     text: 'hi' }


// { message_id: 10,
//   from:
//   { id: 798655655,
//     is_bot: false,
//     first_name: 'neil',
//     language_code: 'en' },
//   chat: { id: 798655655, first_name: 'neil', type: 'private' },
//   date: 1548078109,
//     photo:
//   [ { file_id: 'AgADBQADy6gxG0SLMVZKzVaJvWf1ppl-3zIABNrGk2_jDo_g2ZEBAAEC',
//     file_size: 1547,
//     width: 67,
//     height: 90 },
//     { file_id: 'AgADBQADy6gxG0SLMVZKzVaJvWf1ppl-3zIABNEuFDD-k7JU2pEBAAEC',
//       file_size: 29010,
//       width: 240,
//       height: 320 },
//     { file_id: 'AgADBQADy6gxG0SLMVZKzVaJvWf1ppl-3zIABMEMl1qwxe4R2JEBAAEC',
//       file_size: 103365,
//       width: 720,
//       height: 960 },
//     { file_id: 'AgADBQADy6gxG0SLMVZKzVaJvWf1ppl-3zIABN0ph4s8ixy525EBAAEC',
//       file_size: 127127,
//       width: 600,
//       height: 800 } ] }
// AgADBQADhagxG4h3OFYzGmeJ2B-x-mxf2zIABMzH0pGaKu_lDjADAAEC