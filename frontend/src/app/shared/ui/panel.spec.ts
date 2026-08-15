import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Panel } from './panel';

@Component({
  imports: [Panel],
  template: `
    <button (click)="abierto.set(true)">Abrir</button>
    <app-panel [abierto]="abierto()" titulo="Cambio de aceite" (cerrar)="abierto.set(false)">
      <p>Contenido del trabajo</p>
    </app-panel>
  `,
})
class Anfitrion {
  readonly abierto = signal(false);
}

describe('Panel', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    return fixture;
  }

  function abrir() {
    const fixture = montar();
    fixture.componentInstance.abierto.set(true);
    fixture.detectChanges();
    return fixture;
  }

  it('cerrado no dibuja nada', () => {
    const fixture = montar();
    expect(fixture.nativeElement.querySelector('.p')).toBeNull();
    expect(fixture.nativeElement.querySelector('.velo')).toBeNull();
  });

  it('abierto dibuja el panel, el velo y el título', () => {
    const fixture = abrir();
    expect(fixture.nativeElement.querySelector('.velo')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tit').textContent.trim()).toBe('Cambio de aceite');
    expect(fixture.nativeElement.textContent).toContain('Contenido del trabajo');
  });

  it('es un diálogo para el lector de pantalla', () => {
    const caja = abrir().nativeElement.querySelector('.p');
    expect(caja.getAttribute('role')).toBe('dialog');
    expect(caja.getAttribute('aria-modal')).toBe('true');
  });

  it('Escape pide cerrar', () => {
    const fixture = abrir();
    fixture.nativeElement
      .querySelector('.p')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.abierto()).toBe(false);
  });

  it('el clic en el velo pide cerrar', () => {
    const fixture = abrir();
    fixture.nativeElement.querySelector('.velo').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.abierto()).toBe(false);
  });

  /**
   * Lo que hay que proteger es que **al terminar** la animación no quede
   * transform: mientras corre, claro que lo hay. Un transform permanente
   * convertiría al panel en bloque contenedor de sus descendientes fixed, y el
   * modal de confirmación que se abre desde adentro quedaría recortado.
   */
  it('la animación no deja transform: si lo dejara, atraparía a un modal abierto adentro', async () => {
    const caja: HTMLElement = abrir().nativeElement.querySelector('.p');

    expect(getComputedStyle(caja).animationFillMode).toBe('none');

    await new Promise((listo) => {
      caja.addEventListener('animationend', listo, { once: true });
      // Red por si el navegador de pruebas no corre animaciones.
      setTimeout(listo, 600);
    });

    const transform = getComputedStyle(caja).transform;
    expect(transform === 'none' || transform === '').toBe(true);
  });
});
