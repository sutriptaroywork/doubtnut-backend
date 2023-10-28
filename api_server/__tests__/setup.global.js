require('../config/local-secret-manager');
const { populateSecrets } = require('../config/secret-manager');

module.exports = async () => populateSecrets();
