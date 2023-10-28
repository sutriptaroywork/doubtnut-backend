/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 12:19:24
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-11 12:19:32
*/
"use strict";
const Joi = require('joi');

module.exports = {
    brainly:{
        feedback: {
            body: {
                gcm: Joi.string().required(),
                qid: Joi.string().required(),
                rating: Joi.string().required()
            }
        }
    }
};
