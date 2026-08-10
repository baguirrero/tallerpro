import { motivoLimpio } from './tablero-kanban';

describe('motivoLimpio', () => {
  it('devuelve el texto sin espacios en los bordes', () => {
    expect(motivoLimpio('  pastillas de freno  ')).toBe('pastillas de freno');
  });

  it('un motivo vacío no es un motivo', () => {
    expect(motivoLimpio('')).toBeNull();
  });

  it('solo espacios tampoco', () => {
    expect(motivoLimpio('    ')).toBeNull();
  });
});
