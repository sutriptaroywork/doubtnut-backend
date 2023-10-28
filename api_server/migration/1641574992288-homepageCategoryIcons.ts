import {MigrationInterface, QueryRunner} from "typeorm";

export class homepageCategoryIcons1641574992288 implements MigrationInterface {
    // alter table homepage_category_icons add column min_version_code int(11) default 0, add column max_version_code int(11) default 10000
    // create index homepage_category_icons_max_version on  homepage_category_icons(max_version_code)
    // create index homepage_category_icons_min_version on  homepage_category_icons(min_version_code)
    // create index homepage_category_icons_class on  homepage_category_icons(class)
    // create index homepage_category_icons_is_active on  homepage_category_icons(is_active)
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table homepage_category_icons add column min_version_code int(11) default 0, add column max_version_code int(11) default 10000`);
        await queryRunner.query(`create index homepage_category_icons_max_version on homepage_category_icons(max_version_code)`);
        await queryRunner.query(`create index homepage_category_icons_min_version on homepage_category_icons(min_version_code)`);
        await queryRunner.query(`create index homepage_category_icons_class on homepage_category_icons(class)`);
        await queryRunner.query(`create index homepage_category_icons_is_active on homepage_category_icons(is_active)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table homepage_category_icons drop column min_version_code, drop column max_version_code`);
        await queryRunner.query(`DROP index homepage_category_icons_max_version on homepage_category_icons`);
        await queryRunner.query(`DROP index homepage_category_icons_min_version on homepage_category_icons`);
        await queryRunner.query(`DROP index homepage_category_icons_class on homepage_category_icons`);
        await queryRunner.query(`DROP index homepage_category_icons_is_active on homepage_category_icons`);

    }

}
