module.exports = class videoView {
    static getWebBooksData(client, key) {
        return client.getAsync(`${key}`);
    }

    static setWebBooksData(client, key, data, exTime) {
        return client.set(`${key}`, JSON.stringify(data), 'EX', exTime);
    }
};
