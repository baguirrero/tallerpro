export const ALMACENAMIENTO = 'ALMACENAMIENTO';

export interface ArchivoEntrante {
  buffer: Buffer;
  nombreOriginal: string;
  mime: string;
}

/**
 * Contrato del almacenamiento de adjuntos. Existe para que el resto de la
 * aplicación no sepa si los archivos viven en disco o en un bucket: en
 * desarrollo el disco alcanza, y en producción el de Render es efímero.
 */
export interface AlmacenamientoArchivos {
  /** Guarda el archivo y devuelve la clave con la que se lo recupera. */
  guardar(archivo: ArchivoEntrante): Promise<{ clave: string }>;

  /** Borra el objeto. No falla si la clave ya no existe. */
  eliminar(clave: string): Promise<void>;

  /** URL con la que el navegador puede abrir el archivo. */
  obtenerUrl(clave: string): Promise<string>;
}
