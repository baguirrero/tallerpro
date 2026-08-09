import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Vehículo y historial (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let vehiculoId: string;
  const ordenesCreadas: string[] = [];

  const placa = `E2E${Date.now().toString().slice(-6)}`;

  const ordenBase = {
    descripcion: 'Mantenimiento preventivo',
    fecha_ingreso: '2026-08-08',
    marca: 'Toyota',
    modelo: 'Yaris',
    anio: 2021,
    propietario_nombre: 'Rosa Delgado',
    propietario_telefono: '987654321',
  };

  const crearOrden = (cuerpo: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/ordenes')
      .set('Authorization', `Bearer ${token}`)
      .send(cuerpo);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const sesion = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'jefe@taller.com', password: '123456' })
      .expect(201);
    token = sesion.body.access_token;
  });

  afterAll(async () => {
    const admin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@taller.com', password: '123456' });

    for (const id of ordenesCreadas) {
      await request(app.getHttpServer())
        .delete(`/ordenes/${id}`)
        .set('Authorization', `Bearer ${admin.body.access_token}`);
    }
    await app.close();
  });

  it('una placa nueva crea el vehículo y lo normaliza', async () => {
    const respuesta = await crearOrden({ ...ordenBase, placa: `${placa}-x` }).expect(201);

    ordenesCreadas.push(respuesta.body.id);
    vehiculoId = respuesta.body.vehiculo.id;

    expect(respuesta.body.vehiculo.placa).toBe(`${placa}X`);
    expect(respuesta.body.vehiculo.propietario_nombre).toBe('Rosa Delgado');
  });

  it('la busca por placa sin importar el formato que se escriba', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/vehiculos/placa/${placa.toLowerCase()}-x`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body.id).toBe(vehiculoId);
  });

  it('una segunda orden con la misma placa reutiliza el vehículo', async () => {
    const respuesta = await crearOrden({ ...ordenBase, placa: `${placa}X` }).expect(201);

    ordenesCreadas.push(respuesta.body.id);
    expect(respuesta.body.vehiculo.id).toBe(vehiculoId);
  });

  it('datos distintos responden 409 con el detalle y no pisan nada', async () => {
    const respuesta = await crearOrden({
      ...ordenBase,
      placa: `${placa}X`,
      modelo: 'Corolla',
      propietario_nombre: 'Juan Pérez',
    }).expect(409);

    expect(respuesta.body.diferencias).toEqual(
      expect.arrayContaining([
        { campo: 'modelo', guardado: 'Yaris', enviado: 'Corolla' },
        { campo: 'propietario_nombre', guardado: 'Rosa Delgado', enviado: 'Juan Pérez' },
      ]),
    );

    const sinCambios = await request(app.getHttpServer())
      .get(`/vehiculos/${vehiculoId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(sinCambios.body.modelo).toBe('Yaris');
  });

  it('con actualizar_vehiculo el cambio sí se aplica', async () => {
    const respuesta = await crearOrden({
      ...ordenBase,
      placa: `${placa}X`,
      modelo: 'Corolla',
      actualizar_vehiculo: true,
    }).expect(201);

    ordenesCreadas.push(respuesta.body.id);
    expect(respuesta.body.vehiculo.modelo).toBe('Corolla');
  });

  it('la ficha del vehículo trae su historial completo', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/vehiculos/${vehiculoId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body.ordenes).toHaveLength(3);
    expect(respuesta.body.ordenes[0].numero_orden).toMatch(/^ORD-\d{6,}$/);
  });
});
