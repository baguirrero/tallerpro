import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styles: ``,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);

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
    this.mensajeError.set(null);

    this.authService.login(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.cargando.set(false);
        this.mensajeError.set(
          error.error?.message ?? 'No se pudo iniciar sesión. Intente nuevamente.',
        );
      },
    });
  }

  tieneError(campo: 'email' | 'password', tipoError: string): boolean {
    const control = this.formulario.controls[campo];
    return control.hasError(tipoError) && control.touched;
  }
}
