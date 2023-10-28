// const _ = require('lodash');
// const config = require('../../config/config')
// let Utility = require('./utility');
// let _ = require('./utility');
module.exports = class EtoosBanners {
    static get(data) {
        const {
            database,
            ecmId,
        } = data;
        const sql = 'select image_url,  type, action_activity, action_data from etoos_banners where ecm_id=? and is_active=1 order by banner_order desc limit 1';
        console.log(sql);
        return database.query(sql, [ecmId]);
    }
};
