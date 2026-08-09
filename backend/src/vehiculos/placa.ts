/**
 * Una placa se guarda en una sola forma canónica: mayúsculas y solo letras y
 * dígitos. Así `abc-123`, `ABC 123` y `abc123` son el mismo auto. El costo es
 * que se pierde el guion que trae impresa la placa peruana.
 */
export function normalizarPlaca(valor: string): string {
  return valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
