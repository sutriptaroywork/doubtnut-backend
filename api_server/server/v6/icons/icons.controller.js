const helper = require('../../helpers/icons');

async function geticonsByIconOrderByClass(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id } = req.user;
        const version_code = req.headers.version_code || 604;
        const locale = (req.user.locale === 'hi') ? req.user.locale : 'en';
        let student_class = req.body.class ? req.body.class : req.user.student_class;
        if (req.user.isDropper) {
            student_class = 13;
        }
        const { featureIds } = req.body;
        let flagVariants = [1];
        if (featureIds) {
            if (Array.isArray(featureIds)) {
                flagVariants = [...flagVariants, ...featureIds];
            } else {
                flagVariants.push(featureIds);
            }
        }

        const requestData = {
            studentId: student_id,
            versionCode: version_code,
            studentLocale: locale,
            studentClass: student_class,
            flagVariants,
            xAuthToken: req.headers['x-auth-token'],
            type: 'old',
        };

        const data = await helper.makeIconData(db, config, requestData, true);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = { geticonsByIconOrderByClass };
