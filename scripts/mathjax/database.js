/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-22 16:55:50
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-22 17:21:41
*/
"use strict";
const mysql = require( 'mysql' );
module.exports = class Database {
  constructor( config ) {
    this.connection = mysql.createConnection( config );
  }
  query( sql, args ) {
    return new Promise( ( resolve, reject ) => {
      this.connection.query( sql, args, ( err, rows ) => {
        if ( err )
          return reject( err );
        resolve( rows );
      } );
    } );
  }
  close() {
    return new Promise( ( resolve, reject ) => {
      this.connection.end( err => {
        if ( err )
          return reject( err );
        resolve();
      } );
    } );
  }
}