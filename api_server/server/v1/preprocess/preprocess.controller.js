const rp = require('request-promise');
const Data = require('../../../data/data');
const _ = require('lodash');
let config;

async function getMultipleImagesSplitUrls(req, res) {
    try {
        let question_image;
        config = req.app.get('config');
        question_image = `${config.cdn_url}images/${req.body.file_name}`;
        const requestOpts = {
            uri: Data.PREPROCESS_SERVICE_MULTIPLE_IMAGE_SPLIT,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                question_image:question_image,
            },
            json: true,
            timeout: 3000
        };
        const imageServiceResponse = await rp(requestOpts);
        const responseData = {
            meta: {
                code: 200,
                message: 'Images are separated',
            },
            data: {
                image_urls: imageServiceResponse.data.image_urls,
                question_image: imageServiceResponse.data.question_image,
            },
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 200,
                message: 'Images are not supported',
            },
            data: {
                image_urls: [],
                question_image: req.body.question_image,
            },
        };

        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    getMultipleImagesSplitUrls,
};
