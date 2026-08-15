import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Area } from './area';

@Component({
  imports: [ReactiveFormsModule, Area],
  template: `<app-area etiqueta="Descripción" [filas]="4" [formControl]="control"></app-area>`,
})
class Anfitrion {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });
}

describe('Area', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const area: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    return { fixture, area };
  }

  it('es un textarea, no un input', () => {
    const fixture = montar().fixture;
    expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('respeta las filas pedidas', () => {
    expect(montar().area.rows).toBe(4);
  });

  it('el valor del control llega al textarea y vuelve', () => {
    const { fixture, area } = montar();
    fixture.componentInstance.control.setValue('Cambio de aceite');
    fixture.detectChanges();
    expect(area.value).toBe('Cambio de aceite');

    area.value = 'Revisión de frenos';
    area.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('Revisión de frenos');
  });

  it('muestra el error del mapa después de tocarlo', () => {
    const { fixture, area } = montar();
    area.value = 'abc';
    area.dispatchEvent(new Event('input'));
    area.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Mínimo 5 caracteres',
    );
  });
});
