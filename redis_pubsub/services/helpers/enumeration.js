/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-16 15:23:49
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-17 12:34:59
*/
'use strict'

module.exports = class Enumeration {
	  constructor(obj) {
    for (const key in obj) {
      this[key] = obj[key]
    }
    return Object.freeze(this)
  }
}

