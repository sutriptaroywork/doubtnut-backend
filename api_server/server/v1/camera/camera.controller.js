const bl = require('./camera.bl');
const Utility = require('../../../modules/utility');
const StudentMysql = require('../../../modules/student');
const Data = require('../../../data/data');

function getCameraSettings(req, _res, next) {
    try {
        if (!req.query.openCount && req.query.openCount !== 0) {
            throw new Error('Open count is null');
        }
        let studentClass;
        if (req.headers.country && req.headers.country.toLowerCase() =='us') {
            studentClass = req.user.student_class || 27;
        } else {
            studentClass = req.user.student_class || 12;
        }

        const settings = {
            cameraButtonHint: bl.getCameraButtonHint(parseInt(req.query.openCount)),
            bottomOverlay: {
                info: bl.getCameraBottomOverlayInfo(parseInt(studentClass)),
                subjectList: bl.getCameraBottomOverlaySubjectList(parseInt(studentClass), parseInt(req.query.openCount)),
            },
        };

        next({ data: settings });
    } catch (err) {
        next({ err });
    }
}

function getCameraAnimation(req, _res, next) {
    try {
        let locale = req.user.locale || 'en';
        let region = req.headers.country || 'IN';
        const settings = Data.camera_animation(locale).settings[region.toLowerCase()];
        next({ data: settings });
    } catch (err) {
        next({ err });
    }
}

async function postFaceData(req, _res, next) {
    try {
        let respData = 'sucess';
        const s3 = req.app.get('s3');
        const config = req.app.get('config');
        const publicPath = req.app.get('publicPath');
        const db = req.app.get('db');
        const faceImg = req.body.face_img;
        const { student_id: sid } = req.user;
        const filename = await Utility.handleSelfie(faceImg, s3, publicPath, sid);
        const path = `${config.cdn_url}images/${filename}`;
        const insertFaceData = await StudentMysql.storeSelfieImg(db.mysql.write, { student_id: sid, filepath: path });
        if (!insertFaceData) {
            respData = 'failed to store data';
            next({ data: respData });
        } else {
            next({ data: respData });
        }
    } catch (err) {
        next({ err });
    }
}

module.exports = {
    getCameraSettings,
    getCameraAnimation,
    postFaceData,
};
