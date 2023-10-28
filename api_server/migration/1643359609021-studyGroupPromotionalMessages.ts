import {MigrationInterface, QueryRunner} from "typeorm";

export class studyGroupPromotionalMessages1643359609021 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE study_group_promotional_messages ADD group_type varchar(10) NOT NULL AFTER end_date");
        await queryRunner.query("ALTER table study_group_promotional_messages ADD is_verified ENUM('all', '0', '1') NOT NULL after group_type");
        await queryRunner.query("ALTER TABLE study_group_promotional_messages MODIFY type ENUM('text', 'video', 'audio', 'image') NOT NULL");
        await queryRunner.query("ALTER TABLE study_group_promotional_messages MODIFY filter_operator ENUM('all', '>', '<', '=', '>=', '<=') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE study_group_promotional_messages DROP COLUMN group_type");
        await queryRunner.query("ALTER TABLE study_group_promotional_messages DROP COLUMN is_verified");
        await queryRunner.query("ALTER TABLE study_group_promotional_messages MODIFY type varchar(10) NOT NULL");
        await queryRunner.query("ALTER TABLE study_group_promotional_messages MODIFY filter_operator varchar(5) NOT NULL");
    }
}
