import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../roles/entities/rol.entity';
import { NombreRol } from '../common/enums/estados.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async onModuleInit() {
    await this.cargarRoles();
    await this.cargarUsuarios();
  }

  private async cargarRoles() {
    const cantidad = await this.rolRepository.count();
    if (cantidad > 0) return;

    const roles = [
      { nombre: NombreRol.ADMINISTRADOR, descripcion: 'Control total del sistema' },
      { nombre: NombreRol.JEFE_TALLER, descripcion: 'Gestiona órdenes y asigna trabajos' },
      { nombre: NombreRol.ASESOR, descripcion: 'Registra órdenes y atiende al cliente' },
      { nombre: NombreRol.MECANICO, descripcion: 'Ejecuta los trabajos asignados' },
    ];

    await this.rolRepository.save(roles.map((rol) => this.rolRepository.create(rol)));
    this.logger.log('Roles iniciales creados');
  }

  private async cargarUsuarios() {
    const cantidad = await this.usuarioRepository.count();
    if (cantidad > 0) return;

    const passwordHash = await bcrypt.hash('123456', 10);

    const datos = [
      {
        username: 'admin',
        email: 'admin@taller.com',
        nombres: 'Ana',
        apellidos: 'Ramírez',
        rol: NombreRol.ADMINISTRADOR,
      },
      {
        username: 'jefe',
        email: 'jefe@taller.com',
        nombres: 'Carlos',
        apellidos: 'Medina',
        rol: NombreRol.JEFE_TALLER,
      },
      {
        username: 'asesor',
        email: 'asesor@taller.com',
        nombres: 'Lucía',
        apellidos: 'Flores',
        rol: NombreRol.ASESOR,
      },
      {
        username: 'mecanico',
        email: 'mecanico@taller.com',
        nombres: 'Pedro',
        apellidos: 'Quispe',
        rol: NombreRol.MECANICO,
      },
    ];

    for (const item of datos) {
      const rol = await this.rolRepository.findOne({ where: { nombre: item.rol } });
      const usuario = this.usuarioRepository.create({
        username: item.username,
        email: item.email,
        password_hash: passwordHash,
        nombres: item.nombres,
        apellidos: item.apellidos,
        roles: rol ? [rol] : [],
      });
      await this.usuarioRepository.save(usuario);
    }

    this.logger.log('Usuarios de prueba creados (contraseña: 123456)');
  }
}
