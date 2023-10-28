const path = require('path');
const { URL } = require('url');
const config = require('../../config/config');
const Data = require('../../data/data');

const { cdn_url_mapping: availableCDNs } = Data;

const getCDNUrlFromCDNOrigin = (origin, sendVideoCDNUrl) => {
    const originKey = sendVideoCDNUrl ? 'cdn_video_origin' : 'origin';
    const urlKey = sendVideoCDNUrl ? 'cdn_video_url' : 'url';
    for (let i = 0; i < availableCDNs.length; i++) {
        const obj = availableCDNs[i];
        if (obj[originKey] === origin) {
            return obj[urlKey];
        }
    }
    return null;
};

const getResourceFromCDNUrl = (origin, href, sendVideoCDNUrl, pathname) => {
    // * Get complete URL using Origin
    const cdnURL = getCDNUrlFromCDNOrigin(origin, sendVideoCDNUrl);
    if (!cdnURL) return null;
    // * Get only the resource path of the URL
    if (origin === Data.cdnHostLimelightStaticDONOTCHANGE) {
        return pathname.replace(/(\/static\/)|(\/static-imagekit\/)/, "/");
    }
    return pathname;
};

const getRandomCDNUrl = (sendVideoCDNUrl) => {
    // * Generate random number between 0 to 1
    if (!sendVideoCDNUrl) return config.staticCDN;
    const random = Math.random();
    for (let i = 0; i < availableCDNs.length; i++) {
        const obj = availableCDNs[i];
        // * Compare random with weights in data file and return cdn url accordingly
        if (random < obj.weight) {
            return sendVideoCDNUrl ? obj.cdn_video_url : obj.url;
        }
    }
    return sendVideoCDNUrl ? config.cdn_video_url : config.staticCDN;
};

const getResourcePathFromURL = (url) => {
    try {
        const { pathname } = new URL(url);
        return pathname;
    } catch (e) {
        console.log(e);
    }
    return url;
};

const generateURL = (url, pathname) => {
    try {
        const newURL = new URL(path.join(url, getResourcePathFromURL(pathname)));
        return newURL.href;
    } catch (e) {
        console.log(e);
    }
};

const isStringURL = (string) => {
    try {
        const url = new URL(string);
        console.log(url);
        return true;
    } catch (e) {
        console.log(e);
    }
    return false;
};

const buildStaticCdnUrl = (url, sendVideoCDNUrl = false) => {
    // * Check for old static CDN, if it is old one, replace it with static CDN from env file
    if (!url) {
        return url;
    }
    const prefix = getRandomCDNUrl(sendVideoCDNUrl); // * Param whether to send video cdn url or not
    const currentOrigin = (new URL(prefix)).origin;
    try {
        const { origin, href, pathname } = new URL(url);
        const resource = getResourceFromCDNUrl(origin, href, sendVideoCDNUrl, pathname);
        if (!resource) return url;
        url = new URL(path.join(prefix, resource)).href;
    } catch (e) {
        url = new URL(path.join(prefix, url)).href;
    }

    return url;
};

module.exports = {
    buildStaticCdnUrl,
    getRandomCDNUrl,
    generateURL,
    isStringURL,
};
