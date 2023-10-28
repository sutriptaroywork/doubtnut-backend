require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });
const config = require(`${__dirname}/../../api_server/config/config`);

const Database = require('./database');
const Redis = require('ioredis');
const bluebird = require('bluebird');

bluebird.promisifyAll(Redis);

const conRead = config.mysql_analytics;
const conWrite = config.write_mysql;

async function getTeachers(database) {
    const mysqlQ = "select * from teachers";
    return database.query(mysqlQ);
}

async function getCourseResources(database, allTeachersList) {
    const mysqlQ = "select * from course_resources where vendor_id in (?)";
    return database.query(mysqlQ, [allTeachersList]);
}

async function updateCourseResourceDetails(database, resourceId, teacherId) {
    const mysqlQ = "update course_resources set faculty_id=?, vendor_id = 3 where id=?";
    return database.query(mysqlQ);
}

(async () => {
    try {
        const mysqlRead = new Database(conRead)
        const mysqlWrite = new Database(conWrite)
        const getAllTeachers = await getTeachers(mysqlRead);
        const allTeachersList = [];
        for (let i = 0; i < getAllTeachers.length; i++) {
            allTeachersList.push(getAllTeachers[i].teacher_id);
        }
        const getAllCourseResources = await getCourseResources(mysqlRead, allTeachersList);
        const allCourseResourcesList = [];
        for (let i = 0; i < getAllCourseResources.length; i++) {
            allCourseResourcesList.push(getAllCourseResources[i].id);
        }
        const chunkSize = 100;
        for (let e = 0, f = allCourseResourcesList.length; e < f; e += chunkSize) {
            const workers = [];
            const uniqueResources = allCourseResourcesList.slice(e, e + chunkSize);
            for (let i = 0; i < uniqueResources.length; i++) {
                const resourceIndex = getAllCourseResources.map((x) => x.id).indexOf(uniqueResources[i]);
                if (resourceIndex !== -1) {
                    const teacherId = getAllCourseResources[resourceIndex].vendor_id;
                    workers.push(updateCourseResourceDetails(mysqlWrite, uniqueResources[i], teacherId));
                }
            }
            await Promise.all(workers);
        }
        console.log(`the script successfully ran at ${new Date()}`);
    } catch (error) {
        console.log(error);
    } finally {
        mysql.connection.end();
    }
})();
