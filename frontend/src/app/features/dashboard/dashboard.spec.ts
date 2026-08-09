import { Estadisticas } from '../../core/models/orden.model';
import { contarEstado } from './dashboard';

describe('contarEstado', () => {
  const datos: Estadisticas = {
    total: 52,
    porEstado: [
      { estado: 'EN_PROCESO', cantidad: 7 },
      { estado: 'COTIZADA', cantidad: 2 },
    ],
  };

  it('devuelve la cantidad del estado pedido', () => {
    expect(contarEstado(datos, 'COTIZADA')).toBe(2);
  });

  it('un estado que el backend no devolvió cuenta cero', () => {
    expect(contarEstado(datos, 'ESPERANDO_REPUESTO')).toBe(0);
  });

  it('sin estadísticas cargadas todo cuenta cero', () => {
    expect(contarEstado(null, 'EN_PROCESO')).toBe(0);
  });
});
