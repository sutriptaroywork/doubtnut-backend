"use strict"
/* eslint-disable no-new */
/* eslint-disable new-cap */
// eslint-disable-next-line import/order
require('dotenv').config({path : __dirname + '/../../api_server/.env'})
const fs = require('fs');
const config = require(__dirname+'/../../api_server/config/config')
const database = require('../../api_server/config/database')
const conRead = config.mysql_analytics;
const conWrite = config.mysql_write;
const mysqlRead = new database(conRead);
const mysqlWrite = new database(conWrite);
const s3 = require("./s3.helper");
const yt = require("./youtube.helper");
const { exec } = require("child_process");

// const { exec } = require("child_process");

async function doCommand(command) {
    console.log("command", command);
    return new Promise(resolve => {
        exec(command, (err, stdout, stderr) => {
            console.log(stdout);
            console.error(stderr);
            resolve(stdout);
        });
    });
}

function getAllAnswers(locale) {
    const sql = `select b.ocr_text, b.question_id, d.answer_id, d.answer_video from (select * from classzoo1.studentid_package_mapping_new where video_language in ('${locale}') and to_index=1) as a left join classzoo1.questions as b on a.student_id=b.student_id left join (select max(answer_id) as answer_id, question_id from classzoo1.answers group by question_id) as c  on b.question_id=c.question_id left join classzoo1.answers as d on c.answer_id=d.answer_id  where b.is_answered=1 and d.answer_id is not null and d.youtube_id is null limit 2`;
    return mysqlRead.query(sql);
}

function addslashes(string) {
    return string.replace(/\\/g, '\\\\').
    replace(/\u0008/g, '\\b').
    replace(/\t/g, '\\t').
    replace(/\n/g, '\\n').
    replace(/\f/g, '\\f').
    replace(/\r/g, '\\r').
    replace(/'/g, '\\\'').
    replace(/"/g, '\\"');
}


function cleanText(text) {
    text = text.replace(/<br>/g, ' ');
    text = text.replace(/;/g, ',');
    text = text.replace(/->/g, 'rarr');
    text = text.replace(/=>/g, 'implies');
    text = text.replace(/<-/g, 'larr');
    text = text.replace(/>=/g, 'ge');
    text = text.replace(/<=/g, 'le');
    text = text.replace(/>/g, 'gt');
    text = text.replace(/</g, 'lt');
    text = text.replace(/`\(##/g, '###');
    text = text.replace(/##\)`/g, '###');
    text = text.replace(/<img[^>]+>/g, '');
    text = text.replace(/  /g, '');
    text = text.replace(/"/g, '');
    text = addslashes(text);
    text = text.replace(/ dot /g, '');
    text = text.replace(/[\n\r]/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/[ ]{2,}|[\t]/g, ' ');
    text = text.replace(/!s+!/g, '');
    text = text.replace(/\xc2\xa0/g, ' ');
    text = text.replace(/xc2\xa0/g, ' ');
    text = text.replace(/[[:^print:]]/g, '');
    return text;
}

async function deleteFiles(answerDetails) {
    await doCommand(`rm download/${answerDetails.answer_video.split('.')[0]}.MTS`);
    await doCommand(`rm download/${answerDetails.answer_video.split('.')[0]}.mp4`);
    await doCommand(`rm download/${answerDetails.answer_video.split('.')[0]}.txt`);
    await doCommand(`rm download/${answerDetails.answer_video.split('.')[0]}_output.MTS`);
    await doCommand(`rm download/${answerDetails.answer_video.split('.')[0]}_output.mp4`);
}



async function createTextFile(filename) {
    try {
        fs.appendFileSync(`download/${filename.split('.')[0]}.txt`, 'file intro_hi.MTS\n');
        fs.appendFileSync(`download/${filename.split('.')[0]}.txt`, 'file '+filename.split('.')[0]+'.MTS\n');
        fs.appendFileSync(`download/${filename.split('.')[0]}.txt`, 'file outro_hi.MTS\n');

    } catch (e) {
        console.error(e); // should contain code (exit code) and signal (that caused the termination).
        throw new Error(e);
    }
}

async function processVideo(answerDetails, auth) {
    try {
        //download video
        await s3.downloadS3Object('doubtnutteststreamin-hosting-mobilehub-1961518253', answerDetails.answer_video, `download/${answerDetails.answer_video}`);
        //convert video to MTS: ffmpeg -i answer-1590313049_121610193.mp4 -q 0 answer-1590313049_121610193.MTS;
        await doCommand(` ffmpeg -i download/${answerDetails.answer_video} -q 0 download/${answerDetails.answer_video.split('.')[0]}.MTS `);
        //create txt file
        await createTextFile(answerDetails.answer_video);
        // concatenate videos
        await doCommand(` ffmpeg -f concat -i download/${answerDetails.answer_video.split('.')[0]}.txt -c copy  download/${answerDetails.answer_video.split('.')[0]}_output.MTS`);
        //convert output file to mp4
        await doCommand(` ffmpeg -i download/${answerDetails.answer_video.split('.')[0]}_output.MTS download/${answerDetails.answer_video.split('.')[0]}_output.mp4`);

        //upload to compression s3 : Not now as it not ready for short form videos

        //clean ocr_text
        answerDetails.ocr_text = cleanText(answerDetails.ocr_text);
        let isThumbnailPresent = true;
        try {
            //download thumbnail
            await s3.downloadS3Object('doubtnut-static', `q-thumbnail/${answerDetails.question_id}.png`, `download/${answerDetails.question_id}.png`)

        } catch (e) {
            console.error(e); // should contain code (exit code) and signal (that caused the termination).
            isThumbnailPresent = false;
        }
        console.log(answerDetails);
        console.log(isThumbnailPresent);
        // console.log(response);
        //upload to youtube
        const response = await yt.uploadVideo(auth,`${answerDetails.ocr_text.substring(0, 96)}...`, answerDetails.ocr_text, '', 'hi', `download/${answerDetails.answer_video.split('.')[0]}_output.mp4`, (isThumbnailPresent) ? `download/${answerDetails.question_id}.png` :  '', 'private' );
        // const response = await yt.uploadVideo(auth,`${answerDetails.ocr_text.substring(0, 96)}...`, answerDetails.ocr_text, '', 'hi', `download/${answerDetails.answer_video.split('.')[0]}_output.mp4`, (isThumbnailPresent) ? `download/${answerDetails.question_id}.png` :  '', 'private' );
        if (response.id) {
            //insert in youtube_uploads table
            mysqlWrite.query(`INSERT INTO youtube_uploads set ?`, [{
                question_id: answerDetails.question_id,
                answer_id: answerDetails.answer_id,
                answer_video: answerDetails.answer_video,
                youtube_id: response.id,
                yt_title : `${answerDetails.ocr_text.substring(0, 96)}...`,
                yt_description: answerDetails.ocr_text,
                privacy_status : 'private'
            }])
            // update in answers table
            mysqlWrite.query(`update answers set youtube_id=${response.id} where answer_id=${answerDetails.answer_id}`)
        }
        //delete leftovers : txt, mp4, _output.mp4, MTS,  _output.MTS
        await deleteFiles(answerDetails);

    } catch (e) {
        console.error(e); // should contain code (exit code) and signal (that caused the termination).
        throw new Error(e);
    }
}

async function main(auth) {
    try{
        console.log(auth);
        const answers = await getAllAnswers('hi');
        console.log(answers);
        let promise= [];
        for (let i=0; i< answers.length; i++) {
            if (answers[i].answer_video.includes('.mp4')) {
                console.log(answers[i]);
                promise.push(processVideo(answers[i]), auth);
                if ( (i%2 == 0 && i != 0) || i == answers.length-1) {
                    await Promise.all(promise);
                    promise = [];
                }
            } else {
                //entry in table for skipping
                console.log('skip');
                mysqlWrite.query(`INSERT INTO youtube_uploads set ?`, [{
                    question_id: answers[i].question_id,
                    answer_id: answers[i].answer_id,
                    answer_video: answers[i].answer_video
                }])
            }
        }
    } catch (e) {
        console.error(e); // should contain code (exit code) and signal (that caused the termination).
        throw new Error(e);
    }
}

(async () => {
    try {
        // Load client secrets from a local file.
        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }
            // Authorize a client with the loaded credentials, then call the YouTube API.
            yt.authorize(JSON.parse(content), main);
        });
    }catch (error) {
        console.log(error);
    } finally {
        mysqlRead.close();
        mysqlWrite.close();
    }
})();