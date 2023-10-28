const Utility = require('./Utility');
const config = {
    login: process.env.WHATSAPP_LOGIN,
    password: process.env.WHATSAPP_PASSWORD
}

function waitForSecs() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('wait');
            resolve(true);
        }, 1000);
        // reject(e)
    });
}

exports.handler = async (event) =>{
    try{
        // console.log('------>>>', JSON.parse(event.Records).length);
        if (!event.Records.length) {
            return;
        }
            
           for (let i=0; i<event.Records.length; i++){
               let typeOfMedium = JSON.parse( event.Records[i].body).type;
               console.log('typeOfMedium', typeOfMedium);
               if(typeOfMedium=='text'){
                  
                    let phone = JSON.parse(event.Records[i].body).phone;
                    let event_name = JSON.parse(event.Records[i].body).event_name;
                    let msg = JSON.parse(event.Records[i].body).msg;
                    await Utility.sendWhatsAppMessage(phone, msg,event_name, config);
                    
               }
               else if(typeOfMedium == 'image'){
                    let phone = JSON.parse(event.Records[i].body).phone;
                    let msg = JSON.parse(event.Records[i].body).msg;
                    let caption = JSON.parse(event.Records[i].body).caption;
                    let event_name = JSON.parse(event.Records[i].body).event_name;
                    await Utility.sendImageOnWhatsApp(phone, msg, caption,event_name, config);
                    console.log('message-sent')
               }
               else{
                   console.log('Utility function not called');
               }
               await waitForSecs();
            }
    } catch(e){
        console.log('error', e);
    }
}

