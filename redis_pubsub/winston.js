"use strict";
const winston = require('winston');
const config = require('./config');
// const Logger = winston.Logger;
const Console = winston.transports.Console;
const {LoggingWinston} = require('@google-cloud/logging-winston')
let options = {
  json: true,
  colorize: true,
  keyFilename: config.GCE_CREDENTIAL,
  projectId: config.project_id,
  logName: "pub_sub",
  resource: {
    "type": "gce_instance",
    "labels": {
      "instance_id": config.instance_id,
      "zone": config.server_zone,
    }
  }
}
const loggingWinston = new LoggingWinston(options);

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    // Add Stackdriver Logging
    loggingWinston,
  ]
});

module.exports = logger;
