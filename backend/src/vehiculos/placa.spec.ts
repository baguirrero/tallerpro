import { normalizarPlaca } from './placa';

describe('normalizarPlaca', () => {
  it('pasa a mayúsculas', () => {
    expect(normalizarPlaca('abc123')).toBe('ABC123');
  });

  it('descarta el guion de la placa peruana', () => {
    expect(normalizarPlaca('ABC-123')).toBe('ABC123');
  });

  it('descarta espacios internos y externos', () => {
    expect(normalizarPlaca('  abc 123  ')).toBe('ABC123');
  });

  it('descarta cualquier separador, no solo guiones y espacios', () => {
    expect(normalizarPlaca('a.b/c-1_2 3')).toBe('ABC123');
  });

  it('deja igual una placa que ya está normalizada', () => {
    expect(normalizarPlaca('ABC123')).toBe('ABC123');
  });

  it('con una cadena vacía devuelve vacío', () => {
    expect(normalizarPlaca('')).toBe('');
  });
});
