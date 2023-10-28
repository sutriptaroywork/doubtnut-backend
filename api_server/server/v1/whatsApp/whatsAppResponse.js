/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-shadow */
/* eslint-disable radix */
/* eslint-disable no-useless-escape */
/* eslint-disable camelcase */
/* eslint-disable eqeqeq */
/* eslint-disable no-restricted-globals */

// const Whatsapp = require('../../../modules/whatsapp');
// const request = require('request');
// eslint-disable-next-line no-unused-vars
const mysql = require('mysql');
const mathsteps = require('mathsteps');
const _ = require('lodash');
const axios = require('axios');
// const cp = require('child_process');
// const PushNot = require('../../../../scripts/push_notification/SendMessageToOptInUser');
// const pathForScript = `${__dirname}/../../../../scripts/push_notification/SendMessageToOptInUser`;
// const { InfluxDB } = require('influx');
const Utility = require('../../../modules/utility');
const utilityRedis = require('../../../modules/redis/utility.redis');
const message = require('../../../data/data');
const Question = require('../../../modules/question');
const Student = require('../../../modules/student');
const telemetry = require('../../../config/telemetry');
const StudentContainer = require('../../../modules/containers/student');

require('dotenv').config();

let db;


function checkForDivisionLibrary(str) {
    if (str.includes('=') && str.includes('/')) {
        console.log('hi');
        const strArray = str.split('=');
        const strNewArray = strArray[1].split('/');
        const result = parseFloat(strNewArray[0]) / parseFloat(strNewArray[1]);
        if (isNaN(result) || parseFloat(strNewArray[0]) != strNewArray[0] || parseFloat(strNewArray[1]) != strNewArray[1]) {
            return str;
        }
        return (`${strArray[0]}=${result}`).split(' ').join('');
    } if (str.includes('/')) {
        const strNewArray = str.split('/');
        const result = parseFloat(strNewArray[0]) / parseFloat(strNewArray[1]);
        if (isNaN(result)) {
            return str;
        }
        return result;
    }
    return str;
}

async function sendFactIntroMsg(req, config) {
    const { phone } = req.body;
    const msg = 'Daily FACTS ke saath seekho kuch naya, har roz! 🤓\n\n*#Facts* likh ke mujhe bhejein, aur padhein new and interesting facts. 🤖';
    await Utility.sendWhatsAppMessage(req.body.phone, msg, 'fact-message', config);
    await utilityRedis.lockWithNoExpire(db.redis.write, `${phone}isReceived`, 'received');
    const obj = {};
    obj.type = 'factWalaMessage';
    obj.data = msg;
    Utility.whatsAppLogs(req.body.phone, obj);
    console.log('2');
    return true;
}

function checkForDivision(str) {
    if (str.includes('=')) { return str; }
    const strArray = str.split('/');
    console.log(strArray.length);
    if (strArray.length == 1) {
        return str;
    }
    const result = parseFloat(strArray[0]) / parseFloat(strArray[1]);
    if (isNaN(result)) {
        return str;
    }
    return result;
}

// async function returiningResponse(msg, count, lc, res) {
//     console.log('4 res');
//     const responseData = {
//         meta: {
//             code: 200,
//             success: true,
//             message: 'SUCCESS',
//         },
//         data: 'sent message',
//         message: msg,
//         isThird: count,
//         loopCounter: lc,
//         error: null,
//     };
//     // console.log('res\n',res)
//     res.status(responseData.meta.code).json(responseData);
//     return true;
// }

function SendHiMessage(req, config) {
    return new Promise((resolve, reject) => {
        Utility.sendWhatsAppMessage(req.body.phone, `Hi ${req.body.detail}! I am a Robot. 🤖\n\nAap mujhse *Maths*, *Physics*, *Chemistry* & *Biology* ke questions pooch sakte hai.`, 'salutation-message', config).then(() => {
            // console.log('hey')

            setTimeout(() => {
                console.log('there');
                Utility.sendWhatsAppMessage(req.body.phone, 'How? 🤔 \n\nStep 1⃣ - Question ki 📸 photo kheeche \n\nStep 2⃣ - Sirf one question crop karke send karein', 'salutation-message', config).then(() => {
                    setTimeout(() => {
                        // console.log('asdfghjk')
                        Utility.sendWhatsAppMessage(req.body.phone, 'Bas 2 steps!\n\nTake photo now 📷  🙂', 'salutation-message', config).then(() => {
                            // console.log(result)
                            // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res)
                            resolve(true);
                        }).catch((error) => {
                            console.log(error);
                        });
                    }, 2000);
                }).catch((error) => {
                    console.log(error);
                    reject(error);
                });
            }, 2000);
        });
    });
}

function SendMessageOnSecondYes(req, config) {
    return new Promise((resolve, reject) => {
        Utility.sendWhatsAppMessage(req.body.phone, 'Great! 😇 \nAsk one more question 🤖', 'second-yes', config).then(() => {
            // console.log(result)
            // console.log('hey')

            setTimeout(() => {
                console.log('there');
                Utility.sendWhatsAppMessage(req.body.phone, 'Kya aapko mere solutions helpful lage? 😇  \n\nPls apne friends ko mere baare mai batao. Forward this message 🙂', 'second-yes', config).then(() => {
                    setTimeout(() => {
                        Utility.sendWhatsAppMessage(req.body.phone, '*8-400-400-400* par message karo aur apne saare mushkil se mushkil doubts solve karo! \n\n✅ 10 secs mei solution! 🏆 💯 \n\n✅ IITJEE, CBSE & Boards \n\n❌ No Groups  ❌ No Spam\n\n*Maths*, *Physics*, *Chemistry* & *Biology* doubt? 🤔 *8-400-400-400* pe WhatsApp karo!\n\nYa phir, is link par click karo aur doubt poocho 👉 - https://doubtnut.app/whatsapp', 'second-yes', config).then(() => {
                            resolve(true);
                        }).catch((error) => {
                            console.log(error);
                        });
                    }, 2000);
                }).catch((error) => {
                    console.log(error);
                    reject(error);
                });
            }, 2000);
        });
    });
}

function SendMessageOnBeyondTwoNo(req, config) {
    return new Promise((resolve, reject) => {
        // MakingThePushNotificationForWhatsApp
        Utility.sendWhatsAppMessage(req.body.phone, 'Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe ek aur chance dein.\nI will learn 😊 \n\nMujhse ek aur question puche.', 'beyond-2-no', config).then(() => {
            setTimeout(async () => {
                Utility.sendWhatsAppMessage(req.body.phone, 'Explore more on the app. \nDownload now : 👉 https://doubtnut.app.link/RD1Swe7UsZ', 'beyond-2-no', config).then(() => {
                    resolve(true);
                });
            }, 2000);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
}

function SendMessageOnSecondNo(req, config) {
    return new Promise((resolve, reject) => {
        Utility.sendWhatsAppMessage(req.body.phone, 'Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe ek aur chance dein.\nI will learn 😊 \n\nMujhse ek aur question puche.', 'second-no', config).then(() => {
            setTimeout(async () => {
                Utility.sendWhatsAppMessage(req.body.phone, ' Explore more on the app. \nDownload now : 👉 https://doubtnut.app.link/RD1Swe7UsZ', 'second-no', config).then(() => {
                    resolve(true);
                });
            }, 2000);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
}

async function AddComputationalQuestion(student_id, ques1, msg) {
    const insertedQuestion = {};
    const subject = 'MATHS';
    const locale = 'en';
    insertedQuestion.student_id = student_id;
    insertedQuestion.class = 20;
    insertedQuestion.subject = subject;
    insertedQuestion.book = subject;
    insertedQuestion.chapter = 'DEFAULT';
    insertedQuestion.question = ques1;
    insertedQuestion.doubt = 'WHATSAPP';
    insertedQuestion.locale = locale;
    insertedQuestion.is_skipped = 12;
    insertedQuestion.ocr_done = 0;
    insertedQuestion.ocr_text = msg;
    insertedQuestion.original_ocr_text = msg;
    await Question.addQuestion(insertedQuestion, db.mysql.write);
}

// eslint-disable-next-line no-unused-vars
async function whatsappResponses(req, res, next) {
    res.send({});
    // console.log(message.messageForOptIn)
    const config = req.app.get('config');
    const { soln } = req.body;
    let { msg } = req.body;
    db = req.app.get('db');
    const { phone } = req.body;
    const { student_id } = req.body;
    let dateUTC = new Date();
    dateUTC = dateUTC.getTime();
    const dateIST = new Date(dateUTC);
    // date shifting for IST timezone (+5 hours and 30 minutes)
    dateIST.setHours(dateIST.getHours() + 5);
    dateIST.setMinutes(dateIST.getMinutes() + 30);
    let today = dateIST;
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    today = `${mm}/${dd}/${yyyy}`;
    // console.log('today', today)
    const date = today;
    const todayEnd = new Date(dateIST);
    todayEnd.setHours(23);
    todayEnd.setMinutes(59);
    const expire = Math.floor((todayEnd - dateIST) / 1000);

    console.log('student_id--------------->', student_id);

    const retarget_users = await Student.retargetUsers(student_id, db.mysql.read);
    // const student_Class = await Student.getStudent(student_id, db.mysql.read);
    const student_Class = await StudentContainer.getById(student_id, db);
    // console.log('=========', student_Class[0].student_class);
    // console.log('------------', retarget_users[0].can_be_targeted);
    // console.log('-=-=-=-=-=-=', retarget_users[0].reinstall_timestamp);
    let doNotSendSalutation = 1;
    // console.log(expire)
    // console.log('expire--->>', expire)
    // const fingerprint = await Student.getStudent(student_id, db.mysql.read);
    const fingerprint = await StudentContainer.getById(student_id, db);
    // console.log('fingerprint-------------->>>>',fingerprint[0]['fingerprints'])
    const obj_fing = {};
    obj_fing.type = fingerprint[0].fingerprints;
    obj_fing.data = msg;
    obj_fing.student_id = student_id;
    Utility.whatsAppLogs(phone, obj_fing);
    let IsOptInForFact = await utilityRedis.checkIfExists(db.redis.read, `${phone}IsOptInForFact`);
    let ToSendOrNot = await utilityRedis.checkIfExists(db.redis.read, `${phone}ToSendOrNot`);
    // console.log('the first time ', IsOptInForFact);
    const waCount = await utilityRedis.checkIfExists(db.redis.read, `${phone + date}wa`);
    let yesCount = await utilityRedis.checkIfExists(db.redis.read, `${phone}yesCount`);
    let noCount = await utilityRedis.checkIfExists(db.redis.read, `${phone}noCount`);
    let checkOnPd = await utilityRedis.checkIfExists(db.redis.read, `${phone}checkOnPd`);
    let checkOnRd = await utilityRedis.checkIfExists(db.redis.read, `${phone}checkOnRd`);
    let resOrNot = await utilityRedis.checkIfExists(db.redis.read, `${phone}noResponse`);
    let loopCounter = await utilityRedis.checkIfExists(db.redis.read, `${phone}loopCounter`);
    const qid = await utilityRedis.checkIfExists(db.redis.read, `${phone}qid`);
    let factCounter = await utilityRedis.checkIfExists(db.redis.read, `${phone}factCounter`);
    let sendingFact = await utilityRedis.checkIfExists(db.redis.read, `${phone}sendingFact`);
    const isHw = await utilityRedis.checkIfExists(db.redis.read, `${phone}isHw`);
    let receivedSendFactMsg = await utilityRedis.checkIfExists(db.redis.read, `${phone}isReceived`);
    let count_fact = await utilityRedis.checkIfExists(db.redis.read, `${phone}count_fact`);
    msg = msg.replace(/\:::::/g, '*');
    msg = msg.replace(/\::::/g, '+');
    msg = msg.replace(/\X/g, '*');
    msg = msg.replace(/\÷/g, '/');
    let ques1 = msg;
    let html = '';
    let lastNode = '';
    let flag = 0;
    // const name = req.body.detail;

    if (retarget_users.length && !retarget_users[0].can_be_targeted && !retarget_users[0].reinstall_timestamp) {
        console.log('1');
        if (student_Class[0].student_class == 6 || student_Class[0].student_class == 7 || student_Class[0].student_class == 8) {
            await Utility.sendWhatsAppMessage(phone, 'Padhai ko banana hai aasaan? NCERT Maths Video Solution aur bahut kuch milega sirf Doubtnut par, bilkul free! Download karein aaj hi! https://bit.ly/2KrZJEh', 'retarget-users', config);
        } else if (student_Class[0].student_class == 9 || student_Class[0].student_class == 10) {
            await Utility.sendWhatsAppMessage(phone, 'Physics, Chemistry, Maths aur Biology se pareshan? Sabka hai sirf ek hi samadhan- Doubtnut, jo hai bilkul free! Download karein aaj hi! https://bit.ly/379GOaJ', 'retarget-users', config);
        } else if (student_Class[0].student_class == 11 || student_Class[0].student_class == 12) {
            await Utility.sendWhatsAppMessage(phone, 'Ab Bhag len har Sunday free JEE Mains Mock Tests mein! IIT JEE Crash Course aur bahut kucch ab sirf Doubtnut pe, Download karen abhi! https://bit.ly/2r2Bs0n', 'retarget-users', config);
        } else if (student_Class[0].student_class == 14) {
            await Utility.sendWhatsAppMessage(phone, 'Padhai ko banana hai aasaan? Rakesh Yadav ke Solutions ab Hindi mein bhi! Sirf Doubtnut pe, jo hai bilkul free! Download karein aaj hi! https://bit.ly/2XggTKa', 'retarget-users', config);
        }
        console.log('SendMessage approved by amar');
        const obj = {
            can_be_targeted: 2,
        };
        Student.updateCanBeTargeted(db.mysql.write, student_id, obj);
        doNotSendSalutation = 0;
        // return returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        return;
    }

    // to store the name in db
    // ******
    // let name_ = name.toLowerCase()
    // let fullName = name_.split(' ')
    // let fname = fullName[0]
    // let lname = ''
    // for(let i = 1 ;i<fullName.length ; i++){
    //     lname = lname + fullName[i] + ' '
    // }
    // // console.log(fullName)
    // let nameOfStudent = {}
    // nameOfStudent['student_fname'] = fname
    // nameOfStudent['student_lname'] = lname
    // Student.updateUserProfile(student_id,nameOfStudent,db.mysql.write)
    // Student.updateName(db.mysql.write,student_id,nameOfStudent)
    //* ******
    if (/^\d+$/.test(msg) || /^\d+\.\d+$/.test(msg)) {
        flag = 0;
        console.log('this is just some digits');
        html = 'I am still a learning robot 🤖 \n\n✅ Abhi sirf *Maths*, *Physics*, *Chemistry* & *Biology* question ki *photo* send karein \n\n❌ Handwritten question nahi bheje';
    } else {
        flag = 1;
        if (msg.includes('?') || msg.includes('=')) {
            ques1 = ques1.replace(/\?/g, '');
            ques1 = ques1.replace(/=/g, '');
            //   console.log('helllo')
        }
        ques1 = ques1.replace(/%/g, '/100');
        const steps = mathsteps.simplifyExpression(ques1);
        steps.forEach((step) => {
            if (/[a-zA-Z]{2,}/g.test(step.newNode.toString())) {
                html = '';
            } else {
                html = `${html + _.startCase(_.toLower(step.changeType.replace(/\_/g, ' ')))}\n${step.newNode.toString()}\n`;
                lastNode = step.newNode.toString();
                //   console.log('helllo1')
            }
        });
        // console.log('---heello---')
        const steps1 = mathsteps.solveEquation(msg);
        // if(flag == 1){
        //     let insertedQuestion = {}
        //     let subject = "MATHS";
        //     let locale = 'en';
        //     insertedQuestion["student_id"] = student_id
        //     insertedQuestion["class"] = 20
        //     insertedQuestion["doubt"] = ques1
        //     insertedQuestion["subject"] = subject
        //     insertedQuestion["book"] = subject
        //     insertedQuestion["chapter"] = "DEFAULT"
        //     insertedQuestion["question"] = ques1
        //     insertedQuestion["doubt"] = "WHATSAPP"
        //     insertedQuestion["locale"] = locale
        //     insertedQuestion["is_skipped"] = 12
        //     insertedQuestion["ocr_done"] = 0
        //     insertedQuestion["ocr_text"] = msg
        //     insertedQuestion["original_ocr_text"] = msg
        //     let quesResult = Question.addQuestion(insertedQuestion, db.mysql.write)
        // }

        steps1.forEach((step) => {
            console.log('hi1');
            // console.log(step)
            // console.log("before change: " + step.oldEquation.ascii());  // e.g. before change: 2x + 3x = 35
            // console.log("change: " + step.changeType);                  // e.g. change: SIMPLIFY_LEFT_SIDE
            // console.log("after change: " + step.newEquation.ascii());   // e.g. after change: 5x = 35
            // console.log("# of substeps: " + step.substeps.length);      // e.g. # of substeps: 2
            // html = html + step.newEquation.ascii() + '\n'
            html = `${html + _.startCase(_.toLower(step.changeType.replace(/\_/g, ' ')))}\n${step.newEquation.ascii()}\n`;
            lastNode = step.newEquation.ascii();
        });
        // console.log("html"+html)
    }
    console.log(lastNode);
    const newNode = checkForDivisionLibrary(lastNode);
    if (newNode !== lastNode) {
        html = `${html}\n*${newNode}*`;
    }
    if (html != '') {
        await Utility.sendWhatsAppMessageComputational(req.body.phone, html, 'computational-message', config);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        if (flag == 1) {
            AddComputationalQuestion(student_id, ques1, msg);
        }
        return;
    }
    const resp = checkForDivision(msg);
    if (resp != msg) {
        await Utility.sendWhatsAppMessageComputational(req.body.phone, resp, 'computational-message', config);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, resp);
        if (flag == 1) {
            AddComputationalQuestion(student_id, ques1, msg);
        }
        return;
    }


    if (resOrNot == null) {
        resOrNot = 'res';
    }

    if (checkOnRd == null) {
        checkOnRd = 0;
    }

    if (checkOnPd == null) {
        checkOnPd = 0;
    }

    if (ToSendOrNot == null) {
        ToSendOrNot = 'none';
    }


    if (IsOptInForFact == null) {
        IsOptInForFact = 'none';
    }

    if (yesCount == null) {
        yesCount = 0;
    }

    if (noCount == null) {
        noCount = 0;
        // console.log('type of noCount', typeof noCount)
        // console.log('valueeee', noCount)
    }
    if (count_fact == null) {
        count_fact = 0;
    }
    if (factCounter == null) {
        factCounter = 'off'; // change the factCounter value to 'none'
    }
    if (sendingFact == null) {
        sendingFact = 'none';
    }
    console.log('fact counter', factCounter);
    if (loopCounter == null) {
        loopCounter = 'off';
    }
    if (receivedSendFactMsg == null) {
        receivedSendFactMsg = 'notYet';
    }
    console.log('loopp counter', loopCounter);

    // if(sendFactYes == null){
    //     sendFactYes = 'none'
    // }
    // if(sendFactNo == null){
    //     sendFactNo = 'none'
    // }

    // add after factCounter == 'off && msg.toLowerCase()!='#stopfacts' && factCounter =='off'
    if ((checkOnPd > 10 || resOrNot == 'noResponse') && (loopCounter == 'off')) {
        console.log('1');
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, 0, expire);
        await utilityRedis.lock(db.redis.write, `${phone}checkOnRd`, 0, expire);
        // const x = res.send('enough of texts , now ask question');
        // return x;
        return;
    }
    // add after factCounter == 'off && msg.toLowerCase()!='#stopfacts' && factCounter =='off'
    if ((checkOnRd > 13 || resOrNot == 'noResponse') && (loopCounter == 'off')) {
        console.log('2');
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, 0, expire);
        await utilityRedis.lock(db.redis.write, `${phone}checkOnRd`, 0, expire);
        // const x = res.send('enough of texts , now ask question');
        // return x;
        return;
    }
    console.log('checkOnPd_outside', checkOnPd);
    // console.log('check for factCounter' , factCounter)
    console.log('3');
    // add after factCounter == 'off && msg.toLowerCase()!='#stopfacts' && factCounter =='off'
    if ((checkOnPd > 5 && checkOnPd <= 9) && (loopCounter == 'off')) {
        console.log('checkOnPd_inside', checkOnPd);
        await Utility.sendWhatsAppMessage(phone, 'Oops, yeh to *Maths*, *Physics*, *Chemistry* & *Biology* questions nahi hain! 🤔 🤖\nMai sirf *PCM* doubts solve karr sakta hun. 🤓\n\nAap new cheezein explore karne ke liye meri app try kijiye! 🙂\nDownload Link :👉 https://doubtnut.app.link/RD1Swe7UsZ', 'pd-beyond-5', config);
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, parseInt(checkOnPd) + 1, expire);
        // const x = res.send('enough of texts , now ask question');
        // return x;
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res)
        // return x
        return;
    }
    // add after factCounter == 'off && msg.toLowerCase()!='#stopfacts' && factCounter =='off'
    if ((checkOnPd > 9 && checkOnPd <= 10) && (loopCounter == 'off')) {
        console.log('4');
        await Utility.sendWhatsAppMessage(phone, 'Lagta hai aap confused hain. 😛\nAb mai sirf *Maths*, *Physics*, *Chemistry* & *Biology* doubts parr response dunga. 🤖\n\nBook se question ki photo kheeche aur mujhe bheje. Aapko instant solutions mil jaayega. 🔎📚', 'retarget-users', config);
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, parseInt(checkOnPd) + 1, expire);
        await utilityRedis.lock(db.redis.write, `${phone}noResponse`, 'noResponse', 21600);
        // const x = res.send('enough of texts , now ask question');
        // return x;
        return;
    }
    // add after factCounter == 'off && msg.toLowerCase()!='#stopfacts' && factCounter =='off'
    if ((checkOnRd > 8 && checkOnRd <= 12) && (loopCounter == 'off')) {
        console.log('5');
        await Utility.sendWhatsAppMessage(phone, 'Oops, yeh to *Maths*, *Physics*, *Chemistry* & *Biology* questions nahi hain! 🤔 🤖\nMai sirf *PCM* doubts solve karr sakta hun. 🤓\n\nAap new cheezein explore karne ke liye meri app try kijiye! 🙂\nDownload Link :👉 https://doubtnut.app.link/RD1Swe7UsZ', 'rd-beond-8', config);
        await utilityRedis.lock(db.redis.write, `${phone}checkOnRd`, parseInt(checkOnRd) + 1, expire);
        // const x = res.send('enough of texts , now ask question');
        // return x;
        return;
    }
    // add after factCounter == 'off && msg.toLowerCase()!='#stopfacts' && factCounter =='off'
    if ((checkOnRd > 12 && checkOnRd <= 13) && (loopCounter == 'off')) {
        console.log(6);
        await Utility.sendWhatsAppMessage(phone, 'Lagta hai aap confused hain. 😛\nAb mai sirf *Maths*, *Physics*, *Chemistry* & *Biology* doubts parr response dunga. 🤖\n\nBook se question ki photo kheeche aur mujhe bheje. Aapko instant solutions mil jaayega. 🔎📚', 'rd-beyond-12', config);
        await utilityRedis.lock(db.redis.write, `${phone}checkOnRd`, parseInt(checkOnRd) + 1, expire);
        await utilityRedis.lock(db.redis.write, `${phone}noResponse`, 'noResponse', 21600);
        // const x = res.send('enough of texts , now ask question');
        // return x;
        return;
    }

    // hold on to the facts

    // if(loopCounter == 'off' && IsOptInForFact=='NotDecidedyet' && msg.toLowerCase().includes('yes') && factCounter == 'on' ){
    //     await Utility.sendWhatsAppMessage(phone,'Thank you. 😇\nMai aapko aise interesting facts bhejta rahunga 🤖\n\nAsk one more question 📚', config)
    //     await utility_redis.lockWithNoExpire(db.redis.write , phone+'IsOptInForFact',1)
    //     await utility_redis.lock(db.redis.write , phone+'factCounter','off',43200)
    //     let obj ={}
    //     obj.type = 'fact_push_yes'
    //     obj.data = msg
    //     Utility.whatsAppLogs(phone,obj)
    //     // let x = await utility_redis.checkIfExists(db.redis.read , phone+'IsOptInForFact')
    //     // console.log('after optin for fact --> 1' , x)
    // }
    // else if(loopCounter == 'off' && IsOptInForFact=='NotDecidedyet' && msg.toLowerCase().includes('no') && factCounter == 'on'){
    //     await Utility.sendWhatsAppMessage(phone,"Okay 😔\nFacts band karne ke liye *#STOPFACTS* likh ke bheje 🤖\n\nAsk one more question. 📚", config)
    //     await utility_redis.lockWithNoExpire(db.redis.write , phone+'IsOptInForFact',0)
    //     await utility_redis.lock(db.redis.write , phone+'factCounter','off',43200)
    //     let obj ={}
    //     obj.type = 'fact_push_no'
    //     obj.data = msg
    //     Utility.whatsAppLogs(phone,obj)
    // }
    // else if(loopCounter == 'off' && msg.toLowerCase()=='#stopfacts'){
    //     await Utility.sendWhatsAppMessage(phone,"Okay 😔\nAb mai aapko koi facts nahi bhejunga. 🤖\n\nAsk one more question. 📚", config)
    //     await utility_redis.lockWithNoExpire(db.redis.write,phone+'IsOptInForFact','NoMoreFacts')
    // }


    if ((loopCounter == 'on' || loopCounter == 'isYesOrNo') && (msg.toLowerCase().includes('yes') && yesCount == 0) && doNotSendSalutation == 1) {
        console.log('wacount---->', waCount);
        await Utility.sendWhatsAppMessage(req.body.phone, 'Great! 😊 Pls mere baare mai apne dosto ko bataye. \n\nEk aur question pooche. 📚', 'first-yes', config);
        if (isHw == 1) {
            // let msg = "Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi *Maths*, *Physics*, *Chemistry* & *Biology*  ke questions ki photo book se send karein 😇"
            // await Utility.sendWhatsAppMessage(phone,msg,config)
            // await utility_redis.lock(db.redis.read , phone+'noReplyForYesNo',0,500)
            await utilityRedis.unlock(db.redis.write, `${phone}isHw`);
        }

        if (receivedSendFactMsg == 'notYet') {
            setTimeout(async () => {
                await sendFactIntroMsg(req, config);
            }, 1000);
        }
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')//was using lock with no expire
        // let facts = await Utility.getFacts("whatsapp",1,student_id)
        // let image = facts.body.data
        // console.log('facts--->>',image)

        // holding on to the fatcs for sometime

        // if((IsOptInForFact == 'none' || parseInt(IsOptInForFact) == 0 )&& ToSendOrNot == 'none'){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     console.log('fact-->' , image)
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)

        //     await utility_redis.lockWithNoExpire(db.redis.write,phone+'IsOptInForFact','NotDecidedyet')
        //     await utility_redis.lock(db.redis.write , phone+'ToSendOrNot' ,'no',expire)
        //     await utility_redis.lock(db.redis.write, phone+'sendingFact','here' , 10)
        //     // let x = await utility_redis.checkIfExists(db.redis.read , phone+'IsOptInForFact')
        //     // console.log('Yes wala--> not decidedyet' , x)
        //     let obj ={}
        //     obj.type = 'fact_push'
        //     obj.data = image[0]
        //     Utility.whatsAppLogs(phone,obj)
        //     setTimeout(async ()=>{
        //         await Utility.sendWhatsAppMessage(phone,'Kya aapko aise aur interesting facts jaan ne hai ? 🧐\n*Yes* OR *No* message karein.', config)
        //     },5000)
        // }
        // if(factCounter == 'none'){
        //     await utility_redis.lock(db.redis.write , phone+'factCounter','on',43200)
        // }


        // holding on to the fatcs

        // if(parseInt(waCount)%2!=0 && parseInt(IsOptInForFact) == 1 && sendingFact !='here'){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     let objFact ={}
        //     objFact.type = 'fact_push'
        //     objFact.data = image[0]
        //     Utility.whatsAppLogs(phone,objFact)
        // }


        // await utility_redis.lock(db.redis.write , phone+'factCounter','on',43200)
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        await utilityRedis.lock(db.redis.write, `${phone}yesCount`, 1, expire);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        const obj1 = {};
        obj1.type = 'QuestionLoopWithYes';
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
        if (loopCounter == 'isYesOrNo') {
            const obj2 = {};
            obj2.type = `Question${waCount}RandomYes`;
            obj2.data = msg;
            Utility.whatsAppLogs(phone, obj2);
        } else {
            const obj = {};
            obj.type = `Question${waCount}Yes`;
            obj.data = msg;
            Utility.whatsAppLogs(phone, obj);
        }
    } else if ((loopCounter == 'on' || loopCounter == 'isYesOrNo') && (msg.toLowerCase().includes('no') && noCount == 0 && doNotSendSalutation == 1)) {
        console.log('wacount---->', waCount);
        if (isHw == 1) {
            const msg = 'Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi *Maths*, *Physics*, *Chemistry* & *Biology*  ke questions ki photo book se send karein 😇';
            await Utility.sendWhatsAppMessage(phone, msg, 'first-no-handwritten', config);
            // await utility_redis.lock(db.redis.read , phone+'noReplyForYesNo',0,500)
            await utilityRedis.unlock(db.redis.write, `${phone}isHw`);
            console.log('noCount 1');
        } else {
            await Utility.sendWhatsAppMessage(req.body.phone, `Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe feedback dein.  🙇‍♂   \nI will improve 😊 \n\nfeedback link 👉 -  https://doubtnut.com/whatsapp-rating?qid=${qid}&sid=${student_id}`, 'first-no', config);
            console.log('noCount noHw');
        }
        if (receivedSendFactMsg == 'notYet') {
            setTimeout(async () => {
                await sendFactIntroMsg(req, config);
            }, 2000);
        }
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')//was using lock with no expire
        // console.log('facts--->>',image)

        // holding on to the facts

        // if((IsOptInForFact == 'none'|| parseInt(IsOptInForFact) == 0) && ToSendOrNot == 'none'){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     await utility_redis.lockWithNoExpire(db.redis.write,phone+'IsOptInForFact','NotDecidedyet')
        //     await utility_redis.lock(db.redis.write , phone+'ToSendOrNot' ,'no',expire)
        //     await utility_redis.lock(db.redis.write, phone+'sendingFact','here' , 10)
        //     // let x = await utility_redis.checkIfExists(db.redis.read , phone+'IsOptInForFact')
        //     // console.log('no wala' , x)
        //     let objFact ={}
        //     objFact.type = 'fact_push'
        //     objFact.data = image[0]
        //     Utility.whatsAppLogs(phone,objFact)
        //     setTimeout(async()=>{
        //         await Utility.sendWhatsAppMessage(phone,'Kya aapko aise aur interesting facts jaan ne hai ? 🧐\n*Yes* OR *No* message karein.', config)
        //     },5000)
        // }

        // holding on to the facts

        // if(factCounter == 'none'){
        //     await utility_redis.lock(db.redis.write , phone+'factCounter','on',43200)
        // }
        // if(parseInt(waCount)%2!=0 && parseInt(IsOptInForFact) == 1 && sendingFact !='here'){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     let objFact ={}
        //     objFact.type = 'fact_push'
        //     objFact.data = image[0]
        //     Utility.whatsAppLogs(phone,objFact)
        // }


        // await utility_redis.lock(db.redis.write , phone+'factCounter','on',43200)

        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        await utilityRedis.lock(db.redis.write, `${phone}noCount`, 1, expire);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        const obj1 = {};
        obj1.type = 'QuestionLoopWithNo';
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
        if (loopCounter == 'isYesOrNo') {
            const obj2 = {};
            obj2.type = `Question${waCount}RandomNo`;
            obj2.data = msg;
            Utility.whatsAppLogs(phone, obj2);
        } else {
            const obj = {};
            obj.type = `Question${waCount}No`;
            obj.data = msg;
            Utility.whatsAppLogs(phone, obj);
        }
    } else if (loopCounter == 'on' && (!msg.toLowerCase().includes('yes') && !msg.toLowerCase().includes('no'))) {
        // console.log('wacount---->', waCount)

        await Utility.sendWhatsAppMessage(req.body.phone, 'Sirf *Yes* OR *No* message karein 😊 \n\nYa phir ek aur question pooche. 🤖 📚', 'check-if-got-solution', config);
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'isYesOrNo')//was using lock with no expire
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'isYesOrNo', 43200);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        const obj = {};
        obj.type = 'QuestionLoopWithRandom';
        obj.data = msg;
        Utility.whatsAppLogs(phone, obj);
        const obj1 = {};
        obj1.type = `Question${waCount}Random`;
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
    } else if ((loopCounter == 'on' || loopCounter == 'isYesOrNo') && (msg.toLowerCase().includes('yes') && yesCount == 1)) {
        await utilityRedis.lock(db.redis.write, `${phone}yesCount`, 2, expire);
        await SendMessageOnSecondYes(req, config);
        if (isHw == 1) {
            // let msg = "Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi *Maths*, *Physics*, *Chemistry* & *Biology*  ke questions ki photo book se send karein 😇"
            // await Utility.sendWhatsAppMessage(phone,msg,config)
            // await utility_redis.lock(db.redis.read , phone+'noReplyForYesNo',0,500)
            await utilityRedis.unlock(db.redis.write, `${phone}isHw`);
        }


        // holding onto the facts

        // if(parseInt(waCount)%2!=0 && parseInt(IsOptInForFact) == 1){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     console.log('facts--->>',image)
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     let obj ={}
        //     obj.type = 'fact_push'
        //     obj.data = image[0]
        //     Utility.whatsAppLogs(phone,obj)
        // }


        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')//was using lock with no expire
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        const obj1 = {};
        obj1.type = 'QuestionLoopWithYes';
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
        if (loopCounter == 'isYesOrNo') {
            const obj2 = {};
            obj2.type = `Question${waCount}RandomYes`;
            obj2.data = msg;
            Utility.whatsAppLogs(phone, obj2);
        } else {
            const obj = {};
            obj.type = `Question${waCount}Yes`;
            obj.data = msg;
            Utility.whatsAppLogs(phone, obj);
        }
    } else if ((loopCounter == 'on' || loopCounter == 'isYesOrNo') && (msg.toLowerCase().includes('no') && noCount == 1)) {
        // console.log('wacount---->', waCount)
        await utilityRedis.lock(db.redis.write, `${phone}noCount`, 2, expire);
        if (isHw == 1) {
            const msg = 'Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi *Maths*, *Physics*, *Chemistry* & *Biology*  ke questions ki photo book se send karein 😇';
            await Utility.sendWhatsAppMessage(phone, msg, 'second-no-handwritten', config);
            // await utility_redis.lock(db.redis.read , phone+'noReplyForYesNo',0,500)
            await utilityRedis.unlock(db.redis.write, `${phone}isHw`);
            console.log('noCount Hw');
        } else {
            await SendMessageOnSecondNo(req, config);
            console.log('noCount noHw');
        }

        // holding on to the facts

        // if(parseInt(waCount)%2!=0 && parseInt(IsOptInForFact) == 1){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     console.log('facts--->>',image)
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     let obj ={}
        //     obj.type = 'fact_push'
        //     obj.data = image[0]
        //     Utility.whatsAppLogs(phone,obj)
        // }


        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        const obj1 = {};
        obj1.type = 'QuestionLoopWithNo';
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
        if (loopCounter == 'isYesOrNo') {
            const obj2 = {};
            obj2.type = `Question${waCount}RandomNo`;
            obj2.data = msg;
            Utility.whatsAppLogs(phone, obj2);
        } else {
            const obj = {};
            obj.type = `Question${waCount}No`;
            obj.data = msg;
            Utility.whatsAppLogs(phone, obj);
        }
    } else if ((loopCounter == 'on' || loopCounter == 'isYesOrNo') && (msg.toLowerCase().includes('yes') && waCount >= 3)) {
        // console.log('wacount---->', waCount)
        await Utility.sendWhatsAppMessage(req.body.phone, 'Great! 😇 \nAsk one more question 🤖', 'yes-beyond-3', config);
        if (isHw == 1) {
            // let msg = "Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi *Maths*, *Physics*, *Chemistry* & *Biology*  ke questions ki photo book se send karein 😇"
            // await Utility.sendWhatsAppMessage(phone,msg,config)
            // await utility_redis.lock(db.redis.read , phone+'noReplyForYesNo',0,500)
            await utilityRedis.unlock(db.redis.write, `${phone}isHw`);
        }
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        // if (yesCount == 2) {
        //     await utility_redis.lock(db.redis.write, phone + 'yesCount', 3, expire)
        // }

        // holding on to the facts

        // if(parseInt(waCount)%2!=0 && parseInt(IsOptInForFact) == 1){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     console.log('facts--->>',image)
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     let obj ={}
        //     obj.type = 'fact_push'
        //     obj.data = image[0]
        //     Utility.whatsAppLogs(phone,obj)
        // }


        // await utility_redis.lock(db.redis.write , phone+'noCount' , 3 , expire)
        const obj1 = {};
        obj1.type = 'QuestionLoopWithYes';
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
        if (loopCounter == 'isYesOrNo') {
            const obj2 = {};
            obj2.type = `Question${waCount}RandomYes`;
            obj2.data = msg;
            Utility.whatsAppLogs(phone, obj2);
        } else {
            const obj = {};
            obj.type = `Question${waCount}Yes`;
            obj.data = msg;
            Utility.whatsAppLogs(phone, obj);
        }
    } else if ((loopCounter == 'on' || loopCounter == 'isYesOrNo') && (msg.toLowerCase().includes('no') && waCount >= 3)) {
        // console.log('wacount---->', waCount)
        if (isHw == 1) {
            const msg = 'Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi *Maths*, *Physics*, *Chemistry* & *Biology*  ke questions ki photo book se send karein 😇';
            await Utility.sendWhatsAppMessage(phone, msg, 'no-beyond-3-handwritten', config);
            // await utility_redis.lock(db.redis.read , phone+'noReplyForYesNo',0,500)
            await utilityRedis.unlock(db.redis.write, `${phone}isHw`);
            console.log('noCount Hw');
        } else {
            await SendMessageOnBeyondTwoNo(req, config);
            console.log('noCount noHw');
        }

        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        if (noCount == 2) {
            await utilityRedis.lock(db.redis.write, `${phone}noCount`, 3, expire);
        }


        // holding on to the facts

        // if(parseInt(waCount)%2!=0 && parseInt(IsOptInForFact) == 1){
        //     let facts = await Utility.getFacts("whatsapp",1,student_id)
        //     let image = facts.body.data
        //     console.log('facts--->>',image)
        //     await Utility.sendImageOnWhatsApp(phone,image[0],config)
        //     let obj ={}
        //     obj.type = 'fact_push'
        //     obj.data = image[0]
        //     Utility.whatsAppLogs(phone,obj)
        // }


        const obj1 = {};
        obj1.type = 'QuestionLoopWithNo';
        obj1.data = msg;
        Utility.whatsAppLogs(phone, obj1);
        if (loopCounter == 'isYesOrNo') {
            const obj2 = {};
            obj2.type = `Question${waCount}RandomNo`;
            obj2.data = msg;
            Utility.whatsAppLogs(phone, obj2);
        } else {
            const obj = {};
            obj.type = `Question${waCount}No`;
            obj.data = msg;
            Utility.whatsAppLogs(phone, obj);
        }
    } else if ((msg.toLowerCase() == '#facts' || msg.toLowerCase() == '#fact') && count_fact < 5) {
        const facts = await Utility.getFacts('whatsapp', 1, student_id, config);
        const image = facts.body.data;
        console.log('facts--->>', image);
        await Utility.sendImageOnWhatsAppWithCaption(phone, image[0], '#fact', 'fact-received', config);
        await utilityRedis.lock(db.redis.write, `${phone}count_fact`, parseInt(count_fact) + 1, expire);
        const obj = {};
        obj.type = 'fact_push';
        obj.data = image[0];
        Utility.whatsAppLogs(phone, obj);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
    } else if ((msg.toLowerCase() == '#facts' || msg.toLowerCase() == '#fact') && count_fact == 5) {
        const msg = 'Oops! Lagta hai mai aapko aaj 5 facts bhej chuka hun. 🤖\n\nAise aur interesting facts ke liye kal phir se mujhe *#Facts* likh ke bheje 😇';
        await Utility.sendWhatsAppMessage(phone, msg, 'fact-count-crossed', config);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
    } else if (msg.toLowerCase() == '#key') {
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, parseInt(checkOnPd) + 1, expire);
        Utility.sendWhatsAppMessage(req.body.phone, 'Thank you for connecting with *Doubtnut Bot* 😊\n \nWe hope that you had fun solving Technothlon questions. The answer key will be released on *25th July*. Stay tuned!\n\nYou can access all the video solutions of Technothlon 2019 on the Doubtnut app. Download here: https://doubtnut.app.link/ItbzwSMqgY', 'techlothon-thankyou-message', config).then(async () => {
            // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
            // console.log(result)
        }).catch((error) => {
            console.log(error);
        });
    } else if (msg.toLowerCase() == '#askdoubt' && doNotSendSalutation == 1) {
        console.log('#askdoubt');
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, parseInt(checkOnPd) + 1, expire);
        await SendHiMessage(req, config);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
    } else if (message.salutations.includes(msg.toLowerCase()) && doNotSendSalutation == 1) {
        const message = msg.toLowerCase();
        const splitToArr = message.split(' ');
        let finalSalutation = `${splitToArr.map((w) => w.substring(0, 1).toUpperCase() + w.substring(1)).join(' ')} ${req.body.detail}`;
        if (msg.toLowerCase() == '#vmc') {
            finalSalutation = 'Hi Vmc students';
        }
        console.log('final salutation', finalSalutation);
        console.log('hellooooo');
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, parseInt(checkOnPd) + 1, expire);
        Utility.sendWhatsAppMessage(req.body.phone, `${finalSalutation}! I am a Robot. 🤖\n\nAap mujhse *Maths*, *Physics*, *Chemistry* & *Biology* ke questions pooch sakte hai.`, 'salutation-message', config).then(() => {
            // console.log(result);
            setTimeout(() => {
                // console.log('there')
                // eslint-disable-next-line no-unused-vars
                Utility.sendWhatsAppMessage(req.body.phone, 'How? 🤔 \n\nStep 1⃣ - Question ki 📸 photo kheeche \n\nStep 2⃣ - Sirf one question crop karke send karein', 'salutation-message', config).then(() => {
                    // console.log(result)
                    setTimeout(() => {
                        // console.log('asdfghjk')
                        Utility.sendWhatsAppMessage(req.body.phone, 'Bas 2 steps!\n\nTake photo now 📷  🙂', 'salutation-message', config).then(async () => {
                            // console.log(res)
                            // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
                        }).catch((error) => {
                            console.log(error);
                        });
                    }, 2000);
                }).catch((error) => {
                    console.log(error);
                });
            }, 2000);
        });
    } else if (message.loginAskMessage.includes(msg.toLowerCase()) && doNotSendSalutation == 1) {
        await axios({
            method: 'post',
            url: 'https://api.doubtnut.com/v2/student/whatsapp-login-one',
            data: {
              phone: phone,
            }
          });
    }
    else if (message.messageForOptIn.includes(msg.toLowerCase()) && doNotSendSalutation == 1) {
        console.log('hellooooo');
        console.log('123');
        await utilityRedis.lock(db.redis.write, `${phone}checkOnPd`, parseInt(checkOnPd) + 1, expire);
        await SendHiMessage(req, config);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
    }
    else if (soln == '1') {
        const obj = {};
        obj.type = 'QuestionWithNoResponse';
        obj.data = soln;
        Utility.whatsAppLogs(phone, obj);
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        Utility.sendWhatsAppMessage(req.body.phone, 'Oh no! Mujhe lagta hai question mai kuch problem hai 🤖\n\nI can only answer your *Maths*, *Physics*, *Chemistry* & *Biology* doubts. 📚', 'zero-solution', config).then((result) => {
            console.log(result);
            setTimeout(() => {
                Utility.sendWhatsAppMessage(req.body.phone, 'Kaise? 🤔 \n\nStep 1⃣ - Question ki photo 📸 kheeche \n\nStep 2⃣ - Ek question ko crop karr ke mujhe bheje  📲  \n\n❌ No handwritten questions.', 'zero-solution', config).then(async (result) => {
                    console.log(result);
                    // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
                }).catch((error) => {
                    console.log(error);
                });
            }, 2000);
        });
    } else {
        // await utility_redis.lockWithNoExpire(db.redis.write, phone + 'loopCounter', 'off')
        await utilityRedis.lock(db.redis.write, `${phone}checkOnRd`, parseInt(checkOnRd) + 1, expire);
        await utilityRedis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        await utilityRedis.lock(db.redis.write, `${phone}factCounter`, 'off', 43200);
        await Utility.sendWhatsAppMessage(req.body.phone, 'I am still a learning robot 🤖 \n\n✅ Abhi sirf *Maths*, *Physics*, *Chemistry* & *Biology* question ki *photo* send karein \n\n❌ Handwritten question nahi bheje', 'no-matches', config);
        // await returiningResponse(msg.toLowerCase(), waCount, loopCounter, res);
    }
}


function getParams(config, group, number, image, caption, medium, event) {
    const params = {
        QueueUrl: config.whatsapp_sqs,
        MessageGroupId: group,
        MessageBody: JSON.stringify({
            phone: number,
            msg: image,
            caption,
            type: medium,
            event_name: event,
        }),
    };
    return params;
}

async function pushNotification_wa(req, res) {
    const { mediumOfNotification } = req.body;
    const caption = req.body.caption;
    const image = req.body.url;
    const event = req.body.event;
    const msg = req.body.msg;
    const config = req.app.get('config');
    db = req.app.get('db');
    const sqs = req.app.get('sqs');
    const numbers = await Student.getNumForPush(db.mysql.read);
    res.send('sent');
    if (mediumOfNotification == 'image') {
        for (let i = 0; i < numbers.length; i++) {
            console.log(i);
            const params = getParams(config, 'Image-Notification', numbers[i].mobile_w, image, caption, 'image', event);
            console.log('queue url', params);
            sqs.sendMessage(params, (err, data) => {
                if (err) {
                    console.error('send-message-error', err);
                }
                console.log('data', data);
            });
            console.log('deleting', numbers[i].mobile_w);
            await Student.delNumFromPush(db.mysql.write, numbers[i].mobile_w);
            console.log('deleted', numbers[i].mobile_w);
        }
    } else {
        for (let i = 0; i < numbers.length; i++) {
            console.log(i);
            const params = getParams(config, 'Text-Notification', numbers[i].mobile_w, msg, '', 'text', event);
            console.log(params);
            sqs.sendMessage(params, (err, data) => {
                if (err) {
                    return console.error('send-message-error', err);
                }
                console.log(data);
            });
            console.log('deleting', numbers[i].mobile_w);
            await Student.delNumFromPush(db.mysql.write, numbers[i].mobile_w);
            console.log('deleted', numbers[i].mobile_w);
        }
    }
    console.log('done');
}

async function PauseNotification(req, res) {
    db = req.app.get('db');
    await utilityRedis.lockWithNoExpire(db.redis.write, 'isActive', 'no');
    res.send('killed');
}


module.exports = {
    whatsappResponses,
    pushNotification_wa,
    PauseNotification,
};
