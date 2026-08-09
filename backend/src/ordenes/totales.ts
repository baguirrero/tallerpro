export interface LineaRepuesto {
  cantidad: number;
  precio_unitario: number;
}

export interface TrabajoCotizado {
  precio_mano_obra?: number | null;
  aprobado?: boolean | null;
  repuestos?: LineaRepuesto[];
}

export interface Totales {
  aprobado: number;
  pendiente: number;
  rechazado: number;
}

/** Dos decimales, para que sumar dinero no arrastre el error del punto flotante. */
function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Mano de obra más repuestos. Un trabajo sin cotizar vale cero: sus repuestos
 * no cuentan hasta que alguien le ponga precio de mano de obra, aunque sea 0.
 */
export function subtotalTrabajo(trabajo: TrabajoCotizado): number {
  if (trabajo.precio_mano_obra == null) return 0;

  const repuestos = (trabajo.repuestos ?? []).reduce(
    (suma, repuesto) => suma + repuesto.cantidad * repuesto.precio_unitario,
    0,
  );

  return redondear(trabajo.precio_mano_obra + repuestos);
}

/**
 * Tres cifras en vez de un total ambiguo: `aprobado` es lo que el cliente va a
 * pagar, `pendiente` lo que todavía no responde, `rechazado` lo que dijo que no.
 */
export function calcularTotales(trabajos: TrabajoCotizado[]): Totales {
  const totales: Totales = { aprobado: 0, pendiente: 0, rechazado: 0 };

  for (const trabajo of trabajos) {
    if (trabajo.precio_mano_obra == null) continue;

    const subtotal = subtotalTrabajo(trabajo);

    if (trabajo.aprobado === true) totales.aprobado += subtotal;
    else if (trabajo.aprobado === false) totales.rechazado += subtotal;
    else totales.pendiente += subtotal;
  }

  return {
    aprobado: redondear(totales.aprobado),
    pendiente: redondear(totales.pendiente),
    rechazado: redondear(totales.rechazado),
  };
}
