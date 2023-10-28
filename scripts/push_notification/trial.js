/* eslint-disable no-await-in-loop */

require("dotenv").config({ path: `${__dirname}/../../api_server/.env` });

const config = require(`${__dirname}/../../api_server/config/config`);
// const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);
const FlagrUtility = require(`${__dirname}/../../api_server/modules/Utility.flagr.js`);
const _ = require("lodash");
const moment = require("moment");
const rp = require("request-promise");
const axios = require("axios");
const Database = require("./database");
const mysql = require("mysql");
const request = require("request");

console.log(config);
const analytics = config.mysql_analytics;
const write = config.write_mysql;
const cronServerServiceID = "P9T0CZU";

const event = "PAYMENT-FAILURE-TRIAL";

const templates = {
  notification: {
    en: {
      title: "Payment mein Issue? Padhai rukni nahi chahiye!",
      message: "Doubtnut ne kar diya hai {{1}} ka 3 day trial activate.",
      firebaseTag: "PAYMENT_FAILURE_TRIAL_EN",
    },
    hi: {
      title: "पेमेंट में दिक्कत? पढाई रुकनी नहीं चाहिए!",
      message: "Doubtnut ने कर दिया है {{1}} का तीन दिन का ट्रायल एक्टिवटे!",
      firebaseTag: "PAYMENT_FAILURE_TRIAL_HI",
    },
  },
};

async function getFlagrResponseBool(studentID, expName) {
  try {
    const flagrResp = await FlagrUtility.getFlagrResp(
      {
        body: {
          entityId: studentID.toString(),
          capabilities: {
            "3_days_trial_experiment": {
              entityId: studentID.toString(),
            },
          },
        },
      },
      1000
    );
    console.log("flagrResp");
    console.log(flagrResp);
    if (!flagrResp) {
      return false;
    }
    return flagrResp[expName].payload.enabled;
  } catch (e) {
    return true;
  }
}

async function fetchStudents(mysql) {
  const sql = `select 
    distinct
    count_table.variant_id,
    package.id,
    cd.display_name,
    cd.parent,
    count_table.student_id,
    s.gcm_reg_id,
    s.mobile,
    cd.meta_info as locale,
    cd.assortment_id,
    s.app_version
  from
    (
       select
          id,
          payment_info.student_id,
          count_success,
          payment_for,
          created_at,
          variant_id
       from
          payment_info
          join
             (
                select
                   student_id,
                   sum(if(status = 'SUCCESS', 1, 0)) as count_success
                from
                   payment_info
                   left join
                      variants
                      on variants.id = variant_id
                   left join
                      package
                      on package_id = package.id
                   left join
                      course_details cd
                      on package.assortment_id = cd.assortment_id
                where
                   cd.assortment_type = 'course'
                group by
                   student_id
             )
             as a
             on a.student_id = payment_info.student_id
    )
    as count_table
    left join
       payment_failure
       on count_table.id = payment_failure.payment_info_id
    left join
       variants
       on variants.id = variant_id
    left join
       package
       on package_id = package.id
    left join
       students s
       on s.student_id = count_table.student_id
    left join
       course_details cd
       on package.assortment_id = cd.assortment_id
  where
    count_table.count_success = 0
    and cd.assortment_type = 'course'
    and count_table.created_at < NOW() - INTERVAL 30 minute
    and count_table.created_at > NOW() - INTERVAL 60 minute
    and package.assortment_id is not null
    and s.app_version is not null
    and s.student_id not in
    (
       select
          sps.student_id
       from
          student_package_subscription sps
          left join
             package p
             on sps.new_package_id = p.id
       where
          sps.amount = - 1
          and not (sps.variant_id is null
          and sps.new_package_id is null)
    )  `;
  // console.log(sql);
  return mysql.read.query(sql);
}

async function startSubscriptionForStudentId(mysql, obj) {
  const sql = "insert into student_package_subscription SET ?";
  return mysql.write.query(sql, [obj]);
}

async function createSubscriptionEntryForTrial(
  mysql,
  studentId,
  variantId,
  packageId,
  amount,
  trialDuration
) {
  try {
    const now = moment().add(5, "hours").add(30, "minutes");
    const insertSPS = {};
    insertSPS.student_id = studentId;

    insertSPS.variant_id = variantId;
    insertSPS.start_date = moment(now)
      .startOf("day")
      .format("YYYY-MM-DD HH:mm:ss");
    insertSPS.end_date = moment(now)
      .add(trialDuration, "days")
      .endOf("day")
      .format("YYYY-MM-DD HH:mm:ss");
    insertSPS.amount = amount;
    insertSPS.student_package_id = 0;
    insertSPS.new_package_id = packageId;
    insertSPS.doubt_ask = -1;
    insertSPS.is_active = 1;
    return await startSubscriptionForStudentId(mysql, insertSPS);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
async function main() {
  let writeClient = "";
  let readClient = "";
  try {
    writeClient = new Database(write);
    readClient = new Database(analytics);
    const mysql = {
      read: readClient,
      write: writeClient,
    };
    const sentUsers = [];
    const students = await fetchStudents(mysql);
    console.log(students);

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const splittedAppVersion = row.app_version.split(".");

      if (sentUsers.includes(row.student_id)) {
        console.log("skip", row.student_id);
        continue;
      }
      const locale = row.locale === "HINDI" ? "hi" : "en";
      expName = "3_days_trial_experiment";
      const flagrResp = await getFlagrResponseBool(row.student_id, expName);
      console.log(flagrResp);
      if (
        flagrResp &&
        parseInt(splittedAppVersion[0]) >= 7 &&
        parseInt(splittedAppVersion[1]) >= 8 &&
        parseInt(splittedAppVersion[2]) >= 266
      ) {
        console.log("test");
        const trialDuration = 3;
        const studentId = row.student_id;
        const packageId = row.id;
        const courseDisplayName = row.display_name;
        const variantId = row.variant_id;
        const result = await createSubscriptionEntryForTrial(
          mysql,
          studentId,
          variantId,
          packageId,
          -1,
          trialDuration
        );
        if (!_.isEmpty(result)) {
          if (!_.isEmpty(row.gcm_reg_id)) {
            const notificationPayload = {
              event: "course_details",
              image: row.demo_video_thumbnail || "",
              title: templates.notification[locale].title,
              message: templates.notification[locale].message.replace(
                "{{1}}",
                courseDisplayName
              ),
              firebase_eventtag: templates.notification[locale].firebaseTag,
              s_n_id: templates.notification[locale].firebaseTag,
            };
            if (row.parent == 4) {
              notificationPayload.event = "course_category";
              notificationPayload.data = JSON.stringify({
                category_id: "Kota Classes",
              });
            } else {
              notificationPayload.data = JSON.stringify({
                id: row.assortment_id,
              });
            }
            sendNotification(
              [{ id: row.student_id, gcmId: row.gcm_reg_id }],
              notificationPayload
            );
            sentUsers.push(row.student_id);
          }
        }
      }
    }
    console.log(sentUsers);
  } catch (e) {
    console.error(e);
  } finally {
    writeClient.connection.end();
    readClient.connection.end();
  }
}

async function sendNotification(user, notificationInfo) {
  console.log("notificationInfo");
  console.log(notificationInfo);
  console.log(user.length);
  const options = {
    method: "POST",
    url: config.NEWTON_NOTIFICATION_URL,
    headers: { "Content-Type": "application/json" },
    body: { notificationInfo, user },
    json: true,
  };

  console.log(options);
  return new Promise((resolve, reject) => {
    try {
      request(options, (error, response, body) => {
        if (error) console.log(error);
        console.log(body);
        resolve();
      });
    } catch (err) {
      // fn(err);
      console.log(err);
      reject(err);
    }
  });
}
main();
