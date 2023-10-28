// const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class Rank {
    static getAllClg(database) {
        const sql = 'SELECT DISTINCT college_name FROM opening_closing_ranks WHERE college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY college_name';
        return database.query(sql);
    }

    static getAllState(database) {
        const sql = 'SELECT DISTINCT state_long FROM opening_closing_ranks WHERE state_long != \'ALL INDIA\' AND college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY state_long';
        return database.query(sql);
    }

    static getDistDeptData(clg_name, database) {
        const sql = 'SELECT DISTINCT department FROM opening_closing_ranks WHERE college_name = ? AND college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY department';
        return database.query(sql, [clg_name]);
    }

    static getDistQuota(clg_name, department, database) {
        const sql = 'SELECT DISTINCT quota FROM opening_closing_ranks WHERE college_name = ? AND department = ? AND college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY quota';
        // console.log(sql);
        return database.query(sql, [clg_name, department]);
    }

    static getDistCategory(clg_name, department, quota, database) {
        const sql = 'SELECT DISTINCT category FROM opening_closing_ranks WHERE college_name = ? AND department = ? AND quota = ? AND college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY category';
        // console.log(sql);
        return database.query(sql, [clg_name, department, quota]);
    }

    static getStatewiseCategory(state, database) {
        const sql = 'SELECT DISTINCT category FROM opening_closing_ranks WHERE state_long = ? AND college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY category';
        return database.query(sql, [state]);
    }

    static getRoundWiseRank(clg, dept, quota, category, database) {
        const sql = 'SELECT round_num, opening_rank, closing_rank FROM opening_closing_ranks WHERE college_name = ? AND department = ? AND quota = ? AND category = ? ORDER BY opening_rank';
        // console.log(sql);
        return database.query(sql, [clg, dept, quota, category]);
    }

    static getClgDeptRank(state, category, rank, database) {
        const sql = 'SELECT * FROM opening_closing_ranks WHERE category = ? AND opening_rank <= ? AND closing_rank >=? AND ((state_long<>? and quota in (\'AI\',\'OS\')) OR (state_long=? and quota=\'HS\')) AND college_type <> \'INDIAN INSTITUTE OF TECHNOLOGY (IIT)\' ORDER BY opening_rank ASC';
        console.log(sql);
        return database.query(sql, [category, rank, rank, state, state]);
    }
};
