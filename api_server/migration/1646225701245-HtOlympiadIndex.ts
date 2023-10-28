import {MigrationInterface, QueryRunner} from "typeorm";

export class HtOlympiadIndex1646225701245 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX student_info ON ht_olympiad_students");
        await queryRunner.query("ALTER TABLE ht_olympiad_students ADD UNIQUE (username)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE ht_olympiad_students ADD UNIQUE (username,mobile)");
        await queryRunner.query("DROP INDEX username ON ht_olympiad_students");
    }

}
