const aws = require('aws-sdk');

aws.config.update({
	accessKeyId: process.env.KEY_ID,
	secretAccessKey: process.env.SECRET,
	region: 'ap-south-1',
	signatureVersion: 'v4',
});

const askBucket = 'dn-test-questionupload';
const currentBucket = 'doubtnut-static';
const oldPrefix = '';
const newPrefix = 'images/';
const s3AskBucket = new aws.S3({ params: { Bucket: askBucket }, region: 'ap-south-1' });
const s3StaticBucket = new aws.S3({ params: { Bucket: currentBucket }, region: 'ap-south-1' });
async function moveObject(qAskBucket, staticBucket, fileNameArr) {
	const listObjectPromiseR = await qAskBucket.listObjects(
		{ Prefix: oldPrefix },
	).promise();
	if (listObjectPromiseR.Contents.length) {
		for (let i = 0; i < listObjectPromiseR.Contents.length; i += 1) {
            for(let j=0;j < fileNameArr.length; j++){
                let fileName = JSON.parse(fileNameArr[j].body)
                fileName = fileName.file_name;
                if (fileName === listObjectPromiseR.Contents[i].Key) {
                    const promise = [];
                    const params = {
                        Bucket: currentBucket,
                        CopySource: `${askBucket}/${listObjectPromiseR.Contents[i].Key}`,
                        Key: listObjectPromiseR.Contents[i].Key.replace(
                            oldPrefix,
                            newPrefix,
                        ),
                    };
                    // copy image
                    promise.push(staticBucket.copyObject(params).promise());
                    console.log('Copied: ', params.Key);
                    promise.push(qAskBucket.deleteObject({
                        Bucket: askBucket,
                        Key: listObjectPromiseR.Contents[i].Key,
                    }).promise());
                    console.log('Deleted: ',
                        listObjectPromiseR.Contents[i].Key);
                    return (await Promise.all(promise));
                }
            }
			if ((listObjectPromiseR.Contents.length - 1) === i) {
				return false;
			}
		}
	} else {
		return false;
	}
}

exports.handler = async (event, context) => {
	try {
		console.log(event);
		console.log('testsetset')
		let data = event.Records;
        await moveObject(s3AskBucket, s3StaticBucket, data);
        return new Promise(((resolve) => {
            resolve('Completed');
        }));
    } catch (e) {
        console.log("Error from catch block")
        console.log(e)
    }
}
