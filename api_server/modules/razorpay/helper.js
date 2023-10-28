const _ = require('lodash');
const Razorpay = require('razorpay');
const request = require('request');
const axios = require('axios');
const config = require('../../config/config');

const bufferObj = Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`, 'utf8');
const base64String = bufferObj.toString('base64');

module.exports = class RzpHelper {
    static async refund(orderId, amount) {
        try {
            const rzp = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET,
            });
            const rzpResponse = await rzp.payments.refund(orderId, { amount });
            console.log(orderId);
            console.log(amount);

            return rzpResponse;
        } catch (e) {
            console.log(e);
        }
    }

    static async fetchPaymentsByOrderId(order_id) {
        try {
            const options = {
                method: 'GET',
                url: `https://api.razorpay.com/v1/orders/${order_id}/payments?count=50`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                },
            };
            const rzpResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpResponse);
        } catch (e) {
            console.log(e);
        }
    }

    // fetch a single payment by payment_id passed from android or webhooks
    static async fetchPaymentsByPaymentId(payment_id) {
        try {
            const options = {
                method: 'GET',
                url: `https://api.razorpay.com/v1/payments/${payment_id}`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                },
            };
            const rzpResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpResponse);
        } catch (e) {
            console.log(e);
            return {};
        }
    }

    static async createUPILink(orderId, email, mobile, description, amount) {
        try {
            const payload = {
                amount,
                currency: 'INR',
                order_id: orderId,
                email,
                contact: mobile,
                method: 'upi',
                description: '',
                upi: {
                    flow: 'intent',
                },
            };

            const options = {
                method: 'POST',
                url: 'https://api.razorpay.com/v1/payments/create/upi',
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),

            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            console.log('rzpLinkResponse', rzpLinkResponse);
            return JSON.parse(rzpLinkResponse).link;
        } catch (e) {
            console.log(e);
        }
    }

    static async createStandardLink(obj) {
        try {
            const payload = {
                amount: obj.amount,
                currency: obj.currency,
                expire_by: obj.expire_by,
                reference_id: obj.reference_id,
                description: `${obj.description}\nBy proceeding further, you accept the Terms and Conditions (www.doubtnut.com/terms-and-conditions)`,
                customer: obj.customer,
                notify: {
                    sms: true,
                    email: true,
                },
                reminder_enable: false,
                notes: obj.notes,
                options: {
                    hosted_page: {
                        label: {
                            expire_by: 'PAY BEFORE',
                        },
                    },
                },
            };

            const options = {
                method: 'POST',
                url: 'https://api.razorpay.com/v1/payment_links',
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),

            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            /*
            const rzpRes = await this.fetchStandardLinkInfo(rzpLinkResponse.id);
            console.log("rzpRes", rzpRes);
            */

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async fetchStandardLinkInfo(linkId) {
        try {
            const options = {
                method: 'GET',
                url: `https://api.razorpay.com/v1/payment_links/${linkId}`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${base64String}`,
                },
            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async cancelStandardLink(linkId) {
        try {
            const options = {
                method: 'POST',
                url: `https://api.razorpay.com/v1/payment_links/${linkId}/cancel`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async cancelInvoice(invoiceId) {
        try {
            const rzp = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET,
            });
            await rzp.invoices.cancel(invoiceId);
        } catch (e) {
            console.log(e);
        }
    }

    static async createVPA(obj, createUpi = false) {
        try {
            const payload = {
                receivers: {
                    types: [
                        'bank_account',
                    ],
                },
                description: obj.description,
                // notes: obj.notes,
                // close_by: obj.close_by,
            };
            if (createUpi) {
                payload.receivers.types.push('vpa');
                payload.receivers.vpa = {
                    descriptor: obj.descriptor,
                };
            }

            const options = {
                method: 'POST',
                url: 'https://api.razorpay.com/v1/virtual_accounts',
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),

            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async fetchVPADetails(id) {
        try {
            const options = {
                method: 'GET',
                url: `https://api.razorpay.com/v1/virtual_accounts/${id}`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async fetchVPAPayments(id) {
        try {
            const options = {
                method: 'GET',
                url: `https://api.razorpay.com/v1/virtual_accounts/${id}/payments`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async closeVPA(id) {
        try {
            const options = {
                method: 'POST',
                url: `https://api.razorpay.com/v1/virtual_accounts/${id}/close`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async createUpiId(obj) {
        try {
            const payload = {
                receivers: {
                    types: [
                        'vpa',
                    ],
                    vpa: {
                        descriptor: obj.descriptor,
                    },
                },
                description: obj.description,
                amount_expected: obj.amount,
                // notes: obj.notes,
                close_by: obj.close_by,
            };

            const options = {
                method: 'POST',
                url: 'https://api.razorpay.com/v1/virtual_accounts',
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),

            };

            console.log(options);
            const rzpLinkResponse = await new Promise((resolve, reject) => {
                request(options, (error, response) => {
                    if (error) reject(error);
                    resolve(response.body);
                });
            });

            return JSON.parse(rzpLinkResponse);
        } catch (e) {
            console.log(e);
        }
    }

    static async addUpiIdToVBA(obj) {
        try {
            const payload = {
                types: [
                    'vpa',
                ],
                vpa: {
                    descriptor: obj.descriptor,
                },
            };
            const options = {
                method: 'POST',
                url: `https://api.razorpay.com/v1/virtual_accounts/${obj.id}/receivers`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(payload),
            };
            const { data } = await axios(options);
            console.log('add upi id to vba', data);
            return data;
        } catch (e) {
            console.error(e);
            return {};
        }
    }
};
