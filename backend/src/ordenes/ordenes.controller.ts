import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { ActualizarOrdenDto } from './dto/actualizar-orden.dto';
import { RegistrarAprobacionDto } from './dto/registrar-aprobacion.dto';
import { TrabajosService } from '../trabajos/trabajos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NombreRol } from '../common/enums/estados.enum';

@Controller('ordenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdenesController {
  constructor(
    private readonly ordenesService: OrdenesService,
    private readonly trabajosService: TrabajosService,
  ) {}

  @Get()
  async obtenerTodas(@Query('estado') estado?: string) {
    return await this.ordenesService.obtenerTodas(estado);
  }

  @Get('estadisticas')
  async obtenerEstadisticas() {
    return await this.ordenesService.obtenerEstadisticas();
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return await this.ordenesService.obtenerDetalle(id);
  }

  @Post()
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER, NombreRol.ASESOR)
  async crear(@Body() dto: CrearOrdenDto, @Req() req: any) {
    return await this.ordenesService.crear(dto, req.user.sub);
  }

  @Patch(':id')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER, NombreRol.ASESOR)
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarOrdenDto) {
    return await this.ordenesService.actualizar(id, dto);
  }

  // La respuesta del cliente la registra quien habla con él, así que el asesor
  // entra en los roles.
  @Patch(':id/aprobacion')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER, NombreRol.ASESOR)
  async registrarAprobacion(@Param('id') id: string, @Body() dto: RegistrarAprobacionDto) {
    return await this.trabajosService.registrarAprobacion(id, dto.decisiones);
  }

  @Patch(':id/entregar')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER, NombreRol.ASESOR)
  async entregar(@Param('id') id: string) {
    return await this.ordenesService.entregar(id);
  }

  @Patch(':id/cancelar')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async cancelar(@Param('id') id: string) {
    return await this.ordenesService.cancelar(id);
  }

  @Delete(':id')
  @Roles(NombreRol.ADMINISTRADOR)
  async eliminar(@Param('id') id: string) {
    return await this.ordenesService.eliminar(id);
  }
}
