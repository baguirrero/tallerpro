import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TrabajoService } from '../../../core/services/trabajo';
import { UsuarioService } from '../../../core/services/usuario';
import { Mecanico } from '../../../core/models/usuario.model';
import { PRIORIDADES } from '../../../core/models/estados';

@Component({
  selector: 'app-formulario-trabajo',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-trabajo.html',
  styles: ``,
})
export class FormularioTrabajo implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly trabajoService = inject(TrabajoService);
  private readonly usuarioService = inject(UsuarioService);

  readonly ordenId = input.required<string>();

  readonly trabajoCreado = output<void>();

  readonly guardando = signal<boolean>(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mecanicos = signal<Mecanico[]>([]);

  readonly prioridades = PRIORIDADES;

  readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(4)]],
    descripcion: [''],
    prioridad: ['MEDIA'],
    fecha_limite: [''],
    precio_mano_obra: [null as number | null, [Validators.min(0)]],
    asignado_a_id: [''],
  });

  ngOnInit(): void {
    this.cargarMecanicos();
  }

  private cargarMecanicos(): void {
    this.usuarioService.obtenerMecanicos().subscribe({
      next: (datos) => this.mecanicos.set(datos),
      error: () => this.mecanicos.set([]),
    });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);

    const valores = this.formulario.getRawValue();

    const datos: any = {
      titulo: valores.titulo,
      prioridad: valores.prioridad,
      orden_id: this.ordenId(),
    };
    // null y undefined son "sin cotizar"; 0 sí es un precio.
    if (valores.precio_mano_obra !== null && valores.precio_mano_obra !== undefined) {
      datos.precio_mano_obra = valores.precio_mano_obra;
    }
    if (valores.descripcion) datos.descripcion = valores.descripcion;
    if (valores.fecha_limite) datos.fecha_limite = valores.fecha_limite;
    if (valores.asignado_a_id) datos.asignado_a_id = valores.asignado_a_id;

    this.trabajoService.crear(datos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.formulario.reset({ prioridad: 'MEDIA' });
        this.trabajoCreado.emit();
      },
      error: (error) => {
        this.guardando.set(false);
        const mensaje = error.error?.message;
        this.mensajeError.set(
          Array.isArray(mensaje) ? mensaje.join('. ') : (mensaje ?? 'No se pudo crear el trabajo'),
        );
      },
    });
  }

  tieneError(campo: string, tipoError: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.hasError(tipoError) && control.touched;
  }
}
