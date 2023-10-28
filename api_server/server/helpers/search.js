const axios = require('axios');
const inst =require('../../modules/axiosInstances');

async function getMicroIASResult(config, xAuthToken, studentClass, text, featureIds) {
    let result = await inst.configMicroInst({
        method: 'POST',
        url: `${config.microUrl}/api/search/matches`,
        timeout: 5000,
        headers: { 'Content-Type': 'application/json', 'x-auth-token': xAuthToken },
        data: {
            class: studentClass,
            text,
            featureIds,
        },
    });
    if (result.status === 200) {
        result = result.data.data;
    }
    return result;
}

async function updateIasSearchIndex(data, inAppSearchElasticInstance) {
    const updateData = await inAppSearchElasticInstance.getIasDataById(data.resource_reference);
    if (updateData && updateData.hits.hits.length) {
        const esObj = updateData.hits.hits[0]._source;
        esObj.page = 'TS_VOD';
        esObj.display = data.topic;
        if (esObj.meta_data) {
            esObj.meta_data.page = 'TS_VOD';
            if (esObj.meta_data.live_at) {
                delete esObj.meta_data.live_at;
            }
        }
        inAppSearchElasticInstance.updateIasIndexById(data.resource_reference, esObj);
    }
}

module.exports = {
    getMicroIASResult,
    updateIasSearchIndex,
};
