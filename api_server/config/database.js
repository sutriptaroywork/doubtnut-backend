/* eslint-disable class-methods-use-this */
const mysql = require('mysql');
const logger = require('./winston').winstonLogger;
const { MYSQL_MAX_EXECUTION_TIME_IN_MILLISECONDS: max_timeout } = require('./config');
/**
 * 3024 : MAX EXECUTION TIME OUT
 *
 * @type {Database}
 */
module.exports = class Database {
    constructor(config) {
        this.pool = mysql.createPool(config);
    }

    isSelectQuery(q) {
        return q.trim().toUpperCase().startsWith('SELECT');
    }

    query(sql, args, timeout = max_timeout) {
        if (this.isSelectQuery(sql)) {
            sql = sql.replace(/SELECT/i, `SELECT /*+ MAX_EXECUTION_TIME(${timeout}) */`);
        }

        return new Promise((resolve, reject) => {
            this.pool.query(sql, args, (err, rows) => {
                if (err) {
                    if (typeof err.errno != 'undefined') {
                        logger.error(sql, `${err.errno}`);
                    }
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    transactionalQuery(conn, sql, args) {
        return new Promise((resolve, reject) => {
            conn.query(sql, args, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    /**
     * Single query in a single transaction so that writer is selected to get results
     * @param {{sql: string; args: any; timeout:number}} params
     */
    async singleQueryTransaction(sql, args, timeout = max_timeout) {
        if (this.isSelectQuery(sql)) {
            sql = sql.replace(/SELECT/i, `SELECT /*+ MAX_EXECUTION_TIME(${timeout}) */`);
        }
        return new Promise((resolve, reject) => {
            this.pool.getConnection(async (err, conn) => {
                if (err) {
                    return reject(err);
                }
                try {
                    await this.transactionalQuery(conn, 'START TRANSACTION');
                    const res = await this.transactionalQuery(conn, sql, args);

                    await this.transactionalQuery(conn, 'COMMIT');
                    resolve(res);
                } catch (e) {
                    await this.transactionalQuery(conn, 'ROLLBACK');
                    if (typeof e.errno != 'undefined') {
                        logger.error(sql, `${e.errno}`);
                    }
                    reject(e);
                } finally {
                    conn.release();
                }
            });
        });
    }

    /**
     * Multiple queries in a single transaction
     * @param {{sql: string; args: any}[]} params
     */
    transaction(params) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection(async (err, conn) => {
                if (err) {
                    return reject(err);
                }
                try {
                    await this.transactionalQuery(conn, 'START TRANSACTION');
                    try {
                        const results = [];
                        for (let i = 0; i < params.length; i++) {
                            const { sql, args } = params[i];
                            // eslint-disable-next-line no-await-in-loop
                            const res = await this.transactionalQuery(conn, sql, args);
                            results.push(res);
                        }
                        await this.transactionalQuery(conn, 'COMMIT');
                        resolve(results);
                    } catch (e) {
                        await this.transactionalQuery(conn, 'ROLLBACK');
                        reject(e);
                    }
                } catch (e) {
                    reject(e);
                } finally {
                    conn.release();
                }
            });
        });
    }

    getConnection(cb) {
        return this.pool.getConnection(cb);
    }

    close() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    return reject(err);
                }
                conn.release();
                resolve();
            });
        });
    }
};
