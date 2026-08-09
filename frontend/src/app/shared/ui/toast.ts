import { Component, inject, Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  texto: string;
  tipo: 'exito' | 'error' | 'aviso';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  readonly avisos = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.emitir(texto, 'exito');
  }

  error(texto: string): void {
    this.emitir(texto, 'error');
  }

  aviso(texto: string): void {
    this.emitir(texto, 'aviso');
  }

  cerrar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private emitir(texto: string, tipo: Aviso['tipo']): void {
    const id = ++this.contador;
    this.avisos.update((lista) => [...lista, { id, texto, tipo }]);
    setTimeout(() => this.cerrar(id), 5000);
  }
}

@Component({
  selector: 'app-toast',
  template: `
    <div class="zona" role="status" aria-live="polite">
      @for (aviso of servicio.avisos(); track aviso.id) {
        <div class="t" [class]="aviso.tipo" (click)="servicio.cerrar(aviso.id)">
          {{ aviso.texto }}
        </div>
      }
    </div>
  `,
  styles: `
    .zona {
      position: fixed;
      right: var(--e4);
      bottom: var(--e4);
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: var(--e2);
      pointer-events: none;
    }
    .t {
      pointer-events: auto;
      cursor: pointer;
      max-width: 340px;
      font-size: var(--t-tabla);
      font-weight: 500;
      padding: var(--e3) var(--e4);
      border-radius: var(--r-md);
      border: 1px solid var(--borde);
      box-shadow: var(--sombra-2);
      /* entra desde abajo; la salida la resuelve el borrado del signal */
      animation: entra var(--dur-media) var(--ease-salida);
    }
    @keyframes entra {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .exito { background: var(--exito-fondo); color: var(--exito-texto); }
    .error { background: var(--error-fondo); color: var(--error-texto); }
    .aviso { background: var(--aviso-fondo); color: var(--aviso-texto); }
  `,
})
export class Toast {
  readonly servicio = inject(ToastService);
}
