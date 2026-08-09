import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Trabajo } from './entities/trabajo.entity';
import { CrearTrabajoDto } from './dto/crear-trabajo.dto';
import { ActualizarTrabajoDto } from './dto/actualizar-trabajo.dto';
import { EstadoTrabajo, NombreRol } from '../common/enums/estados.enum';
import { Orden } from '../ordenes/entities/orden.entity';
import { derivarEstado, esTerminal } from '../ordenes/estado-orden';
import { subtotalTrabajo } from '../ordenes/totales';
import { DecisionDto } from '../ordenes/dto/registrar-aprobacion.dto';
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
        precio_mano_obra: dto.precio_mano_obra,
        orden: { id: dto.orden_id } as any,
        asignado_a: dto.asignado_a_id ? ({ id: dto.asignado_a_id } as any) : undefined,
        creado_por: { id: usuarioId } as any,
      });

      return await manager.save(nuevoTrabajo);
    });
  }

  async obtenerPorOrden(ordenId: string) {
    const trabajos = await this.trabajoRepository.find({
      where: { orden: { id: ordenId } },
      relations: { asignado_a: true, creado_por: true, repuestos: true },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        estado: true,
        fecha_limite: true,
        precio_mano_obra: true,
        aprobado: true,
        created_at: true,
        asignado_a: { id: true, username: true, nombres: true, apellidos: true },
        creado_por: { id: true, username: true },
        repuestos: { id: true, descripcion: true, cantidad: true, precio_unitario: true },
      },
      order: { created_at: 'ASC' },
    });

    // El subtotal lo manda la API ya calculado: el dinero se computa en un
    // solo sitio, no también en el frontend.
    return trabajos.map((trabajo) => ({ ...trabajo, subtotal: subtotalTrabajo(trabajo) }));
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

    // Pasa por la transacción con bloqueo porque poner un precio cotiza el
    // trabajo, y eso cambia el estado de la orden.
    return await this.conOrdenBloqueada(trabajo.orden.id, async (manager) => {
      const actual = await manager.findOne(Trabajo, { where: { id } });
      if (!actual) {
        throw new NotFoundException(`No existe el trabajo con id ${id}`);
      }

      if (dto.titulo !== undefined) actual.titulo = dto.titulo;
      if (dto.descripcion !== undefined) actual.descripcion = dto.descripcion;
      if (dto.prioridad !== undefined) actual.prioridad = dto.prioridad;
      if (dto.fecha_limite !== undefined) actual.fecha_limite = dto.fecha_limite;
      if (dto.precio_mano_obra !== undefined) actual.precio_mano_obra = dto.precio_mano_obra;
      if (dto.asignado_a_id !== undefined) {
        actual.asignado_a = { id: dto.asignado_a_id } as any;
      }

      return await manager.save(actual);
    });
  }

  /**
   * Registra la respuesta del cliente sobre varios trabajos a la vez, que es
   * como ocurre: dice que sí a tres cosas y que no a una, en una conversación.
   * Una transacción y una sola derivación al final.
   */
  async registrarAprobacion(ordenId: string, decisiones: DecisionDto[]) {
    return await this.conOrdenBloqueada(ordenId, async (manager) => {
      const ids = decisiones.map((decision) => decision.trabajo_id);

      const trabajos = await manager.find(Trabajo, {
        where: { id: In(ids), orden: { id: ordenId } },
      });

      if (trabajos.length !== ids.length) {
        throw new BadRequestException(
          'Alguno de los trabajos indicados no pertenece a esta orden',
        );
      }

      const sinCotizar = trabajos.find((trabajo) => trabajo.precio_mano_obra == null);
      if (sinCotizar) {
        throw new ConflictException(
          `El trabajo "${sinCotizar.titulo}" no tiene precio: no se puede autorizar lo que no se cotizó`,
        );
      }

      for (const trabajo of trabajos) {
        const decision = decisiones.find((d) => d.trabajo_id === trabajo.id)!;
        trabajo.aprobado = decision.aprobado;
      }

      return await manager.save(trabajos);
    });
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
