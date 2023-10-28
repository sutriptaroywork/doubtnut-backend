function getResourceByResourceReference(connection, resourceReference) {
    const mysqlQ = `select * from (SELECT id, resource_type, resource_reference, old_detail_id, stream_status, subject FROM course_resources WHERE resource_reference = '${resourceReference}' and resource_type IN (1,4,8) limit 1) a left join (select id, resource_reference, old_detail_id from course_resources where resource_type=2 and meta_info='Homework') as b on a.old_detail_id=b.old_detail_id`;
    console.log(mysqlQ);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}

function getAssortmentsByResourceReference(connection, resourceReference) {
    const mysqlQ = `select b.assortment_id from (select id from course_resources where resource_reference='${resourceReference}') as a inner join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id`;
    // console.log('mysqlQ')
    // console.log(mysqlQ)
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}

function checkPushed(connection, studentID, questionID) {
    const mysqlQ = `select * from liveclass_subscribers where student_id=${studentID} and resource_reference=${questionID} and (is_pushed=0 or is_pushed is null)`;
    console.log(mysqlQ);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}

function updateLiveclassSubscriber(connection, studentID, questionID) {
    const mysqlQ = `update liveclass_subscribers set is_pushed=1 where student_id=${studentID} and resource_reference=${questionID}`;
    // console.log(sql);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}

function getAllParentAssortments(connection, assortmentIDArray) {
    const mysqlQ = `select assortment_id,course_resource_id from course_resource_mapping where course_resource_id in (${assortmentIDArray}) and resource_type='assortment'`;
    // console.log('mysqlQ');
    // console.log(mysqlQ);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}
function getSubscribedUnpushedUsers(connection, assortmentIDArray, questionID) {
    const mysqlQ = `select * from (select id, assortment_id from package where assortment_id in (${assortmentIDArray})) as a left join (select student_id, new_package_id from student_package_subscription where start_date <= now() and end_date >= now() and is_active=1) as b on a.id=b.new_package_id left join (select student_id, is_pushed from liveclass_subscribers where resource_reference=${questionID} and is_pushed is null) as c on b.student_id=c.student_id inner join (select student_id, gcm_reg_id, mobile, locale from students where gcm_reg_id is not null) as d on b.student_id=d.student_id`;
    console.log(mysqlQ);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}

function upsertSubscribers(connection, studentID, questionID) {
    const mysqlQ = `INSERT INTO liveclass_subscribers (resource_reference, student_id, is_pushed, is_interested, is_view) VALUES (${questionID}, ${studentID}, 1, 1, 1) ON DUPLICATE KEY UPDATE is_pushed = 1, is_interested=1 , is_view=1`;
     console.log(mysqlQ);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}

function getWhatsappOptinSource(connection, mobile) {
    const mysqlQ = `select source from whatsapp_optins where phone='${mobile}'`;
     console.log(mysqlQ);
    return new Promise((resolve, reject) => {
        connection.query(mysqlQ, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}
module.exports = {
    getResourceByResourceReference,
    getAssortmentsByResourceReference,
    checkPushed,
    updateLiveclassSubscriber,
    getAllParentAssortments,
    getSubscribedUnpushedUsers,
    upsertSubscribers,
    getWhatsappOptinSource,
};
