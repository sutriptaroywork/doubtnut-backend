/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-await-in-loop */

const path = `${__dirname}/../../api_server/`;
require('dotenv').config({ path: `${path}.env` });
const moment = require('moment');

const config = require(`${path}config/config`);
const { ObjectId } = require('mongodb'); // or ObjectID
const { utility: Utility } = require('./modules');

let mongo;

const ARCHIVE_DAYS = 30;

async function insertBatch(collection, documents) {
    try {
        // Inserting documents in new collection
        const bulkInsert = await mongo.collection(`${collection}`).initializeUnorderedBulkOp();
        const insertedIds = [];
        let id;
        documents.forEach((doc) => {
            id = doc._id;
            // Insert without raising an error for duplicates
            bulkInsert.find({ _id: id }).upsert().replaceOne(doc);
            insertedIds.push(id);
        });
        await bulkInsert.execute();
        return insertedIds;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function deleteBatch(collection, documents) {
    try {
        // Deleting documents from old collection
        const bulkRemove = await mongo.collection(`${collection}`).initializeUnorderedBulkOp();
        documents.forEach((doc) => {
            bulkRemove.find({ _id: doc._id }).deleteOne();
        });
        await bulkRemove.execute();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function moveDocuments(sourceCollection, targetCollection, filter, batchSize) {
    try {
        console.log(`Moving ${await mongo.collection(`${sourceCollection}`).find(filter).count()} documents from ${sourceCollection} to ${targetCollection}`);
        while (await mongo.collection(`${sourceCollection}`).find(filter).count()) {
            const sourceDocs = await mongo.collection(`${sourceCollection}`).find(filter).limit(batchSize).toArray();
            const idsOfCopiedDocs = await insertBatch(targetCollection, sourceDocs);

            const targetDocs = await mongo.collection(`${targetCollection}`).find({ _id: { $in: idsOfCopiedDocs } }).toArray();
            await deleteBatch(sourceCollection, targetDocs);
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
function objectIdFromDate() {
    // Creating objectId from timestamp
    const date = moment().add(5, 'hours').add(30, 'minutes').subtract(ARCHIVE_DAYS, 'days')
        .valueOf();
    return `${Math.floor(date / 1000).toString(16)}0000000000000000`;
}

async function main() {
    try {
        mongo = await Utility.connectMongo(config);
        // Filtering based on objectId instead of created_at (much more efficient) - Using Timestamp to create objectId
        const filter = {
            _id: {
                $lte: ObjectId(`${objectIdFromDate()}`),
            },
            room_type: 'study_group',
            room_id: { $ne: 'study_group_faq' },
        };
        const targetCollection = `studygroup_archive_${moment().add(5, 'hours').add(30, 'minutes').year()}`;
        await moveDocuments('chatroom_messages', targetCollection, filter, 50000);
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        console.log(`the script successfully ran at ${moment().add(5, 'hours').add(30, 'minutes')}`);
    }
}

main();
