const vision = require('@google-cloud/vision')
let Enum = require('enum');

async function processImage(image) {
    try {
        let client = new vision.ImageAnnotatorClient()
        let checkedImage = await client.safeSearchDetection(image)
        // let checkedImage = await client.safeSearchDetection('https://cdn.vox-cdn.com/thumbor/NtgHwgBedas3nxzUofhFhNxQfgQ=/0x0:2040x1360/920x613/filters:focal(857x517:1183x843):format(webp)/cdn.vox-cdn.com/uploads/chorus_image/image/65093706/mdoying_180118_2249_0338stills.0.jpg')
        console.log(checkedImage)
        let imageCheckresult = new Enum(['POSSIBLE', 'VERY_LIKELY', 'LIKELY'])
        if (imageCheckresult.isDefined(checkedImage[0]['safeSearchAnnotation']['adult'])) {
            return Promise.resolve(1)
        } else {
            return Promise.resolve(0)
        }
    } catch (e) {
        return Promise.reject(e)
    }
}

(async () => {
    await processImage('https://d10lpgp6xz60nq.cloudfront.net/UGC_Images/4e97c3d4d9b3e36badeec418dfd476b5')
})()