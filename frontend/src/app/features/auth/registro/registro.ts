import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Campo } from '../../../shared/ui/campo';
import { Boton } from '../../../shared/ui/boton';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, Campo, Boton],
  templateUrl: './registro.html',
  styleUrl: '../auth.css',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly cargando = signal<boolean>(false);

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

    this.authService.registro(this.formulario.getRawValue()).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.toast.exito(respuesta.mensaje);
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.cargando.set(false);
        // La API devuelve un array cuando falla más de una validación.
        const mensaje = error.error?.message;
        this.toast.error(
          Array.isArray(mensaje)
            ? mensaje.join('. ')
            : (mensaje ?? 'No se pudo completar el registro.'),
        );
      },
    });
  }
}
