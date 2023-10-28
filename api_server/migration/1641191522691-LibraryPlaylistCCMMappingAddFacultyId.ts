import {MigrationInterface, QueryRunner} from "typeorm";

export class LibraryPlaylistCCMMappingAddFacultyId1641191522691 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `library_playlists_ccm_mapping` ADD `faculty_id` INT NULL DEFAULT NULL AFTER `is_active`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `library_playlists_ccm_mapping` DROP column `faculty_id`");
    }

}
