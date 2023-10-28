import {MigrationInterface, QueryRunner} from "typeorm";

export class vendorIdAdded1642144679121 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE classzoo1.course_resources ALTER vendor_id SET DEFAULT 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE classzoo1.course_resources ALTER vendor_id DROP DEFAULT");
    }

}
