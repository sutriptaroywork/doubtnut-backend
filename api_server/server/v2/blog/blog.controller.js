const blogContainer = require('../../../modules/containers/blog');

let db; let config; let
    client;

async function getBlogs(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const promises = [];
        const { page } = req.params;
        const { category } = req.params;
        let resolvedPromisesData;

        promises.push(blogContainer.getRecentBlogs(db));
        promises.push(blogContainer.getCategories(db));

        if (typeof category === 'undefined') {
            promises.push(blogContainer.getBlogItems(page, '', db));
            promises.push(blogContainer.getBlogItemsCount('', db));
        } else {
            promises.push(blogContainer.getBlogItems(page, category, db));
            promises.push(blogContainer.getBlogItemsCount(category, db));
        }

        resolvedPromisesData = await Promise.all(promises);

        const data = {
            recent_blogs: resolvedPromisesData[0], category_list: resolvedPromisesData[1], blogs: resolvedPromisesData[2], total_records: resolvedPromisesData[3][0].total_records,
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        // console.log(e)
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Error from Catch Blog',
            },
            data: 'Something Went Wrong',
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function getSingleBlog(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const promises = [];
        let { title } = req.params;
        let resolvedPromisesData;

        title = title.split('-').join(' ');

        promises.push(blogContainer.getRecentBlogs(db));
        promises.push(blogContainer.getCategories(db));
        promises.push(blogContainer.getSingleBlog(title, db));

        resolvedPromisesData = await Promise.all(promises);

        const data = { recent_blogs: resolvedPromisesData[0], category_list: resolvedPromisesData[1], blog_details: resolvedPromisesData[2] };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        // console.log(e)
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Error from Catch Blog',
            },
            data: 'Something Went Wrong',
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = { getBlogs, getSingleBlog };
