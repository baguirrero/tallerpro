import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Segunda mitad de la extracción: ahora que el código usa la relación, se
 * puede exigir `vehiculo_id` y soltar los seis campos desnormalizados.
 */
export class SoltarDatosDeVehiculoEnOrdenes1786248138000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "vehiculo_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "ordenes" ADD CONSTRAINT "FK_ordenes_vehiculo"
      FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "ordenes"
        DROP COLUMN "placa",
        DROP COLUMN "marca",
        DROP COLUMN "modelo",
        DROP COLUMN "anio",
        DROP COLUMN "cliente_nombre",
        DROP COLUMN "cliente_telefono"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ordenes"
        ADD COLUMN "placa" character varying(10),
        ADD COLUMN "marca" character varying(50),
        ADD COLUMN "modelo" character varying(50),
        ADD COLUMN "anio" integer,
        ADD COLUMN "cliente_nombre" character varying(150),
        ADD COLUMN "cliente_telefono" character varying(20)
    `);
    await queryRunner.query(`
      UPDATE "ordenes" o
      SET "placa" = v."placa", "marca" = v."marca", "modelo" = v."modelo",
          "anio" = v."anio", "cliente_nombre" = v."propietario_nombre",
          "cliente_telefono" = v."propietario_telefono"
      FROM "vehiculos" v WHERE v."id" = o."vehiculo_id"
    `);
    await queryRunner.query(`ALTER TABLE "ordenes" DROP CONSTRAINT "FK_ordenes_vehiculo"`);
    await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "vehiculo_id" DROP NOT NULL`);
  }
}
