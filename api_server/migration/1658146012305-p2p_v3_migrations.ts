import { MigrationInterface, QueryRunner } from "typeorm";

export class p2pV3Migrations1658146012305 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // adding new columns to parent table
        await queryRunner.query(`alter table doubt_pe_charcha
    add subject varchar(55) default null null,
    add locale varchar(55) default null null,
    add class int default null null,
    add is_whatsapp_opted tinyint(1) default 0 null;`);

        // modifying parent table
        await queryRunner.query(`alter table doubt_pe_charcha
    modify question_id int null,
    modify created_at datetime default CURRENT_TIMESTAMP null;`);

        // index creation
        await queryRunner.query(`create index doubt_pe_charcha_class_index on doubt_pe_charcha (class);`);
        await queryRunner.query(`create index doubt_pe_charcha_locale_index on doubt_pe_charcha (locale desc);`);
        await queryRunner.query(`create index doubt_pe_charcha_subject_index on doubt_pe_charcha (subject desc);`);
        await queryRunner.query(`create index doubt_pe_charcha_is_active_index on doubt_pe_charcha (is_active desc);`);
        await queryRunner.query(`create index doubt_pe_charcha_is_solved_index on doubt_pe_charcha (is_solved desc);`);
        await queryRunner.query(`create index doubt_pe_charcha_created_at_index on doubt_pe_charcha (created_at desc);`);

        // adding text feedback column in feedback table
        await queryRunner.query(`alter table doubt_pe_charcha_feedback add text_feedback varchar(255) default null null;`);

        // doubt pe charcha solved table creation
        await queryRunner.query(`CREATE TABLE \`doubt_pe_charcha_solved\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`room_id\` varchar(55) NOT NULL,
  \`marked_by\` int(11) DEFAULT NULL,
  \`sender_id\` int(11) NOT NULL,
  \`message_id\` varchar(255) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  \`event\` varchar(255) DEFAULT NULL,
  \`solve_stage\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`doubt_pe_charcha_solved_room_id_index\` (\`room_id\`)
);`);

        // doubt pe charcha member table creation
        await queryRunner.query(`CREATE TABLE \`doubt_pe_charcha_members\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`student_id\` int(11) NOT NULL,
  \`is_host\` tinyint(1) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`room_id\` varchar(55) NOT NULL,
  \`solve_stage\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`,\`room_id\`),
  KEY \`group_id_idx\` (\`room_id\`),
  KEY \`doubt_pe_charcha_id_index\` (\`student_id\`),
  KEY \`sgm_is_active_ix\` (\`is_active\`)
);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table doubt_pe_charcha drop column subject, locale, class, is_whatsapp_opted`);

        await queryRunner.query("alter table doubt_pe_charcha drop index doubt_pe_charcha_class_index");
        await queryRunner.query("alter table doubt_pe_charcha drop index doubt_pe_charcha_locale_index");
        await queryRunner.query("alter table doubt_pe_charcha drop index doubt_pe_charcha_subject_index");
        await queryRunner.query("alter table doubt_pe_charcha drop index doubt_pe_charcha_is_active_index");
        await queryRunner.query("alter table doubt_pe_charcha drop index doubt_pe_charcha_is_solved_index");
        await queryRunner.query("alter table doubt_pe_charcha drop index doubt_pe_charcha_created_at_index");

        await queryRunner.query(`alter table doubt_pe_charcha_feedback drop column text_feedback`);

        await queryRunner.query(
            `Drop Table doubt_pe_charcha_solved`
        )

        await queryRunner.query(
            `Drop Table doubt_pe_charcha_members`
        )
    }

}
