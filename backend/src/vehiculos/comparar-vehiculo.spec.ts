import { compararVehiculo, DatosVehiculo } from './comparar-vehiculo';

const guardado: DatosVehiculo = {
  marca: 'Toyota',
  modelo: 'Yaris',
  anio: 2021,
  propietario_nombre: 'Rosa Delgado',
  propietario_telefono: '987654321',
};

describe('compararVehiculo', () => {
  it('sin cambios no devuelve diferencias', () => {
    expect(compararVehiculo(guardado, { ...guardado })).toEqual([]);
  });

  it('detecta un campo distinto', () => {
    expect(compararVehiculo(guardado, { ...guardado, modelo: 'Corolla' })).toEqual([
      { campo: 'modelo', guardado: 'Yaris', enviado: 'Corolla' },
    ]);
  });

  it('detecta varios campos distintos', () => {
    const diferencias = compararVehiculo(guardado, {
      ...guardado,
      modelo: 'Corolla',
      propietario_nombre: 'Juan Pérez',
    });

    expect(diferencias).toHaveLength(2);
    expect(diferencias.map((d) => d.campo)).toEqual(['modelo', 'propietario_nombre']);
  });

  it('un campo ausente no cuenta como diferencia', () => {
    // El asesor dejó el año vacío: eso no significa "bórrale el año al vehículo".
    expect(compararVehiculo(guardado, { marca: 'Toyota' })).toEqual([]);
  });

  it('un año nuevo sobre un vehículo sin año sí es diferencia', () => {
    expect(compararVehiculo({ ...guardado, anio: null }, { anio: 2021 })).toEqual([
      { campo: 'anio', guardado: null, enviado: 2021 },
    ]);
  });

  it('nunca compara la placa: es la identidad', () => {
    const enviado = { ...guardado, placa: 'OTRA999' } as Partial<DatosVehiculo>;
    expect(compararVehiculo(guardado, enviado)).toEqual([]);
  });
});
