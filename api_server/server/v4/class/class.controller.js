
const _ = require('lodash');
const ClassContainer = require('../../../modules/containers/class');
const LanguageContainer = require('../../../modules/containers/language');
const Data = require('../../../data/data');

async function getList(req, res, next) {
    try {
        const db = req.app.get('db');
        let versionCode = req.headers.version_code;
        if (!versionCode) {
            versionCode = 656;
        }
        let appCountry = 'IN';
        if (!_.isEmpty(req.headers.country)) {
            appCountry = req.headers.country;
        }
        const language_code = req.params.language;
        if (language_code !== '' && !_.isNull(language_code) && language_code !== undefined) {
            const language = await LanguageContainer.getByCode(language_code, db);
            if (language.length > 0) {
                let result;
                if (versionCode > 656) {
                    result = await ClassContainer.getClassListNewOnBoardingForHome(db, language[0].language, appCountry);
                    let temp = result.shift();
                    result.push(temp);
                    temp = result.shift();
                    result.splice(2, 0, temp);
                } else {
                    result = await ClassContainer.getListNew(language[0].language, appCountry, db);
                    const temp = result.shift();
                    result.push(temp);
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: result,
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'No Language Found With This Code',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid Language Code Provided',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log(e)
        next(e);
    }
}

function getClass(result, language, stClass) {
    const classList = [];
    result.map((x) => {
        if (x.class === 13) {
            x.class_display = Data.classLocalised[language]['13'];
        }
        if (x.class === 14) {
            x.class_display = Data.classLocalised[language]['14'];
        }
        if (x.class === stClass) {
            classList.splice(0, 0, x);
        } else {
            classList.push(x);
        }
        return classList;
    });
    return classList;
}

async function getClassList(req, res, next) {
    try {
        const db = req.app.get('db');
        let language = 'english';
        if (req.user.locale === 'hi') {
            language = 'hindi';
        }

        let appCountry = 'IN';
        if (!_.isEmpty(req.headers.country)) {
            appCountry = req.headers.country;
        }

        let stClass = 13;
        if (req.user.student_class && !req.user.isDropper) {
            stClass = parseInt(req.user.student_class);
        }
        const result = await ClassContainer.getClassListNewOnBoardingForHome(db, language, appCountry);
        const classList = getClass(result, language, stClass);
        const data = { classList, studentClass: stClass };
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
        console.log(e);
        next(e);
    }
}


module.exports = { getList, getClassList };
