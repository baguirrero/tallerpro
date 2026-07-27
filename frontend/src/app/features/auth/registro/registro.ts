import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styles: ``,
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    nombres: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set(null);

    this.authService.registro(this.formulario.getRawValue()).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.mensajeExito.set(respuesta.mensaje + '. Redirigiendo al inicio de sesión...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (error) => {
        this.cargando.set(false);
        const mensaje = error.error?.message;
        this.mensajeError.set(
          Array.isArray(mensaje)
            ? mensaje.join('. ')
            : (mensaje ?? 'No se pudo completar el registro.'),
        );
      },
    });
  }

  tieneError(campo: string, tipoError: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.hasError(tipoError) && control.touched;
  }
}
