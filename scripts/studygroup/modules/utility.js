/* eslint-disable import/no-dynamic-require */
const path = `${__dirname}/../../../api_server/`;
const { sendFcm } = require(`${path}modules/utility`);
const { MongoClient } = require('mongodb');
const axios = require('axios');

module.exports = class Utility {
    static async connectMongo(config) {
        const mongodbUrl = config.mongo.database_url.replace('{username}', config.mongo.database_user).replace('{password}', config.mongo.database_pass).replace('{database}', config.mongo.database_name);
        return new Promise((resolve, reject) => {
            MongoClient.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err, mongoClient) => {
                if (err && !mongoClient) {
                    console.error(err);
                    reject();
                }
                return resolve(mongoClient.db(config.mongo.database_name));
            });
        });
    }

    static async postMultipleMessage(message, roomIds) {
        try {
            const microService = {
                method: 'post',
                url: 'https://micro.doubtnut.com/api/chatroom/multiple-post',
                headers: {
                    'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NzI0NTE1LCJpYXQiOjE1OTY1MjIwNjgsImV4cCI6MTY1OTU5NDA2OH0.jCnoQt_VhGjC6EMq_ObPl9QpkBJNEAqQhPojLG_pz8c',
                    Cookie: '__cfduid=d117dc0091ddb32cee1131365a76a7c931617628174',
                },
                data: {
                    message,
                    room_list: roomIds,
                },
            };

            axios(microService)
                .then((response) => {
                    console.log(JSON.stringify(response.data));
                })
                .catch((error) => {
                    console.error(error);
                });
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async postMessage(data) {
        try {
            const microService = {
                method: 'post',
                url: 'https://micro.doubtnut.com/api/chatroom/post',
                headers: {
                    'x-auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NzI0NTE1LCJpYXQiOjE1OTY1MjIwNjgsImV4cCI6MTY1OTU5NDA2OH0.jCnoQt_VhGjC6EMq_ObPl9QpkBJNEAqQhPojLG_pz8c',
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                    Cookie: '__cfduid=d117dc0091ddb32cee1131365a76a7c931617628174',
                },
                data,
            };

            axios(microService)
                .then((response) => {
                    console.log(JSON.stringify(response.data));
                })
                .catch((error) => {
                    console.error(error);
                });
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async sendNotification(studentData) {
        try {
            for (const student of studentData) {
                if (student.gcm_reg_id) {
                    const notificationData = {
                        event: 'study_group_chat',
                        title: `${unescape(student.group_name)} mein aaya hai nya message`,
                        message: 'Guidelines follow krna hai zaroori',
                        image: null,
                        firebase_eventtag: 'studygroup',
                        data: { group_id: student.room_id, is_faq: false },
                    };
                    // console.log('notificationData ', notificationData);
                    sendFcm(student.student_id, student.gcm_reg_id, notificationData, null, null);
                }
            }
        } catch (e) {
            console.log(e);
            return false;
        }
    }
};
