const Utility = require('../modules/utility');

function handleTydSourcePanelQueryOcrSearchCompatible(req, res, next) {
    try {
        const {
            source,
            ocrText,
        } = req.body;
        if (source === 'panel') {
            req.body.ocrText = Utility.getOcrTextWithoutHtmlTags(ocrText);
        }
    } catch (e) {
        console.log(e);
    } finally {
        next();
    }
}
module.exports = handleTydSourcePanelQueryOcrSearchCompatible;
