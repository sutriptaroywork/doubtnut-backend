import {MigrationInterface, QueryRunner} from "typeorm";

export class addSuccesstoPEsessions1643296453661 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE practice_english_sessions ADD is_success TINYINT NULL DEFAULT NULL AFTER status");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE practice_english_sessions DROP is_success");

    }

}
