import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { NombreRol } from '../common/enums/estados.enum';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async obtenerTodos() {
    return await this.usuarioRepository.find({
      relations: { roles: true },
      select: {
        id: true,
        username: true,
        email: true,
        nombres: true,
        apellidos: true,
        activo: true,
        created_at: true,
        roles: { id: true, nombre: true },
      },
      order: { created_at: 'DESC' },
    });
  }

  async obtenerMecanicos() {
    return await this.usuarioRepository.find({
      where: { activo: true, roles: { nombre: NombreRol.MECANICO } },
      select: { id: true, username: true, nombres: true, apellidos: true },
    });
  }

  async cambiarEstado(id: string, activo: boolean) {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario con id ${id}`);
    }

    usuario.activo = activo;
    await this.usuarioRepository.save(usuario);

    return { mensaje: activo ? 'Usuario activado' : 'Usuario desactivado' };
  }
}
