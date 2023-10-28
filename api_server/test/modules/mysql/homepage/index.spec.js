const { describe } = require('mocha');

describe('homepage', () => {
    require('./getCaraousel.spec');
    require('./getPersonalisedCaraousel.spec');
    require('./getAllActiveHomePageWidgets.spec');
});
