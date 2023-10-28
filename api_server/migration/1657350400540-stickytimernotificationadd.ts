import {MigrationInterface, QueryRunner} from "typeorm";

export class stickytimernotificationadd1657350400540 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table sticky_notification add (timer_end_time timestamp NULL DEFAULT NULL, text_color varchar(255) DEFAULT NULL, bg_color varchar(255) DEFAULT NULL, cta_bg_color varchar(255) DEFAULT NULL, type_extra varchar(255) DEFAULT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table sticky_notification drop timer_end_time,drop text_color,drop bg_color,drop cta_bg_color,drop type_extra;`);
    }

}
