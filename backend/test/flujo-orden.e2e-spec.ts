import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Recorre el ciclo completo de una orden contra la base real. Es lo que
 * ninguna prueba unitaria puede cubrir: que la derivación del estado, los
 * guards por rol y las transiciones funcionan juntos.
 */
describe('Flujo de una orden (e2e)', () => {
  let app: INestApplication<App>;
  let tokenJefe: string;
  let tokenMecanico: string;
  let idMecanico: string;
  let ordenId: string;
  let trabajoId: string;

  const nuevaOrden = {
    descripcion: 'Cambio de aceite y revisión de frenos',
    fecha_ingreso: '2026-08-08',
    placa: `FLUJO${Date.now().toString().slice(-5)}`,
    marca: 'Toyota',
    modelo: 'Yaris',
    propietario_nombre: 'Cliente de prueba',
    propietario_telefono: '999888777',
  };

  const iniciarSesion = async (email: string) => {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: '123456' })
      .expect(201);
    return respuesta.body;
  };

  const estadoDeLaOrden = async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .expect(200);
    return respuesta.body.estado;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    tokenJefe = (await iniciarSesion('jefe@taller.com')).access_token;

    const sesionMecanico = await iniciarSesion('mecanico@taller.com');
    tokenMecanico = sesionMecanico.access_token;
    idMecanico = sesionMecanico.usuario.id;
  });

  afterAll(async () => {
    if (ordenId) {
      const admin = await iniciarSesion('admin@taller.com');
      await request(app.getHttpServer())
        .delete(`/ordenes/${ordenId}`)
        .set('Authorization', `Bearer ${admin.access_token}`);
    }
    await app.close();
  });

  it('crea la orden con un correlativo con formato', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/ordenes')
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send(nuevaOrden)
      .expect(201);

    ordenId = respuesta.body.id;
    expect(respuesta.body.numero_orden).toMatch(/^ORD-\d{6,}$/);
    expect(respuesta.body.estado).toBe('RECIBIDA');
  });

  it('rechaza mandar el estado por el PATCH genérico', async () => {
    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ estado: 'ENTREGADA' })
      .expect(400);
  });

  it('no entrega una orden que no está finalizada', async () => {
    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}/entregar`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .expect(409);
  });

  it('un trabajo cotizado deja la orden COTIZADA hasta que el cliente responde', async () => {
    const creado = await request(app.getHttpServer())
      .post('/trabajos')
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({
        titulo: 'Cambiar pastillas de freno',
        orden_id: ordenId,
        asignado_a_id: idMecanico,
        precio_mano_obra: 150,
      })
      .expect(201);

    trabajoId = creado.body.id;
    expect(await estadoDeLaOrden()).toBe('COTIZADA');
  });

  it('con la aprobación del cliente vuelve a RECIBIDA, lista para empezar', async () => {
    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}/aprobacion`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ decisiones: [{ trabajo_id: trabajoId, aprobado: true }] })
      .expect(200);

    expect(await estadoDeLaOrden()).toBe('RECIBIDA');
  });

  it('completar el trabajo deja la orden FINALIZADA', async () => {
    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoId}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'COMPLETADO' })
      .expect(200);

    expect(await estadoDeLaOrden()).toBe('FINALIZADA');
  });

  it('reabrir el trabajo devuelve la orden a EN_PROCESO', async () => {
    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoId}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(200);

    expect(await estadoDeLaOrden()).toBe('EN_PROCESO');
  });

  it('un mecánico ajeno no puede mover el trabajo', async () => {
    const sufijo = Date.now();
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({
        username: `ajeno${sufijo}`,
        email: `ajeno${sufijo}@taller.com`,
        password: '123456',
        nombres: 'Mecánico',
        apellidos: 'Ajeno',
      })
      .expect(201);

    const ajeno = await iniciarSesion(`ajeno${sufijo}@taller.com`);

    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoId}/estado`)
      .set('Authorization', `Bearer ${ajeno.access_token}`)
      .send({ estado: 'PENDIENTE' })
      .expect(403);
  });

  it('entrega la orden una vez completada y la cierra a cambios', async () => {
    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoId}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'COMPLETADO' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}/entregar`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .expect(200);

    expect(await estadoDeLaOrden()).toBe('ENTREGADA');

    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoId}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(409);
  });
});
