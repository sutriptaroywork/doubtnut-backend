import {MigrationInterface, QueryRunner} from "typeorm";

export class webleadsclassaddition1644832527051 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE leads_web_landing_page ADD student_class varchar(255) NOT NULL, DROP PRIMARY KEY, ADD PRIMARY KEY(assortment_id,mobile,tag,student_class)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE leads_web_landing_page DROP PRIMARY KEY, ADD PRIMARY KEY(assortment_id,mobile,tag,student_class), DROP column student_class");
    }

}
