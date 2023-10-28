const RedisUtility = require('./redis/utility.redis');
const Mysql = require('./mysql/student');

const rate_limit_prefix = 'rate_limit_';
const rate_limit_expiry = 60 * 60 * 12;

module.exports = class IPUtility {
    /** *
   * All IP related utilities will go here
   */
    static async hasReachedLimit(redis, limit, ip) {
        const redisResponse = await RedisUtility.getValue(redis.read, rate_limit_prefix + ip);

        console.log('redisResponse', redisResponse);

        if (redisResponse == null) {
            await this.updateCounter(redis.write, ip);
            RedisUtility.expire(redis.write, rate_limit_prefix + ip, rate_limit_expiry);
            return false;
        }

        if (parseInt(redisResponse) < limit) {
            await this.updateCounter(redis.write, ip);
            return false;
        }
        return true;
    }

    static async updateCounter(redis, ip) {
        await RedisUtility.incrementValue(redis, rate_limit_prefix + ip);
    }

    static maxLimitReached() {
        return {
            meta: {
                code: 401,
                success: false,
                message: 'Too many OTP Requests',
            },
            data: {
                status: 'FAILURE',
                session_id: false,
            },
        };
    }

    static async tooManyQuickRequests(db, limit, mobile) {
        if (await RedisUtility.getQuickBlock(db.redis.read, mobile)) {
            return true;
        }
        const totalOtpLastMinute = await Mysql.getLastMinuteOtps(db.mysql.read, mobile);
        if (totalOtpLastMinute.length > limit) {
            RedisUtility.setQuickBlock(db.redis.write, mobile, 30 * 60);
            return true;
        }
        return false;
    }

    static getIpAddress(req) {
        if (req.headers['x-forwarded-for']) {
            const ipArray = req.headers['x-forwarded-for'].split(',');
            return ipArray[0];
        }
        return '127.0.0.1';
    }

    static async getCountryFromIPAddress(req) {
        return 'IN';
        /**
         * Shutdown UAE flow
         * return req.headers['x-client-region'] || 'IN';
         */
    }
};
