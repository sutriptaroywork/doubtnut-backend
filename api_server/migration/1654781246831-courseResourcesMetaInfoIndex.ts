import { MigrationInterface, QueryRunner } from "typeorm"

export class courseResourcesMetaInfoIndex1654781246831 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table course_resources add index idx_rtype_minfo_odid(resource_type,meta_info,old_detail_id)");

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table course_resources drop index idx_rtype_minfo_odid");

    }

}
