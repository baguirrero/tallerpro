import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Espera de repuesto (e2e)', () => {
  let app: INestApplication<App>;
  let tokenJefe: string;
  let tokenMecanico: string;
  let tokenAsesor: string;
  let idMecanico: string;
  let ordenId: string;
  let trabajoId: string;

  const iniciarSesion = async (email: string) => {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: '123456' })
      .expect(201);
    return respuesta.body;
  };

  const laOrden = async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .expect(200);
    return respuesta.body;
  };

  const elTrabajo = async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/trabajos/orden/${ordenId}`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .expect(200);
    return respuesta.body.find((trabajo: any) => trabajo.id === trabajoId);
  };

  const mover = (
    estado: string,
    extra: Record<string, unknown> = {},
    token: string = tokenMecanico,
  ) =>
    request(app.getHttpServer())
      .patch(`/trabajos/${trabajoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado, ...extra });

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
    tokenAsesor = (await iniciarSesion('asesor@taller.com')).access_token;
    const mecanico = await iniciarSesion('mecanico@taller.com');
    tokenMecanico = mecanico.access_token;
    idMecanico = mecanico.usuario.id;

    const orden = await request(app.getHttpServer())
      .post('/ordenes')
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({
        descripcion: 'Trabajo que se traba esperando una pieza',
        fecha_ingreso: '2026-08-09',
        placa: `ESP${Date.now().toString().slice(-6)}`,
        marca: 'Nissan',
        modelo: 'Sentra',
        propietario_nombre: 'Cliente de prueba',
        propietario_telefono: '999111222',
      })
      .expect(201);
    ordenId = orden.body.id;

    const trabajo = await request(app.getHttpServer())
      .post('/trabajos')
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({
        titulo: 'Cambio de embrague',
        orden_id: ordenId,
        asignado_a_id: idMecanico,
        precio_mano_obra: 350,
      })
      .expect(201);
    trabajoId = trabajo.body.id;
  });

  afterAll(async () => {
    const admin = await iniciarSesion('admin@taller.com');
    await request(app.getHttpServer())
      .delete(`/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${admin.access_token}`);
    await app.close();
  });

  it('un trabajo sin aprobar no se puede iniciar', async () => {
    await mover('EN_PROCESO').expect(409);
  });

  it('la aprobación del cliente lo desbloquea', async () => {
    await request(app.getHttpServer())
      .patch(`/ordenes/${ordenId}/aprobacion`)
      .set('Authorization', `Bearer ${tokenJefe}`)
      .send({ decisiones: [{ trabajo_id: trabajoId, aprobado: true }] })
      .expect(200);
  });

  it('un trabajo pendiente no puede saltar a la espera', async () => {
    await mover('ESPERANDO_REPUESTO', { motivo_espera: 'Kit de embrague' }).expect(409);
  });

  it('iniciarlo deja la orden EN_PROCESO', async () => {
    await mover('EN_PROCESO').expect(200);
    expect((await laOrden()).estado).toBe('EN_PROCESO');
  });

  it('mandarlo a la espera sin decir qué se espera es 400', async () => {
    await mover('ESPERANDO_REPUESTO').expect(400);
  });

  it('con motivo, la orden entera pasa a ESPERANDO_REPUESTO', async () => {
    await mover('ESPERANDO_REPUESTO', { motivo_espera: 'Kit de embrague Valeo' }).expect(200);

    expect((await laOrden()).estado).toBe('ESPERANDO_REPUESTO');
    expect((await elTrabajo()).motivo_espera).toBe('Kit de embrague Valeo');
  });

  it('no se puede completar un trabajo que espera una pieza', async () => {
    await mover('COMPLETADO').expect(409);
  });

  it('quien no tiene el trabajo asignado no lo puede retomar', async () => {
    await mover('EN_PROCESO', {}, tokenAsesor).expect(403);
  });

  it('retomarlo limpia el motivo y devuelve la orden a EN_PROCESO', async () => {
    await mover('EN_PROCESO').expect(200);

    expect((await elTrabajo()).motivo_espera).toBeNull();
    expect((await laOrden()).estado).toBe('EN_PROCESO');
  });

  it('mandar un motivo hacia un destino que no es la espera es 400', async () => {
    await mover('COMPLETADO', { motivo_espera: 'sobra' }).expect(400);
  });

  it('completarlo finaliza la orden', async () => {
    await mover('COMPLETADO').expect(200);
    expect((await laOrden()).estado).toBe('FINALIZADA');
  });
});
