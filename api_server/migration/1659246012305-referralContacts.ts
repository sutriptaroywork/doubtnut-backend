import { MigrationInterface, QueryRunner } from "typeorm";

export class referralContacts1659246012305 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // adding new columns to parent table
        await queryRunner.query(`CREATE TABLE referral_contacts (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            customer varchar(15) DEFAULT NULL,
            contact varchar(15) DEFAULT NULL,
            first_name varchar(20) DEFAULT NULL,
            last_name varchar(20) DEFAULT NULL,
            is_on_dn tinyint(1) DEFAULT NULL,
            blocked tinyint(1) DEFAULT NULL,
            pending tinyint(1) DEFAULT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            dob date DEFAULT NULL,
            is_active tinyint(1) DEFAULT '1',
            PRIMARY KEY (id),
            KEY idx_referral_contact_cci (contact,customer,is_on_dn)
          ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;`);
          await queryRunner.query(`ALTER TABLE referral_contacts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
          await queryRunner.query(`ALTER TABLE referral_contacts CHANGE first_name first_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;`)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(
            `Drop Table referral_contacts`
        );
        await queryRunner.query(
            `ALTER TABLE referral_contacts CONVERT TO CHARACTER SET utf8;`
        )
        await queryRunner.query(
            `ALTER TABLE referral_contacts CHANGE first_name first_name VARCHAR(255) SET utf8;`
        )
    }

}
