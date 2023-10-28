import {MigrationInterface, QueryRunner} from "typeorm";

export class recommendedStudygroupCompound1654769155532 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("create index study_group_group_recommended_group_index on study_group (group_type desc, created_by_class desc, is_active desc, total_members desc, created_at desc");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `study_group_group_recommended_group_index` ON study_group");
    }

}
