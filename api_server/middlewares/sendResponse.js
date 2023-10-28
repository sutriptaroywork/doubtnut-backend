const { ValidationError } = require('express-validation');
const _ = require('lodash');
const { handleGuestLoginResponse } = require('../modules/utility');

function getDataForhandlingErrorsGracefullyByApiRequest(apiRequest) {
    const srpWidgetsApiRegex = new RegExp('v1\\/question\\/get-srp-widgets\\?.*');
    const matchPageCaraouselsRegex = new RegExp('v1\\/matchpage\\/get-carousels\\/\\d+');
    const apiUrl = apiRequest.originalUrl;
    switch (apiUrl) {
        case srpWidgetsApiRegex.test(apiUrl) ? apiUrl : false:
            return {
                data: {
                    nudges: null,
                },
            };
        case matchPageCaraouselsRegex.test(apiUrl) ? apiUrl : false:
            return {
                data: {
                    live_classes: [],
                    popular_courses: [],
                },
            };
        default:
            return new Error('NO HANDLER FOR API ERROR');
    }
}

/**
 * - Response handling middleware
 * - To be added as last function of any route
 * @param {ValidationError | {err: Error, data: any}} result Either validation error or {err, data} from controllers
 * @param {Express.Request} _req request
 * @param {Express.Response} res response
 * @param {Function} next next function
 * @author Abhishek Sinha
 */
function sendResponse(result, _req, res, next) {
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
            ...(_.get(result, 'meta.analytics', false) && { analytics: _.get(result, 'meta.analytics', {}) }),
        },
        data: null,
    };
    try {
        if (result instanceof (ValidationError)) {
        //  || result instanceof (ReferenceError) || result instanceof TypeError) {
            throw result;
        }
        if (result.err) {
            throw result.err;
        }
        responseData.data = result.data;
        if (_req.inapp_pop_up) {
            responseData.meta.inapp_pop_up = _req.inapp_pop_up;
        }
        if (_req.user && _req.user.is_guest_user && _req.user.is_action_disabled_by_route) {
            return res.status(responseData.meta.code).json(handleGuestLoginResponse(responseData, _req.user.locale));
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const _data = getDataForhandlingErrorsGracefullyByApiRequest(_req);
        if (_data instanceof Error) {
            next(e);
        } else {
            responseData.data = _data;
            return res.status(responseData.meta.code).json(responseData);
        }
    }
}

module.exports = sendResponse;
