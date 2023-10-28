/* eslint-disable global-require */
require('./config/local-secret-manager');
const { populateSecrets } = require('./config/secret-manager');

populateSecrets().then(() => {
    const config = require('./config/config');
    const app = require('./config/express');
    app.listen(config.port, () => {
        console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
    });
});
