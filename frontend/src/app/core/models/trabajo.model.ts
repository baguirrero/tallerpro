import { Mecanico } from './usuario.model';

export interface OrdenResumen {
  id: string;
  numero_orden: string;
  placa: string;
  marca: string;
  modelo: string;
}

export interface Trabajo {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: string;
  estado: string;
  fecha_limite?: string;
  created_at: string;
  asignado_a?: Mecanico;
  creado_por?: Mecanico;
  orden?: OrdenResumen;
}

export interface TrabajoRequest {
  titulo: string;
  descripcion?: string;
  prioridad?: string;
  fecha_limite?: string;
  orden_id: string;
  asignado_a_id?: string;
}
