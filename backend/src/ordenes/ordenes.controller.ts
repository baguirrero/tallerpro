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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NombreRol } from '../common/enums/estados.enum';

@Controller('ordenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

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
    return await this.ordenesService.obtenerPorId(id);
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

  @Delete(':id')
  @Roles(NombreRol.ADMINISTRADOR)
  async eliminar(@Param('id') id: string) {
    return await this.ordenesService.eliminar(id);
  }
}
