export interface Repuesto {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface RepuestoRequest {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

/**
 * Tres cifras en vez de un total ambiguo: lo aprobado es lo que el cliente va
 * a pagar, lo pendiente lo que todavía no responde, lo rechazado lo que dijo
 * que no. Las calcula la API.
 */
export interface Totales {
  aprobado: number;
  pendiente: number;
  rechazado: number;
}
