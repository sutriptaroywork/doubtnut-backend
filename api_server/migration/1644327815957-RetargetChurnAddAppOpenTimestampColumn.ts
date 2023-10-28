import {MigrationInterface, QueryRunner} from "typeorm";

export class RetargetChurnAddAppOpenTimestampColumn1644327815957 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE retarget_student_churn ADD app_open_timestamp DATETIME NULL DEFAULT NULL AFTER id");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE retarget_student_churn drop app_open_timestamp");
    }

}
