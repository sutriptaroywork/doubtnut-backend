import { MigrationInterface, QueryRunner } from "typeorm"

 export class LiveClassHomework1662850501610 implements MigrationInterface {

     public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(
             `CREATE INDEX idx_liveclass_homework_ca
             ON liveclass_homework (created_at)`
         );
     }

     public async down(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(`DROP index idx_liveclass_homework_ca on idx_liveclass_homework`);
     }

 }