import { EstadoTrabajo } from '../common/enums/estados.enum';

/**
 * El Kanban dejó de ser una línea. La espera de un repuesto es un **desvío** que
 * cuelga de EN_PROCESO: se entra desde ahí y se vuelve ahí.
 *
 * Que no sea una etapa intermedia es lo que hace útil a la columna. Si
 * completar obligara a atravesarla, todos los trabajos pasarían por "esperando
 * repuesto" y el conteo dejaría de significar "trancados".
 *
 * El orden de cada lista es el orden en que el frontend dibuja los botones.
 */
export const TRANSICIONES: Record<string, EstadoTrabajo[]> = {
  [EstadoTrabajo.PENDIENTE]: [EstadoTrabajo.EN_PROCESO],
  [EstadoTrabajo.EN_PROCESO]: [
    EstadoTrabajo.ESPERANDO_REPUESTO,
    EstadoTrabajo.COMPLETADO,
    EstadoTrabajo.PENDIENTE,
  ],
  [EstadoTrabajo.ESPERANDO_REPUESTO]: [EstadoTrabajo.EN_PROCESO],
  [EstadoTrabajo.COMPLETADO]: [EstadoTrabajo.EN_PROCESO],
};

/**
 * Quedarse en el mismo estado no es una transición: un PATCH que no cambia nada
 * es un error del llamador, no una operación idempotente que valga aceptar en
 * silencio. Un estado desconocido tampoco tiene salidas.
 */
export function transicionValida(desde: string, hacia: string): boolean {
  return (TRANSICIONES[desde] ?? []).includes(hacia as EstadoTrabajo);
}
