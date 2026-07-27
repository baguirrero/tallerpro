import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TrabajosService } from './trabajos.service';
import { CrearTrabajoDto } from './dto/crear-trabajo.dto';
import { ActualizarTrabajoDto } from './dto/actualizar-trabajo.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NombreRol } from '../common/enums/estados.enum';

@Controller('trabajos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajosController {
  constructor(private readonly trabajosService: TrabajosService) {}

  @Get('mis-trabajos')
  async obtenerMisTrabajos(@Req() req: any) {
    return await this.trabajosService.obtenerMisTrabajos(req.user.sub);
  }

  @Get('orden/:ordenId')
  async obtenerPorOrden(@Param('ordenId') ordenId: string) {
    return await this.trabajosService.obtenerPorOrden(ordenId);
  }

  @Post()
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async crear(@Body() dto: CrearTrabajoDto, @Req() req: any) {
    return await this.trabajosService.crear(dto, req.user.sub);
  }

  @Patch(':id/estado')
  async actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoDto,
    @Req() req: any,
  ) {
    return await this.trabajosService.actualizarEstado(
      id,
      dto.estado,
      req.user.sub,
      req.user.roles,
    );
  }

  @Patch(':id')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarTrabajoDto) {
    return await this.trabajosService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async eliminar(@Param('id') id: string) {
    return await this.trabajosService.eliminar(id);
  }
}
