import { MigrationInterface, QueryRunner } from "typeorm";

export class FksObligatorias1786242187307 implements MigrationInterface {
    name = 'FksObligatorias1786242187307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" DROP CONSTRAINT "FK_caa7f7500eb58774f7b09e7e65d"`);
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "creado_por" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comentarios" DROP CONSTRAINT "FK_6c2612a2cc8a792788ce584d6d2"`);
        await queryRunner.query(`ALTER TABLE "comentarios" DROP CONSTRAINT "FK_1281c1e3cb210b0b3d6d09ab2e7"`);
        await queryRunner.query(`ALTER TABLE "comentarios" ALTER COLUMN "trabajo_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comentarios" ALTER COLUMN "usuario_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_9ac8b987ddeb17e006e5d08bae3"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_b61012f300c6130d6535237d8b8"`);
        await queryRunner.query(`ALTER TABLE "trabajos" ALTER COLUMN "orden_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ALTER COLUMN "creado_por" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "adjuntos" DROP CONSTRAINT "FK_8d64f8f11c627370e2ca5420f52"`);
        await queryRunner.query(`ALTER TABLE "adjuntos" DROP CONSTRAINT "FK_23624cd2c619b398d270278c5f1"`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ALTER COLUMN "trabajo_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ALTER COLUMN "subido_por" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ordenes" ADD CONSTRAINT "FK_caa7f7500eb58774f7b09e7e65d" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comentarios" ADD CONSTRAINT "FK_6c2612a2cc8a792788ce584d6d2" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comentarios" ADD CONSTRAINT "FK_1281c1e3cb210b0b3d6d09ab2e7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_9ac8b987ddeb17e006e5d08bae3" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_b61012f300c6130d6535237d8b8" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ADD CONSTRAINT "FK_8d64f8f11c627370e2ca5420f52" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ADD CONSTRAINT "FK_23624cd2c619b398d270278c5f1" FOREIGN KEY ("subido_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjuntos" DROP CONSTRAINT "FK_23624cd2c619b398d270278c5f1"`);
        await queryRunner.query(`ALTER TABLE "adjuntos" DROP CONSTRAINT "FK_8d64f8f11c627370e2ca5420f52"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_b61012f300c6130d6535237d8b8"`);
        await queryRunner.query(`ALTER TABLE "trabajos" DROP CONSTRAINT "FK_9ac8b987ddeb17e006e5d08bae3"`);
        await queryRunner.query(`ALTER TABLE "comentarios" DROP CONSTRAINT "FK_1281c1e3cb210b0b3d6d09ab2e7"`);
        await queryRunner.query(`ALTER TABLE "comentarios" DROP CONSTRAINT "FK_6c2612a2cc8a792788ce584d6d2"`);
        await queryRunner.query(`ALTER TABLE "ordenes" DROP CONSTRAINT "FK_caa7f7500eb58774f7b09e7e65d"`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ALTER COLUMN "subido_por" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ALTER COLUMN "trabajo_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ADD CONSTRAINT "FK_23624cd2c619b398d270278c5f1" FOREIGN KEY ("subido_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjuntos" ADD CONSTRAINT "FK_8d64f8f11c627370e2ca5420f52" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ALTER COLUMN "creado_por" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ALTER COLUMN "orden_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_b61012f300c6130d6535237d8b8" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trabajos" ADD CONSTRAINT "FK_9ac8b987ddeb17e006e5d08bae3" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comentarios" ALTER COLUMN "usuario_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comentarios" ALTER COLUMN "trabajo_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comentarios" ADD CONSTRAINT "FK_1281c1e3cb210b0b3d6d09ab2e7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comentarios" ADD CONSTRAINT "FK_6c2612a2cc8a792788ce584d6d2" FOREIGN KEY ("trabajo_id") REFERENCES "trabajos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "creado_por" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ordenes" ADD CONSTRAINT "FK_caa7f7500eb58774f7b09e7e65d" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
