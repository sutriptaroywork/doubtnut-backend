const hashExpiry = 60 * 60 * 24 * 2; // 2 days

module.exports = class DailyViews {
    static setDailyViews(client, date, points, studentID) {
        console.log(`daily_views:${date}`);
        return client.multi()
            .zadd(`daily_views:${date}`, 'INCR', points, studentID)
            .expireat(`daily_views:${date}`, (+new Date()) / 1000 + hashExpiry)
            .execAsync();
    }

    static getDailyViewsUsers(client, date, min, max) {
        return client.zrevrangeAsync(`daily_views:${date}`, min, max, 'WITHSCORES');
    }
};
