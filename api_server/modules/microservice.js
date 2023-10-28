const config = require('../config/config');
const axiosInstance = require('./axiosInstances');

async function requestMicroServer(postUrl, data, xAuthToken, versionCode, method = 'POST') {
    try {
        // console.log(`${config.microUrl}${postUrl}`, {
        //     method,
        //     url: `${config.microUrl}${postUrl}`,
        //     timeout: 300,
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'x-auth-token': xAuthToken,
        //         version_code: versionCode || 940,
        //     },
        //     data,
        // });
        return axiosInstance.configMicroInst({
            method,
            url: `${config.microUrl}${postUrl}`,
            timeout: 300,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': xAuthToken,
                version_code: versionCode || 940,
            },
            data,
        });
    } catch (e) {
        console.error(e);
    }
}

async function requestMicroServerWithoutAuthToken(postUrl, data, versionCode, timeout = 300) {
    try {
        return axiosInstance.configMicroInst({
            method: 'POST',
            url: `${config.microUrl}${postUrl}`,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                version_code: versionCode || 940,
            },
            data,
        });
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    requestMicroServer,
    requestMicroServerWithoutAuthToken,
};
