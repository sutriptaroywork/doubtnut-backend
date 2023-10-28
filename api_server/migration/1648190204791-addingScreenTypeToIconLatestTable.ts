import {MigrationInterface, QueryRunner} from "typeorm";

export class addingScreenTypeToIconLatestTable1648190204791 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE icons_latest CHANGE screen_type screen_type ENUM('','CAMERA_NAVIGATION','CAMERA_PAGE_BOTTOM_SHEET','HOME_ALL','CAMERA_EXPLORE_ALL','APP_NAVIGATION')  DEFAULT ''");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE icons_latest CHANGE screen_type screen_type ENUM('','CAMERA_NAVIGATION','CAMERA_PAGE_BOTTOM_SHEET','HOME_ALL')  DEFAULT ''");
    }

}
