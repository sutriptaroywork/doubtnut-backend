import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateReferAndEarnTable1650987745830 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE refer_and_earn
            ( id INT(11) NOT NULL AUTO_INCREMENT ,
            inviter_id INT(11) NOT NULL ,
            invitee_id INT(11) NOT NULL ,
            question_asked TINYINT(4) NULL DEFAULT '0' ,
            bottom_sheet_viewed_inviter TINYINT(4) NOT NULL DEFAULT '0',
            bottom_sheet_viewed_invitee TINYINT(4) NOT NULL DEFAULT '0' ,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE invitee_id_idx (invitee_id))`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `Drop Table refer_and_earn`
        )
    }

}
