const _ = require('lodash');
const { ObjectId } = require('mongodb'); // or ObjectID

const ReportedUser = require('../../../modules/mysql/reported_users');
const UserConnections = require('../../../modules/mysql/user_connections');
const PopularStudents = require('../../../modules/containers/popular_students');
const BannedUser = require('../../../modules/mysql/banneduser');
const Class = require('../../../modules/mysql/class');
const banner = require('../../helpers/banUser');

const Flagr = require('../../../modules/Utility.flagr');

function getObjectId(prevTime) {
    const now = new Date();
    now.setTime(now.getTime() - 1000 * 60 * prevTime);
    return `${Math.floor(now.getTime() / 1000).toString(16)}0000000000000000`;
}

async function reportUser(req, res) {
    const db = req.app.get('db');
    const { student_id } = req.user;
    const reportedStudentId = req.params.userId;
    let responseData = {};

    const admins = [
        7232, // Aditya Shankar
        666, // Umang sharma
        4413678, // Parth
        28075529, // Sanjeev
        25787005, // Charmi
        13098982, // Aditya Pathak
        122775514, // mohit
        24593286, // amar
        19211105, // mukesh
        40350141, // ankur
        24593113, // rohan
        72487696, // sumant
        19412426, // gt
        8306072, //   Vikas Pal
        45917205, // Shubham Kumar
        60385821, // Sachin
        62298148, // Sandeep
        81692214, // Vaibhav
    ];

    if (admins.includes(student_id)) {
        // await banner.banUser(db, reportedStudentId);
        await BannedUser.banUserByAdmin(db.mysql.write, reportedStudentId, student_id);

        const prevDayObjectID = getObjectId(24 * 60);

        await db.mongo.write.collection('tesla').updateMany(
            {
                student_id: reportedStudentId,
                _id: { $gt: ObjectId(prevDayObjectID) },
            },
            {
                $set: {
                    reason: req.body.reason,
                    is_banned: true,
                    is_deleted: true,
                },
            },
        );
    }

    const alreadyReportedOnce = await ReportedUser.getReportedStatus(db.mysql.read, parseInt(student_id), parseInt(reportedStudentId));
    if (!(alreadyReportedOnce && alreadyReportedOnce.length)) {
        const report = await ReportedUser.insertReportedUser(db.mysql.write, parseInt(student_id), parseInt(reportedStudentId));
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { status: 'Reported', reportId: report.insertId },
        };
        // Removing Temporarily
        // const countedReports = await ReportedUser.reportCounts(db.mysql.read, parseInt(reportedStudentId));
        // if (countedReports[0].cnt > 4) {
        //     await BannedUser.banUser(db.mysql.write, reportedStudentId);
        // }
    } else {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { status: 'Can Report Only Once' },
        };
    }

    return res.status(responseData.meta.code).json(responseData);
}

async function userFollowings(req, res) {
    const db = req.app.get('db');
    const studentId = parseInt(req.params.userId);
    const size = 20;
    let { page } = req.query;
    page = parseInt(page) ? parseInt(page) : 0;
    const callerStudentId = parseInt(req.user.student_id);
    const followingUsers = await UserConnections.getFollowingUsers(db.mysql.read, callerStudentId, studentId, page, size);
    const classList = await Class.getEnglishClassList(db.mysql.read);
    const groupedClassList = _.groupBy(classList, 'class');
    const followingUsersMapped = _.map(followingUsers, (followingUser) => {
        followingUser.student_class = groupedClassList[followingUser.student_class][0].class_display;
        return followingUser;
    });
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: followingUsersMapped,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function userFollowers(req, res) {
    const db = req.app.get('db');
    const studentId = parseInt(req.params.userId);
    const size = 20;
    let { page } = req.query;
    page = parseInt(page) ? parseInt(page) : 0;

    const callerStudentId = parseInt(req.user.student_id);
    const followers = await UserConnections.getFollowers(db.mysql.read, callerStudentId, studentId, page, size);
    const classList = await Class.getEnglishClassList(db.mysql.read);
    const groupedClassList = _.groupBy(classList, 'class');
    const FollowersMapped = _.map(followers, (follower) => {
        follower.student_class = groupedClassList[follower.student_class][0].class_display;
        return follower;
    });

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: FollowersMapped,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function reportStatus(req, res) {
    const db = req.app.get('db');
    const { student_id } = req.user;
    const reportedStudentId = req.params.userId;
    const report = await ReportedUser.getReportedStatus(db.mysql.read, parseInt(student_id), parseInt(reportedStudentId));
    let isReported = false;
    if (report && report.length) {
        isReported = true;
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { isReported },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function removeFollower(req, res) {
    const db = req.app.get('db');
    const { student_id } = req.user;
    let responseData;
    const followerStudentId = parseInt(req.params.userId);
    const followerData = await UserConnections.getFollower(db.mysql.read, parseInt(student_id), followerStudentId);
    if (followerData && followerData.length > 0) {
        await UserConnections.updateIsRemoved(db.mysql.write, parseInt(student_id), followerStudentId);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: 'Follower Removed',
        };
    } else {
        responseData = {
            meta: {
                code: 410,
                success: false,
                message: 'No Follower Found',
            },
            data: '',
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getAllFollowing(req, res) {
    /*
        USED STRICTLY FOR feed-stories-microservice
    */
    const db = req.app.get('db');
    const studentID = parseInt(req.params.userId);
    let followers = await UserConnections.getAllFollowings(db.mysql.read, studentID);
    followers = followers.map((follower) => follower.connection_id);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: followers,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function banUser(req, res) {
    /*
        USED STRICTLY FOR feed-stories-microservice
    */
    const db = req.app.get('db');
    const studentID = parseInt(req.params.userId);
    const isBan = await banner.banUser(db, studentID);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { isBan },
    };
    return res.status(responseData.meta.code).json(responseData);
}
async function reportedUsers(req, res) {
    const db = req.app.get('db');
    const { startDate, endDate } = req.query;
    const size = 50;
    let { page } = req.query;
    page = parseInt(page) ? parseInt(page) : 0;
    const reported_users = await ReportedUser.getReportedUsers(db.mysql.read, page, size, startDate, endDate);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: reported_users,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function reviewedUser(req, res) {
    const db = req.app.get('db');
    const reportedStudentId = req.params.userId;
    const { reviewedBy } = req.query;
    const updatedUser = await ReportedUser.updateReview(db.mysql.write, parseInt(reportedStudentId), reviewedBy);
    console.log(reviewedBy, updatedUser);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { status: 'reviewed' },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function getReviewedUsers(req, res) {
    const db = req.app.get('db');
    // const { startDate, endDate } = req.query;
    const size = 50;
    let { page } = req.query;
    page = parseInt(page) ? parseInt(page) : 0;
    const reported_users = await ReportedUser.getReviewedUsers(db.mysql.read, page, size);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: reported_users,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function getReviewedUsersByModerator(req, res) {
    const db = req.app.get('db');
    // const { startDate, endDate } = req.query;
    const size = 50;
    const { username } = req.body;
    let { page } = req.query;
    page = parseInt(page) ? parseInt(page) : 0;
    const reported_users = await ReportedUser.getReviewedUsersByModerator(db.mysql.read, page, size, username);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: reported_users,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function reportedUserCount(req, res) {
    const db = req.app.get('db');
    const reportedUserID = req.params.id;
    const reported_users = await ReportedUser.getReportedUserCount(db.mysql.read, reportedUserID);
    const distinct_reported_users = await ReportedUser.getReportedUserDistinctCount(db.mysql.read, reportedUserID);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: {
            reported_users: reported_users[0].cnt,
            distinct_reported_users: distinct_reported_users[0].cnt,
        },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function reviewedStatus(req, res) {
    const db = req.app.get('db');
    const reportedStudentId = req.params.id;
    const reportedUser = await ReportedUser.getReviewedStatus(db.mysql.read, parseInt(reportedStudentId));
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { reportedUser },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function mostPopularStudents(req, res) {
    /*
        USED STRICTLY FOR feed-stories-microservice
    */
    /*
   return res.send('most popular list')
   */
    const xAuthToken = req.headers['x-auth-token'];
    const db = req.app.get('db');
    const callerStudentId = parseInt(req.user.student_id);

    let variantAttachment = false;
    try {
        variantAttachment = await Flagr.callFlagr(xAuthToken, 'suggested_ppl', 'suggested_ppl.payload.variation');
    } catch (error) {
        variantAttachment = false;
    }

    let popular_students; let
        PopularStudentsMapped;

    if (variantAttachment) {
        popular_students = [];
        // popular_students = await UserConnections.getPopularStudents(db.mysql.read, callerStudentId);


        const avatars = ['https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/3ACA9B56-C675-61EB-26ED-43CF88AE0027.webp', 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/003698CA-257E-32FB-851C-10E16F099159.webp', 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/42CEC818-0903-5BFC-E661-2054608E94E5.webp'];

        PopularStudentsMapped = _.map(popular_students, (popular_student) => {
            const student_info = {
                student_id: String(popular_student.connection_id),
                image_url: (!popular_student.img_url) ? avatars[Math.floor(Math.random() * avatars.length)] : popular_student.img_url,
                name: popular_student.name,
                follower_text: `${popular_student.followers} followers`,
            };
            return student_info;
        });
    } else {
        PopularStudentsMapped = [];
    }

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { items: PopularStudentsMapped },
    };
    return res.status(responseData.meta.code).json(responseData);
}


module.exports = {
    reportUser,
    userFollowings,
    userFollowers,
    reportStatus,
    removeFollower,
    getAllFollowing,
    banUser,
    reviewedUser,
    getReviewedUsers,
    getReviewedUsersByModerator,
    reportedUserCount,
    reviewedStatus,
    reportedUsers,
    mostPopularStudents,
};
