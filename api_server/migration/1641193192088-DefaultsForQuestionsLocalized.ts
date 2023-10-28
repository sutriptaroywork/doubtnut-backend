import {MigrationInterface, QueryRunner, Table, TableIndex, TableColumn, TableForeignKey } from "typeorm";

export class DefaultsForQuestionsLocalized1641193192088 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('questions_localized', 'english', new TableColumn({type: "longtext", name: 'english', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'hindi', new TableColumn({type: "longtext", name: 'hindi', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'bengali', new TableColumn({type: "longtext", name: 'bengali', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'gujarati', new TableColumn({type: "longtext", name: 'gujarati', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'kannada', new TableColumn({type: "longtext", name: 'kannada', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'malayalam', new TableColumn({type: "longtext", name: 'malayalam', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'marathi', new TableColumn({type: "longtext", name: 'marathi', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'nepali', new TableColumn({type: "longtext", name: 'nepali', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'punjabi', new TableColumn({type: "longtext", name: 'punjabi', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'Tamil', new TableColumn({type: "longtext", name: 'Tamil', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'Telugu', new TableColumn({type: "longtext", name: 'Telugu', isNullable: true}));
        await queryRunner.changeColumn('questions_localized', 'Urdu', new TableColumn({type: "longtext", name: 'Urdu', isNullable: true}));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('questions_localized', 'english', new TableColumn({type: "longtext", name: 'english', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'hindi', new TableColumn({type: "longtext", name: 'hindi', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'bengali', new TableColumn({type: "longtext", name: 'bengali', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'gujarati', new TableColumn({type: "longtext", name: 'gujarati', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'kannada', new TableColumn({type: "longtext", name: 'kannada', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'malayalam', new TableColumn({type: "longtext", name: 'malayalam', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'marathi', new TableColumn({type: "longtext", name: 'marathi', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'nepali', new TableColumn({type: "longtext", name: 'nepali', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'punjabi', new TableColumn({type: "longtext", name: 'punjabi', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'Tamil', new TableColumn({type: "longtext", name: 'Tamil', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'Telugu', new TableColumn({type: "longtext", name: 'Telugu', isNullable: false}));
        await queryRunner.changeColumn('questions_localized', 'Urdu', new TableColumn({type: "longtext", name: 'Urdu', isNullable: false}));
    }

}
