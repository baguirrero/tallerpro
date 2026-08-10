import { Orden } from '../../../core/models/orden.model';
import { coincide, estadoDesdeUrl } from './lista-ordenes';

function orden(parcial: Partial<Orden> = {}): Orden {
  return {
    id: '1',
    numero_orden: 'ORD-2026-0042',
    descripcion: 'Cambio de aceite',
    fecha_ingreso: '2026-08-04',
    estado: 'EN_PROCESO',
    vehiculo: {
      id: 'v1',
      placa: 'ABC-123',
      marca: 'Toyota',
      modelo: 'Yaris',
      propietario_nombre: 'Juan Pérez',
      propietario_telefono: '987654321',
    },
    totales: { aprobado: 0, pendiente: 0, rechazado: 0 },
    created_at: '2026-08-04',
    ...parcial,
  };
}

describe('estadoDesdeUrl', () => {
  it('acepta un estado del dominio', () => {
    expect(estadoDesdeUrl('COTIZADA')).toBe('COTIZADA');
  });

  it('un estado inventado cae en "todas" en vez de dejar la tabla vacía', () => {
    expect(estadoDesdeUrl('MARTE')).toBe('');
  });

  it('sin parámetro, todas', () => {
    expect(estadoDesdeUrl(null)).toBe('');
  });
});

describe('coincide', () => {
  it('sin texto, pasa todo', () => {
    expect(coincide(orden(), '')).toBe(true);
    expect(coincide(orden(), '   ')).toBe(true);
  });

  it('encuentra por fragmento de placa, sin importar mayúsculas', () => {
    expect(coincide(orden(), 'abc')).toBe(true);
  });

  it('encuentra por número de orden y por propietario', () => {
    expect(coincide(orden(), '0042')).toBe(true);
    expect(coincide(orden(), 'pérez')).toBe(true);
  });

  it('encuentra por marca y modelo', () => {
    expect(coincide(orden(), 'yaris')).toBe(true);
  });

  it('ignora los espacios de los bordes', () => {
    expect(coincide(orden(), '  ABC-123  ')).toBe(true);
  });

  it('el teléfono no se busca: no está en el rótulo de la columna', () => {
    expect(coincide(orden(), '987654321')).toBe(false);
  });

  it('lo que no está, no coincide', () => {
    expect(coincide(orden(), 'nissan')).toBe(false);
  });
});
