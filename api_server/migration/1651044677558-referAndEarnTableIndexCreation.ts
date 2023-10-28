import {MigrationInterface, QueryRunner} from "typeorm";

export class referAndEarnTableIndexCreation1651044677558 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
        `ALTER TABLE refer_and_earn ADD INDEX inviter_id_idx (inviter_id);`
            )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP index inviter_id_idx on refer_and_earn`
        )
    }

}
