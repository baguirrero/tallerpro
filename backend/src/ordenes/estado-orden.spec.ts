import { EstadoOrden, EstadoTrabajo } from '../common/enums/estados.enum';
import { derivarEstado, esTerminal, puedeCancelar, puedeEntregar } from './estado-orden';

const { PENDIENTE, EN_PROCESO, COMPLETADO } = EstadoTrabajo;

describe('derivarEstado', () => {
  it('una orden sin trabajos queda RECIBIDA', () => {
    expect(derivarEstado([])).toBe(EstadoOrden.RECIBIDA);
  });

  it('con todos los trabajos pendientes queda RECIBIDA', () => {
    expect(derivarEstado([PENDIENTE, PENDIENTE])).toBe(EstadoOrden.RECIBIDA);
  });

  it('con algún trabajo en proceso pasa a EN_PROCESO', () => {
    expect(derivarEstado([PENDIENTE, EN_PROCESO])).toBe(EstadoOrden.EN_PROCESO);
  });

  it('con parte completada y parte sin empezar sigue EN_PROCESO', () => {
    expect(derivarEstado([PENDIENTE, COMPLETADO])).toBe(EstadoOrden.EN_PROCESO);
  });

  it('con todos los trabajos completados pasa a FINALIZADA', () => {
    expect(derivarEstado([COMPLETADO, COMPLETADO])).toBe(EstadoOrden.FINALIZADA);
  });

  it('con un único trabajo completado pasa a FINALIZADA', () => {
    expect(derivarEstado([COMPLETADO])).toBe(EstadoOrden.FINALIZADA);
  });
});

describe('esTerminal', () => {
  it('ENTREGADA y CANCELADA son terminales', () => {
    expect(esTerminal(EstadoOrden.ENTREGADA)).toBe(true);
    expect(esTerminal(EstadoOrden.CANCELADA)).toBe(true);
  });

  it('los estados de taller no son terminales', () => {
    expect(esTerminal(EstadoOrden.RECIBIDA)).toBe(false);
    expect(esTerminal(EstadoOrden.EN_PROCESO)).toBe(false);
    expect(esTerminal(EstadoOrden.FINALIZADA)).toBe(false);
  });
});

describe('puedeEntregar', () => {
  it('solo se entrega desde FINALIZADA', () => {
    expect(puedeEntregar(EstadoOrden.FINALIZADA)).toBe(true);
  });

  it('no se entrega desde ningún otro estado', () => {
    expect(puedeEntregar(EstadoOrden.RECIBIDA)).toBe(false);
    expect(puedeEntregar(EstadoOrden.EN_PROCESO)).toBe(false);
    expect(puedeEntregar(EstadoOrden.ENTREGADA)).toBe(false);
    expect(puedeEntregar(EstadoOrden.CANCELADA)).toBe(false);
  });
});

describe('puedeCancelar', () => {
  it('se cancela desde cualquier estado no terminal', () => {
    expect(puedeCancelar(EstadoOrden.RECIBIDA)).toBe(true);
    expect(puedeCancelar(EstadoOrden.EN_PROCESO)).toBe(true);
    expect(puedeCancelar(EstadoOrden.FINALIZADA)).toBe(true);
  });

  it('no se cancela lo que ya es terminal', () => {
    expect(puedeCancelar(EstadoOrden.ENTREGADA)).toBe(false);
    expect(puedeCancelar(EstadoOrden.CANCELADA)).toBe(false);
  });
});
