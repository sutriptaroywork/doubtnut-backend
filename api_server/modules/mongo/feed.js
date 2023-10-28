const mongoose = require("mongoose");
const Comment = mongoose.model("Comment");

module.exports = class Feed {
    constructor() {
    }

    static async getCommentsByUserId(user_id, database) {
        return Comment.find(
            { 
                "student_id" : user_id
            }
        ).select('entity_id -_id')
    }

    static async getCommentsByEntityId(entity_id, database) {
        return Comment.findOne(
            { 
                "entity_id" : entity_id
            }
        ).select('entity_id -_id message')
    }
}


