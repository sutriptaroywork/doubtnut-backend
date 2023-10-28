const rp = require('request-promise');
const moment = require('moment')
var http = require('https');
var url = require('url');
const _ = require('lodash')
const cdn_path = "https://d10lpgp6xz60nq.cloudfront.net/"
const MongoClient = require("mongodb").MongoClient;
var fs = require('fs'),
    request = require('request');
const download = require('image-downloader')


const dbName = "doubtnut";

const mongoUrl = "mongodb://127.0.0.1:27018";
//odd student id = 2524641
const oddHeader = {
    "authorization": "bearer" +
        " eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUyNDY0MSwiaWF0IjoxNTcxOTA5Mzg3LCJleHAiOjE2MzQ5ODEzODd9.xTMTMW1bF2KpQcIcC1TCIrimevK7kM-GzIQ0sMqqtZQ"
}
//event student id 4414510
const evenHeader = {
    "authorization": "bearer" +
        " eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQxNDUxMCwiaWF0IjoxNTcxOTA5NDg2LCJleHAiOjE2MzQ5ODE0ODZ9.lPQKz8Q0gCiRK77kK2PTBFKBCz-si6x3czjJbvEtn0E"
}
let limit = 10
MongoClient.connect(mongoUrl, async function(err, client) {
    if (err) {
        throw err;
    } else {

        try {
            // console.log(db)
            const mongo = client.db(dbName);
            await main(mongo,limit)
            //get list of questions from mongo logs
            //close connection
            client.close();

        } catch (e) {
            console.log(e)
        }
    }

});

let t = 0
let f = 0
let failedQuestionIds = []

let counter = 0
let totalSignedUrlTime = 0
let totalUploadTime = 0
let totalPollingTime = 0
let totalTime = 0

async function main(mongo,limit){
        let questionList = await getQuestions(mongo,limit)
        // console.log(questionList)
        for(let i=0;i<questionList.length;i++){
            //1.download image
            try {
                console.log(i)

                // console.log(questionList[i])
                let fileName = questionList[i]['question_image']
                let matchArray = questionList[i]['qid_matches_array']
                let question_image = cdn_path + "images/" + fileName
                let locale = questionList[i]['user_locale']
                let isStudentIdEven = false
                if (isEven(questionList[i]['student_id'])) {
                    isStudentIdEven = true
                }

                const options = {
                    url: question_image,
                    dest: __dirname + '/' + fileName
                }
                await download.image(options)
                console.log('Starting timer')
                counter = counter + 1
                let startTime = new Date()
                console.log(startTime)
                console.log('Getting signed Url')

                //2.get signed url
                var signedUrlOptions = {
                    method: 'GET',
                    uri: 'https://api.doubtnut.com/v1/config/get-signed-url',
                    headers: (isStudentIdEven) ? evenHeader : oddHeader
                };
                let signedUrlResponse = await rp(signedUrlOptions)
                var end = new Date() - startTime
                totalSignedUrlTime = totalSignedUrlTime + end
                console.info('Execution time for getting signed url: %dms', end)
                // return;
                console.log('Got signed Url')
                signedUrlResponse = JSON.parse(signedUrlResponse)
                let signedUrl = signedUrlResponse['data']['url']
                let newFileName = signedUrlResponse['data']['fileName']
                let question_id = signedUrlResponse['data']['question_id']
                //3.rename file
                await renameFile(fileName, newFileName, fs)
                //4.upload the image
                console.log('uploading file')
                let uploadStartTime = new Date()
                await uploadImage(fs, newFileName, signedUrl)
                console.log('Upload Complete')
                var end2 = new Date() - uploadStartTime
                console.info('Execution time for uploading image: %dms', end2)
                totalUploadTime = totalUploadTime + end2
                let pollingUri = 'https://api.doubtnut.com/v2/questions/matches?file_name=' + newFileName + '&question_id=' + question_id
                // let pollingUri = 'http://localhost:3000/v2/questions/matches?file_name=' + newFileName + '&question_id=' + question_id
                if (!_.isEmpty(locale)) {
                    pollingUri = pollingUri + '&locale=' + locale
                }
                console.log(pollingUri)
                //5. do polling
                let pollingRequestOptions = {
                    method: 'GET',
                    // uri: 'https://api.doubtnut.com/v2/questions/matches?file_name=' + newFileName + '&question_id=' + question_id,
                    uri: pollingUri,
                    headers: (isStudentIdEven) ? evenHeader : oddHeader
                };
                console.log('Polling Start')
                let pollingStart = new Date()
                console.log(pollingStart)
                let matchResponse = await pollingPromise(pollingRequestOptions)
                console.log("Polling done")
                var end3 = new Date() - pollingStart
                console.info('Execution time for polling: %dms', end3)
                totalPollingTime = totalPollingTime + end3
                var end4 = new Date() - startTime
                console.info('Execution time for script: %dms', end4)
                totalTime = totalTime + end4
                // console.log(matchResponse['data']['value']['matched_questions'])
                let newMatchesArray = generateMatchArray(matchResponse['data']['value']['matched_questions'])
                // console.log("newMatchesArray")
                console.log(matchArray)
                console.log(newMatchesArray)
                let r = compareArray(matchArray, newMatchesArray)
                console.log(r)
                if (r) {
                    t = t + 1

                } else {
                    failedQuestionIds.push(questionList[i]['qid'])
                    console.log(questionList[i]['qid'])
                    f = f + 1
                }
            }catch(e){
                console.log("Error-")
                console.log(e)
            }
        }
        console.log("True = "+t)
        console.log("False = "+f)
        console.log(failedQuestionIds)
    console.log('end')
    console.log("Number of question asked : " + counter)
    console.log("Average time spent on getting signed url : " + totalSignedUrlTime/counter)
    console.log("Average time spent on uploading image : " + totalUploadTime/counter)
    console.log("Average time spent on polling matches : " +totalPollingTime/counter)
    console.log("Average time per transaction : "+ totalTime/counter)
    // }catch(e){
    //     console.log(e)
    // }
}

function getQuestions(mongo,limit) {
    return new Promise(async function(resolve, reject) {
        // Do async job
        try {
            mongo
                .collection("questionlogs")
                .find({request_version : 'v9','question_image' : { $exists: true, $ne: null },'user_locale' : { $exists: true, $ne: null }})
                // .find({qid : '65939711'})
                .sort({updatedAt:-1})
                .limit(limit)
                .toArray(async function(err, result) {
                    if (err) {
                        return reject(err);
                    }
                    // console.log("result")
                    // console.log(result)
                    return resolve(result);
                });
        } catch (e) {
            console.log(e);
            return reject(e);
        }
    });
}
function renameFile(oldFileName,newFileName,fs){
        //first try to get from redis
        return new Promise(async function (resolve, reject) {
            // Do async job
            try {
                fs.rename(__dirname+'/'+oldFileName, __dirname+'/'+newFileName, function(err) {
                    if ( err ) reject(err)
                    resolve()
                });
            } catch (e) {
                console.log(e)
                return reject(e)
            }
        })
}
function uploadImage(fs,fileName,signedUrl){
    return new Promise(async function (resolve, reject) {
        // Do async job
        try {
            let readmeStream = fs.createReadStream(__dirname + "/"+fileName)
            readmeStream.on('error', console.log)
            const {size} = fs.statSync(__dirname + "/"+fileName)
            const putOptions = {
                method: 'PUT',
                url: signedUrl,
                gzip: true,
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Length': size,
                }
            }
            readmeStream.pipe(rp(putOptions)).then(async body => {
                //upload complete here
                resolve()
            })
                .catch(err => {
                    console.log("err");
                    console.log(err);
                    reject(err)
                });
        } catch (e) {
            console.log(e)
            return reject(e)
        }
    })

}
function pollingGetMatches(option, cb) {
    request(option, function (error, response, body) {
        if (error) {
            console.log("error")
            console.log(error)
        } else {
            try{
                // console.log("no error")
                body = JSON.parse(body)
                // console.log(body.data)
                if (body.data.retry) {
                    // console.log('teststs')
                    setTimeout(function () {
                        pollingGetMatches(option, cb)
                    }, 0);
                } else {
                    console.log("retry")
                    // console.log(body.data)
                    return cb(body)
                    // }    });
                }
            }catch(e){
                console.log("Polling error")
                console.log(body)
                console.log(e)
                setTimeout(function () {
                    pollingGetMatches(option, cb)
                }, 0);
            }

        }
    })
}
function pollingPromise(pollingRequestOptions){
    return new Promise(async function (resolve, reject) {
        // Do async job
        try {
            pollingGetMatches(pollingRequestOptions, function (resp) {
                console.log('polling done')
                // console.log(resp)
                return resolve(resp)
            })
        } catch (e) {
            console.log(e)
            return reject(e)
        }
    })
}
function isEven(number){
    if(typeof number !== 'number'){
        number = parseInt(number)
    }
    if(number % 2 == 0){
        return true
    }
    return false
}
function generateMatchArray(matchesArray){
    let arr = []
    for(let i=0;i<matchesArray.length;i++){
        // console.log(matchesArray[i]['_id'])
        if(typeof matchesArray[i]['_id'] !== 'undefined'){
            arr.push(matchesArray[i]['_id'])
            // console.log('test')
        }
    }
    return arr
}

function compareArray(arr1,arr2){
    if(arr1.length !== arr2.length){
        return false
    }
    for(let i=0;i<arr1.length;i++){
        if(arr1[i] !== arr2[i]){
            return false
        }
    }
    return true
}


// '50434566', '50434470',
//     '50434446', '50434269',
//     '50434097', '50434061',
//     '50434001', '50433814',
//     '50433730', '50433650',
//     '50433380', '50433317',
//     '50433040', '50432769',
//     '50432300', '50431659',
//     '50431610', '50431385'


