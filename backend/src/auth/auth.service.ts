import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../roles/entities/rol.entity';
import { NombreRol } from '../common/enums/estados.enum';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly jwtService: JwtService,
  ) {}

  async registro(registroDto: RegistroDto) {
    const existeEmail = await this.usuarioRepository.findOne({
      where: { email: registroDto.email },
    });
    if (existeEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    const existeUsername = await this.usuarioRepository.findOne({
      where: { username: registroDto.username },
    });
    if (existeUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const rolMecanico = await this.rolRepository.findOne({
      where: { nombre: NombreRol.MECANICO },
    });

    const passwordHash = await bcrypt.hash(registroDto.password, 10);

    const nuevoUsuario = this.usuarioRepository.create({
      username: registroDto.username,
      email: registroDto.email,
      password_hash: passwordHash,
      nombres: registroDto.nombres,
      apellidos: registroDto.apellidos,
      roles: rolMecanico ? [rolMecanico] : [],
    });

    await this.usuarioRepository.save(nuevoUsuario);
    return { mensaje: 'Usuario registrado correctamente' };
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { email: loginDto.email },
      relations: { roles: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordCorrecta = await bcrypt.compare(loginDto.password, usuario.password_hash);
    if (!passwordCorrecta) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('El usuario está desactivado. Contacte al administrador.');
    }

    const nombresRoles = usuario.roles.map((rol) => rol.nombre);

    const payload = {
      sub: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: nombresRoles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        roles: nombresRoles,
      },
    };
  }

  async cambiarPassword(usuarioId: string, dto: CambiarPasswordDto) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordCorrecta = await bcrypt.compare(dto.passwordActual, usuario.password_hash);
    if (!passwordCorrecta) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    usuario.password_hash = await bcrypt.hash(dto.passwordNueva, 10);
    await this.usuarioRepository.save(usuario);

    return { mensaje: 'Contraseña actualizada correctamente' };
  }
}
