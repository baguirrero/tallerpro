import { mkdir, rm, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { AlmacenamientoArchivos, ArchivoEntrante } from './almacenamiento.interface';

/**
 * Driver de desarrollo: escribe en el directorio `uploads/` del proyecto y
 * deja que ServeStaticModule los publique. En producción no sirve, porque el
 * disco de Render es efímero y los archivos desaparecen en cada despliegue.
 */
export class AlmacenamientoDisco implements AlmacenamientoArchivos {
  constructor(
    private readonly directorio: string,
    private readonly urlBase: string,
  ) {}

  async guardar({ buffer, nombreOriginal }: ArchivoEntrante): Promise<{ clave: string }> {
    await mkdir(this.directorio, { recursive: true });

    const clave = `${randomUUID()}${extname(nombreOriginal)}`;
    await writeFile(join(this.directorio, clave), buffer);

    return { clave };
  }

  async eliminar(clave: string): Promise<void> {
    // `force` hace que borrar algo que ya no está no sea un error.
    await rm(join(this.directorio, clave), { force: true });
  }

  async obtenerUrl(clave: string): Promise<string> {
    return `${this.urlBase}/uploads/${clave}`;
  }
}
