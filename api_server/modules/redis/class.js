// const _ = require('lodash');

module.exports = class Class {
    static getList(language, client) {
        return client.hgetAsync('language_list', `${language}class_list`);
    }

    static setList(language, data, client) {
        console.log('set question in redis');
        return client.hsetAsync('language_list', `${language}class_list`, JSON.stringify(data));
    }

    static getListNew(language, appCountry, client) {
        return client.hgetAsync(`language_list_new_${appCountry}`, `${language}class_list`);
    }

    static setListNew(language, appCountry, data, client) {
        return client.hsetAsync(`language_list_new_${appCountry}`, `${language}class_list`, JSON.stringify(data));
    }

    static getClassListNewOnBoarding(client, language) {
        return client.hgetAsync('language_list_new_onboarding', `${language}_class_list`);
    }

    static setClassListNewOnBoarding(client, language, data) {
        console.log('set question in redis');
        return client.hsetAsync('language_list_new_onboarding', `${language}_class_list`, JSON.stringify(data));
    }

    static getClassListNewOnBoardingForHome(client, language, appCountry) {
        return client.hgetAsync(`language_list_new_onboarding_home_${appCountry}`, `${language}_class_list`);
    }

    static setClassListNewOnBoardingForHome(client, language, data, appCountry) {
        console.log('set question in redis');
        return client.hsetAsync(`language_list_new_onboarding_home_${appCountry}`, `${language}_class_list`, JSON.stringify(data));
    }
};
