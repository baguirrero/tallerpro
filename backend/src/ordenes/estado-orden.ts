import { EstadoOrden, EstadoTrabajo } from '../common/enums/estados.enum';

const TERMINALES: readonly string[] = [EstadoOrden.ENTREGADA, EstadoOrden.CANCELADA];

/**
 * El estado de la orden dentro del taller es función de sus trabajos.
 * Las tres reglas se evalúan en orden, así que una mezcla de pendientes
 * y completados cae en EN_PROCESO.
 *
 * Una orden sin trabajos entra por la primera regla —`[].every()` es `true`—
 * y queda RECIBIDA, que es lo que se busca.
 */
export function derivarEstado(estadosDeTrabajos: string[]): EstadoOrden {
  if (estadosDeTrabajos.every((estado) => estado === EstadoTrabajo.PENDIENTE)) {
    return EstadoOrden.RECIBIDA;
  }
  if (estadosDeTrabajos.every((estado) => estado === EstadoTrabajo.COMPLETADO)) {
    return EstadoOrden.FINALIZADA;
  }
  return EstadoOrden.EN_PROCESO;
}

/** ENTREGADA y CANCELADA no se derivan ni se abandonan: la orden ya cerró. */
export function esTerminal(estado: string): boolean {
  return TERMINALES.includes(estado);
}

export function puedeEntregar(estado: string): boolean {
  return estado === EstadoOrden.FINALIZADA;
}

export function puedeCancelar(estado: string): boolean {
  return !esTerminal(estado);
}
