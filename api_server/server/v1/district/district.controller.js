const districtsData = require('../../../data/districts.data');
const Property = require('../../../modules/mysql/property');
const District = require('../../../modules/mysql/district');

async function getHomepage(req, res) {
    let responseData = {};
    try {
        const db = req.app.get('db');
        const values = await Property.getNameAndValueByBucket(db.mysql.read, 'whatsapp_group_admin');
        const data = {};

        // eslint-disable-next-line no-return-assign
        values.map((item) => data[item.name] = item.value);
        data.description_text = data.description_text.split('|');
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.json(responseData);
    } catch (error) {
        console.log(error);
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'Something Went Wrong',
            },
        };
        return res.json(responseData);
    }
}

async function postForm(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id } = req.user;
        let responseData;
        const {
            name,
            mobile,
            district,
            state,
            friends_count,
        } = req.body;
        const check = await District.checkForStudent(db.mysql.read, student_id);

        if (check.length != 0) {
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: "You've filled it already!",
                },
            };
            return res.json(responseData);
        }
        await District.createFormEntry(db.mysql.write, mobile, name, district, state, student_id, friends_count);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Your request has been submitted!',
            },
        };
        return res.json(responseData);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

async function getDistricts(req, res) {
    try {
        return res.json(districtsData);
    } catch (error) {
        console.log(error);
        const responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'Something Went Wrong',
            },
        };
        return res.json(responseData);
    }
}

module.exports = { getHomepage, postForm, getDistricts };
