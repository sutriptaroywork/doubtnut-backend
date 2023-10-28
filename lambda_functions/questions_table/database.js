const mysql = require('mysql');

module.exports = class Database {
    constructor(config) {
        this.connection = mysql.createPool(config);
        // this.counter = 0;
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.getConnection((err, conn) => {
                if (err) {
                    // console.log(err)
                    return reject(err);
                }
                conn.query(sql, args, (err2, rows) => {
                    // console.log('mysql query counter');
                    // this.counter += 1;
                    // console.log(this.counter);
                    conn.release();
                    if (err2) {
                        // console.log(err)
                        return reject(err2);
                    }
                    resolve(rows);
                    // resolve(rows);
                });
            });
        });
    }

    getConnection(cb) {
        return this.connection.getConnection(cb);
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.getConnection((err, conn) => {
                if (err) {
                    return reject(err);
                }
                conn.release();
                resolve();
            });
        });
    }
};
