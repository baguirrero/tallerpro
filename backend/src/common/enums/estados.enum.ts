export enum EstadoOrden {
  RECIBIDA = 'RECIBIDA',
  COTIZADA = 'COTIZADA',
  EN_PROCESO = 'EN_PROCESO',
  ESPERANDO_REPUESTO = 'ESPERANDO_REPUESTO',
  FINALIZADA = 'FINALIZADA',
  ENTREGADA = 'ENTREGADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoTrabajo {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  ESPERANDO_REPUESTO = 'ESPERANDO_REPUESTO',
  COMPLETADO = 'COMPLETADO',
}

export enum Prioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum NombreRol {
  ADMINISTRADOR = 'Administrador',
  JEFE_TALLER = 'Jefe de Taller',
  ASESOR = 'Asesor de Servicio',
  MECANICO = 'Mecánico',
}
