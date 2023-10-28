import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterHomeCarouselChanges1646126692426 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE home_caraousels ADD COLUMN package VARCHAR(100) NULL DEFAULT NULL, ADD COLUMN is_free int(1) default NULL");
        await queryRunner.query(`create index package on home_caraousels(package)`);
        await queryRunner.query(`create index is_free on home_caraousels(is_free)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table home_caraousels drop column package, drop column is_free`);
        await queryRunner.query(`DROP index package on home_caraousels`);
        await queryRunner.query(`DROP index is_free on home_caraousels`);


    }

}
