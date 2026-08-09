import { EstadoTrabajo } from '../common/enums/estados.enum';
import { TRANSICIONES, transicionValida } from './transiciones';

const { PENDIENTE, EN_PROCESO, ESPERANDO_REPUESTO, COMPLETADO } = EstadoTrabajo;

describe('transicionValida', () => {
  it('de PENDIENTE solo se puede empezar', () => {
    expect(transicionValida(PENDIENTE, EN_PROCESO)).toBe(true);
    expect(transicionValida(PENDIENTE, COMPLETADO)).toBe(false);
  });

  it('no se puede declarar en espera un trabajo que nunca arrancó', () => {
    expect(transicionValida(PENDIENTE, ESPERANDO_REPUESTO)).toBe(false);
  });

  it('de EN_PROCESO salen las tres aristas', () => {
    expect(transicionValida(EN_PROCESO, ESPERANDO_REPUESTO)).toBe(true);
    expect(transicionValida(EN_PROCESO, COMPLETADO)).toBe(true);
    expect(transicionValida(EN_PROCESO, PENDIENTE)).toBe(true);
  });

  it('de la espera solo se vuelve a EN_PROCESO', () => {
    expect(transicionValida(ESPERANDO_REPUESTO, EN_PROCESO)).toBe(true);
    expect(transicionValida(ESPERANDO_REPUESTO, PENDIENTE)).toBe(false);
  });

  it('no se puede completar un trabajo que espera una pieza', () => {
    expect(transicionValida(ESPERANDO_REPUESTO, COMPLETADO)).toBe(false);
  });

  it('un trabajo completado solo se puede reabrir', () => {
    expect(transicionValida(COMPLETADO, EN_PROCESO)).toBe(true);
    expect(transicionValida(COMPLETADO, PENDIENTE)).toBe(false);
    expect(transicionValida(COMPLETADO, ESPERANDO_REPUESTO)).toBe(false);
  });

  it('quedarse en el mismo estado no es una transición válida', () => {
    expect(transicionValida(PENDIENTE, PENDIENTE)).toBe(false);
    expect(transicionValida(EN_PROCESO, EN_PROCESO)).toBe(false);
    expect(transicionValida(ESPERANDO_REPUESTO, ESPERANDO_REPUESTO)).toBe(false);
    expect(transicionValida(COMPLETADO, COMPLETADO)).toBe(false);
  });

  it('un estado desconocido no tiene destinos', () => {
    expect(transicionValida('INVENTADO', EN_PROCESO)).toBe(false);
  });
});

describe('TRANSICIONES', () => {
  it('describe seis aristas', () => {
    expect(Object.values(TRANSICIONES).flat()).toHaveLength(6);
  });

  it('todos los estados tienen al menos una salida: ninguno es terminal', () => {
    for (const estado of Object.values(EstadoTrabajo)) {
      expect(TRANSICIONES[estado].length).toBeGreaterThan(0);
    }
  });

  it('todo destino es un estado conocido', () => {
    const conocidos = Object.values(EstadoTrabajo);
    for (const destinos of Object.values(TRANSICIONES)) {
      for (const destino of destinos) {
        expect(conocidos).toContain(destino);
      }
    }
  });
});
