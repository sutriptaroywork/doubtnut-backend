import {MigrationInterface, QueryRunner} from "typeorm";

export class WebLandingWidgetsHTMLcolumn1656365201026 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table web_landing_page_widgets add column is_html int(11) DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table web_landing_page_widgets drop column is_html`);

    }

}
