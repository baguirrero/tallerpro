import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Un trabajo parado esperando una pieza deja de verse igual que uno en curso.
 *
 * El CHECK no es decorativo: el motivo solo tiene sentido mientras el trabajo
 * espera, y si algún camino olvida limpiarlo al retomar, es mejor que el UPDATE
 * falle acá y no que seis meses después un reporte diga que un trabajo terminado
 * sigue esperando un repuesto.
 */
export class EsperaDeRepuesto1786254410000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trabajos" ADD COLUMN "motivo_espera" character varying(200)`,
    );

    await queryRunner.query(`
      ALTER TABLE "trabajos" ADD CONSTRAINT "CHK_trabajos_motivo_espera"
        CHECK (("estado" = 'ESPERANDO_REPUESTO') = ("motivo_espera" IS NOT NULL))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trabajos" DROP CONSTRAINT "CHK_trabajos_motivo_espera"`,
    );
    await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "motivo_espera"`);
  }
}
