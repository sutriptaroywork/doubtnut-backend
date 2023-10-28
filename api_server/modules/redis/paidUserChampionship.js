const { cli } = require('winston/lib/winston/config');

const weeklyExpiry = 60 * 60 * 24 * 7;
const monthlyExpiry = 60 * 60 * 24 * 31;
const annualExpiry = 60 * 60 * 24 * 365;

module.exports = class PaidUserChampionship {
    static setStudentWeeklyData(client, studentId, assortmentId, weekNumber, data) {
        return client.setAsync(`padho_aur_jeeto_weekly:${weekNumber}:${assortmentId}:${studentId}`, JSON.stringify(data), 'Ex', weeklyExpiry);
    }

    static setStudentPaidCourseInteractionCount(client, studentId, count) {
        return client.setAsync(`student_paid_course_interaction:${studentId}`, count);
    }

    static incrementStudentPaidCourseInteractionCount(client, studentId) {
        return client.incrAsync(`student_paid_course_interaction:${studentId}`);
    }

    static getCountInWeekLeaderboard(client, assortmentId, weekNumber) {
        return client.zcardAsync(`padho_aur_jeeto_weekly_leaderboard:${weekNumber}:${assortmentId}`);
    }

    static getCountInMonthLeaderboard(client, assortmentId, month) {
        return client.zcardAsync(`padho_aur_jeeto_monthly_leaderboard:${month}:${assortmentId}`);
    }

    static getCountInYearLeaderboard(client, assortmentId, year) {
        return client.zcardAsync(`padho_aur_jeeto_annual_leaderboard:${year}:${assortmentId}`);
    }

    static getStudentPaidCourseInteractionCount(client, studentId) {
        return client.getAsync(`student_paid_course_interaction:${studentId}`);
    }

    static getStudentWeeklyScore(client, studentId, assortmentId, weekNumber) {
        return client.zscoreAsync(`padho_aur_jeeto_weekly_leaderboard:${weekNumber}:${assortmentId}`, studentId);
    }

    static getStudentMonthlyScore(client, studentId, assortmentId, month) {
        return client.zscoreAsync(`padho_aur_jeeto_monthly_leaderboard:${month}:${assortmentId}`, studentId);
    }

    static getStudentAnnualScore(client, studentId, assortmentId, year) {
        return client.zscoreAsync(`padho_aur_jeeto_annual_leaderboard:${year}:${assortmentId}`, studentId);
    }

    static getStudentWeeklyData(client, studentId, assortmentId, weekNumber) {
        return client.getAsync(`padho_aur_jeeto_weekly:${weekNumber}:${assortmentId}:${studentId}`);
    }

    static getStudentRankWeekly(client, studentId, assortmentId, week) {
        return client.zrevrankAsync(`padho_aur_jeeto_weekly_leaderboard:${week}:${assortmentId}`, studentId);
    }

    static getStudentRankMontly(client, studentId, assortmentId, month) {
        return client.zrevrankAsync(`padho_aur_jeeto_monthly_leaderboard:${month}:${assortmentId}`, studentId);
    }

    static getStudentRankAnnual(client, studentId, assortmentId, year) {
        return client.zrevrankAsync(`padho_aur_jeeto_annual_leaderboard:${year}:${assortmentId}`, studentId);
    }

    static setPaidUserChampionshipLeaderboardWeekly(client, studentId, assortmentId, weekNumber, points) {
        client.multi()
            .zadd(`padho_aur_jeeto_weekly_leaderboard:${weekNumber}:${assortmentId}`, points, studentId)
            .expire(`padho_aur_jeeto_weekly_leaderboard:${weekNumber}:${assortmentId}`, weeklyExpiry)
            .execAsync();
    }

    static getPaidUserChampionshipLeaderboardWeekly(client, weekNumber, assortmentId, min, max) {
        return client.zrevrangeAsync(`padho_aur_jeeto_weekly_leaderboard:${weekNumber}:${assortmentId}`, min, max, 'WITHSCORES');
    }

    static setStudentMonthlyData(client, studentId, assortmentId, monthNumber, data) {
        return client.setAsync(`padho_aur_jeeto_monthly:${monthNumber}:${assortmentId}:${studentId}`, JSON.stringify(data), 'Ex', monthlyExpiry);
    }

    static getStudentMonthlyData(client, studentId, assortmentId, monthNumber) {
        return client.getAsync(`padho_aur_jeeto_monthly:${monthNumber}:${assortmentId}:${studentId}`);
    }

    static setPaidUserChampionshipLeaderboardMonthly(client, studentId, assortmentId, monthNumber, points) {
        client.multi()
            .zadd(`padho_aur_jeeto_monthly_leaderboard:${monthNumber}:${assortmentId}`, points, studentId)
            .expire(`padho_aur_jeeto_monthly_leaderboard:${monthNumber}:${assortmentId}`, monthlyExpiry)
            .execAsync();
    }

    static getPaidUserChampionshipLeaderboardMonthly(client, monthNumber, assortmentId, min, max) {
        return client.zrevrangeAsync(`padho_aur_jeeto_monthly_leaderboard:${monthNumber}:${assortmentId}`, min, max, 'WITHSCORES');
    }

    static setStudentAnnualData(client, studentId, assortmentId, year, data) {
        return client.setAsync(`padho_aur_jeeto_annual:${year}:${assortmentId}:${studentId}`, JSON.stringify(data), 'Ex', annualExpiry);
    }

    static getStudentAnnualData(client, studentId, assortmentId, year) {
        return client.getAsync(`padho_aur_jeeto_annual:${year}:${assortmentId}:${studentId}`);
    }

    static setPaidUserChampionshipLeaderboardAnnual(client, studentId, assortmentId, year, points) {
        client.multi()
            .zadd(`padho_aur_jeeto_annual_leaderboard:${year}:${assortmentId}`, points, studentId)
            .expire(`padho_aur_jeeto_annual_leaderboard:${year}:${assortmentId}`, annualExpiry)
            .execAsync();
    }

    static getPaidUserChampionshipLeaderboardAnnual(client, year, assortmentId, min, max) {
        return client.zrevrangeAsync(`padho_aur_jeeto_annual_leaderboard:${year}:${assortmentId}`, min, max, 'WITHSCORES');
    }

    static setAssortmentIdParamsWeekly(client, assortmentId, weekNumber, batch, data) {
        return client.setAsync(`padho_aur_jeeto_weekly_assortment_data:${weekNumber}:${assortmentId}:${batch}`, JSON.stringify(data), 'Ex', 15 * 60); // 15 minutes
    }

    static setAssortmentIdParamsMonthly(client, assortmentId, month, batch, data) {
        return client.setAsync(`padho_aur_jeeto_monthly_assortment_data:${month}:${assortmentId}:${batch}`, JSON.stringify(data), 'Ex', 15 * 60);// 15 minutes
    }

    static setAssortmentIdParamsYearly(client, assortmentId, year, batch, data) {
        return client.setAsync(`padho_aur_jeeto_yearly_assortment_data:${year}:${assortmentId}:${batch}`, JSON.stringify(data), 'Ex', 15 * 60);// 15 minutes
    }

    static getAssortmentIdParamsWeekly(client, assortmentId, weekNumber, batch) {
        return client.getAsync(`padho_aur_jeeto_weekly_assortment_data:${weekNumber}:${assortmentId}:${batch}`);
    }

    static getAssortmentIdParamsMonthly(client, assortmentId, month, batch) {
        return client.getAsync(`padho_aur_jeeto_monthly_assortment_data:${month}:${assortmentId}:${batch}`);
    }

    static getAssortmentIdParamsYearly(client, assortmentId, year, batch) {
        return client.getAsync(`padho_aur_jeeto_yearly_assortment_data:${year}:${assortmentId}:${batch}`);
    }

    static getCourseStartDate(client, assortmentId) {
        return client.getAsync(`course_start_date:${assortmentId}`);
    }

    static setCourseStartDate(client, assortmentId, date) {
        return client.setAsync(`course_start_date:${assortmentId}`, date, 'EX', 3600 * 24);// 1 day
    }

    static setPaidUserChampionshipShownCoupons(client, studentId, data) {
        return client.hsetAsync(`USER:PROFILE:${studentId}`, 'puc_shown_coupons', JSON.stringify(data));
    }

    static getPaidUserChampionshipShownCoupons(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, 'puc_shown_coupons');
    }
};
