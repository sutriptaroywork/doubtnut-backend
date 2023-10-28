const _ = require('lodash');
const config = require('../../config/config');
const mysqlBlogContainer = require('../mysql/blog');
const redisBlogContainer = require('../redis/blog');

module.exports = class Blog {
    constructor() {
    }

    static async getRecentBlogs(db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                // let recentBlogs
                // if (config.caching) {
                //   recentBlogs = await redisBlogContainer.getRecentBlogs(db.redis.read)
                //   console.log('recentBlogs blog containers')
                //   console.log(recentBlogs)
                //   if (!_.isNull(recentBlogs)) {
                //     return resolve(JSON.parse(recentBlogs))
                //   } else {
                //     //get from mysql
                //     recentBlogs = await mysqlBlogContainer.getRecentBlogs(db.mysql.read)
                //     if (recentBlogs && recentBlogs.length > 0) {
                //       //set in redis
                //       await redisBlogContainer.setRecentBlogs(recentBlogs, db.redis.write)
                //       return resolve(recentBlogs)
                //     } else {
                //       reject("No recent blogs found")
                //     }
                //   }
                // } else {
                const recentBlogs = await mysqlBlogContainer.getRecentBlogs(db.mysql.read);
                if (recentBlogs && recentBlogs.length > 0) {
                    // set in redis
                    return resolve(recentBlogs);
                }
                reject('No recent blogs found');

                // }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getCategories(db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                // let categories
                // if (config.caching) {
                //   categories = await redisBlogContainer.getCategories(db.redis.read)
                //   if (!_.isNull(categories)) {
                //     return resolve(JSON.parse(categories))
                //   } else {
                //     //get from mysql
                //     categories = await mysqlBlogContainer.getCategories(db.mysql.read)
                //     if (categories && categories.length > 0) {
                //       //set in redis
                //       await redisBlogContainer.setCategories(categories, db.redis.write)
                //       return resolve(categories)
                //     } else {
                //       reject("No category found")
                //     }
                //   }
                // } else {
                const categories = await mysqlBlogContainer.getCategories(db.mysql.read);
                if (categories && categories.length > 0) {
                    // set in redis
                    return resolve(categories);
                }
                reject('No category found');

                // }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getBlogItems(page, category, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                // let blogItems
                // if (config.caching) {
                //   blogItems = await redisBlogContainer.getBlogItems(page, category, db.redis.read)
                //   if (!_.isNull(blogItems)) {
                //     return resolve(JSON.parse(blogItems))
                //   } else {
                //     //get from mysql
                //     blogItems = await mysqlBlogContainer.getBlogItems(page, category, db.mysql.read)
                //     if (blogItems && blogItems.length > 0) {
                //       //set in redis
                //       await redisBlogContainer.setBlogItems(page, category, blogItems, db.redis.write)
                //       return resolve(blogItems)
                //     } else {
                //       reject("No category found")
                //     }
                //   }
                // } else {
                const blogItems = await mysqlBlogContainer.getBlogItems(page, category, db.mysql.write);
                if (blogItems && blogItems.length > 0) {
                    // set in redis
                    return resolve(blogItems);
                }
                reject('No category found');

                // }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getBlogItemsCount(category, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                // let blogItemsCount
                // if (config.caching) {
                //   blogItemsCount = await redisBlogContainer.getBlogItemsCount(category, db.redis.read)
                //   if (!_.isNull(blogItemsCount)) {
                //     return resolve(JSON.parse(blogItemsCount))
                //   } else {
                //     //get from mysql
                //     blogItemsCount = await mysqlBlogContainer.getBlogItemsCount(category, db.mysql.read)
                //     if (blogItemsCount && blogItemsCount.length > 0) {
                //       //set in redis
                //       await redisBlogContainer.setBlogItemsCount(category, blogItemsCount, db.redis.write)
                //       return resolve(blogItemsCount)
                //     } else {
                //       reject("No category found")
                //     }
                //   }
                // } else {
                const blogItemsCount = await mysqlBlogContainer.getBlogItemsCount(category, db.mysql.read);
                if (blogItemsCount && blogItemsCount.length > 0) {
                    // set in redis
                    return resolve(blogItemsCount);
                }
                reject('No category found');

                // }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getSingleBlog(title, db) {
    // first try to get from redis
        return new Promise(async (resolve, reject) => {
            // Do async job
            try {
                let singleBlog;
                if (0) {
                    singleBlog = await redisBlogContainer.getSingleBlog(title, db.redis.read);
                    if (!_.isNull(singleBlog)) {
                        return resolve(JSON.parse(singleBlog));
                    }
                    // get from mysql
                    singleBlog = await mysqlBlogContainer.getSingleBlog(title, db.mysql.read);
                    if (singleBlog && singleBlog.length > 0) {
                        // set in redis
                        await redisBlogContainer.setSingleBlog(title, singleBlog, db.redis.write);
                        return resolve(singleBlog);
                    }
                    reject('No title found');
                } else {
                    singleBlog = await mysqlBlogContainer.getSingleBlog(title, db.mysql.read);
                    if (singleBlog && singleBlog.length > 0) {
                        // set in redis
                        return resolve(singleBlog);
                    }
                    reject('No title found');
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }
};
