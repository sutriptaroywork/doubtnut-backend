const Utility = require('../../../modules/utility');

async function generate(req, res, next) {
    try {
        const config = req.app.get('config');
        const { channel, deeplink, campaign } = req.body;
        const result = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, channel, campaign, deeplink);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: result,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next();
    }
}
module.exports = {
    generate,
};
