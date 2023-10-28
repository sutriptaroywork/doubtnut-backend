const BannedUser = require('../../../modules/mysql/banneduser');

async function status(req, res) {
    const db = req.app.get('db');
    const { student_id } = req.user;
    let banStatus = false;
    const checkBanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, student_id);

    if (checkBanned && checkBanned.length) {
        banStatus = true;
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { banStatus },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function timeout(req, res) {
    /* LiveClass Timeout
        * For Banning Users from Commenting on a particular Liveclass
    */
    const db = req.app.get('db');
    const { student_id } = req.user;
    const { timeout_student_id, entity_id } = req.body;
    let responseData = {};
    if (!student_id == 98) {
        responseData = {
            meta: {
                code: 410,
                success: false,
                message: 'Not Admin',
            },
            data: {},
        };
        return res.status(responseData.meta.code).json(responseData);
    }
    const postTimeout = await BannedUser.insertTimeOut(db.mysql.write, timeout_student_id, entity_id);
    responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { postTimeout },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function timeoutStatus(req, res) {
    const db = req.app.get('db');
    const { student_id, entity_id } = req.body;
    let banStatus = false;
    const checkTimeOut = await BannedUser.checkUserTimeOut(db.mysql.read, student_id, entity_id);

    if (checkTimeOut && checkTimeOut.length) {
        banStatus = !!checkTimeOut[0].count;
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: { banStatus },
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function timeOutUrgent(req, res) {
    /* LiveClass Timeout
        * For Banning Users from Commenting on a particular Liveclass
    */
    const db = req.app.get('db');
    const { liveclassQuestionId, studentId } = req.params;
    await BannedUser.insertTimeOut(db.mysql.write, studentId, liveclassQuestionId);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Timeout - Done ',
    };
    return res.status(responseData.meta.code).json(responseData);
}
module.exports = {
    status,
    timeout,
    timeoutStatus,
    timeOutUrgent,
};
