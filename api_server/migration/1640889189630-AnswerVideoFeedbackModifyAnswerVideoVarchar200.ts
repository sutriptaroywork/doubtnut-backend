import {MigrationInterface, QueryRunner} from "typeorm";

export class AnswerVideoFeedbackModifyAnswerVideoVarchar2001640889189630 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE user_answer_feedback MODIFY answer_video varchar(200)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE user_answer_feedback MODIFY answer_video varchar(50)`);
    }

}
