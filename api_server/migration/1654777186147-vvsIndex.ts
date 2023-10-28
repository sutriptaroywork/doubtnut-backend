import { MigrationInterface, QueryRunner } from "typeorm"

export class vvsIndex1654777186147 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query( `CREATE INDEX video_view_stats_sid_qid_IDX ON video_view_stats (student_id,question_id)`)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP index video_view_stats_sid_qid_IDX on video_view_stats`);

    }

}
