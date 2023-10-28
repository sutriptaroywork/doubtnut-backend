const moment = require("moment");
const _ = require("lodash");
const { ObjectId } = require("mongodb"); // or ObjectID
const Utility = require('../../../modules/utility');
const CDN_URL = "https://d10lpgp6xz60nq.cloudfront.net/images/"
const CommentContainer = require('../../../modules/containers/comment')
const bluebird = require("bluebird");
require('../../../modules/mongo/comment')
const mongoose = require("mongoose");
bluebird.promisifyAll(mongoose);
const Comment = mongoose.model("Comment");
const jsonToTable = require('json-to-table');
const { Parser } = require('json2csv');
const AnswerContainer = require('../../../modules/containers/answer')


async function getFeedItem(req, res, next) {
    try {
        const db = req.app.get("db");
        let post
        if (typeof req.params.id == 'string' && req.params.id.includes('_pinned')) {
            let pinned_id = req.params.id.replace(/_pinned/g, "");
            let pinned_sql = `select * from  pinned_post where id = ${pinned_id}`
            let pinned = await db.mysql.read.query(pinned_sql);
            console.log(pinned)
            post = await pinned_formatter(db, pinned[0])
        } else {
            post = await db.mongo.read.collection("tesla").findOne({
                _id: ObjectId(req.params.id),
            });
        }
        let sendData = await postAggregator([post], req.user.student_id, db, 0, 1);
        next({
            data: sendData[0] ? sendData[0] : {},
        });
    } catch (error) {
        next(error);
    }
}
async function getFeed(req, res, next) {
    try {
        const db = req.app.get("db");
        let page_number = 0;
        let feed_algo_size = 8;
        let page_size = 10;
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1;
        }

        let with_video_type = 0;
        if (req.query.with_video_type) {
            with_video_type = parseInt(req.query.with_video_type);
        }
        let see_feed = await db.redis.read.zrevrangeAsync(
            "tesla_rank_custom",
            feed_algo_size * page_number,
            feed_algo_size * (page_number + 1)
        );
        let recent_post_size = page_size - see_feed.length;
        let feedranked = [];
        see_feed = _.map(see_feed, (id) => {
            return ObjectId(id);
        });
        if (see_feed.length) {
            feedranked = await db.mongo.read
                .collection("tesla")
                .find({
                    _id: {
                        $in: see_feed,
                    },
                })
                .toArray();
        }
        let postsData = await db.mongo.read
            .collection("tesla")
            .find({
                is_active: true,
                is_deleted: false,
            })
            .sort({
                _id: -1,
            })
            .skip(page_number * recent_post_size)
            .limit(recent_post_size)
            .toArray();
        // Get Pinned Post
        // Check If it Exist In Map or Not
        // Create Map If Not Exist
        // Create Object For Given Id
        if (!page_number) {
            let pinned_sql = "select  * from pinned_post where class = 'all' and post_type in ('viral_videos','youtube') and is_active = 1 and `start_date` <= CURRENT_TIMESTAMP and `end_date` >=CURRENT_TIMESTAMP order by created_at desc limit 1 ";
            let pinned = await db.mysql.read.query(pinned_sql)

            if (pinned.length) {
                pinned = await pinned_formatter(db, pinned[0])
                postsData.unshift(pinned)
            }
        }
        console.log(postsData)

        let sendData = await postAggregator(
            feedranked.concat(postsData),
            req.user.student_id,
            db,
            0,
            with_video_type
        );
        if (!(parseInt(req.user.student_id) % 4)) {
            let bountyQuestionSql = "select bpd.*, count(bad.answer_id) as answer_count, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username, c.img_url, 'question' as tag, 'all' as type, now() as curr_time from (select * from (SELECT * FROM `bounty_post_detail` WHERE is_delete = 0 and is_active = 1 and is_answered=0 order by bounty_id desc limit 150) as t1 order by rand() limit 1) bpd join bounty_answer_detail bad on bpd.bounty_id = bad.bounty_id join students c on bpd.student_id = c.student_id"
            let BountyQuestion = await db.mysql.read.query(bountyQuestionSql)

            if (BountyQuestion.length) {
                BountyQuestion[0].time_left = moment(BountyQuestion[0]['expired_at']).diff(BountyQuestion[0]['curr_time']);
                sendData.splice(3, 0, { widget_type: "bounty_question_widget", widget_data: BountyQuestion[0] })
            }
        }

        next({
            data: sendData,
        });
    } catch (error) {
        next(error);
    }
}


async function postAggregator(
    postData,
    student_id,
    db,
    is_bookmark_data,
    with_video_type
) {
    try {
        let sendData = [];
        student_id = parseInt(student_id);
        for (const elem of postData) {
            let post = elem
            if (is_bookmark_data) {
                post = elem.entity[0];
                if (typeof elem.entity_id == 'string' && elem.entity_id.includes('_pinned')) {
                    let pinned_id = elem.entity_id.replace(/_pinned/g, "");
                    let pinned_sql = `select * from  pinned_post where id = ${pinned_id}`
                    let pinned = await db.mysql.read.query(pinned_sql);
                    post = await pinned_formatter(db, pinned[0])
                }
            }
            if (
                post &&
                (with_video_type || post.type !== "video") &&
                (!is_bookmark_data || post.is_deleted == false)
            ) {
                if (typeof post._id == 'string' && post._id.toString().includes('_pinned')) {
                    entity_id = post._id
                } else {
                    entity_id = ObjectId(post._id)
                    post.created_at = moment(ObjectId(post._id).getTimestamp())
                        .utcOffset(330)
                        .format();
                }
                let student_data_sql =
                    "select * from students left join gamification_user_meta on student_id = user_id where student_id = ?";
                let student_data = db.mysql.read.query(student_data_sql, [
                    post.student_id,
                ]);
                let old_entity_comments;
                let comments = CommentContainer.getCommentCount('new_feed_type', post._id, Comment, db)
                if (post.old_entity_id) {
                    old_entity_comments = CommentContainer.getCommentCount(post.old_entity_type, post.old_entity_id, Comment, db)
                }
                let recentComment = CommentContainer.getTopComment('new_feed_type', post._id, Comment, db)

                let is_follower_sql = `SELECT *    from user_connections where user_id = ? and connection_id = ? and is_deleted = 0 `;
                student_data = await student_data;
                comments = await comments;
                recentComment = await recentComment;
                if (post.old_entity_id) {
                    old_entity_comments = await old_entity_comments;
                } else {
                    old_entity_comments = 0;
                }
                let is_follower = await db.mysql.read.query(is_follower_sql, [
                    student_id,
                    post.student_id,
                ]);
                if (!_.isEmpty(student_data[0].student_fname)) {
                    student_data[0].student_username = student_data[0].student_fname;

                    if (!_.isEmpty(student_data[0].student_lname)) {
                        student_data[0].student_username =
                            `${student_data[0].student_fname}` +
                            " " +
                            `${student_data[0].student_lname}`;
                    }
                }
                let student_meta = {
                    student_username: student_data[0].student_username,
                    student_exam: student_data[0].ex_board,
                    student_school: student_data[0].school_name,
                    student_level: student_data[0].lvl,
                    student_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5359795C-30F7-7F07-8B72-134AF38E02D5.webp',
                    student_vip: "status",
                    follow_relationship: is_follower.length,
                };
                let engagment_meta = {
                    like_count: 0,
                    bookmarked_count: 0,
                    comment_count: comments + old_entity_comments,
                    share_count: 0,
                    is_liked: 0,
                    is_starred: 0,
                    featured_comment: recentComment[0],
                };
                if (!post.attachment) {
                    post.attachment = []
                }
                post.cdn_url = CDN_URL;
                sendData.push({
                    'widget_type': 'feed_post', 'widget_data': {
                        ...post,
                        ...student_meta,
                        ...engagment_meta
                    }
                })
            }
        }
        return sendData;
    } catch (error) {
        console.log(error)
    }

}
async function getUserPosts(req, res, next) {
    try {
        next({
            data: [],
        });
    } catch (error) {
        next(error);
    }
}
async function getBookmarkedPosts(req, res, next) {
    try {
        next({
            data: [],
        });
    } catch (error) {
        next(error);
    }
}
async function feedBrowser(req, res, next) {
    const db = req.app.get("db");
    let { type, attachment_count, days, page_size } = req.query
    if (req.query.page) {
        page_number = parseInt(req.query.page) - 1;
    }
    if (page_size) {
        page_size = parseInt(page_size)
    } else {
        page_size = 100
    }

    var date = new Date();
    var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
    var idMin = ObjectId(Math.floor(last / 1000).toString(16) + "0000000000000000")
    let query = {
        "_id": { $gt: idMin },
        "type": type, '$expr': {
            '$eq': [{ '$size': { "$ifNull": ["$attachment", []] } }, parseInt(attachment_count)]
        }
    }
    let data = await db.mongo.read.collection('tesla').find(query).skip(page_number * page_size).limit(page_size).toArray()
    let x = data.map(post => {
        delete post._id
        if (post.attachment) {
            post.attachment = post.attachment.map(elem => {
                elem = CDN_URL + elem
                return elem;
            });
        }

        return post
    });
    const tabled = jsonToTable(x);
    const fields = tabled.shift();

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(x);
    res.setHeader('Content-disposition', 'attachment; filename=testing.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
}

async function feedStats(req, res, next) {
    const db = req.app.get("db");
    let { days } = req.query

    let query = [
        {
            "$group": {
                "_id": "$type",
                "count": {
                    "$sum": 1.0
                }
            }
        }
    ]
    if (days) {
        var date = new Date();
        var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
        var idMin = ObjectId(Math.floor(last / 1000).toString(16) + "0000000000000000")
        query = [
            {
                "$match": {
                    "_id": { $gt: idMin },
                }
            },
            {
                "$group": {
                    "_id": "$type",
                    "count": {
                        "$sum": 1.0
                    }
                }
            }
        ]
    }
    let data = await db.mongo.read.collection('tesla').aggregate(query).toArray()
    let total = 0
    data.forEach(element => {
        total = total + element.count
    });
    data.push({ '_id': 'total', 'count': total })
    next({ data })
}
async function pinned_formatter(db, pinned) {
    let video_url = 'https://d3cvwyf9ksu0h5.cloudfront.net/';
    if (pinned.post_type == 'viral_videos') {
        let answer = await AnswerContainer.getByQuestionId(pinned.question_id, db)
        video_url = video_url + answer[0]['answer_video']
        if (answer[0]['is_vdo_ready'] == '3') {
            video_url = answer[0]['answer_video']
        }
    }
    let pinned_object = {
        "_id": `${pinned.id}_pinned`,
        "attachment": [],
        "msg": pinned.title,
        "video_obj": {
            "question_id": pinned.question_id ? pinned.question_id : "123",
            "autoplay": (pinned.post_type == 'viral_videos'),
            "video_url": video_url,
            "thumbnail_image": pinned.image_url
        },
        "type": "dn_video",
        "student_id": pinned.student_id,
        "old_entity_id": `${pinned.id}_pinned`,
        "old_entity_type": pinned.post_type,
        "is_deleted": false,
        "is_profane": false,
        "is_active": false,
        "created_at": pinned.created_at
    }
    if (pinned.post_type == 'youtube') {
        pinned_object.video_obj.youtube_id = pinned.youtube_id
    }
    return pinned_object;
}
async function topicpost(req, res, next) {
    next({ data: [] })

}
module.exports = {
    getFeed,
    feedBrowser,
    feedStats,
    getFeedItem,
    getUserPosts,
    getBookmarkedPosts,
    topicpost
};
