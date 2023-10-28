import { MigrationInterface, QueryRunner } from "typeorm"

export class campaignInHC1649914910789 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table home_caraousels add campaign varchar(255) default NULL after locale`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table home_caraousels drop column campaign`);
    }

}
