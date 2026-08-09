import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla de vehículos y la puebla desde las órdenes existentes, una
 * fila por placa normalizada. Cuando una placa aparece en varias órdenes con
 * datos distintos, gana la más reciente.
 *
 * Deja `ordenes.vehiculo_id` nullable a propósito: soltar las columnas viejas
 * es otra migración, para que el código pueda cambiar entre una y otra sin que
 * quede ningún commit con el esquema y las entidades desalineados.
 */
export class CrearVehiculos1786247893000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehiculos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "placa" character varying(10) NOT NULL,
        "marca" character varying(50) NOT NULL,
        "modelo" character varying(50) NOT NULL,
        "anio" integer,
        "propietario_nombre" character varying(150) NOT NULL,
        "propietario_telefono" character varying(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehiculos" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehiculos_placa" UNIQUE ("placa")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "vehiculos" ("placa", "marca", "modelo", "anio",
                               "propietario_nombre", "propietario_telefono")
      SELECT DISTINCT ON (upper(regexp_replace("placa", '[^A-Za-z0-9]', '', 'g')))
             upper(regexp_replace("placa", '[^A-Za-z0-9]', '', 'g')),
             "marca", "modelo", "anio", "cliente_nombre", "cliente_telefono"
      FROM "ordenes"
      ORDER BY upper(regexp_replace("placa", '[^A-Za-z0-9]', '', 'g')), "created_at" DESC
    `);

    await queryRunner.query(`ALTER TABLE "ordenes" ADD COLUMN "vehiculo_id" uuid`);

    await queryRunner.query(`
      UPDATE "ordenes" o SET "vehiculo_id" = v."id"
      FROM "vehiculos" v
      WHERE v."placa" = upper(regexp_replace(o."placa", '[^A-Za-z0-9]', '', 'g'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "vehiculo_id"`);
    await queryRunner.query(`DROP TABLE "vehiculos"`);
  }
}
