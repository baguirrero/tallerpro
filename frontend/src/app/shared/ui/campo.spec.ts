import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Campo } from './campo';

@Component({
  imports: [ReactiveFormsModule, Campo],
  template: `<app-campo etiqueta="Placa" [formControl]="control"></app-campo>`,
})
class Anfitrion {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6)],
  });
}

@Component({
  imports: [Campo],
  template: `<app-campo [valor]="valor()" (valorCambia)="valor.set($event)"></app-campo>`,
})
class AnfitrionSuelto {
  readonly valor = signal('inicial');
}

describe('Campo como ControlValueAccessor', () => {
  function montar() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    return { fixture, input };
  }

  function escribir(input: HTMLInputElement, texto: string) {
    input.value = texto;
    input.dispatchEvent(new Event('input'));
  }

  it('el valor del control llega al input', () => {
    const { fixture, input } = montar();
    fixture.componentInstance.control.setValue('ABC123');
    fixture.detectChanges();
    expect(input.value).toBe('ABC123');
  });

  it('escribir en el input actualiza el control', () => {
    const { fixture, input } = montar();
    escribir(input, 'XYZ987');
    expect(fixture.componentInstance.control.value).toBe('XYZ987');
  });

  it('no muestra el error mientras el campo no fue tocado', () => {
    const { fixture } = montar();
    expect(fixture.componentInstance.control.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('.mal-texto')).toBeNull();
  });

  it('al perder el foco sí lo muestra', () => {
    const { fixture, input } = montar();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Este campo es obligatorio',
    );
  });

  it('el mensaje sigue al error que corresponda', () => {
    const { fixture, input } = montar();
    escribir(input, 'ABC');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mal-texto')?.textContent.trim()).toBe(
      'Mínimo 6 caracteres',
    );
  });

  it('form.disable() deshabilita el input, no solo el input deshabilitado', () => {
    const { fixture, input } = montar();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });

  it('sin formControl sigue andando con valor y valorCambia', () => {
    const fixture = TestBed.createComponent(AnfitrionSuelto);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('inicial');

    input.value = 'escrito a mano';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.valor()).toBe('escrito a mano');
  });
});
