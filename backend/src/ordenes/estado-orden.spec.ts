import { EstadoOrden, EstadoTrabajo } from '../common/enums/estados.enum';
import { derivarEstado, esTerminal, puedeCancelar, puedeEntregar } from './estado-orden';

const { PENDIENTE, EN_PROCESO, COMPLETADO } = EstadoTrabajo;

describe('derivarEstado', () => {
  const pendiente = (extra = {}) => ({ estado: EstadoTrabajo.PENDIENTE, ...extra });
  const enProceso = (extra = {}) => ({ estado: EstadoTrabajo.EN_PROCESO, ...extra });
  const completado = (extra = {}) => ({ estado: EstadoTrabajo.COMPLETADO, ...extra });
  const esperando = (extra = {}) => ({ estado: EstadoTrabajo.ESPERANDO_REPUESTO, ...extra });
  const aprobado = { precio_mano_obra: 100, aprobado: true };
  const rechazado = { precio_mano_obra: 100, aprobado: false };
  const sinResponder = { precio_mano_obra: 100, aprobado: null };
  const sinCotizar = { precio_mano_obra: null, aprobado: null };

  it('una orden sin trabajos queda RECIBIDA', () => {
    expect(derivarEstado([])).toBe(EstadoOrden.RECIBIDA);
  });

  it('con trabajos sin cotizar sigue RECIBIDA: el jefe está armando la cotización', () => {
    expect(derivarEstado([pendiente(sinCotizar), pendiente(sinCotizar)])).toBe(
      EstadoOrden.RECIBIDA,
    );
  });

  it('con un trabajo cotizado esperando respuesta pasa a COTIZADA', () => {
    expect(derivarEstado([pendiente(sinResponder)])).toBe(EstadoOrden.COTIZADA);
  });

  it('COTIZADA gana aunque ya haya trabajos aprobados avanzando', () => {
    expect(derivarEstado([enProceso(aprobado), pendiente(sinResponder)])).toBe(
      EstadoOrden.COTIZADA,
    );
  });

  it('con todo aprobado y nada empezado vuelve a RECIBIDA', () => {
    expect(derivarEstado([pendiente(aprobado), pendiente(aprobado)])).toBe(EstadoOrden.RECIBIDA);
  });

  it('con un aprobado en proceso pasa a EN_PROCESO', () => {
    expect(derivarEstado([enProceso(aprobado), pendiente(aprobado)])).toBe(EstadoOrden.EN_PROCESO);
  });

  it('con parte aprobada completada y parte pendiente sigue EN_PROCESO', () => {
    expect(derivarEstado([completado(aprobado), pendiente(aprobado)])).toBe(
      EstadoOrden.EN_PROCESO,
    );
  });

  it('con todos los aprobados completados pasa a FINALIZADA', () => {
    expect(derivarEstado([completado(aprobado), completado(aprobado)])).toBe(
      EstadoOrden.FINALIZADA,
    );
  });

  it('un trabajo rechazado no impide finalizar', () => {
    expect(derivarEstado([completado(aprobado), pendiente(rechazado)])).toBe(
      EstadoOrden.FINALIZADA,
    );
  });

  it('si el cliente rechaza todo, vuelve a RECIBIDA', () => {
    expect(derivarEstado([pendiente(rechazado), pendiente(rechazado)])).toBe(EstadoOrden.RECIBIDA);
  });

  it('un trabajo sin cotizar no impide finalizar los aprobados', () => {
    expect(derivarEstado([completado(aprobado), pendiente(sinCotizar)])).toBe(
      EstadoOrden.FINALIZADA,
    );
  });

  it('con todos los aprobados esperando pieza, la orden espera pieza', () => {
    expect(derivarEstado([esperando(aprobado), esperando(aprobado)])).toBe(
      EstadoOrden.ESPERANDO_REPUESTO,
    );
  });

  it('basta un aprobado en proceso para que la orden siga EN_PROCESO', () => {
    expect(derivarEstado([esperando(aprobado), enProceso(aprobado)])).toBe(
      EstadoOrden.EN_PROCESO,
    );
  });

  it('esperando junto a uno completado sigue siendo espera: nada avanza', () => {
    expect(derivarEstado([esperando(aprobado), completado(aprobado)])).toBe(
      EstadoOrden.ESPERANDO_REPUESTO,
    );
  });

  it('esperando junto a uno pendiente también es espera', () => {
    expect(derivarEstado([esperando(aprobado), pendiente(aprobado)])).toBe(
      EstadoOrden.ESPERANDO_REPUESTO,
    );
  });

  it('un trabajo rechazado esperando pieza no arrastra a la orden', () => {
    expect(derivarEstado([completado(aprobado), esperando(rechazado)])).toBe(
      EstadoOrden.FINALIZADA,
    );
  });

  it('un cotizado sin respuesta le gana a la espera', () => {
    expect(derivarEstado([esperando(aprobado), pendiente(sinResponder)])).toBe(
      EstadoOrden.COTIZADA,
    );
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

  it('esperar una pieza no es terminal', () => {
    expect(esTerminal(EstadoOrden.ESPERANDO_REPUESTO)).toBe(false);
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

  it('no se entrega un auto que todavía espera una pieza', () => {
    expect(puedeEntregar(EstadoOrden.ESPERANDO_REPUESTO)).toBe(false);
  });
});

describe('puedeCancelar', () => {
  it('se cancela desde cualquier estado no terminal', () => {
    expect(puedeCancelar(EstadoOrden.RECIBIDA)).toBe(true);
    expect(puedeCancelar(EstadoOrden.EN_PROCESO)).toBe(true);
    expect(puedeCancelar(EstadoOrden.FINALIZADA)).toBe(true);
  });

  it('una orden cotizada se puede cancelar', () => {
    expect(puedeCancelar(EstadoOrden.COTIZADA)).toBe(true);
  });

  it('una orden esperando repuesto se puede cancelar', () => {
    expect(puedeCancelar(EstadoOrden.ESPERANDO_REPUESTO)).toBe(true);
  });

  it('no se cancela lo que ya es terminal', () => {
    expect(puedeCancelar(EstadoOrden.ENTREGADA)).toBe(false);
    expect(puedeCancelar(EstadoOrden.CANCELADA)).toBe(false);
  });
});
