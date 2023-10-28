import {MigrationInterface, QueryRunner} from "typeorm";

export class flagrNameColumnAdditionInIconLatestTable1647520667330 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE icons_latest ADD COLUMN flagr_name varchar(150) NOT NULL DEFAULT ''");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table icons_latest drop column flagr_name");
    }

}
