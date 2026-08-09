import { Mecanico } from './usuario.model';
import { Vehiculo } from './vehiculo.model';

export interface Orden {
  id: string;
  numero_orden: string;
  descripcion: string;
  fecha_ingreso: string;
  fecha_entrega?: string;
  estado: string;
  vehiculo: Vehiculo;
  created_at: string;
  creado_por?: Mecanico;
}

export interface OrdenRequest {
  descripcion: string;
  fecha_ingreso: string;
  fecha_entrega?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  propietario_nombre: string;
  propietario_telefono: string;
  /** Confirma pisar los datos de un vehículo ya registrado. */
  actualizar_vehiculo?: boolean;
}

export interface EstadisticaEstado {
  estado: string;
  cantidad: number;
}

export interface Estadisticas {
  total: number;
  porEstado: EstadisticaEstado[];
}
