/* eslint-disable no-new */
/* eslint-disable new-cap */
// eslint-disable-next-line import/order
const config = require('./config');

if (config.env === 'production') {
    // eslint-disable-next-line global-require
    require('dd-trace').tracer.init({
        sampleRate: Number(process.env.DD_TRACE_SAMPLE_RATE || 1),
        experimental: {
            sampler: {
                sampleRate: Number(process.env.DD_TRACE_SAMPLE_RATE || 1),
                rules: [{
                    sampleRate: Number(process.env.DD_TRACE_SAMPLE_RATE_RULE || 1),
                    service: new RegExp('redis|mysql|fs', 'g'),
                }, {
                    service: new RegExp('.*', 'g'),
                }],
            },
        },
    });
}

const azure = require('azure-storage');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const elasticSearch = require('elasticsearch');
const { Translate } = require('@google-cloud/translate');
const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const httpStatus = require('http-status');
const expressWinston = require('express-winston');
const expressValidation = require('express-validation');
const helmet = require('helmet');
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
const i18next = require('i18next');
const i18NextBackend = require('i18next-fs-backend');
const { execSync } = require('child_process');
const { winstonLogger, getDynamicMeta } = require('./winston');
const redis = require('./redis');

redis.on('connect', () => {
    console.log('redis connect');
});

redis.on('ready', () => {
    console.log('redis ready');
});

redis.on('error', () => {
    console.log('redis error');
});

redis.on('close', () => {
    console.log('redis close');
});

redis.on('reconnecting', () => {
    console.log('redis reconnecting');
});

redis.on('end', () => {
    console.log('redis end');
});

const app = express();

const kinesisClient = require('./aws').kinesisClient();
// const Utility = require('../modules/utility');
const Header = require('../middlewares/header');
const StudentIdBan = require('../middlewares/studentIdBan');
const ElasticSearch = require('../modules/elasticSearch');
const ElasticSearchTest = require('../modules/elasticSearchTest');
const ElasticSearchWeb = require('../modules/elasticSearch');
const PznElasticSearch = require('../modules/pznElasticSearch');
const DailyGoalElasticSearch = require('../modules/dailyGoalElasticSearch');
const ElasticSearchAllDoubts = require('../modules/elasticSearchAllDoubts');
const InAppElasticSearch = require('../modules/inAppElasticSearch');
const LtrElasticSearch = require('../modules/ltrElasticSearch');
const UserQuestionsElasticSearch = require('../modules/userQuestionsElasticSearch');

const projectId = 'doubtnut-vm';

const translate2 = new Translate({
    projectId,
});
const mongodbUrl = config.mongo.database_url.replace('{username}', config.mongo.database_user).replace('{password}', config.mongo.database_pass).replace('{database}', config.mongo.database_name);
const eventsMongodbUrl = config.events_mongo.database_url && config.events_mongo.database_user && config.events_mongo.database_pass && config.events_mongo.database_name ? config.events_mongo.database_url.replace('{username}', config.events_mongo.database_user).replace('{password}', config.events_mongo.database_pass).replace('{database}', config.events_mongo.database_name) : '';

const serviceAccount = {
    projectId: config.firebase.project_id,
    privateKey: config.firebase.private_key.replace(/\\n/g, '\n'),
    clientEmail: config.firebase.client_email,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.base_url,
    databaseAuthVariableOverride: {
        uid: 'write-worker',
    },
});

app.use('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /');
});

const cloneAppServiceAccount = {
    projectId: config.firebase_new.project_id,
    privateKey: config.firebase_new.private_key.replace(/\\n/g, '\n'),
    clientEmail: config.firebase_new.client_email,
};

const cloneBiologyNeetServiceAccount = {
    projectId: config.firebase_biology_neet.project_id,
    privateKey: config.firebase_biology_neet.private_key.replace(/\\n/g, '\n'),
    clientEmail: config.firebase_biology_neet.client_email,
};

const cloneIITJEEServiceAccount = {
    projectId: config.firebase_maths_iitjee.project_id,
    privateKey: config.firebase_maths_iitjee.private_key.replace(/\\n/g, '\n'),
    clientEmail: config.firebase_maths_iitjee.client_email,
};

const cloneAppAdmin = admin.initializeApp({
    credential: admin.credential.cert(cloneAppServiceAccount),
    databaseURL: config.firebase_new.base_url,
    databaseAuthVariableOverride: {
        uid: 'write-worker',
    },
}, 'cloneAppAdmin');

const cloneBiologyNeetAdmin = admin.initializeApp({
    credential: admin.credential.cert(cloneBiologyNeetServiceAccount),
    databaseURL: config.firebase_biology_neet.base_url,
    databaseAuthVariableOverride: {
        uid: 'write-worker',
    },
}, 'cloneBiologyNeetAdmin');

const cloneIITJEEAdmin = admin.initializeApp({
    credential: admin.credential.cert(cloneIITJEEServiceAccount),
    databaseURL: config.firebase_biology_neet.base_url,
    databaseAuthVariableOverride: {
        uid: 'write-worker',
    },
}, 'cloneIITJEEAdmin');

const Database = require('./database');

bluebird.promisifyAll(mongoose);

const sqs = require('./aws').sqs();
const sns = require('./aws').sns();
const s3 = require('./aws').s3();

const blobService = azure.createBlobService();
let writeMysql;

const readMysql = new Database(config.read_mysql);
if (config.env === 'development') {
    writeMysql = readMysql;
} else {
    writeMysql = new Database(config.write_mysql);
}

const client = new elasticSearch.Client({
    host: config.elastic.ELASTIC_HOST,
});
const testClient = new elasticSearch.Client({
    host: config.elastic.TEST_ELASTIC_HOST,
});

const webElasticClient = new elasticSearch.Client({
    host: config.elastic.WEB_ELASTIC_HOST,
});
const pznElasticClient = new elasticSearch.Client({
    host: config.elastic.PZN_ELASTIC_HOST,
    // log: 'trace',
    apiVersion: '7.1',
});

const ltrElasticClient = new elasticSearch.Client({
    host: config.elastic.ELASTIC_LTR_HOST,
    // log: 'trace',
    apiVersion: '7.1',
});

const userQuestionsElasticClient = new elasticSearch.Client({
    host: config.elastic.ELASTIC_USER_QUESTIONS_HOST,
    // log: 'trace',
    apiVersion: '5.6',
});

const elasticSearchDailyGoalClient = new elasticSearch.Client({
    host: config.elastic.ELASTIC_DAILY_GOAL_INSTANCE.host,
    httpAuth: `${config.elastic.ELASTIC_DAILY_GOAL_INSTANCE.username} : ${config.elastic.ELASTIC_DAILY_GOAL_INSTANCE.password}`,
    apiVersion: '7.1',
});

const inAppElasticClient = new elasticSearch.Client({
    host: config.elastic.INAPP_ELASTIC_HOST,
});

const elasticSearchAllDoubtsClient = new elasticSearch.Client({
    host: config.elastic.ELASTIC_ALL_DOUBTS_INSTANCE.host,
    httpAuth: `${config.elastic.ELASTIC_ALL_DOUBTS_INSTANCE.username}:${config.elastic.ELASTIC_ALL_DOUBTS_INSTANCE.password}`,
    apiVersion: '7.1',
});

const db = {};
db.mysql = {};
db.mongo = {};
db.events_mongo = {};
db.redis = {
    read: redis,
    write: redis,
};
db.mysql.read = readMysql;
db.mysql.write = writeMysql;
if (config.mongo.connect) {
    MongoClient.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err, mongoClient) => {
        if (err && !mongoClient) {
            console.error(err);
            return;
        }
        const mongo = mongoClient.db(config.mongo.database_name);
        db.mongo.read = mongo;
        db.mongo.write = mongo;
        db.mongo.client = mongoClient;
    });
    mongoose.connect(mongodbUrl, { useNewUrlParser: true, autoIndex: false, useUnifiedTopology: true }).then(() => {
        console.log('Successfully connected to mongoose');
    }).catch((err) => {
        console.error(`Could not connect to the database. Exiting now...${err}`);
        process.exit(1);
    });
}
// * Connect to events mongo, only if the details are available
if (config.events_mongo.connect) {
    MongoClient.connect(eventsMongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err, mongoClient) => {
        if (err && !mongoClient) {
            console.error(err);
            return;
        }
        const mongo = mongoClient.db(config.events_mongo.database_name);
        db.events_mongo = mongo;
    });
}
// compress all responses
app.use(compression());
const shouldCompress = (req, res) => {
    if (req.headers['x-no-compression']) {
        // don't compress responses if this request header is present
        return false;
    }

    // fallback to standard compression
    return compression.filter(req, res);
};

app.use(compression({
    // filter decides if the response should be compressed or not,
    // based on the `shouldCompress` function above
    filter: shouldCompress,
    // threshold is the byte threshold for the response body size
    // before compression is considered, the default is 1kb
    threshold: 0,
}));

const publicPath = path.join(__dirname, '..', 'public');
const elasticSearchInstance = new ElasticSearch(client, config);
const elasticSearchTestInstance = new ElasticSearchTest(testClient, config);
const webElasticSearchInstance = new ElasticSearchWeb(webElasticClient, config);
const pznElasticSearchInstance = new PznElasticSearch(pznElasticClient, config);
const elasticDailyGoalInstance = new DailyGoalElasticSearch(elasticSearchDailyGoalClient, config);
const elasticSearchAllDoubtsInstance = new ElasticSearchAllDoubts(elasticSearchAllDoubtsClient, config);
const inAppSearchElasticInstance = new InAppElasticSearch(inAppElasticClient, config);
const elasticSearchLtrInstance = new LtrElasticSearch(ltrElasticClient, config);
const elasticSearchUserQuestionsInstance = new UserQuestionsElasticSearch(userQuestionsElasticClient, config);

app.set('db', db);
app.set('config', config);
app.set('client', client);
app.set('elasticSearchInstance', elasticSearchInstance);
app.set('elasticSearchTestInstance', elasticSearchTestInstance);
app.set('webElasticSearchInstance', webElasticSearchInstance);
app.set('pznElasticSearchInstance', pznElasticSearchInstance);
app.set('blobService', blobService);
app.set('inAppSearchElasticInstance', inAppSearchElasticInstance);
app.set('elasticSearchLtrInstance', elasticSearchLtrInstance);
app.set('elasticSearchUserQuestionsInstance', elasticSearchUserQuestionsInstance);
app.set('pznElasticSearchInstance', pznElasticSearchInstance);
app.set('elasticDailyGoalInstance', elasticDailyGoalInstance);
app.set('elasticSearchAllDoubtsInstance', elasticSearchAllDoubtsInstance);
app.set('publicPathblobService', blobService);
// app.set('redisPubSub', redisPubSub);
app.set('publicPath', publicPath);
app.set('admin', admin);
app.set('cloneAppAdmin', cloneAppAdmin);
app.set('cloneBiologyNeetAdmin', cloneBiologyNeetAdmin);
app.set('cloneIITJEEAdmin', cloneIITJEEAdmin);
app.set('winstonInstance', winstonLogger);
app.set('s3', s3);
app.set('aws', require('./aws').aws());

const localesFolder = path.join(__dirname, '../locales');
const { localeArray } = require('../data/locales');

if (config.env === 'development') {
    execSync(`aws s3 sync s3://dn-locale/${config.env}/ ${localesFolder}`); // standard command do not remove space
}
console.log('dn-locale synced');

global.t8 = {};
function t8options(locale, namespaceList) {
    return {
        initImmediate: false, // setting initImediate to false, will load the resources synchronously
        lng: locale,
        fallbackLng: 'en',
        ns: namespaceList,
        nsSeparator: false,
        keySeparator: false,
        interpolation: { escapeValue: false },
        defaultNS: 'translation',
        backend: {
            loadPath: path.join(localesFolder, '{{lng}}/{{ns}}.json'),
        },
    };
}

for (let i = 0; i < localeArray.length; i++) {
    global.t8[localeArray[i].locale] = i18next.createInstance();
    global.t8[localeArray[i].locale].use(i18NextBackend).init(t8options(localeArray[i].locale, localeArray[i].namespace), (err, t) => {
        if (err) return console.error(err);
        t('key');
    });
}
// To account for locale == 'null/undefined'
global.t8.undefined = global.t8.en.cloneInstance();
global.t8.null = global.t8.en.cloneInstance();
global.t8[''] = global.t8.en.cloneInstance();
console.log('i18next ready');

app.set('translate2', translate2);
app.set('sqs', sqs);
app.set('sns', sns);
app.set('kinesis', kinesisClient);
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(helmet());
// enable CORS - Cross Origin Resource Sharing
app.use(cors());
app.options('*', cors());
app.use((req, res, next) => {
    if (req.originalUrl && req.originalUrl.split('/').pop() === 'favicon.ico') {
        return res.sendStatus(204);
    }
    return next();
});

app.use((req, res, next) => {
    StudentIdBan.banStudent(req, res, next);
});

app.use((req, res, next) => {
    Header.headerMiddleware(req, res, next);
});

const Passport = require('./passport');

// eslint-disable-next-line no-new
new Passport.passportStrategy(db, db.redis);
new Passport.googleOAuthPassportStrategy(db);
new Passport.facebookOAuthPassportStrategy(db);

// -- routes for docs and generated swagger spec --

if (config.env === 'development') {
    app.set('trust proxy', 1); // Don't set to "true", it's not secure. Make sure it matches your environment
}

app.use(expressWinston.logger({
    winstonInstance: winstonLogger,
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    metaField: null, // this causes the metadata to be stored at the root of the log entry
    requestWhitelist: ['headers'],
    responseWhitelist: ['headers'],
    headerBlacklist: ['x-auth-token', 'authorization', 'x-auth-refresh-token'],
    dumpExceptions: true,
    showStack: true,
    dynamicMeta: getDynamicMeta,
}));

// eslint-disable-next-line no-restricted-syntax
for (const k in config.versions) {		// eslint-disable-line guard-for-in
    // eslint-disable-next-line global-require
    app.use(config.versions[k], require(`../server${config.versions[k]}/index.route`));	// eslint-disable-line import/no-dynamic-require
}

// log error in winston transports except when executing test suite
app.use(expressWinston.errorLogger({
    winstonInstance: winstonLogger,
    msg: '{{err.message}}',
    level: 'error',
    dumpExceptions: true,
    showStack: true,
    requestWhitelist: ['headers'],
    responseWhitelist: ['headers'],
    headerBlacklist: ['x-auth-token', 'authorization', 'x-auth-refresh-token'],
    blacklistedMetaFields: ['os', 'process', 'trace'],
    dynamicMeta: getDynamicMeta,
}));

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing messages[]
        const unifiedErrorMessage = err.errors.map((error) => error.messages.join('. ')).join(' and ');
        return next({ message: unifiedErrorMessage, status: err.status });
    }
    return next(err);
});

app.use('/static', express.static(publicPath));

// catch 404 and forward to error handler
app.use((_req, _res, next) => next({ message: httpStatus[httpStatus.NOT_FOUND], status: httpStatus.NOT_FOUND }));

// error handler, send stacktrace only during development
app.use((err, _req, res, _next) => { // eslint-disable-line no-unused-vars
    const status = err.status || httpStatus.INTERNAL_SERVER_ERROR;
    res.status(status).json({
        code: status,
        message: config.env === 'production' ? httpStatus[status] : err.message,
        // stack: err.stack,
    });
});

module.exports = app;
