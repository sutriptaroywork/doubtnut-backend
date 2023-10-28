const DNCache = require('../../config/dn-cache');

class AppConfig extends DNCache {
    constructor() {
        super(21600, 1800); // 12 hrs-30min
    }
}

module.exports = new AppConfig();
