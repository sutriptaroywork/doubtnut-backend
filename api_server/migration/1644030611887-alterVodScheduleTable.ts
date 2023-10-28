import {MigrationInterface, QueryRunner} from "typeorm";

export class alterVodScheduleTable1644030611887 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE vod_schedule ADD parent_qid INT(55) NULL DEFAULT NULL AFTER lecture_type");
        await queryRunner.query("ALTER TABLE vod_schedule ADD year_exam INT(11) DEFAULT 2023 AFTER lecture_type");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE vod_schedule DROP COLUMN parent_qid");
        await queryRunner.query("ALTER TABLE vod_schedule DROP COLUMN year_exam");
    }

}
