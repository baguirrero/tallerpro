
export const ESTADOS_ORDEN = [
  'RECIBIDA',
  'EN_PROCESO',
  'FINALIZADA',
  'ENTREGADA',
  'CANCELADA',
] as const;

export const ESTADOS_TRABAJO = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO'] as const;

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'] as const;

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  JEFE_TALLER: 'Jefe de Taller',
  ASESOR: 'Asesor de Servicio',
  MECANICO: 'Mecánico',
} as const;

export const ETIQUETA_ESTADO_ORDEN: Record<string, string> = {
  RECIBIDA: 'Recibida',
  EN_PROCESO: 'En proceso',
  FINALIZADA: 'Finalizada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
};

export const ETIQUETA_ESTADO_TRABAJO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
};

export const COLOR_ESTADO: Record<string, string> = {
  RECIBIDA: 'secondary',
  EN_PROCESO: 'primary',
  FINALIZADA: 'success',
  ENTREGADA: 'dark',
  CANCELADA: 'danger',
  PENDIENTE: 'secondary',
  COMPLETADO: 'success',
  BAJA: 'light',
  MEDIA: 'info',
  ALTA: 'danger',
};
