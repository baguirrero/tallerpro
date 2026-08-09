import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Trabajo } from './entities/trabajo.entity';
import { CrearTrabajoDto } from './dto/crear-trabajo.dto';
import { ActualizarTrabajoDto } from './dto/actualizar-trabajo.dto';
import { EstadoTrabajo, NombreRol } from '../common/enums/estados.enum';
import { Orden } from '../ordenes/entities/orden.entity';
import { derivarEstado, esTerminal } from '../ordenes/estado-orden';
import { AdjuntosService } from '../adjuntos/adjuntos.service';

@Injectable()
export class TrabajosService {
  constructor(
    @InjectRepository(Trabajo)
    private readonly trabajoRepository: Repository<Trabajo>,
    private readonly dataSource: DataSource,
    private readonly adjuntosService: AdjuntosService,
  ) {}

  /**
   * Envuelve una operación sobre los trabajos de una orden en una transacción
   * que bloquea la fila de la orden, y resincroniza su estado al terminar.
   *
   * El bloqueo no es decorativo: si dos mecánicos completan a la vez los dos
   * últimos trabajos, sin él cada transacción ve al otro trabajo todavía sin
   * terminar, ambas concluyen "sigue en proceso", y la orden queda EN_PROCESO
   * con todo completado.
   */
  private async conOrdenBloqueada<T>(
    ordenId: string,
    operacion: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.dataSource.transaction(async (manager) => {
      const orden = await manager
        .createQueryBuilder(Orden, 'orden')
        .setLock('pessimistic_write')
        .where('orden.id = :id', { id: ordenId })
        .getOne();

      if (!orden) {
        throw new NotFoundException(`No existe la orden con id ${ordenId}`);
      }

      if (esTerminal(orden.estado)) {
        throw new ConflictException(
          `La orden ${orden.numero_orden} está ${orden.estado} y ya no admite cambios en sus trabajos`,
        );
      }

      const resultado = await operacion(manager);
      await this.sincronizarEstadoOrden(manager, orden);
      return resultado;
    });
  }

  private async sincronizarEstadoOrden(manager: EntityManager, orden: Orden): Promise<void> {
    const trabajos = await manager.find(Trabajo, {
      where: { orden: { id: orden.id } },
      select: { id: true, estado: true, precio_mano_obra: true, aprobado: true },
    });

    const derivado = derivarEstado(trabajos);

    if (derivado !== orden.estado) {
      await manager.update(Orden, { id: orden.id }, { estado: derivado });
    }
  }

  async crear(dto: CrearTrabajoDto, usuarioId: string) {
    return await this.conOrdenBloqueada(dto.orden_id, async (manager) => {
      const nuevoTrabajo = manager.create(Trabajo, {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad,
        fecha_limite: dto.fecha_limite,
        orden: { id: dto.orden_id } as any,
        asignado_a: dto.asignado_a_id ? ({ id: dto.asignado_a_id } as any) : undefined,
        creado_por: { id: usuarioId } as any,
      });

      return await manager.save(nuevoTrabajo);
    });
  }

  async obtenerPorOrden(ordenId: string) {
    return await this.trabajoRepository.find({
      where: { orden: { id: ordenId } },
      relations: { asignado_a: true, creado_por: true },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        estado: true,
        fecha_limite: true,
        created_at: true,
        asignado_a: { id: true, username: true, nombres: true, apellidos: true },
        creado_por: { id: true, username: true },
      },
      order: { created_at: 'ASC' },
    });
  }

  async obtenerMisTrabajos(usuarioId: string) {
    return await this.trabajoRepository.find({
      where: { asignado_a: { id: usuarioId } },
      relations: { orden: { vehiculo: true } },
      select: {
        id: true,
        titulo: true,
        prioridad: true,
        estado: true,
        fecha_limite: true,
        orden: {
          id: true,
          numero_orden: true,
          vehiculo: { id: true, placa: true, marca: true, modelo: true },
        },
      },
      order: { fecha_limite: 'ASC' },
    });
  }

  async obtenerPorId(id: string) {
    const trabajo = await this.trabajoRepository.findOne({
      where: { id },
      relations: { asignado_a: true, orden: true },
    });

    if (!trabajo) {
      throw new NotFoundException(`No existe el trabajo con id ${id}`);
    }
    return trabajo;
  }

  async actualizar(id: string, dto: ActualizarTrabajoDto) {
    const trabajo = await this.obtenerPorId(id);

    if (dto.titulo !== undefined) trabajo.titulo = dto.titulo;
    if (dto.descripcion !== undefined) trabajo.descripcion = dto.descripcion;
    if (dto.prioridad !== undefined) trabajo.prioridad = dto.prioridad;
    if (dto.fecha_limite !== undefined) trabajo.fecha_limite = dto.fecha_limite;
    if (dto.asignado_a_id !== undefined) {
      trabajo.asignado_a = { id: dto.asignado_a_id } as any;
    }

    return await this.trabajoRepository.save(trabajo);
  }

  async actualizarEstado(
    id: string,
    estado: EstadoTrabajo,
    usuarioId: string,
    rolesUsuario: string[],
  ) {
    const trabajo = await this.obtenerPorId(id);

    return await this.conOrdenBloqueada(trabajo.orden.id, async (manager) => {
      // Se relee con la orden ya bloqueada, para que la comprobación de
      // asignación y la escritura ocurran sobre datos consistentes.
      const actual = await manager.findOne(Trabajo, {
        where: { id },
        relations: { asignado_a: true },
      });

      if (!actual) {
        throw new NotFoundException(`No existe el trabajo con id ${id}`);
      }

      const esSupervisor =
        rolesUsuario.includes(NombreRol.ADMINISTRADOR) ||
        rolesUsuario.includes(NombreRol.JEFE_TALLER);

      if (!esSupervisor && actual.asignado_a?.id !== usuarioId) {
        throw new ForbiddenException(
          'Solo puede cambiar el estado de los trabajos asignados a usted',
        );
      }

      // La regla que de verdad impide trabajar sin autorización del cliente.
      if (actual.aprobado !== true) {
        throw new ConflictException(
          `El trabajo "${actual.titulo}" no está aprobado por el cliente`,
        );
      }

      actual.estado = estado;
      return await manager.save(actual);
    });
  }

  async eliminar(id: string) {
    const trabajo = await this.obtenerPorId(id);

    return await this.conOrdenBloqueada(trabajo.orden.id, async (manager) => {
      // Las filas se van solas por el ON DELETE CASCADE; los archivos no.
      await this.adjuntosService.eliminarPorTrabajos([id], manager);
      await manager.delete(Trabajo, { id });
      return { mensaje: 'Trabajo eliminado correctamente' };
    });
  }
}
