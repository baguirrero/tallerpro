import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TrabajoService } from '../../../core/services/trabajo';
import { UsuarioService } from '../../../core/services/usuario';
import { Mecanico } from '../../../core/models/usuario.model';
import { ETIQUETA_PRIORIDAD, PRIORIDADES } from '../../../core/models/estados';
import { Campo } from '../../../shared/ui/campo';
import { Select, Opcion } from '../../../shared/ui/select';
import { Boton } from '../../../shared/ui/boton';
import { Tarjeta } from '../../../shared/ui/tarjeta';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-formulario-trabajo',
  imports: [ReactiveFormsModule, Campo, Select, Boton, Tarjeta],
  templateUrl: './formulario-trabajo.html',
  styleUrl: './formulario-trabajo.css',
})
export class FormularioTrabajo implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly trabajoService = inject(TrabajoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);

  readonly ordenId = input.required<string>();

  readonly trabajoCreado = output<void>();

  readonly guardando = signal<boolean>(false);
  readonly mecanicos = signal<Mecanico[]>([]);

  readonly opcionesPrioridad = computed<Opcion[]>(() =>
    PRIORIDADES.map((prioridad) => ({
      valor: prioridad,
      texto: ETIQUETA_PRIORIDAD[prioridad] ?? prioridad,
    })),
  );

  readonly opcionesMecanicos = computed<Opcion[]>(() =>
    this.mecanicos().map((mecanico) => ({
      valor: mecanico.id,
      texto: `${mecanico.nombres} ${mecanico.apellidos}`,
    })),
  );

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

    const valores = this.formulario.getRawValue();

    const datos: any = {
      titulo: valores.titulo,
      prioridad: valores.prioridad,
      orden_id: this.ordenId(),
    };
    // El DOM solo tiene texto, así que `app-campo` deja "150" en el control aunque
    // el tipo sea number, y el @IsNumber() de la API rechaza la cadena. La
    // conversión va acá, en el borde. Vacío es "sin cotizar"; 0 sí es un precio.
    const precio = `${valores.precio_mano_obra ?? ''}`.trim();
    if (precio !== '') datos.precio_mano_obra = Number(precio);
    if (valores.descripcion) datos.descripcion = valores.descripcion;
    if (valores.fecha_limite) datos.fecha_limite = valores.fecha_limite;
    if (valores.asignado_a_id) datos.asignado_a_id = valores.asignado_a_id;

    this.trabajoService.crear(datos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.formulario.reset({ prioridad: 'MEDIA' });
        this.toast.exito('Se agregó el trabajo');
        this.trabajoCreado.emit();
      },
      error: (error) => {
        this.guardando.set(false);
        const mensaje = error.error?.message;
        this.toast.error(
          Array.isArray(mensaje) ? mensaje.join('. ') : (mensaje ?? 'No se pudo crear el trabajo'),
        );
      },
    });
  }
}
