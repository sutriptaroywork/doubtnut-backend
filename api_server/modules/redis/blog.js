// const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class Blog {
    static setRecentBlogs(blogsData, client) {
        return client.hsetAsync('blog_data', 'recent_blogs', JSON.stringify(blogsData));
    }

    static getRecentBlogs(client) {
        return client.hgetAsync('blog_data', 'recent_blogs');
    }

    static setCategories(categoryList, client) {
        return client.hsetAsync('blog_data', 'category_list', JSON.stringify(categoryList));
    }

    static getCategories(client) {
        return client.hgetAsync('blog_data', 'category_list');
    }

    static setBlogItems(page, category, blogItems, client) {
        let redisKey = '';
        if (category == '') {
            redisKey += `blogs_${page}`;
        } else {
            redisKey += `blogs_${category}_${page}`;
        }
        return client.hsetAsync('blog_items', redisKey, JSON.stringify(blogItems));
    }

    static getBlogItems(page, category, client) {
        let redisKey = '';
        if (category == '') {
            redisKey += `blogs_${page}`;
        } else {
            redisKey += `blogs_${category}_${page}`;
        }
        return client.hgetAsync('blog_items', redisKey);
    }

    static setBlogItemsCount(category, blogItemsCount, client) {
        let redisKey = '';
        if (category == '') {
            redisKey += 'blogs_count';
        } else {
            redisKey += `blogs_count_${category}`;
        }
        return client.hsetAsync('blog_items_count', redisKey, JSON.stringify(blogItemsCount));
    }

    static getBlogItemsCount(category, client) {
        let redisKey = '';
        if (category == '') {
            redisKey += 'blogs_count';
        } else {
            redisKey += `blogs_count_${category}`;
        }
        return client.hgetAsync('blog_items_count', redisKey);
    }

    static setSingleBlog(title, blogDetails, client) {
        let blogTitle = title.split('(')[0];
        blogTitle = blogTitle.split(' ').join('_').toLowerCase();
        const redisKey = `blog__${blogTitle}`;
        return client.hsetAsync('blog_item', redisKey, JSON.stringify(blogDetails));
    }

    static getSingleBlog(title, client) {
        let blogTitle = title.split('(')[0];
        blogTitle = blogTitle.split(' ').join('_').toLowerCase();
        const redisKey = `blog__${blogTitle}`;
        console.log(redisKey);
        return client.hgetAsync('blog_item', redisKey);
    }
};
