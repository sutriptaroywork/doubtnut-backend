import {MigrationInterface, QueryRunner} from "typeorm";

export class courseDetailsDefaultPromo1642516206959 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `classzoo1`.`course_details` CHANGE COLUMN `promo_applicable` `promo_applicable` INT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `classzoo1`.`course_details` CHANGE COLUMN `promo_applicable` `promo_applicable` tinyint");
    }

}
