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
import { Campo } from '../../../shared/ui/campo';
import { Boton } from '../../../shared/ui/boton';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-cambiar-password',
  imports: [ReactiveFormsModule, Campo, Boton, Tarjeta],
  templateUrl: './cambiar-password.html',
  styleUrl: './cambiar-password.css',
})
export class CambiarPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly guardando = signal<boolean>(false);

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

    const { passwordActual, passwordNueva } = this.formulario.getRawValue();

    this.authService.cambiarPassword({ passwordActual, passwordNueva }).subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.toast.exito(respuesta.mensaje);
        this.formulario.reset();
      },
      error: (error) => {
        this.guardando.set(false);
        // La API devuelve un array cuando falla más de una validación.
        const mensaje = error.error?.message;
        this.toast.error(
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

  noCoinciden(): boolean {
    return (
      this.formulario.hasError('noCoinciden') &&
      !!this.formulario.get('passwordConfirmacion')?.touched
    );
  }
}
