import { computed, Injectable, signal } from '@angular/core';

const CLAVE = 'tallerpro-tema';

/**
 * El tema vive aquí y en tres líneas de `index.html`, que aplican el atributo
 * antes de que Angular arranque para que no haya destello blanco al cargar en
 * oscuro. Las dos mitades comparten la clave de localStorage: si se cambia una,
 * hay que cambiar la otra.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly estado = signal<boolean>(this.preferenciaInicial());

  readonly oscuro = computed(() => this.estado());

  constructor() {
    this.aplicar(this.estado());
  }

  alternar(): void {
    const siguiente = !this.estado();
    this.estado.set(siguiente);
    localStorage.setItem(CLAVE, siguiente ? 'oscuro' : 'claro');
    this.aplicar(siguiente);
  }

  /** Lo guardado manda; si no hay nada, se sigue al sistema operativo. */
  private preferenciaInicial(): boolean {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return guardado === 'oscuro';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private aplicar(oscuro: boolean): void {
    if (oscuro) {
      document.documentElement.setAttribute('data-tema', 'oscuro');
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
  }
}
