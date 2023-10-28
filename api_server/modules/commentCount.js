const comment = require('./mongo/comment');


module.exports = class BountyComment {
    static getCommentCount(entity_type, ids) {
        return comment.aggregate([
            {
                $match: {
                    entity_type,
                    entity_id: { $in: ids },
                    is_deleted: { $ne: true },
                },
            }, {
                $project: {
                    entity_id: 1,
                },
            }, {
                $group: {
                    _id: '$entity_id',
                    count: { $sum: 1 },
                },
            },
        ]);
    }
};
