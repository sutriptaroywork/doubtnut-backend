const request = require('request');


module.exports = class SMSUtility {
    /** *
   * All SMS related utilities will go here
   */

    static async sendSMS(config, template_name, var_array, phone) {
        let url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${config.two_fa_key}&to=${phone}&from=DOUBTN&templatename=${template_name}&`;

        let var_string = '';

        for (let i = 0; i < var_array.length; i++) {
            var_string += `var${i + 1}=${encodeURI(var_array[i])}&`;
        }

        url += var_string;

        console.log(url);
        const options = {
            method: 'GET',
            url,
        };
        request(options, (error, response) => {
            if (error) throw new Error(error);
            console.log(response.body);
        });
    }

    static async sendSMSWithoutTemplate(config, msg, phone) {
        let url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${config.two_fa_key}&to=${phone}&from=DOUBTN&msg=${msg}`;

        url = encodeURI(url);
        const options = {
            method: 'GET',
            url,
        };
        console.log(url);
        request(options, (error, response) => {
            if (error) throw new Error(error);
            console.log(response.body);
        });
    }
};
