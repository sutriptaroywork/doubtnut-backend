import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterLiveclassSchedulerLogs1646402403919 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE liveclass_scheduler_logs ADD COLUMN is_active int(1) NULL DEFAULT 1");
        await queryRunner.query(`create index is_active on liveclass_scheduler_logs(is_active)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table liveclass_scheduler_logs drop column is_active`);
        await queryRunner.query(`DROP index is_active on liveclass_scheduler_logs`);
    }

}

