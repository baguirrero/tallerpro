import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orden } from './entities/orden.entity';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto';
import { formatearNumeroOrden, SECUENCIA_NUMERO_ORDEN } from './numero-orden';
import { puedeCancelar, puedeEntregar } from './estado-orden';
import { EstadoOrden } from '../common/enums/estados.enum';

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(Orden)
    private readonly ordenRepository: Repository<Orden>,
  ) {}

  async crear(dto: CrearOrdenDto, usuarioId: string) {
    const nuevaOrden = this.ordenRepository.create({
      ...dto,
      numero_orden: await this.generarNumeroOrden(),
      creado_por: { id: usuarioId } as any,
    });

    return await this.ordenRepository.save(nuevaOrden);
  }

  async obtenerTodas(estado?: string) {
    return await this.ordenRepository.find({
      where: estado ? { estado } : {},
      relations: { creado_por: true },
      select: {
        id: true,
        numero_orden: true,
        descripcion: true,
        presupuesto: true,
        fecha_ingreso: true,
        fecha_entrega: true,
        estado: true,
        placa: true,
        marca: true,
        modelo: true,
        anio: true,
        cliente_nombre: true,
        cliente_telefono: true,
        created_at: true,
        creado_por: { id: true, username: true, nombres: true, apellidos: true },
      },
      order: { created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: string) {
    const orden = await this.ordenRepository.findOne({
      where: { id },
      relations: { creado_por: true },
    });

    if (!orden) {
      throw new NotFoundException(`No existe la orden con id ${id}`);
    }
    return orden;
  }

  async actualizar(id: string, dto: ActualizarOrdenDto) {
    const orden = await this.obtenerPorId(id);

    Object.assign(orden, dto);

    return await this.ordenRepository.save(orden);
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
    await this.ordenRepository.remove(orden);
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

  private async generarNumeroOrden(): Promise<string> {
    const filas: Array<{ nextval: string }> =
      await this.ordenRepository.manager.query(
        `SELECT nextval('${SECUENCIA_NUMERO_ORDEN}') AS nextval`,
      );
    return formatearNumeroOrden(Number(filas[0].nextval));
  }
}
