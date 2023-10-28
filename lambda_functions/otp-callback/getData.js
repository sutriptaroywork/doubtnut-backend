module.exports = class OtpCallback {
    static getStudentIdByMobile(client, mobile){
        return new Promise(async function (resolve, reject) {
            const sql = `SELECT student_id from students WHERE mobile='${mobile}'`;
            client.query(sql, function (err, result) {
                console.log(err)
                if (err){
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
