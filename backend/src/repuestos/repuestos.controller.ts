import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { RepuestosService } from './repuestos.service';
import { CrearRepuestoDto } from './dto/crear-repuesto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NombreRol } from '../common/enums/estados.enum';

// Mismo patrón que adjuntos y comentarios, las otras dos hijas del trabajo.
@Controller('repuestos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RepuestosController {
  constructor(private readonly repuestosService: RepuestosService) {}

  @Post('trabajo/:trabajoId')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async crear(@Param('trabajoId') trabajoId: string, @Body() dto: CrearRepuestoDto) {
    return await this.repuestosService.crear(trabajoId, dto);
  }

  @Delete(':id')
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.JEFE_TALLER)
  async eliminar(@Param('id') id: string) {
    return await this.repuestosService.eliminar(id);
  }
}
