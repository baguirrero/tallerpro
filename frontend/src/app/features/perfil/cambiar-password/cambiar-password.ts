import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-cambiar-password',
  imports: [ReactiveFormsModule],
  templateUrl: './cambiar-password.html',
  styles: ``,
})
export class CambiarPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly guardando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group(
    {
      passwordActual: ['', [Validators.required]],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmacion: ['', [Validators.required]],
    },
    { validators: [CambiarPassword.contrasenasIguales] },
  );

  static contrasenasIguales(grupo: AbstractControl): ValidationErrors | null {
    const nueva = grupo.get('passwordNueva')?.value;
    const confirmacion = grupo.get('passwordConfirmacion')?.value;
    return nueva === confirmacion ? null : { noCoinciden: true };
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const { passwordActual, passwordNueva } = this.formulario.getRawValue();

    this.authService.cambiarPassword({ passwordActual, passwordNueva }).subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.mensajeExito.set(respuesta.mensaje);
        this.formulario.reset();
      },
      error: (error) => {
        this.guardando.set(false);
        const mensaje = error.error?.message;
        this.mensajeError.set(
          Array.isArray(mensaje)
            ? mensaje.join('. ')
            : (mensaje ?? 'No se pudo cambiar la contraseña'),
        );
      },
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  tieneError(campo: string, tipoError: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.hasError(tipoError) && control.touched;
  }

  noCoinciden(): boolean {
    return (
      this.formulario.hasError('noCoinciden') &&
      !!this.formulario.get('passwordConfirmacion')?.touched
    );
  }
}
