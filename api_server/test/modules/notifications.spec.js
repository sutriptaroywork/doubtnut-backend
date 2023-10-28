const { describe, it } = require('mocha');
const moment = require('moment');

const mysql = require('mysql');
const MockDate = require('mockdate');

const { assert } = require('chai');
const Notifications = require('../../modules/notifications');

describe('Test getLiveClassesQuery', () => {
    it('should form the correct query for getLiveClasses function', async () => {
        // Given (test setup)
        MockDate.set('01/01/2020');
        const mysqlDateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
        const dateTimeNowInIST = moment().add(5, 'hours').add(30, 'minutes');
        const mySqlCompatibleStartDatetime = dateTimeNowInIST.startOf('day').format(mysqlDateTimeFormat);
        const mySqlCompatibleEndDatetime = dateTimeNowInIST.endOf('day').format(mysqlDateTimeFormat);

        // When (actual code execution)
        console.log(Notifications.getLiveClassResourcesQuery());
        const actual = mysql.format(Notifications.getLiveClassResourcesQuery(),
            [mySqlCompatibleStartDatetime, mySqlCompatibleEndDatetime]);
        const expected = "select a.* from (SELECT * FROM liveclass_course_resources WHERE  player_type='liveclass' and resource_reference is not null and resource_type=4) as a left join (SELECT * FROM liveclass_course_details where live_at>='2020-01-01 00:00:00' AND live_at<'2020-01-01 23:59:59') as b on a.liveclass_course_detail_id=b.id where b.id is not null";

        // Then
        assert.equal(actual, expected);
    });
});
