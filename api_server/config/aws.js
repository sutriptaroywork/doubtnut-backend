const aws = require('aws-sdk');
const { Kinesis } = require('aws-sdk');
const bluebird = require('bluebird');
const config = require('./config');

aws.config.setPromisesDependency(bluebird);
aws.config.update({
    accessKeyId: config.aws_access_id,
    secretAccessKey: config.aws_secret,
    region: config.aws_region,
    signatureVersion: config.aws_signature_version,
});

module.exports = {
    s3() {
        return new aws.S3();
    },
    sqs() {
        return new aws.SQS();
    },
    sns() {
        return new aws.SNS();
    },
    kinesisClient() {
        return new Kinesis({
            accessKeyId: config.aws_access_id,
            secretAccessKey: config.aws_secret,
            region: config.aws_region,
        });
    },
    aws() {
        return aws;
    },
};
