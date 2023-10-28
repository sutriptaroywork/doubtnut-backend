import { MigrationInterface, QueryRunner } from "typeorm"

export class youtubeEventResource1657513918789 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table youtube_event add resource_reference varchar(255), add UNIQUE (resource_reference);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table youtube_event drop column resource_reference`);
    }

}
