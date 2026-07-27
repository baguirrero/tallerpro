import { Mecanico } from './usuario.model';

export interface Orden {
  id: string;
  numero_orden: string;
  descripcion: string;
  presupuesto?: number;
  fecha_ingreso: string;
  fecha_entrega?: string;
  estado: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  cliente_nombre: string;
  cliente_telefono: string;
  created_at: string;
  creado_por?: Mecanico;
}

export interface OrdenRequest {
  descripcion: string;
  presupuesto?: number;
  fecha_ingreso: string;
  fecha_entrega?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  cliente_nombre: string;
  cliente_telefono: string;
  estado?: string;
}

export interface EstadisticaEstado {
  estado: string;
  cantidad: number;
}

export interface Estadisticas {
  total: number;
  porEstado: EstadisticaEstado[];
}
