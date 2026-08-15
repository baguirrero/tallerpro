import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Campo } from '../../../shared/ui/campo';
import { Boton } from '../../../shared/ui/boton';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Campo, Boton],
  templateUrl: './login.html',
  styleUrl: '../auth.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly cargando = signal<boolean>(false);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);

    this.authService.login(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      // Credenciales equivocadas es el resultado de una acción, no un fallo de
      // carga: va por toast, como el resto de la aplicación desde la entrega B.
      error: (error) => {
        this.cargando.set(false);
        this.toast.error(error.error?.message ?? 'No se pudo iniciar sesión. Intente nuevamente.');
      },
    });
  }
}
