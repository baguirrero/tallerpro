import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NombreRol } from '../common/enums/estados.enum';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(NombreRol.ADMINISTRADOR)
  async obtenerTodos() {
    return await this.usuariosService.obtenerTodos();
  }

  @Get('mecanicos')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER, NombreRol.ASESOR)
  async obtenerMecanicos() {
    return await this.usuariosService.obtenerMecanicos();
  }

  @Patch(':id/estado')
  @Roles(NombreRol.ADMINISTRADOR)
  async cambiarEstado(@Param('id') id: string, @Body('activo') activo: boolean) {
    return await this.usuariosService.cambiarEstado(id, activo);
  }
}
