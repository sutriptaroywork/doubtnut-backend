import {MigrationInterface, QueryRunner} from "typeorm";

export class pucShirtsizecolumnaddition1643279412744 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `paid_user_championship_shirt_winners`  ADD  column `shirt_size` VARCHAR(20) NULL DEFAULT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `paid_user_championship_shirt_winners` DROP column `shirt_size`");
    }

}
