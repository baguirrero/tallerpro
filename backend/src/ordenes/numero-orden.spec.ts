import { formatearNumeroOrden } from './numero-orden';

describe('formatearNumeroOrden', () => {
  it('rellena con ceros hasta seis dígitos', () => {
    expect(formatearNumeroOrden(1)).toBe('ORD-000001');
    expect(formatearNumeroOrden(42)).toBe('ORD-000042');
  });

  it('no trunca cuando el número supera los seis dígitos', () => {
    expect(formatearNumeroOrden(1234567)).toBe('ORD-1234567');
  });

  // 'ORD-' ocupa 4 caracteres y el entero más grande que JavaScript representa
  // con exactitud tiene 16 dígitos: 20 justos, el ancho de la columna. Ninguna
  // secuencia real llega hasta ahí, así que el correlativo nunca la desborda.
  it('el mayor correlativo representable llena la columna sin pasarse', () => {
    expect(formatearNumeroOrden(Number.MAX_SAFE_INTEGER)).toBe('ORD-9007199254740991');
    expect(formatearNumeroOrden(Number.MAX_SAFE_INTEGER)).toHaveLength(20);
  });
});
