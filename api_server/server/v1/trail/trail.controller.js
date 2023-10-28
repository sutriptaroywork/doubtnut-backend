const _ = require("lodash");
const Trail = require("../../../modules/mysql/trail");
let db;
let config;

async function getStudents(req, res) {
    try {
        config = req.app.get("config");
        db = req.app.get("db");
        console.log(req);
        const studentInfo = await Trail.getStudentTrail(db.mysql.read);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data: studentInfo,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getPackageQuestion(req, res) {
    try {
        config = req.app.get("config");
        db = req.app.get("db");
        const { packageId,studentId } = req.query;
        console.log("req.query" + JSON.stringify(req.query));
        const packageQuestionInfo = await Trail.getpackageQuestion(
            db.mysql.read,
            packageId
        );
        const questionIds = new Array();
        packageQuestionInfo.forEach((element) => (questionIds.push(element.resource_reference)));
        var questionId = questionIds.join();
        questionId = "'" + questionId.split( "," ).join( "','" ) + "'";
        const totalTime = await Trail.getTotalEngTime(
            db.mysql.read,
            questionId,
            studentId
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data: totalTime,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    getStudents,
    getPackageQuestion,
};
