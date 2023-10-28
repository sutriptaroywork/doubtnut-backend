const Influx = require('influx');

const influx = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST,
    port: process.env.INFLUX_PORT,
    database: process.env.INFLUX_DATABASE,
    username: process.env.INFLUX_USERNAME,
    password: process.env.INFLUX_PASSWORD,
})

exports.handler = async (event) => {
    try {
        if (!event.Records || !event.Records.length) {
            console.log('Null event');
            return;
        }
        console.log(event.Records);
        const data = event.Records.map(record => {
            const body = JSON.parse(record.body);
            return {
                measurement: body.eventName,
                tags: body.tags,
                fields: { value: body.value, time: body.time },
            }
        });
        await influx.writePoints(data);
    } catch (err) {
        console.error(`Error saving data to InfluxDB! ${err.stack}`);
    }
}