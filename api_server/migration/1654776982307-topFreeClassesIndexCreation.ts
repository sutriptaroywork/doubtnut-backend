import { MigrationInterface, QueryRunner } from "typeorm"

export class topFreeClassesIndexCreation1654776982307 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query( `CREATE INDEX top_free_classes_locale_is_active_subject_master_chapter_idx ON top_free_classes (locale,master_chapter,class,subject,is_active)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP index top_free_classes_locale_is_active_subject_master_chapter_idx on top_free_classes`);

    }

}
