const mongoConnection = require('./mongoDbConnection');
const request = require('request');

async function whatsAppLogs(obj){
    try{
            let db = await mongoConnection.getDbHandle();
            await db.collection('whatsapps').insertOne(obj);
            console.log('logging done')
    }catch(e){
        console.log('errorrrrrrr in logging',e)
    }

}

function sendWhatsAppMessage(phone_number, text, event, config) {
    // console.log("inside", config.whatsapp.login)
    // const self = this;
    let obj = {};
    obj.phone = phone_number
    obj.type = event;
    obj.data = text;
    return new Promise(((resolve, reject) => {
        const options = {
            method: 'GET',
            url: 'https://media.smsgupshup.com/GatewayAPI/rest',
            qs:
            {
                method: 'SendMessage',
                send_to: phone_number,
                msg: text,
                msg_type: 'DATA_TEXT',
                userid: config.login,
                auth_scheme: 'plain',
                data_encoding: 'Unicode_text',
                password: config.password,
                v: '1.1',
                format: 'text',
            },
        };

        request(options, async(error, response) => {
            if(error) reject(error);
            if (response.body.includes('success')) {
               
               await whatsAppLogs(obj);
               resolve(true)
                console.log('object with success' , obj)
            } else {
                console.log('object with no success ', obj)
                console.log(response.body)
                await whatsAppLogs(obj);
                resolve(false)
            }
        });
    }));
}

function sendImageOnWhatsApp(phone_number, urlImage, caption, event, config){
    let obj = {}
    // let data1 = {}
    obj.type = event
    obj.data = urlImage
    obj.phone = phone_number
    // data1 = obj
    return new Promise(async function (resolve, reject) {
      var options = {
        method: 'GET',
        url: 'https://media.smsgupshup.com/GatewayAPI/rest',
        qs:
          {
            method: "SendMediaMessage",
            send_to: phone_number,
            msg_type: "image",
            userid: config.login,
            auth_scheme: "plain",
            data_encoding: "Unicode_text",
            password: config.password,
            v: "1.1",
            format: "text",
            media_url: urlImage,
            caption: caption,
          }
      };
      request(options, async function (error, response, body) {
        if(response.body.includes('success')){

            console.log('Objecttttt', response.body);
            // console.loggingIn(obj)
            // console.loggingIn()(response.body)
            await whatsAppLogs(obj);
          resolve(true)
      }else{
          console.log('errrrrrrr', response.body)
        //   obj.response = response
        //   obj.success = '0'
          await whatsAppLogs(obj);
          resolve(false)
      }
      });
    });
  }
  

module.exports = {sendWhatsAppMessage, sendImageOnWhatsApp}