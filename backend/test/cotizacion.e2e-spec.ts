import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Cotización y aprobación (e2e)', () => {
  let app: INestApplication<App>;
  let tokenJefe: string;
  let tokenMecanico: string;
  let idMecanico: string;
  let ordenId: string;
  let trabajoA: string;
  let trabajoB: string;
  let trabajoSinCotizar: string;

  const iniciarSesion = async (email: string) => {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: '123456' })
      .expect(201);
    return respuesta.body;
  };

  const verOrden = async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .expect(200);
    return respuesta.body;
  };

  const crearTrabajo = async (titulo: string, precio?: number) => {
    const respuesta = await request(app.getHttpServer())
      .post('/trabajos')
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ titulo, orden_id: ordenId, asignado_a_id: idMecanico, precio_mano_obra: precio })
      .expect(201);
    return respuesta.body.id;
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
    const mecanico = await iniciarSesion('mecanico@taller.com');
    tokenMecanico = mecanico.access_token;
    idMecanico = mecanico.usuario.id;

    const orden = await request(app.getHttpServer())
      .post('/ordenes')
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({
        descripcion: 'Mantenimiento con cotización',
        fecha_ingreso: '2026-08-09',
        placa: `COT${Date.now().toString().slice(-6)}`,
        marca: 'Toyota',
        modelo: 'Yaris',
        propietario_nombre: 'Cliente de prueba',
        propietario_telefono: '999888777',
      })
      .expect(201);
    ordenId = orden.body.id;
  });

  afterAll(async () => {
    const admin = await iniciarSesion('admin@taller.com');
    await request(app.getHttpServer())
      .delete(`/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${admin.access_token}`);
    await app.close();
  });

  it('un trabajo sin cotizar no mueve el estado de la orden', async () => {
    trabajoSinCotizar = await crearTrabajo('Diagnóstico');
    expect((await verOrden()).estado).toBe('RECIBIDA');
  });

  it('rechaza cargar un repuesto en un trabajo sin cotizar', async () => {
    await request(app.getHttpServer())
      .post(`/repuestos/trabajo/${trabajoSinCotizar}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ descripcion: 'Filtro', cantidad: 1, precio_unitario: 30 })
      .expect(409);
  });

  it('cotizar un trabajo deja la orden COTIZADA', async () => {
    trabajoA = await crearTrabajo('Cambio de aceite', 100);
    expect((await verOrden()).estado).toBe('COTIZADA');
  });

  it('los repuestos suman al total pendiente', async () => {
    await request(app.getHttpServer())
      .post(`/repuestos/trabajo/${trabajoA}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ descripcion: 'Aceite sintético', cantidad: 4, precio_unitario: 25.5 })
      .expect(201);

    expect((await verOrden()).totales).toEqual({ aprobado: 0, pendiente: 202, rechazado: 0 });
  });

  it('un trabajo sin aprobar no se puede mover', async () => {
    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoA}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(409);
  });

  it('no se puede aprobar un trabajo sin cotizar', async () => {
    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}/aprobacion`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ decisiones: [{ trabajo_id: trabajoSinCotizar, aprobado: true }] })
      .expect(409);
  });

  it('la respuesta parcial reparte los totales y deja la orden RECIBIDA', async () => {
    trabajoB = await crearTrabajo('Cambio de bujías', 80);

    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}/aprobacion`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({
        decisiones: [
          { trabajo_id: trabajoA, aprobado: true },
          { trabajo_id: trabajoB, aprobado: false },
        ],
      })
      .expect(200);

    const orden = await verOrden();
    expect(orden.totales).toEqual({ aprobado: 202, pendiente: 0, rechazado: 80 });
    // Aprobar no es empezar: los aprobados siguen PENDIENTE.
    expect(orden.estado).toBe('RECIBIDA');
  });

  it('mover un trabajo aprobado sí avanza la orden', async () => {
    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoA}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(200);

    expect((await verOrden()).estado).toBe('EN_PROCESO');
  });

  it('completar los aprobados finaliza la orden pese al rechazado', async () => {
    await request(app.getHttpServer())
      .patch(`/trabajos/${trabajoA}/estado`)
      .set('Authorization', `Bearer ${tokenMecanico}`)
      .send({ estado: 'COMPLETADO' })
      .expect(200);

    expect((await verOrden()).estado).toBe('FINALIZADA');
  });
});
