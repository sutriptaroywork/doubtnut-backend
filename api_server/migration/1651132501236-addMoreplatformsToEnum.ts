import {MigrationInterface, QueryRunner} from "typeorm";

export class addMoreplatformsToEnum1651132501236 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE events_publishing MODIFY COLUMN platform ENUM('apxor','branch','clevertap','moengage','firebase','snowplow','facebook') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE events_publishing MODIFY COLUMN platform ENUM('metabase','apxor','moengage') NOT NULL`);

    }

}
