import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class updateTableStatementAddColumnSenderId1618493734135 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn('statements', new TableColumn({
        name: 'sender_id',
        type: 'uuid',
        isNullable: true
      }));

      await queryRunner.createForeignKey('statements', new TableForeignKey({
        name: 'FKUser',
        columnNames:['sender_id'],
        referencedTableName:"users",
        referencedColumnNames:['id']
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey('statements', 'FKUser');
      await queryRunner.dropColumn('statements', 'sender_id');
    }

}
