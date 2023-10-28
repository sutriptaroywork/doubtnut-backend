import {MigrationInterface, QueryRunner} from "typeorm";

export class activityBasedCarousel1649234470636 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table one_tap_posts add carousel_type varchar(55) default "auto"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('alter table one_tap_posts drop column carousel_type');
    }

}
