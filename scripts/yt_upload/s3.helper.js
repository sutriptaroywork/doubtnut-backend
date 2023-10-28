const { S3 } = require("aws-sdk");
const path = require("path");
const fs = require("fs");

const s3 = new S3({
    region: "ap-south-1",
    signatureVersion: "v4",
});

async function downloadS3Object(Bucket, Key, filePath) {
    const status = await checkObj(Bucket, Key);
    if (!status) {
        throw new Error("Key doesn't exist");
    }
    return new Promise((resolve) => {
        const file = fs.createWriteStream(filePath);
        const stream = s3.getObject({
            Bucket,
            Key,
        }).createReadStream().pipe(file);
        stream.on("finish", () => {
            resolve();
        });
    });
}

async function uploadS3Objects(bucket_name, key, dirPath) {
    const files = fs.readdirSync(dirPath);

    for (let i = 0; i < files.length; i++) {
        const Body = fs.createReadStream(path.join(dirPath, files[i]));
        var params = {
            Body,
            Bucket: bucket_name,
            Key: path.join(key, files[i]),
            CacheControl: 'max-age=25920001, public'
        };
        await s3.putObject(params).promise();
    }
}

async function uploadS3Object(Bucket, Key, Body, ContentType) {
    console.log("uploading", Bucket, Key);
    await s3.putObject({
        Body,
        Bucket,
        Key: Key,
        ContentType,
        CacheControl: 'max-age=25920001, public'
    }).promise();
}

async function checkObj(bucket, key) {
    try {
        await s3.headObject({
            Bucket: bucket,
            Key: key,
        }).promise();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function moveObj(Bucket, srcKey, destKey) {
    try {
        await s3.copyObject({
            Bucket,
            CopySource: `/${path.join(Bucket, srcKey)}`,
            Key: destKey,
        }).promise();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

module.exports = {
    downloadS3Object,
    uploadS3Objects,
    checkObj,
    uploadS3Object,
    moveObj,
};