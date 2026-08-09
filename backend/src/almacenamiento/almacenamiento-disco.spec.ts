import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { AlmacenamientoDisco } from './almacenamiento-disco.service';

describe('AlmacenamientoDisco', () => {
  let directorio: string;
  let almacenamiento: AlmacenamientoDisco;

  beforeEach(async () => {
    directorio = await mkdtemp(join(tmpdir(), 'tallerpro-'));
    almacenamiento = new AlmacenamientoDisco(directorio, 'http://localhost:3001');
  });

  afterEach(async () => {
    await rm(directorio, { recursive: true, force: true });
  });

  const archivo = {
    buffer: Buffer.from('contenido de prueba'),
    nombreOriginal: 'foto.jpg',
    mime: 'image/jpeg',
  };

  it('guarda el archivo y devuelve una clave que conserva la extensión', async () => {
    const { clave } = await almacenamiento.guardar(archivo);

    expect(clave).toMatch(/\.jpg$/);
    expect(await readFile(join(directorio, clave), 'utf8')).toBe('contenido de prueba');
  });

  it('genera una clave distinta para cada archivo', async () => {
    const primera = await almacenamiento.guardar(archivo);
    const segunda = await almacenamiento.guardar(archivo);

    expect(primera.clave).not.toBe(segunda.clave);
  });

  it('arma la URL pública a partir de la clave', async () => {
    const { clave } = await almacenamiento.guardar(archivo);

    expect(await almacenamiento.obtenerUrl(clave)).toBe(`http://localhost:3001/uploads/${clave}`);
  });

  it('elimina el archivo del disco', async () => {
    const { clave } = await almacenamiento.guardar(archivo);

    await almacenamiento.eliminar(clave);

    await expect(readFile(join(directorio, clave))).rejects.toThrow();
  });

  it('eliminar una clave inexistente no lanza', async () => {
    await expect(almacenamiento.eliminar('no-existe.jpg')).resolves.toBeUndefined();
  });
});
