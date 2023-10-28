const rp = require('request-promise');

module.exports = class Pagerduty {
    static async createIncident(apiKey, serviceID, title, from) {
        const options = {
            method: 'POST',
            url: 'https://api.pagerduty.com/incidents',
            headers: {
                accept: 'application/vnd.pagerduty+json;version=2',
                'content-type': 'application/json',
                from,
                authorization: `Token token=${apiKey}`,
            },
            body: {
                incident: {
                    title,
                    service: { id: serviceID, type: 'service_reference' },
                    escalation_policy: { id: 'PV3ZMQL', type: 'escalation_policy_reference' },
                },
            },
            json: true,
        };
        // console.log(options.body);
        return rp(options);
    }
};
