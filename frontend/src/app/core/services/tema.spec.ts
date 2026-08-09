import { TestBed } from '@angular/core/testing';
import { TemaService } from './tema';

describe('TemaService', () => {
  beforeEach(() => {
    localStorage.removeItem('tallerpro-tema');
    document.documentElement.removeAttribute('data-tema');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem('tallerpro-tema');
    document.documentElement.removeAttribute('data-tema');
  });

  it('respeta la preferencia guardada por encima de la del sistema', () => {
    localStorage.setItem('tallerpro-tema', 'oscuro');
    const servicio = TestBed.inject(TemaService);
    expect(servicio.oscuro()).toBe(true);
  });

  it('sin preferencia guardada, sigue a la del sistema', () => {
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const servicio = TestBed.inject(TemaService);
    expect(servicio.oscuro()).toBe(prefiereOscuro);
  });

  it('alternar cambia el signal y lo persiste', () => {
    localStorage.setItem('tallerpro-tema', 'claro');
    const servicio = TestBed.inject(TemaService);

    servicio.alternar();

    expect(servicio.oscuro()).toBe(true);
    expect(localStorage.getItem('tallerpro-tema')).toBe('oscuro');
  });

  it('alternar dos veces vuelve al punto de partida', () => {
    localStorage.setItem('tallerpro-tema', 'claro');
    const servicio = TestBed.inject(TemaService);

    servicio.alternar();
    servicio.alternar();

    expect(servicio.oscuro()).toBe(false);
    expect(localStorage.getItem('tallerpro-tema')).toBe('claro');
  });

  it('escribe data-tema en el elemento raíz solo cuando es oscuro', () => {
    localStorage.setItem('tallerpro-tema', 'claro');
    const servicio = TestBed.inject(TemaService);
    expect(document.documentElement.getAttribute('data-tema')).toBeNull();

    servicio.alternar();
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');
  });
});
