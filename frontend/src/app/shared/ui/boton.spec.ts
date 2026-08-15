import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Boton } from './boton';

@Component({
  imports: [Boton],
  template: `
    <form (ngSubmit)="envios.set(envios() + 1)">
      <app-boton (pulsar)="pulsaciones.set(pulsaciones() + 1)">Corregir</app-boton>
    </form>
  `,
})
class AnfitrionEnFormulario {
  readonly envios = signal(0);
  readonly pulsaciones = signal(0);
}

describe('Boton', () => {
  /**
   * Un `<button>` sin `type` dentro de un `<form>` es `submit` por omisión. Sin
   * el `type="button"` de la plantilla, «Cancelar» y «Corregir» enviaban el
   * formulario en vez de hacer lo suyo.
   */
  it('dentro de un formulario no envía: emite pulsar y nada más', () => {
    const fixture = TestBed.createComponent(AnfitrionEnFormulario);
    fixture.detectChanges();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.type).toBe('button');

    boton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pulsaciones()).toBe(1);
    expect(fixture.componentInstance.envios()).toBe(0);
  });

  it('bloque lo lleva a ancho completo', () => {
    const fixture = TestBed.createComponent(Boton);
    fixture.componentRef.setInput('bloque', true);
    fixture.detectChanges();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.classList.contains('bloque')).toBe(true);
  });
});
