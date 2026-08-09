import { Mecanico } from './usuario.model';
import { Repuesto } from './repuesto.model';

export interface VehiculoResumen {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
}

export interface OrdenResumen {
  id: string;
  numero_orden: string;
  vehiculo: VehiculoResumen;
}

export interface Trabajo {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: string;
  estado: string;
  fecha_limite?: string;
  precio_mano_obra?: number;
  aprobado?: boolean | null;
  repuestos?: Repuesto[];
  /** Lo calcula la API: mano de obra más repuestos. */
  subtotal?: number;
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
  precio_mano_obra?: number;
}
