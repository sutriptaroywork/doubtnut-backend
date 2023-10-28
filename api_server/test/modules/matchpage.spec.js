const { describe, it } = require('mocha');

const mysql = require('mysql');

const { assert } = require('chai');
const Liveclass = require('../../modules/mysql/liveclass');

describe('Test getLiveClassesQuery', () => {
    it('should form the correct query for getLiveClasses function', async () => {
        const qids = ['1', '2'];
        // When (actual code execution)
        const actual = mysql.format(Liveclass.liveVideoDetailsByResIdSql, [qids]);
        const expected = "SELECT a.resource_reference, a.expert_name, a.expert_image, a.player_type, a.meta_info, a.stream_status, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference IN ('1', '2')";

        // Then
        assert.equal(actual, expected);
    });
});
