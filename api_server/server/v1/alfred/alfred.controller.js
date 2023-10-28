const _ = require('lodash')
const { ObjectId } = require('mongodb'); // or ObjectID 

async function createChannel(req, res, next) {
    try {
        const db = req.app.get('db');
        let data = { name, color, language } = req.body
        data.student_id = req.user.student_id;
        data.class = req.user.student_class;
        data.is_deleted = false;
        data.is_profane = false;
        data.is_active = true;
        db.mongo.write.collection('alfred').save(data);
        next({ data })
    } catch (error) {
        next(error)
    }
}
async function getChannel(req, res, next) {
    try {
        const db = req.app.get('db');
        let page_number = 0
        let page_size = 10
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1
        }

        let is_aggregated = false
        let channelData = []
        if (req.query.filter == 'popular') {
            var pipeline = [
                {
                    "$match": {
                        "is_active": true
                    }
                },
                {
                    "$group": {
                        "_id": "$channel_id",
                        "count": {
                            "$sum": 1.0
                        }
                    }
                },
                {
                    "$sort": {
                        "count": -1.0
                    }
                },
                {
                    "$lookup": {
                        "from": "alfred",
                        "localField": "_id",
                        "foreignField": "_id",
                        "as": "channel"
                    }
                },
                {
                    "$skip": page_number * page_size
                },
                {
                    "$limit": page_size
                }
            ];
            channelData = await db.mongo.read.collection('alfred_users').aggregate(pipeline).toArray()
            is_aggregated = true
        } else {
            let query = { 'is_deleted': false }
            if (req.query.last_id && req.query.last_id !== "") {
                query['_id'] = {
                    '$lt': ObjectId(req.query.last_id)
                }
            }
            channelData = await db.mongo.read.collection('alfred').find(query).sort({ '_id': -1 }).limit(page_size).toArray()
        }

        let sendData = await channelAggregator(channelData, db, is_aggregated)
        next({ data: sendData })
    } catch (error) {
        next(error)
    }
}
async function banUser(req, res, next) {
    try {
        const db = req.app.get('db');
        let data = {
            student_id: parseInt(req.body.student_id),
            channel_id: ObjectId(req.body.channel_id),
            reason: req.body.reason
        }
        data.is_deleted = false;
        data.is_active = true;
        await db.mongo.write.collection('alfred_ban').save(data);
        next({ data })
    } catch (error) {
        next(error)
    }
}
async function userStatus(req, res, next) {
    try {
        const db = req.app.get('db');
        let user_status = await db.mongo.read.collection('alfred_ban').find({ 'student_id': parseInt(req.user.student_id), 'channel_id': ObjectId(req.params.channelId), 'is_deleted': false, 'is_active': true }).toArray()
        let responseData = {
            status: 'Ok'
        }
        if (user_status.length) {
            responseData.status = 'Banned'
        }
        next({ data: responseData })
    } catch (error) {
        next(error)
    }
}
async function userJoinStatus(req, res, next) {
    try {
        const db = req.app.get('db');
        let data = {
            student_id: parseInt(req.user.student_id),
            channel_id: ObjectId(req.body.channel_id)
        }
        let is_active = parseInt(req.body.is_active) ? true : false;
        db.mongo.write.collection('alfred_users').findAndModify(
            data, // query
            [['_id', 'desc']],  // sort order
            { '$set': { is_active } },
            { 'upsert': true }, // options
            function (err, object) {
                if (err) {
                    console.warn(err.message);
                } else {
                    console.dir(object);
                }
            });
        next({ data })
    } catch (error) {
        next(error)
    }
}
async function channelAggregator(channelData, db, is_aggregated) {
    let sendData = []
    for (const elem of channelData) {
        let channel = elem
        if (is_aggregated) {
            channel = elem.channel[0]
        }
        if (channel) {
            let student_data_sql = 'select * from students left join gamification_user_meta on student_id = user_id where student_id = ?';
            let student_data = await db.mysql.read.query(student_data_sql, [channel.student_id])
            if (!_.isEmpty(student_data[0].student_fname)) {
                student_data[0].student_username = student_data[0].student_fname;

                if (!_.isEmpty(student_data[0].student_lname)) {
                    student_data[0].student_username =
                        `${student_data[0].student_fname}` +
                        " " +
                        `${student_data[0].student_lname}`;
                }
            }
            channel.created_at = ObjectId(channel._id).getTimestamp();
            delete student_data[0].mobile
            delete student_data[0].student_email
            channel.admin = student_data[0]
            sendData.push(channel)
        }
    }
    return sendData
}
module.exports = {
    createChannel,
    getChannel,
    banUser,
    userStatus,
    userJoinStatus
}