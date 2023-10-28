import {MigrationInterface, QueryRunner} from "typeorm";

export class dnShortsScraperTableCreation1652086972225 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`dn_shorts_scrap_scheduler\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`category\` varchar(55) NOT NULL,
          \`playlist_id\` varchar(255) NOT NULL,
          \`is_playlist\` tinyint(1) DEFAULT '1',
          \`total_videos\` int(11) DEFAULT '0',
          \`uploaded_videos\` int(11) DEFAULT '0',
          \`is_active\` smallint(6) DEFAULT '1',
          \`is_completed\` smallint(6) DEFAULT '0',
          \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`dn_shorts_scrap_scheduler_url_uindex\` (\`playlist_id\`),
          KEY \`dn_shorts_scrap_scheduler__is_active_ix\` (\`is_active\`),
          KEY \`dn_shorts_scrap_scheduler_playlist_id_index\` (\`playlist_id\`)
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE dn_shorts_scrap_scheduler");
    }

}
