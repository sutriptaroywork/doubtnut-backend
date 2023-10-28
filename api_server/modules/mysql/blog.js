// const _ = require('lodash')
// let Utility = require('../utility');
module.exports = class Blog {
    static getRecentBlogs(database) {
        const sql = "SELECT *, date_format(created_at, '%d-%M-%Y') as created_Date FROM blog WHERE created_at <= NOW() ORDER BY created_at DESC LIMIT 5";
        return database.query(sql);
    }

    static getCategories(database) {
        const sql = 'SELECT DISTINCT category FROM blog';
        return database.query(sql);
    }

    static getBlogItems(page, category, database) {
        let sql = '';
        if (category == '') {
            sql = "SELECT id,title,category,tags,image,meta_description,meta_keywords,created_at,created_by,url_slug, date_format(created_at, '%d-%M-%Y') as created_Date FROM blog WHERE created_at <= NOW() ORDER BY created_at DESC LIMIT ?, 10";
            return database.query(sql, [(page - 1) * 10]);
        }
        sql = "SELECT id,title,category,tags,image,meta_description,meta_keywords,created_at,created_by,url_slug, date_format(created_at, '%d-%M-%Y') as created_Date FROM blog WHERE category = ? AND created_at <= NOW() ORDER BY created_at DESC LIMIT ?, 10";
        return database.query(sql, [category, (page - 1) * 10]);
    }

    static getBlogItemsCount(category, database) {
        let sql = '';
        if (category == '') {
            sql = "SELECT COUNT(id) AS total_records FROM(SELECT *, date_format(created_at, '%d-%M-%Y') as created_Date FROM blog WHERE created_at <= NOW()) AS a";
            return database.query(sql);
        }
        sql = "SELECT COUNT(id) AS total_records FROM(SELECT *, date_format(created_at, '%d-%M-%Y') as created_Date FROM blog WHERE category = ? AND created_at <= NOW()) AS a";
        return database.query(sql, [category]);
    }

    static getSingleBlog(title, database) {
        title = title.split('-').join(' ');
        const sql = 'SELECT * FROM blog WHERE url_slug = ?';
        return database.query(sql, [title]);
    }
};
