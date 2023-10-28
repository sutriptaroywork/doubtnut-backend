// eslint-disable-next-line import/no-extraneous-dependencies
const sonarqubeScanner = require('sonarqube-scanner');

sonarqubeScanner({
    serverUrl: 'http://localhost:9000',
    options: {
        'sonar.sources': '.',
        'sonar.inclusions': '**', // Entry point of your code
        'sonar.exclusions': 'node_modules/*,.git/*',
    },
}, () => { });
