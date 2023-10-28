import {MigrationInterface, QueryRunner} from "typeorm";

export class LiveclassSchedulerChanges1644234298831 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE library_playlists_ccm_mapping CHANGE faculty_id flag_id INT(11) NULL DEFAULT NULL");
        await queryRunner.query(`create index scheduler_flag_id on library_playlists_ccm_mapping(flag_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE library_playlists_ccm_mapping CHANGE flag_id faculty_id INT(11) NULL DEFAULT NULL");
        await queryRunner.query(`DROP index scheduler_flag_id on library_playlists_ccm_mapping`);
    }

}
