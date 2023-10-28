const cors = require('cors');

module.exports = cors({
    origin: (origin, callback) => {
        if (origin.endsWith('doubtnut.com') || !origin) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
});
