export interface DatosVehiculo {
  marca: string;
  modelo: string;
  anio?: number | null;
  propietario_nombre: string;
  propietario_telefono: string;
}

export interface Diferencia {
  campo: string;
  guardado: unknown;
  enviado: unknown;
}

// `placa` queda fuera a propósito: es la identidad con la que se encontró el
// registro, no un dato que pueda estar en conflicto consigo mismo.
const CAMPOS_COMPARABLES: (keyof DatosVehiculo)[] = [
  'marca',
  'modelo',
  'anio',
  'propietario_nombre',
  'propietario_telefono',
];

/**
 * Devuelve qué campos del vehículo guardado difieren de los enviados.
 * Un campo ausente en `enviado` no se compara: significa "no opino", no
 * "bórralo".
 */
export function compararVehiculo(
  guardado: DatosVehiculo,
  enviado: Partial<DatosVehiculo>,
): Diferencia[] {
  return CAMPOS_COMPARABLES.filter((campo) => enviado[campo] !== undefined)
    .filter((campo) => guardado[campo] !== enviado[campo])
    .map((campo) => ({ campo, guardado: guardado[campo], enviado: enviado[campo] }));
}
