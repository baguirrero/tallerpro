export const SECUENCIA_NUMERO_ORDEN = 'ordenes_numero_seq';

export function formatearNumeroOrden(valor: number): string {
  return `ORD-${String(valor).padStart(6, '0')}`;
}
