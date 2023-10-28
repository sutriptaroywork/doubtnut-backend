const hashExpiry = 60 * 60 * 24; // 1 day
const checkout_counter = 'CHECKOUT';
const BBPS = 'BBPS';
module.exports = class Payment {
    static setCheckoutPageViewStat(client, studentID) {

        return client
            .multi()
            .incr(`${checkout_counter}:${studentID}`)
            .expire(`${checkout_counter}:${studentID}`, hashExpiry * 15)
            .execAsync();
    }

    static getCheckoutPageViewStat(client, studentID) {
        console.log(`${checkout_counter}:${studentID}`);
        return client
            .getAsync(`${checkout_counter}:${studentID}`);
    }

    static getPaymentCartOption(client, studentID) {
        return client
            .getAsync(`${BBPS}:${studentID}`);
    }

    static setPaymentCartOption(client, studentID, data) {
        return client.multi()
            .set(`${BBPS}:${studentID}`, JSON.stringify(data))
            .expire(`${BBPS}:${studentID}`, 60 * 60 * 2)
            .execAsync();
    }
};
