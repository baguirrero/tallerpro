import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';

import { Adjunto } from './entities/adjunto.entity';
import { ALMACENAMIENTO } from '../almacenamiento/almacenamiento.interface';
// `import type` es obligatorio para un tipo que aparece en una firma
// decorada: con isolatedModules y emitDecoratorMetadata, TypeScript no
// puede distinguirlo de un valor en tiempo de emisión (TS1272).
import type { AlmacenamientoArchivos } from '../almacenamiento/almacenamiento.interface';

@Injectable()
export class AdjuntosService {
  private readonly logger = new Logger('AdjuntosService');

  constructor(
    @InjectRepository(Adjunto)
    private readonly adjuntoRepository: Repository<Adjunto>,
    @Inject(ALMACENAMIENTO)
    private readonly almacenamiento: AlmacenamientoArchivos,
  ) {}

  async guardar(archivo: Express.Multer.File, trabajoId: string, usuarioId: string) {
    const { clave } = await this.almacenamiento.guardar({
      buffer: archivo.buffer,
      nombreOriginal: archivo.originalname,
      mime: archivo.mimetype,
    });

    const nuevoAdjunto = this.adjuntoRepository.create({
      nombre_original: archivo.originalname,
      clave,
      tipo_mime: archivo.mimetype,
      tamano: archivo.size,
      trabajo: { id: trabajoId } as any,
      subido_por: { id: usuarioId } as any,
    });

    const guardado = await this.adjuntoRepository.save(nuevoAdjunto);

    return { ...guardado, url: await this.almacenamiento.obtenerUrl(clave) };
  }

  async obtenerPorTrabajo(trabajoId: string) {
    const adjuntos = await this.adjuntoRepository.find({
      where: { trabajo: { id: trabajoId } },
      relations: { subido_por: true },
      select: {
        id: true,
        nombre_original: true,
        clave: true,
        tipo_mime: true,
        tamano: true,
        created_at: true,
        subido_por: { id: true, username: true, nombres: true, apellidos: true },
      },
      order: { created_at: 'DESC' },
    });

    // Firmar es un cálculo local del SDK, sin viaje al bucket, así que
    // resolver la URL de cada adjunto aquí sale casi gratis y le ahorra al
    // frontend una petición por archivo.
    return await Promise.all(
      adjuntos.map(async (adjunto) => ({
        ...adjunto,
        url: await this.almacenamiento.obtenerUrl(adjunto.clave),
      })),
    );
  }

  async eliminar(id: string) {
    const adjunto = await this.adjuntoRepository.findOne({ where: { id } });
    if (!adjunto) {
      throw new NotFoundException(`No existe el adjunto con id ${id}`);
    }

    await this.borrarDelAlmacenamiento(adjunto.clave);
    await this.adjuntoRepository.remove(adjunto);

    return { mensaje: 'Adjunto eliminado correctamente' };
  }

  /**
   * Borra del almacenamiento los objetos de los trabajos indicados. Las filas
   * las arrastra el ON DELETE CASCADE de adjuntos.trabajo_id; lo que la base
   * no puede limpiar sola son los archivos.
   */
  async eliminarPorTrabajos(trabajoIds: string[], manager: EntityManager): Promise<void> {
    if (trabajoIds.length === 0) return;

    const adjuntos = await manager.find(Adjunto, {
      where: { trabajo: { id: In(trabajoIds) } },
      select: { id: true, clave: true },
    });

    for (const adjunto of adjuntos) {
      await this.borrarDelAlmacenamiento(adjunto.clave);
    }
  }

  /**
   * Un objeto huérfano es un problema menor que una orden que no se puede
   * eliminar, así que un fallo del almacenamiento se registra y no corta.
   */
  private async borrarDelAlmacenamiento(clave: string): Promise<void> {
    try {
      await this.almacenamiento.eliminar(clave);
    } catch (error) {
      this.logger.error(`No se pudo eliminar del almacenamiento la clave ${clave}`, error);
    }
  }
}
