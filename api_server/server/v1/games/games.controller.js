const GamesMysql = require('../../../modules/mysql/games');
// const { studentId } = require('../../../modules/mongo/whatspp.netcore');
const PROFILE_HEADER_COUNT = 10;

async function list(req, res, next) {
    try {
        const db = req.app.get('db');
        const studentID = req.user.student_id;
        const { version_code: versionCode } = req.headers;
        const orderField = req.query.order === 'profile' ? 'profile_order' : 'order_field';
        const promises = [];
        promises.push(GamesMysql.getList(db.mysql.read, orderField));
        promises.push(GamesMysql.getBanner(db.mysql.read, versionCode));
        const [gameList, banner] = await Promise.all(promises);
        if (versionCode <= 803) {
            // for previous versions student_id must be added from backend
            // for new versions, addded from App side.
            // Required in case we send notifications to App
            gameList.forEach((element) => {
                if (element.is_gamezop) {
                    element.fallback_url = `${element.fallback_url}&sub=${studentID}`;
                }
            });
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                banner_url: banner[0].image_url,
                list: gameList,
                profile_header_count: PROFILE_HEADER_COUNT,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports = { list };
