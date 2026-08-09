import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El presupuesto deja de ser un número suelto en la orden y pasa a ser la suma
 * de los trabajos. `ordenes.presupuesto` se elimina sin repartirlo: no hay forma
 * honesta de partirlo entre trabajos que no existen.
 */
export class CotizacionEnTrabajos1786251399000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trabajos" ADD COLUMN "precio_mano_obra" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "trabajos" ADD COLUMN "aprobado" boolean`);

    await queryRunner.query(`
      CREATE TABLE "repuestos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "descripcion" character varying(200) NOT NULL,
        "cantidad" integer NOT NULL,
        "precio_unitario" numeric(10,2) NOT NULL,
        "trabajo_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_repuestos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_repuestos_trabajo" FOREIGN KEY ("trabajo_id")
          REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "presupuesto"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ordenes" ADD COLUMN "presupuesto" numeric(10,2)`);
    await queryRunner.query(`DROP TABLE "repuestos"`);
    await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "aprobado"`);
    await queryRunner.query(`ALTER TABLE "trabajos" DROP COLUMN "precio_mano_obra"`);
  }
}
