module.exports = class Contest {
    static setLuckyDrawDetailsByParameter(client, parameter, date, data) {
        return client.setAsync(`course_draw_contest_winner_${parameter}_${date}`, JSON.stringify(data), 'Ex', 60 * 5);
    }

    static getLuckyDrawDetailsByParameter(client, parameter, date) {
        return client.getAsync(`course_draw_contest_winner_${parameter}_${date}`);
    }

    static setWinnersByParameter(client, parameter, date, courseID, data) {
        return client.setAsync(`course_contest_winner_course_id_${parameter}_${date}_${courseID}`, JSON.stringify(data), 'Ex', 60);
    }

    static getWinnersByParameter(client, parameter, courseID, date) {
        return client.getAsync(`course_contest_winner_course_id_${parameter}_${date}_${courseID}`);
    }

    static setAllWinnersByParameter(client, parameter, date, data) {
        return client.setAsync(`course_contest_winner_all_${parameter}_${date}`, JSON.stringify(data), 'Ex', 60 * 5);
    }

    static getAllWinnersByParameter(client, parameter, date) {
        return client.getAsync(`course_contest_winner_all_${parameter}_${date}`);
    }
};
