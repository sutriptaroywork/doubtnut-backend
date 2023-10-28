module.exports = class Bounty {
    static getVotes(client, ids) {
        return Promise.all(ids.map((x) => client.getAsync(x)));
    }
};
