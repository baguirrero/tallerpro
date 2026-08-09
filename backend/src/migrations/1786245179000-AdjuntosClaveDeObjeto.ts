import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `nombre_archivo` y `ruta` guardaban variantes de lo mismo: el nombre
 * generado y su ruta en disco. Con el almacenamiento detrás de una interfaz
 * la única identidad que importa es la clave del objeto, que en disco es el
 * nombre del archivo y en S3 es la key del bucket. `nombre_original` se
 * queda: es lo que ve el usuario.
 */
export class AdjuntosClaveDeObjeto1786245179000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "adjuntos" RENAME COLUMN "ruta" TO "clave"`);
    await queryRunner.query(`ALTER TABLE "adjuntos" DROP COLUMN "nombre_archivo"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adjuntos" ADD COLUMN "nombre_archivo" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "adjuntos" RENAME COLUMN "clave" TO "ruta"`);
  }
}
