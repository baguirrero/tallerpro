import { MigrationInterface, QueryRunner } from "typeorm";

export class EsquemaInicial1786241304870 implements MigrationInterface {
    name = 'EsquemaInicial1786241304870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "nombre" character varying(50) NOT NULL, "descripcion" character varying(250), CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE ("nombre"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(50) NOT NULL, "email" character varying(150) NOT NULL, "password_hash" text NOT NULL, "nombres" character varying(100) NOT NULL, "apellidos" character varying(100) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9f78cfde576fc28f279e2b7a9cb" UNIQUE ("username"), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ordenes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numero_orden" character varying(20) NOT NULL, "descripcion" text NOT NULL, "presupuesto" numeric(10,2), "fecha_ingreso" date NOT NULL, "fecha_entrega" date, "estado" character varying(20) NOT NULL DEFAULT 'RECIBIDA', "placa" character varying(10) NOT NULL, "marca" character varying(50) NOT NULL, "modelo" character varying(50) NOT NULL, "anio" integer, "cliente_nombre" character varying(150) NOT NULL, "cliente_telefono" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "creado_por" uuid, CONSTRAINT "UQ_fedd93d9dcd2316b4a5a6d72047" UNIQUE ("numero_orden"), CONSTRAINT "PK_58713affeb8e3b7b30b9eeeee7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comentarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contenido" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "trabajo_id" uuid, "usuario_id" uuid, CONSTRAINT "PK_b60b1468bb275db8d5e875c4a78" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trabajos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying(200) NOT NULL, "descripcion" text, "prioridad" character varying(10) NOT NULL DEFAULT 'MEDIA', "estado" character varying(20) NOT NULL DEFAULT 'PENDIENTE', "fecha_limite" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "orden_id" uuid, "asignado_a" uuid, "creado_por" uuid, CONSTRAINT "PK_f6e8d17fbcb1d72fb45642e3a57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "adjuntos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre_original" character varying(255) NOT NULL, "nombre_archivo" character varying(255) NOT NULL, "ruta" character varying(500) NOT NULL, "tipo_mime" character varying(100) NOT NULL, "tamano" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "trabajo_id" uuid, "subido_por" uuid, CONSTRAINT "PK_31c54c1f2f5d5515eeb2d7b1d3f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuario_roles" ("rol_id" integer NOT NULL, "usuario_id" uuid NOT NULL, CONSTRAINT "PK_43e0c343408b4c5c79be51e7202" PRIMARY KEY ("rol_id", "usuario_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0a60de73dab09515692949c13a" ON "usuario_roles"  ("rol_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4660653ecea0eef621bae5209" ON "usuario_roles"  ("usuario_id") `);
        await queryRunner.query(`ALTER TABLE "ordenes" ADD CONSTRAINT "FK_caa7f7500eb58774f7b09e7e65d" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comentarios" ADD CONSTRAINT "FK_6c2612a2cc8a792788ce584d6d2" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comentarios" ADD CONSTRAINT "FK_1281c1e3cb210b0b3d6d09ab2e7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_9ac8b987ddeb17e006e5d08bae3" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_85a6faefb4d3ccf3f21bd4ec1ec" FOREIGN KEY ("asignado_a") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_b61012f300c6130d6535237d8b8" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ADD CONSTRAINT "FK_8d64f8f11c627370e2ca5420f52" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ADD CONSTRAINT "FK_23624cd2c619b398d270278c5f1" FOREIGN KEY ("subido_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuario_roles" ADD CONSTRAINT "FK_0a60de73dab09515692949c13a5" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "usuario_roles" ADD CONSTRAINT "FK_f4660653ecea0eef621bae52097" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuario_roles" DROP CONSTRAINT "FK_f4660653ecea0eef621bae52097"`);
        await queryRunner.query(`ALTER TABLE "usuario_roles" DROP CONSTRAINT "FK_0a60de73dab09515692949c13a5"`);
        await queryRunner.query(`ALTER TABLE "adjuntos" DROP CONSTRAINT "FK_23624cd2c619b398d270278c5f1"`);
        await queryRunner.query(`ALTER TABLE "adjuntos" DROP CONSTRAINT "FK_8d64f8f11c627370e2ca5420f52"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_b61012f300c6130d6535237d8b8"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_85a6faefb4d3ccf3f21bd4ec1ec"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_9ac8b987ddeb17e006e5d08bae3"`);
        await queryRunner.query(`ALTER TABLE "comentarios" DROP CONSTRAINT "FK_1281c1e3cb210b0b3d6d09ab2e7"`);
        await queryRunner.query(`ALTER TABLE "comentarios" DROP CONSTRAINT "FK_6c2612a2cc8a792788ce584d6d2"`);
        await queryRunner.query(`ALTER TABLE "ordenes" DROP CONSTRAINT "FK_caa7f7500eb58774f7b09e7e65d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4660653ecea0eef621bae5209"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0a60de73dab09515692949c13a"`);
        await queryRunner.query(`DROP TABLE "usuario_roles"`);
        await queryRunner.query(`DROP TABLE "adjuntos"`);
        await queryRunner.query(`DROP TABLE "trabajos"`);
        await queryRunner.query(`DROP TABLE "comentarios"`);
        await queryRunner.query(`DROP TABLE "ordenes"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
