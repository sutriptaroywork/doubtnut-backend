module.exports = class ImportPackage {
    static filterAssortment(db, item) {
        try {
            const sql = 'SELECT COUNT(assortment_id) as count FROM course_details where assortment_id = ?';
            return db.query(sql, [item.assortment_id]);
        } catch (e) {
            console.log(e);
        }
    }

    static filterSubscription(db, item) {
        try {
            const sql = 'SELECT COUNT(id) as count FROM package where assortment_id = ? AND duration_in_days = ? AND type = ?';
            return db.query(sql, [item.assortment_id, item.duration_in_days, item.type]);
        } catch (e) {
            console.log(e);
        }
    }

    static filterSubscriptionModeTwo(db, item) {
        try {
            const sql = 'SELECT * FROM package where assortment_id = ? AND duration_in_days = ? AND type = ?';
            return db.query(sql, [item.assortment_id, item.duration_in_days, item.type]);
        } catch (e) {
            console.log(e);
        }
    }

    static filterEmi(db, item) {
        try {
            if (item.emi_order == null) {
                const sql = 'SELECT id FROM package where assortment_id = ? AND duration_in_days = ? AND type = ?  AND ISNULL(emi_order) AND total_emi = ? LIMIT 1';
                return db.query(sql, [item.assortment_id, item.duration_in_days, item.type, item.total_emi]);
            }
            const sql = 'SELECT id FROM package where assortment_id = ? AND duration_in_days = ? AND type = ?  AND emi_order = ? AND total_emi = ? LIMIT 1';
            return db.query(sql, [item.assortment_id, item.duration_in_days, item.type, item.emi_order, item.total_emi]);
        } catch (e) {
            console.log(e);
        }
    }

    static filterEmiModeTwo(db, item) {
        try {
            if (item.emi_order == null) {
                const sql = 'SELECT * FROM package where assortment_id = ? AND duration_in_days = ? AND type = ?  AND ISNULL(emi_order) AND total_emi = ? LIMIT 1';
                return db.query(sql, [item.assortment_id, item.duration_in_days, item.type, item.total_emi]);
            }
            const sql = 'SELECT * FROM package where assortment_id = ? AND duration_in_days = ? AND type = ?  AND emi_order = ? AND total_emi = ? LIMIT 1';
            return db.query(sql, [item.assortment_id, item.duration_in_days, item.type, item.emi_order, item.total_emi]);
        } catch (e) {
            console.log(e);
        }
    }

    static insertPackage(db, values) {
        try {
            const sql = 'INSERT INTO package SET ?';
            return db.query(sql, values);
        } catch (e) {
            console.log(e);
        }
    }

    static insertVariant(db, values) {
        try {
            const sql = 'INSERT INTO variants SET ?';
            return db.query(sql, values);
        } catch (e) {
            console.log(e);
        }
    }

    static findMasterParentVariant(db, item) {
        try {
            const sql = 'SELECT id FROM package where assortment_id = ? AND duration_in_days = ? AND type = "emi" AND ISNULL(emi_order)';
            return db.query(sql, [item.assortment_id, item.duration_in_days]);
        } catch (e) {
            console.log(e);
        }
    }

    static addMasterParentVariant(db, item) {
        try {
            const sql = 'UPDATE variants SET master_parent_variant_id = ? where id = ?';
            return db.query(sql, [item.master_parent_variant_id, item.id]);
        } catch (e) {
            console.log(e);
        }
    }

    static checkVariantsExistsEmi(db, fetchPackageID, base_price, display_price) {
        try {
            const sql = 'select * from variants where package_id = ? and base_price=? and display_price= ?';
            return db.query(sql, [fetchPackageID, base_price, display_price]);
        } catch (e) {
            console.log(e);
        }
    }
};
