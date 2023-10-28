const { ValidationError } = require('express-validation');
const _ = require('lodash');
const { getEventsToPublishByApi } = require('../modules/containers/eventPublisher');

// checking if field exists in req.user or req.query or req.body or req.headers
function getField(req, field) {
    return _.get(req, `user.${field}`, '') || _.get(req, `query.${field}`, '') || _.get(req, `body.${field}`, '') || _.get(req, `headers.${field}`, '');
}
async function eventsPublisher(result, req, res, next) {
    try {
        const { version_code: versionCode } = req.headers;
        if (+versionCode >= 1000) {
            const db = req.app.get('db');
            const api = req.originalUrl.split('?')[0];
            // handling errors so analytics data isnt added when there is an error
            if (result instanceof (ValidationError)) {
                next(result);
            }
            if (result.err) {
                next(result);
            }
            // sending analytics key only for first page request
            // TODO: make page handling proper (some apis have page 0 as first page and some have page 1 as first)
            if (result.data && +_.get(req, 'query.page', 0) === 1) {
                const data = await getEventsToPublishByApi(db, api);

                if (_.get(data, 'events.fields.length', 0) > 0) {
                    const fields = _.get(data, 'events.fields', []);
                    const event = {};
                    // creating events with data for each field
                    fields.forEach((field) => {
                        _.set(event, `params.${field}`, getField(req, field));
                        _.set(event, 'name', _.get(data, 'events.screen_name', ''));
                        _.set(event, 'platforms', _.get(data, 'events.platforms', ''));
                    });
                    _.set(result, 'meta.analytics.events', [event]);
                }
                // setting student attributes
                if (_.get(data, 'attributes.length', 0) > 0) {
                    const attributesData = [];
                    const attributes = _.get(data, 'attributes', []);
                    attributes.forEach((attribute) => {
                        attributesData.push({
                            platforms: attribute.platforms,
                            key: attribute.field,
                            value: getField(req, attribute.field),
                        });
                    });
                    _.set(result, 'meta.analytics.attributes', attributesData);
                }
            }
            return next(result);
        }
        return next(result);
    } catch (err) {
        next({ err });
    }
}

module.exports = eventsPublisher;
