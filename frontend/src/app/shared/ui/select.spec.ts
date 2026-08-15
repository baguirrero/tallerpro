import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from './select';

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `
    <app-select etiqueta="Prioridad" [opciones]="opciones" [formControl]="control"></app-select>
  `,
})
class Anfitrion {
  readonly opciones = [
    { valor: 'BAJA', texto: 'Baja' },
    { valor: 'MEDIA', texto: 'Media' },
    { valor: 'ALTA', texto: 'Alta' },
  ];
  readonly control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
}

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `<app-select [opciones]="opciones" [formControl]="control"></app-select>`,
})
class AnfitrionConValorPrevio {
  readonly opciones = [
    { valor: 'BAJA', texto: 'Baja' },
    { valor: 'MEDIA', texto: 'Media' },
    { valor: 'ALTA', texto: 'Alta' },
  ];
  readonly control = new FormControl('MEDIA', { nonNullable: true });
}

describe('Select como ControlValueAccessor', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    return { fixture, select };
  }

  it('el valor del control selecciona la opción', () => {
    const { fixture, select } = montar();
    fixture.componentInstance.control.setValue('ALTA');
    fixture.detectChanges();
    expect(select.value).toBe('ALTA');
  });

  /**
   * El caso que se escapaba: los tests anteriores llamaban a `setValue` con las
   * opciones ya dibujadas. Un control que **llega** con valor se resolvía en el
   * primer render, cuando el `@for` todavía no había creado las opciones, y el
   * desplegable mostraba la primera mientras el formulario guardaba la otra.
   */
  it('un valor que ya venía en el control queda seleccionado en el primer render', () => {
    const fixture = TestBed.createComponent(AnfitrionConValorPrevio);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('MEDIA');
    expect(select.options[select.selectedIndex].textContent?.trim()).toBe('Media');
  });

  it('elegir una opción actualiza el control', () => {
    const { fixture, select } = montar();
    select.value = 'MEDIA';
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.value).toBe('MEDIA');
  });

  it('muestra el error solo después de tocarlo', () => {
    const { fixture, select } = montar();
    expect(fixture.nativeElement.querySelector('.mal-texto')).toBeNull();

    select.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Este campo es obligatorio',
    );
  });

  it('form.disable() lo deshabilita', () => {
    const { fixture, select } = montar();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(select.disabled).toBe(true);
  });
});
