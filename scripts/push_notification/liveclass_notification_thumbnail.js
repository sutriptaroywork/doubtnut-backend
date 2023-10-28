"use strict";

const puppeteer = require('puppeteer')
const fs = require('fs')
const database = require('./database')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand
} = require("@aws-sdk/client-s3");

require('dotenv').config()

// Set the AWS region
const REGION = "ap-south-1"; // e.g., "us-east-1"

// Set the bucket parameters
const bucketName = "doubtnut-static";
const bucketParams = { Bucket: bucketName };

const path = require('path')

const con = {
    //host: "test-db-latest.cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    timezone: process.env.TIMEZONE
}

const mysql = new database(con)

let db


console.log('start')

function getAllTopics(mysql) {
    let sql = "SELECT a.id as detail_id, d.class, a.live_at,hour(a.live_at) as hour_class, a.subject as subject_class, a.liveclass_course_id, a.chapter, b.resource_reference, c.name as faculty_name ,c.image_url as faculty_image,d.title from liveclass_course_resources as b left join liveclass_course_details as a on a.id=b.liveclass_course_detail_id left join dashboard_users as c on a.faculty_id=c.id left JOIN liveclass_course as d on a.liveclass_course_id=d.id left join course_details_liveclass_course_mapping as e on a.liveclass_course_id = e.liveclass_course_id  where ((e.vendor_id = 1 and b.resource_type = 4) or (e.vendor_id = 2 and b.resource_type = 1)) and date(a.live_at)=CURRENT_DATE and a.is_replay = 0 order by a.live_at"
    return mysql.query(sql)
}


async function uploadToS3(objectParams) {
    // Create an S3 client service object
    const s3 = new S3Client({ region: REGION });

    try {
        const results = await s3.send(new PutObjectCommand(objectParams));
    } catch (err) {
        console.log("Error", err);
    }
}

async function main(mysql) {
    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()


        await page.setViewport({
            width: 970,
            height: 465,
            deviceScaleFactor: 1,
        })

        let allTopics = await getAllTopics(mysql)

        for (let i = 0; i < allTopics.length; i++) {
            // console.log(allTopics[i]);
            let detail_id = allTopics[i].detail_id
            let faculty_id = allTopics[i].faculty_id
            let class_id = allTopics[i].class
            let subject = allTopics[i].subject_class
            let course_id = allTopics[i].course_id
            let lecture = allTopics[i].chapter
            let question_id = allTopics[i].resource_reference
            let faculty_image = allTopics[i].faculty_image
            let faculty_name = allTopics[i].faculty_name
            let title = allTopics[i].title
            let live_at = allTopics[i].live_at
            let hour_class = allTopics[i].hour_class
            let template_name = ''

            // if (question_id!=561746524) {
            //     continue;
            // }
            let time_class1 = hour_class % 12 || 12; // Adjust hours
            let time_class2 = hour_class < 12 ? 'AM' : 'PM'; // Set AM/PM
            let class_time = time_class1 + " " + time_class2


            console.log("id : ", detail_id)
            console.log("faculty : ", faculty_name)
            console.log("faculty image : ", faculty_image)
            console.log("class : ", class_id)
            console.log("question : ", question_id)
            console.log("subject : ", subject)
            console.log("lecture : ", lecture)
            console.log("title: ", title)
            console.log("class_time : ", class_time)


            if (class_id == 14) {
                if (faculty_image == null) {
                    template_name = 'live-class-govt-without-img.html';
                    console.log("000000");

                }
                else {
                    template_name = 'live-class-govt.html';
                }

            }


            else if (class_id < 14) {

                if (faculty_image == null) {
                    template_name = 'live-class-without-img.html';
                }
                else {
                    template_name = 'live-class.html';
                    console.log("11111");
                }

            }

            let template = await readFileAsync(template_name, 'utf8')
            //template =  template.replace('$',img_link)
            template = template.replace('#top#', title)
            template = template.replace('#time#', class_time)
            template = template.replace('#class#', class_id)
            template = template.replace('#subject#', subject)
            template = template.replace('#chapter#', lecture)
            template = template.replace('#expert#', faculty_name)
            template = template.replace('#image#', faculty_image)
            //template =  template.replace('##BGIMAGE##', 'https://d10lpgp6xz60nq.cloudfront.net/images/etoos/thumbnail-background/'+subject+'_S.png')

            await page.setContent(template)
            let image_name = 'notif-thumb-' + detail_id + '-' + class_id + '-' + question_id + '.png'
            let screenshot_image = await page.screenshot({ path: './lecture_thumbnails/' + image_name, type: "png" })
            let keyName = `q-thumbnail/${image_name}`
            console.log(keyName);
            const objectParams = { Bucket: bucketName, Key: keyName, Body: screenshot_image };
            await uploadToS3(objectParams);
            break;
        }
    } catch (e) {
        console.log(e)
    } finally {
        mysql.close()
        return
    }
}

main(mysql)