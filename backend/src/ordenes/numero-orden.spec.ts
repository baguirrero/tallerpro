import { formatearNumeroOrden } from './numero-orden';

describe('formatearNumeroOrden', () => {
  it('rellena con ceros hasta seis dígitos', () => {
    expect(formatearNumeroOrden(1)).toBe('ORD-000001');
    expect(formatearNumeroOrden(42)).toBe('ORD-000042');
  });

  it('no trunca cuando el número supera los seis dígitos', () => {
    expect(formatearNumeroOrden(1234567)).toBe('ORD-1234567');
  });

  it('cabe en los 20 caracteres de la columna', () => {
    expect(formatearNumeroOrden(999999).length).toBeLessThanOrEqual(20);
  });
});
