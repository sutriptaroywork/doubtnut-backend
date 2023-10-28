const studentsUploadDetails = require('../../../modules/mysql/students_upload_marksheet');

function createObj(student_id, mobile, file) {
    const obj = {
        student_id,
        mobile,
        is_marksheet_uploaded: 1,
        file,
    };
    return obj;
}

function resposneObj(type, data) {
    let responseData;
    if (type == 'success') {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
                data,
            },
        };
        return responseData;
    }
    responseData = {
        meta: {
            code: 401,
            success: false,
            message: 'Already Uploaded',
            data,
        },
    };
    return responseData;
}

async function uploadMarkSheet(req, res, next) {
    try {
        const db = req.app.get('db');
        const { hash, mobile } = req.body;
        const file = req.files.marksheet[0].key;
        let responseData;
        const student_details = await studentsUploadDetails.getStudentIdByHash(db.mysql.read, hash);
        console.log(student_details);
        if (student_details[0].is_marksheet_uploaded == 0) {
            const obj = createObj(student_details[0].student_id, mobile, file);
            await studentsUploadDetails.UpdateStudetMarkesheetUpload(db.mysql.write, obj);
            responseData = resposneObj('success', 'new upload');
        } else {
            responseData = resposneObj('already_uploaded', 'user already uploaded');
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function checkIfUploaded(req, res, next) {
    try {
        const db = req.app.get('db');
        const studentsHash = req.body.hash;
        let responseData;
        const student_details = await studentsUploadDetails.getStudentIdByHash(db.mysql.read, studentsHash);
        if (student_details[0].is_marksheet_uploaded == 1) {
            responseData = resposneObj('already_uploaded', 'user already uploaded');
            return res.status(responseData.meta.code).json(responseData);
        }
        responseData = resposneObj('success', student_details);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = { uploadMarkSheet, checkIfUploaded };
