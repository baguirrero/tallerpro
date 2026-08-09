import { TestBed } from '@angular/core/testing';
import { Prioridad } from './prioridad';

describe('Prioridad', () => {
  function montar(valor: string) {
    const fixture = TestBed.createComponent(Prioridad);
    fixture.componentRef.setInput('valor', valor);
    fixture.detectChanges();
    return fixture;
  }

  it('traduce la prioridad a su etiqueta en castellano', () => {
    expect(montar('ALTA').nativeElement.textContent.trim()).toBe('Alta');
  });

  it('resuelve el token de color de cada prioridad', () => {
    expect(montar('BAJA').componentInstance.color()).toBe('var(--prioridad-baja)');
    expect(montar('MEDIA').componentInstance.color()).toBe('var(--prioridad-media)');
    expect(montar('ALTA').componentInstance.color()).toBe('var(--prioridad-alta)');
  });

  it('una prioridad desconocida se muestra cruda, con el punto neutro', () => {
    const fixture = montar('URGENTISIMA');
    expect(fixture.nativeElement.textContent.trim()).toBe('URGENTISIMA');
    expect(fixture.componentInstance.color()).toBe('var(--borde-fuerte)');
  });
});
