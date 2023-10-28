import {MigrationInterface, QueryRunner} from "typeorm";

export class LiveclassSchedulerColumnAdd1641294133027 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE liveclass_scheduler
        ADD min_rank INT NULL DEFAULT NULL AFTER faculty_rank,
        ADD max_rank INT NULL DEFAULT NULL AFTER min_rank`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE liveclass_scheduler DROP column min_rank");
        await queryRunner.query("ALTER TABLE liveclass_scheduler DROP column max_rank");

    }

}
