import { calcularTotales, subtotalTrabajo, TrabajoCotizado } from './totales';

describe('subtotalTrabajo', () => {
  it('sin repuestos es la mano de obra', () => {
    expect(subtotalTrabajo({ precio_mano_obra: 120.5 })).toBe(120.5);
  });

  it('suma los repuestos por cantidad', () => {
    expect(
      subtotalTrabajo({
        precio_mano_obra: 100,
        repuestos: [
          { cantidad: 2, precio_unitario: 45.5 },
          { cantidad: 1, precio_unitario: 30 },
        ],
      }),
    ).toBe(221);
  });

  it('acepta mano de obra en cero: una revisión de cortesía con repuestos', () => {
    expect(
      subtotalTrabajo({ precio_mano_obra: 0, repuestos: [{ cantidad: 3, precio_unitario: 12.5 }] }),
    ).toBe(37.5);
  });

  it('un trabajo sin cotizar vale cero aunque tenga repuestos', () => {
    expect(
      subtotalTrabajo({ precio_mano_obra: null, repuestos: [{ cantidad: 1, precio_unitario: 99 }] }),
    ).toBe(0);
  });

  it('redondea a dos decimales', () => {
    expect(
      subtotalTrabajo({ precio_mano_obra: 0.1, repuestos: [{ cantidad: 1, precio_unitario: 0.2 }] }),
    ).toBe(0.3);
  });
});

describe('calcularTotales', () => {
  const trabajos: TrabajoCotizado[] = [
    { precio_mano_obra: 100, aprobado: true, repuestos: [{ cantidad: 1, precio_unitario: 50 }] },
    { precio_mano_obra: 200, aprobado: false },
    { precio_mano_obra: 80, aprobado: null },
    { precio_mano_obra: null, aprobado: null },
  ];

  it('reparte en los tres buckets', () => {
    expect(calcularTotales(trabajos)).toEqual({ aprobado: 150, pendiente: 80, rechazado: 200 });
  });

  it('sin trabajos todo es cero', () => {
    expect(calcularTotales([])).toEqual({ aprobado: 0, pendiente: 0, rechazado: 0 });
  });

  it('los trabajos sin cotizar no suman en ningún bucket', () => {
    expect(calcularTotales([{ precio_mano_obra: null, aprobado: true }])).toEqual({
      aprobado: 0,
      pendiente: 0,
      rechazado: 0,
    });
  });

  it('acumula varios trabajos en el mismo bucket', () => {
    expect(
      calcularTotales([
        { precio_mano_obra: 10.1, aprobado: true },
        { precio_mano_obra: 20.2, aprobado: true },
      ]),
    ).toEqual({ aprobado: 30.3, pendiente: 0, rechazado: 0 });
  });
});
