
export const ESTADOS_ORDEN = [
  'RECIBIDA',
  'COTIZADA',
  'EN_PROCESO',
  'ESPERANDO_REPUESTO',
  'FINALIZADA',
  'ENTREGADA',
  'CANCELADA',
] as const;

/** El orden de las columnas del Kanban. Ya no es un eje por el que se avanza de
 *  a un paso: el movimiento lo describe TRANSICIONES_TRABAJO. */
export const ESTADOS_TRABAJO = [
  'PENDIENTE',
  'EN_PROCESO',
  'ESPERANDO_REPUESTO',
  'COMPLETADO',
] as const;

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'] as const;

/**
 * La misma tabla que `backend/src/trabajos/transiciones.ts`. Acá decide qué
 * botones se dibujan; la autoridad sigue siendo el 409 de la API, igual que la
 * matriz de roles del `rolesGuard` es UX y no seguridad.
 *
 * El orden de cada lista es el orden de los botones en la tarjeta.
 */
export const TRANSICIONES_TRABAJO: Record<string, string[]> = {
  PENDIENTE: ['EN_PROCESO'],
  EN_PROCESO: ['ESPERANDO_REPUESTO', 'COMPLETADO', 'PENDIENTE'],
  ESPERANDO_REPUESTO: ['EN_PROCESO'],
  COMPLETADO: ['EN_PROCESO'],
};

/** Una acción por arista: el mecánico lee qué va a pasar, no deduce una flecha. */
export const ACCION_TRANSICION: Record<string, string> = {
  'PENDIENTE->EN_PROCESO': 'Iniciar',
  'EN_PROCESO->ESPERANDO_REPUESTO': '⏸ Esperar repuesto',
  'EN_PROCESO->COMPLETADO': 'Completar',
  'EN_PROCESO->PENDIENTE': '← Devolver a pendiente',
  'ESPERANDO_REPUESTO->EN_PROCESO': '▶ Retomar',
  'COMPLETADO->EN_PROCESO': '← Reabrir',
};

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  JEFE_TALLER: 'Jefe de Taller',
  ASESOR: 'Asesor de Servicio',
  MECANICO: 'Mecánico',
} as const;

export const ETIQUETA_ESTADO_ORDEN: Record<string, string> = {
  RECIBIDA: 'Recibida',
  COTIZADA: 'Cotizada',
  EN_PROCESO: 'En proceso',
  ESPERANDO_REPUESTO: 'Esperando repuesto',
  FINALIZADA: 'Finalizada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
};

export const ETIQUETA_ESTADO_TRABAJO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  ESPERANDO_REPUESTO: 'Esperando repuesto',
  COMPLETADO: 'Completado',
};

export const COLOR_ESTADO: Record<string, string> = {
  RECIBIDA: 'secondary',
  // Celeste, no ámbar: que el cliente todavía no responda no es una alarma del
  // taller. El ámbar queda para lo que está trancado.
  COTIZADA: 'info',
  EN_PROCESO: 'primary',
  ESPERANDO_REPUESTO: 'warning',
  FINALIZADA: 'success',
  ENTREGADA: 'dark',
  CANCELADA: 'danger',
  PENDIENTE: 'secondary',
  COMPLETADO: 'success',
  BAJA: 'light',
  MEDIA: 'info',
  ALTA: 'danger',
};
