import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearSecuenciaNumeroOrden1786242951000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE "ordenes_numero_seq"`);
    await queryRunner.query(`
      SELECT setval('ordenes_numero_seq', COALESCE(
        (SELECT MAX(NULLIF(regexp_replace(numero_orden, '\\D', '', 'g'), '')::bigint)
         FROM ordenes), 0
      ) + 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE "ordenes_numero_seq"`);
  }
}
