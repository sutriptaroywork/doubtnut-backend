const Settings = require('../../../modules/settings');
const Utility = require('../../../modules/utility');

const DEFAULT_COUNTRY = 'IN';
let db;

function aboutUs(req, res, next) {
    db = req.app.get('db');
    let region = req.headers.country || DEFAULT_COUNTRY;
    if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
        region = `ALT_${region}`;
    }
    Settings.getAboutus(db.mysql.read, region).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: values[0],
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
        next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 401,
        //     "success": false,
        //     "message": "Something is wrong",
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData)
    });
}

function termsAndConditions(req, res, next) {
    db = req.app.get('db');
    let region = req.headers.country || DEFAULT_COUNTRY;
    if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
        region = `ALT_${region}`;
    }
    Settings.getTnc(db.mysql.read, region).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: values[0],
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
    // let responseData = {
    //   "meta": {
    //     "code": 401,
    //     "success": false,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": error
    // }
    // res.status(responseData.meta.code).json(responseData)
        next(error);
    });
}

function privacy(req, res, next) {
    db = req.app.get('db');
    let region = req.headers.country || DEFAULT_COUNTRY;
    if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
        region = `ALT_${region}`;
    }
    Settings.getPrivacy(db.mysql.read, region).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: values[0],
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
        next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 401,
        //     "success": false,
        //     "message": "Something is wrong",
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData)
    });
}

function contactUs(req, res, next) {
    db = req.app.get('db');
    let region = req.headers.country || DEFAULT_COUNTRY;
    if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
        region = `ALT_${region}`;
    }

    Settings.getContactUs(db.mysql.read, region).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: values[0],
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
        next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 401,
        //     "success": false,
        //     "message": "Something is wrong",
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData)
    });
}

async function cameraGuide(req, res, next) {
    db = req.app.get('db');
    const region = req.headers.country || DEFAULT_COUNTRY;
    try {
        const data = await Settings.getHtml(db.mysql.read, region);
        // console.log(data)
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: data[0].value,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        // console.log(e)
    }
}

function refundPolicy(req, res, next) {
    db = req.app.get('db');
    const region = req.headers.country || DEFAULT_COUNTRY;

    Settings.getRefundPolicy(db.mysql.read, region).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: values[0],
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
        next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 401,
        //     "success": false,
        //     "message": "Something is wrong",
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData)
    });
}

module.exports = {
    aboutUs,
    termsAndConditions,
    privacy,
    contactUs,
    cameraGuide,
    refundPolicy,
};
