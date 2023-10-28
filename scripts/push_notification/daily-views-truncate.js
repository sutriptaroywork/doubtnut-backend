require('dotenv').config({ path: `${__dirname  }/../../api_server/.env` });
const config = require(`${__dirname}/../../api_server/config/config`);
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);
const database = require('./database');
const conWrite = config.write_mysql;
const cronServerServiceID = 'P9T0CZU';

main();


async function main() {
    let writeClient = '';
    try {
      writeClient = new database(conWrite);
      await truncateViews(writeClient);
      console.log("the script successfully ran at "+ new Date())
    } catch (error) {
        console.log(error);
        const title = 'Issue in Daily views truncate script';
        const from = 'vivek@doubtnut.com';
        await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
          writeClient.connection.end();
    }
}


function truncateViews(mysql){
    let query = `TRUNCATE TABLE daily_views`;
    return mysql.query(query);
}
