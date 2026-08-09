import { Totales } from './repuesto.model';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  propietario_nombre: string;
  propietario_telefono: string;
}

export interface OrdenDelHistorial {
  id: string;
  numero_orden: string;
  descripcion: string;
  estado: string;
  fecha_ingreso: string;
  fecha_entrega?: string;
  totales: Totales;
}

export interface VehiculoConHistorial extends Vehiculo {
  ordenes: OrdenDelHistorial[];
}

/** Lo que devuelve la API en el 409 cuando la placa ya existe con otros datos. */
export interface Diferencia {
  campo: string;
  guardado: unknown;
  enviado: unknown;
}
