import { EstadoOrden, EstadoTrabajo } from '../common/enums/estados.enum';

const TERMINALES: readonly string[] = [EstadoOrden.ENTREGADA, EstadoOrden.CANCELADA];

export interface TrabajoParaDerivar {
  estado: string;
  precio_mano_obra?: number | null;
  aprobado?: boolean | null;
}

/**
 * El estado de la orden dentro del taller es función de sus trabajos: desde la
 * fase 2 también de si el cliente respondió, y desde la 2b de si alguno está
 * trancado esperando una pieza.
 *
 * Solo los trabajos aprobados participan del avance: uno rechazado no impide
 * finalizar, y uno sin cotizar tampoco, porque el jefe todavía está armando la
 * cotización.
 */
export function derivarEstado(trabajos: TrabajoParaDerivar[]): EstadoOrden {
  if (trabajos.length === 0) return EstadoOrden.RECIBIDA;

  const esperandoRespuesta = trabajos.some(
    (trabajo) => trabajo.precio_mano_obra != null && trabajo.aprobado == null,
  );
  if (esperandoRespuesta) return EstadoOrden.COTIZADA;

  const aprobados = trabajos.filter((trabajo) => trabajo.aprobado === true);
  if (aprobados.length === 0) return EstadoOrden.RECIBIDA;

  if (aprobados.every((trabajo) => trabajo.estado === EstadoTrabajo.PENDIENTE)) {
    return EstadoOrden.RECIBIDA;
  }

  // Nada avanza y algo espera una pieza. Basta un aprobado EN_PROCESO para que
  // la orden vuelva a reportarse en proceso: el taller sí está metido en ese
  // auto, aunque otra cosa esté trancada.
  const alguienTrabajando = aprobados.some(
    (trabajo) => trabajo.estado === EstadoTrabajo.EN_PROCESO,
  );
  const algunaEspera = aprobados.some(
    (trabajo) => trabajo.estado === EstadoTrabajo.ESPERANDO_REPUESTO,
  );
  if (!alguienTrabajando && algunaEspera) {
    return EstadoOrden.ESPERANDO_REPUESTO;
  }

  if (aprobados.every((trabajo) => trabajo.estado === EstadoTrabajo.COMPLETADO)) {
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
