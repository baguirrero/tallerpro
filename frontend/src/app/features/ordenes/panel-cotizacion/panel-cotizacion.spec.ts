import { Trabajo } from '../../../core/models/trabajo.model';
import { marcaDe, repuestoValido } from './panel-cotizacion';

function trabajo(parcial: Partial<Trabajo> = {}): Trabajo {
  return {
    id: 't1',
    titulo: 'Cambio de aceite',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    created_at: '2026-08-04',
    ...parcial,
  };
}

describe('marcaDe', () => {
  it('sin precio de mano de obra, está sin cotizar', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: undefined }))).toBe('sin-cotizar');
  });

  it('precio cero sí es un precio: está cotizado', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 0 }))).toBe('esperando');
  });

  it('cotizado y sin respuesta, está esperando', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 120, aprobado: null }))).toBe('esperando');
  });

  it('cotizado y aprobado', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 120, aprobado: true }))).toBe('aprobado');
  });

  it('cotizado y rechazado', () => {
    expect(marcaDe(trabajo({ precio_mano_obra: 120, aprobado: false }))).toBe('rechazado');
  });
});

describe('repuestoValido', () => {
  it('convierte el borrador en la petición', () => {
    expect(
      repuestoValido({ descripcion: '  Filtro  ', cantidad: '2', precio_unitario: '35.5' }),
    ).toEqual({ descripcion: 'Filtro', cantidad: 2, precio_unitario: 35.5 });
  });

  it('precio cero es válido: hay repuestos sin costo', () => {
    expect(repuestoValido({ descripcion: 'Filtro', cantidad: '1', precio_unitario: '0' })).toEqual({
      descripcion: 'Filtro',
      cantidad: 1,
      precio_unitario: 0,
    });
  });

  it('sin descripción, no va', () => {
    expect(repuestoValido({ descripcion: '   ', cantidad: '1', precio_unitario: '10' })).toBeNull();
  });

  it('cantidad cero o negativa, no va', () => {
    expect(
      repuestoValido({ descripcion: 'Filtro', cantidad: '0', precio_unitario: '10' }),
    ).toBeNull();
    expect(
      repuestoValido({ descripcion: 'Filtro', cantidad: '-1', precio_unitario: '10' }),
    ).toBeNull();
  });

  it('cantidad fraccionaria, no va: los repuestos se cuentan en unidades', () => {
    expect(
      repuestoValido({ descripcion: 'Filtro', cantidad: '1.5', precio_unitario: '10' }),
    ).toBeNull();
  });

  it('precio negativo, no va', () => {
    expect(
      repuestoValido({ descripcion: 'Filtro', cantidad: '1', precio_unitario: '-5' }),
    ).toBeNull();
  });

  it('texto que no es número, no va', () => {
    expect(
      repuestoValido({ descripcion: 'Filtro', cantidad: 'dos', precio_unitario: '10' }),
    ).toBeNull();
    expect(
      repuestoValido({ descripcion: 'Filtro', cantidad: '1', precio_unitario: '' }),
    ).toBeNull();
  });
});
