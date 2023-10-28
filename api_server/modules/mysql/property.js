module.exports = class Properties {
    static getNameAndValueByBucket(database, bucket) {
        const sql = 'select name,value from dn_property where bucket = ? and is_active = 1 order by priority';
        return database.query(sql, [bucket]);
    }

    static getValueByBucketAndName(database, bucket, name) {
        const sql = 'select value from dn_property where bucket = ? and name = ? and is_active =1';
        return database.query(sql, [bucket, name]);
    }

    static updateValueByBucketAndName(database, bucket, name, value) {
        const sql = 'update dn_property SET value = ? where bucket = ? and name = ?';
        return database.query(sql, [value, bucket, name]);
    }

    static createDnPropertyEntry(database, obj) {
        const sql = 'insert into dn_property SET ?';
        return database.query(sql, [obj]);
    }

    static checkEntryInBucketByNameAndValue(database, bucket, name, value) {
        const sql = 'select * from dn_property where bucket = ? and name = ? and value = ?';
        return database.query(sql, [bucket, name, value]);
    }
};
