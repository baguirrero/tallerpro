import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Orden } from './entities/orden.entity';
import { Trabajo } from '../trabajos/entities/trabajo.entity';
import { AdjuntosService } from '../adjuntos/adjuntos.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto';
import { formatearNumeroOrden, SECUENCIA_NUMERO_ORDEN } from './numero-orden';
import { puedeCancelar, puedeEntregar } from './estado-orden';
import { EstadoOrden } from '../common/enums/estados.enum';
import { calcularTotales } from './totales';
import { VehiculosService } from '../vehiculos/vehiculos.service';

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(Orden)
    private readonly ordenRepository: Repository<Orden>,
    private readonly dataSource: DataSource,
    private readonly adjuntosService: AdjuntosService,
    private readonly vehiculosService: VehiculosService,
  ) {}

  async crear(dto: CrearOrdenDto, usuarioId: string) {
    // El vehículo se resuelve dentro de la misma transacción que escribe la
    // orden: si la orden falla, no queda un vehículo huérfano.
    const creada = await this.dataSource.transaction(async (manager) => {
      const vehiculo = await this.vehiculosService.resolverParaOrden(
        dto,
        dto.actualizar_vehiculo === true,
        manager,
      );

      const nuevaOrden = manager.create(Orden, {
        descripcion: dto.descripcion,
        fecha_ingreso: dto.fecha_ingreso,
        fecha_entrega: dto.fecha_entrega,
        numero_orden: await this.generarNumeroOrden(manager),
        vehiculo,
        creado_por: { id: usuarioId } as any,
      });

      return await manager.save(nuevaOrden);
    });

    // Se relee para devolver la misma forma que el detalle: con totales. Sin
    // esto la API devolvería una orden sin `totales`, que el modelo declara
    // obligatorio.
    return await this.obtenerDetalle(creada.id);
  }

  async obtenerTodas(estado?: string) {
    const ordenes = await this.ordenRepository.find({
      where: estado ? { estado } : {},
      relations: { creado_por: true, vehiculo: true, trabajos: { repuestos: true } },
      select: {
        id: true,
        numero_orden: true,
        descripcion: true,
        fecha_ingreso: true,
        fecha_entrega: true,
        estado: true,
        created_at: true,
        vehiculo: {
          id: true,
          placa: true,
          marca: true,
          modelo: true,
          anio: true,
          propietario_nombre: true,
          propietario_telefono: true,
        },
        creado_por: { id: true, username: true, nombres: true, apellidos: true },
        trabajos: {
          id: true,
          precio_mano_obra: true,
          aprobado: true,
          repuestos: { id: true, cantidad: true, precio_unitario: true },
        },
      },
      order: { created_at: 'DESC' },
    });

    // Los trabajos se cargan para la suma, no para viajar por la red.
    return ordenes.map(({ trabajos, ...orden }) => ({
      ...orden,
      totales: calcularTotales(trabajos ?? []),
    }));
  }

  /** Como `obtenerPorId`, pero con los totales calculados. Es lo que ve el detalle. */
  async obtenerDetalle(id: string) {
    const orden = await this.ordenRepository.findOne({
      where: { id },
      relations: { creado_por: true, vehiculo: true, trabajos: { repuestos: true } },
    });

    if (!orden) {
      throw new NotFoundException(`No existe la orden con id ${id}`);
    }

    const { trabajos, ...resto } = orden;
    return { ...resto, totales: calcularTotales(trabajos ?? []) };
  }

  async obtenerPorId(id: string) {
    const orden = await this.ordenRepository.findOne({
      where: { id },
      relations: { creado_por: true, vehiculo: true, trabajos: { repuestos: true } },
    });

    if (!orden) {
      throw new NotFoundException(`No existe la orden con id ${id}`);
    }
    return orden;
  }

  async actualizar(id: string, dto: ActualizarOrdenDto) {
    await this.dataSource.transaction(async (manager) => {
      const orden = await manager.findOne(Orden, {
        where: { id },
        relations: { vehiculo: true },
      });

      if (!orden) {
        throw new NotFoundException(`No existe la orden con id ${id}`);
      }

      // Editar la placa muda la orden al vehículo correcto: es la vía para
      // corregir una orden registrada con la placa equivocada.
      if (dto.placa) {
        orden.vehiculo = await this.vehiculosService.resolverParaOrden(
          { ...orden.vehiculo, ...dto, placa: dto.placa },
          dto.actualizar_vehiculo === true,
          manager,
        );
      }

      // Campo por campo y no `Object.assign(orden, dto)`: el DTO trae ahora
      // datos del vehículo que no son columnas de la orden.
      if (dto.descripcion !== undefined) orden.descripcion = dto.descripcion;
      if (dto.fecha_ingreso !== undefined) orden.fecha_ingreso = dto.fecha_ingreso;
      if (dto.fecha_entrega !== undefined) orden.fecha_entrega = dto.fecha_entrega;

      return await manager.save(orden);
    });

    return await this.obtenerDetalle(id);
  }

  /**
   * La entrega es una decisión humana, no algo que se derive de los trabajos:
   * "terminada" es un hecho del taller y "entregada" es un hecho del cliente.
   */
  async entregar(id: string) {
    const orden = await this.obtenerPorId(id);

    if (!puedeEntregar(orden.estado)) {
      throw new ConflictException(
        `No se puede entregar una orden en estado ${orden.estado}: primero deben completarse todos sus trabajos`,
      );
    }

    orden.estado = EstadoOrden.ENTREGADA;
    return await this.ordenRepository.save(orden);
  }

  async cancelar(id: string) {
    const orden = await this.obtenerPorId(id);

    if (!puedeCancelar(orden.estado)) {
      throw new ConflictException(
        `La orden ${orden.numero_orden} ya está ${orden.estado} y no se puede cancelar`,
      );
    }

    orden.estado = EstadoOrden.CANCELADA;
    return await this.ordenRepository.save(orden);
  }

  async eliminar(id: string) {
    const orden = await this.obtenerPorId(id);

    await this.dataSource.transaction(async (manager) => {
      const trabajos = await manager.find(Trabajo, {
        where: { orden: { id } },
        select: { id: true },
      });

      // Las filas de trabajos, comentarios y adjuntos las arrastra el
      // ON DELETE CASCADE; los archivos del almacenamiento hay que borrarlos.
      await this.adjuntosService.eliminarPorTrabajos(
        trabajos.map((trabajo) => trabajo.id),
        manager,
      );

      await manager.delete(Orden, { id: orden.id });
    });

    return { mensaje: 'Orden eliminada correctamente' };
  }

  async obtenerEstadisticas() {
    const porEstado = await this.ordenRepository
      .createQueryBuilder('orden')
      .select('orden.estado', 'estado')
      .addSelect('COUNT(orden.id)', 'cantidad')
      .groupBy('orden.estado')
      .getRawMany();

    const total = await this.ordenRepository.count();

    return {
      total,
      porEstado: porEstado.map((fila) => ({
        estado: fila.estado,
        cantidad: Number(fila.cantidad),
      })),
    };
  }

  // Recibe el manager para pedir el correlativo por la misma conexión que
  // está escribiendo la orden.
  private async generarNumeroOrden(manager: EntityManager): Promise<string> {
    const filas: Array<{ nextval: string }> = await manager.query(
      `SELECT nextval('${SECUENCIA_NUMERO_ORDEN}') AS nextval`,
    );
    return formatearNumeroOrden(Number(filas[0].nextval));
  }
}
